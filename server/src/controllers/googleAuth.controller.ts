import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Profile from '../models/Profile';
import Settings from '../models/Settings';
import UserProgress from '../models/UserProgress';
import Streak from '../models/Streak';
import { signToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { googleOAuth, env } from '../config/env';
import { syncProfileLevel } from '../services/gamification.service';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo';
const STATE_COOKIE = 'google_oauth_state';

/** The backend's own OAuth callback URL. This exact string (with the real host
 *  and port) must be registered in Google Cloud Console under "Authorized
 *  redirect URIs". */
function buildRedirectUri(): string {
  const base = process.env.APP_BASE_URL || `http://localhost:${env.PORT}`;
  return `${base}/api/auth/google/callback`;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

/** Ensure a unique, valid username for a Google user (email-part + optional
 *  suffix). Keeps retrying with longer suffixes until one is free. */
async function uniqueUsername(base: string): Promise<string> {
  const strip = (s: string) => s.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  let candidate = (strip(base) || 'user').slice(0, 20);
  if (candidate.length < 3) candidate = candidate.padEnd(3, 'x');
  if (await User.findOne({ username: candidate })) {
    for (let i = 0; i < 50; i += 1) {
      const suffix = crypto.randomInt(1000, 99999).toString();
      const withSuffix = `${candidate.slice(0, 20 - suffix.length)}${suffix}`;
      if (!(await User.findOne({ username: withSuffix }))) {
        return withSuffix;
      }
    }
    return `${candidate.slice(0, 15)}${Date.now().toString(36).slice(-4)}`;
  }
  return candidate;
}

export async function googleOAuthStart(req: Request, res: Response): Promise<void> {
  if (!googleOAuth.isConfigured) {
    sendError(res, 'Google Sign-In is not configured on the server.', 503);
    return;
  }

  const state = crypto.randomBytes(24).toString('hex');

  // HttpOnly cookie survives the cross-site redirect; used to validate the
  // callback round-trip (CSRF) and short-lived (10 min).
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000,
    path: '/',
  });

  const params = new URLSearchParams({
    client_id: googleOAuth.clientId,
    redirect_uri: buildRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

/** Minimal cookie header parser — returns a map of cookie name -> value. Avoids
 *  pulling in the cookie-parser dependency just for the one-time OAuth state. */
function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === name) {
      try {
        return decodeURIComponent(part.slice(idx + 1).trim());
      } catch {
        return part.slice(idx + 1).trim();
      }
    }
  }
  return undefined;
}

export async function googleOAuthCallback(req: Request, res: Response): Promise<void> {
  const { code, state, error: googleError } = req.query;
  const storedState = readCookie(req, STATE_COOKIE);

  // Clear the one-time state cookie regardless of outcome.
  res.clearCookie(STATE_COOKIE, { path: '/' });

  const failRedirect = () =>
    res.redirect(`${env.CLIENT_URL}/login?error=google`);

  if (googleError) {
    console.warn(`[google-oauth] consent error: ${googleError}`);
    failRedirect();
    return;
  }
  if (!code) {
    failRedirect();
    return;
  }
  if (!storedState || !state || storedState !== state) {
    console.warn('[google-oauth] state mismatch — possible CSRF');
    failRedirect();
    return;
  }
  if (!googleOAuth.isConfigured) {
    failRedirect();
    return;
  }

  try {
    // Exchange the authorization code for an access token + ID token.
    const tokenRes = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: googleOAuth.clientId,
        client_secret: googleOAuth.clientSecret,
        redirect_uri: buildRedirectUri(),
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenResult = await tokenRes.json().catch(() => ({}));
    const tokenData = tokenResult as { access_token?: string; error?: string; error_description?: string };
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[google-oauth] token exchange failed:', tokenData);
      failRedirect();
      return;
    }

    const userInfoRes = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const info = (await userInfoRes.json().catch(() => ({}))) as GoogleUserInfo;

    if (!userInfoRes.ok || !info.email) {
      console.error('[google-oauth] userinfo fetch failed:', info);
      failRedirect();
      return;
    }

    const existingUser = await User.findOne({ email: info.email.toLowerCase() });

    let user;
    let isNewUser = false;
    if (existingUser) {
      // Email already registered — treat the Google login as a sign-in to the
      // existing account rather than creating a duplicate.
      user = existingUser;
      if (!user.emailVerified) {
        user.emailVerified = true;
        await user.save();
      }
    } else {
      isNewUser = true;
      const username = await uniqueUsername(
        info.given_name || info.name || info.email.split('@')[0]
      );
      // Google users have no password — store an unguessable random hash so the
      // account can never be accessed through the email/password path.
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
      user = await User.create({
        username,
        email: info.email.toLowerCase(),
        passwordHash,
        authProvider: 'google',
        emailVerified: true,
      });
    }

    // Companion documents — same idempotent pattern used by register/login.
    const [profile, settings] = await Promise.all([
      Profile.findOneAndUpdate(
        { userId: user._id },
        {
          $setOnInsert: {
            displayName: info.name || user.username,
            ...(info.picture ? { avatarUrl: info.picture } : {}),
          },
        },
        { new: true, upsert: true }
      ),
      Settings.findOneAndUpdate({ userId: user._id }, { $setOnInsert: {} }, { new: true, upsert: true }),
      UserProgress.findOneAndUpdate({ userId: user._id }, { $setOnInsert: {} }, { new: true, upsert: true }),
      Streak.findOneAndUpdate({ userId: user._id }, { $setOnInsert: {} }, { new: true, upsert: true }),
    ]);

    const synced = await syncProfileLevel(user._id);
    const token = signToken(user._id.toString());

    const callbackParams = new URLSearchParams({
      token,
      firstTime: isNewUser ? '1' : '0',
    });
    res.redirect(`${env.CLIENT_URL}/oauth/callback?${callbackParams.toString()}`);
  } catch (err) {
    console.error('[google-oauth] callback error:', err);
    failRedirect();
  }
}
