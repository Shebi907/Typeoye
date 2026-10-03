import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { RequireAuth } from './components/auth/RequireAuth';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import OAuthCallback from './pages/OAuthCallback';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import TestMode from './pages/TestMode';
import Practice from './pages/Practice';
import PracticeSetup from './pages/PracticeSetup';
import PracticeSession from './pages/PracticeSession';
import Analytics from './pages/Analytics';
import Leaderboard from './pages/Leaderboard';
import Games from './pages/Games';
import Challenge from './pages/Challenge';
import Learn from './pages/Learn';
import LessonPlayer from './pages/LessonPlayer';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import HowItWorks from './pages/HowItWorks';
import Faq from './pages/Faq';
import SupportCenter from './pages/SupportCenter';
import SupportArticle from './pages/SupportArticle';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import ProgressPage from './pages/Progress';
import AchievementsPage from './pages/AchievementsPage';
import CertificatePage from './pages/CertificatePage';
import Settings from './pages/Settings';
import MyCertificates from './pages/MyCertificates';
import ProfilePage from './pages/Profile';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLessons from './pages/admin/AdminLessons';
import AdminContent from './pages/admin/AdminContent';
import AdminAchievements from './pages/admin/AdminAchievements';
import AdminSettings from './pages/admin/AdminSettings';
import AdminCertificateParagraphs from './pages/admin/AdminCertificateParagraphs';

/**
 * The Test page doubles as the certificate timed-test flow, distinguished only
 * by `?cert=1` in the URL. React Router matches both to the same route element
 * and does NOT remount it when only the search params change, so a finished
 * engine + result modal would leak from one flow into the other. Keying the
 * component on the search string forces a fresh mount whenever the flow flips.
 */
function TestRoute() {
  const { search } = useLocation();
  return <TestMode key={search} />;
}

/**
 * The root "/" always shows the marketing landing page (the intended Home),
 * regardless of sign-in state. Signed-in users' personalized home is the
 * Progress page (/progress), which the navbar links to for them — so the old
 * signed-in dashboard is NOT rendered at "/". It lives INSIDE the shared
 * <AppLayout /> route group (as an index route) so navigating away only swaps
 * this page's content — never the whole shell (navbar, background sheet,
 * footer). A standalone route wrapper would remount the entire layout on
 * exit, which shows a full-screen flash when leaving Home.
 */
function Home() {
  return <Landing />;
}

export default function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      {/* Google OAuth round-trip — standalone (no login layout, no app shell). */}
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      {/* Website shell — ONE persistent AppLayout for the entire app (navbar,
          background sheet, footer). Sign-in-independent pages live directly in
          it; account pages are nested behind the <RequireAuth /> guard.

          Because there is a single shell instance, React Router NEVER unmounts
          the navbar/sheet/footer when moving between pages (e.g. Test → My
          Profile) — it only swaps the <Outlet /> content. That is what prevents
          a full-screen white flash: no layout teardown + instant data. */}
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="/test" element={<TestRoute />} />
        <Route path="/certificate" element={<CertificatePage />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/practice/:slug" element={<PracticeSetup />} />
        <Route path="/practice/:slug/session" element={<PracticeSession />} />
        <Route path="/lessons" element={<Learn />} />
        <Route path="/lessons/:id" element={<LessonPlayer />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/support" element={<SupportCenter />} />
        <Route path="/support/:slug" element={<SupportArticle />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/games" element={<Games />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Account pages — sign-in required. The guard is nested INSIDE the
            shared shell, so entering these routes (e.g. My Profile) swaps only
            the page content and never remounts the layout. */}
        <Route element={<RequireAuth />}>
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/challenge" element={<Challenge />} />
          <Route path="/challenge/:code" element={<Challenge />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/progress/test" element={<ProgressPage />} />
          <Route path="/progress/practice" element={<ProgressPage />} />
          <Route path="/progress/learn" element={<ProgressPage />} />
          <Route path="/progress/achievements" element={<AchievementsPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/certificates" element={<MyCertificates />} />
          <Route path="/profile/:id" element={<ProfilePage />} />

          {/* Admin Panel — route is guarded inside AdminLayout (admin role only). */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="lessons" element={<AdminLessons />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="achievements" element={<AdminAchievements />} />
            <Route path="certificate-paragraphs" element={<AdminCertificateParagraphs />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Redirect unknown protected paths to My Progress */}
          <Route path="*" element={<Navigate to="/progress" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
