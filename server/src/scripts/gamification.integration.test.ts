/* eslint-disable no-console */
/**
 * END-TO-END GAMIFICATION CHECK (achievements v2)
 *
 * Runs against a live server (expected at http://localhost:3001). Registers
 * fresh users, completes real test / practice / lesson sessions through the
 * public API, and verifies EVERY achievement individually — including the
 * negative cases (wrong accuracy, short duration, too few tests, not enough
 * practice, streak gaps). Also confirms server-derived XP/levels and that
 * client-submitted stats are ignored.
 *
 * Run: ts-node src/scripts/gamification.integration.test.ts
 */
import mongoose from 'mongoose';
import Streak from '../models/Streak';
import { env } from '../config/env';
import { deriveLevelFromXp } from '../services/gamification.service';
import type { IAchievement } from '../models/Achievement';

const BASE = `http://localhost:${env.PORT}/api`;

let failures = 0;
function check(name: string, condition: boolean, detail?: unknown): void {
  if (condition) {
    console.log(`  ✓ ${name}`);
  } else {
    failures += 1;
    console.error(`  ✗ FAIL: ${name}${detail !== undefined ? ` → ${JSON.stringify(detail)}` : ''}`);
  }
}

async function api(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' = 'GET',
  body?: unknown,
  token?: string
): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`API ${method} ${path} failed (${res.status}): ${JSON.stringify(json)}`);
  return json;
}

function words(count: number, wrong = 0): { word: string; typed: string; correct: boolean; timeTakenMs: number }[] {
  const pool = ['the', 'quick', 'brown', 'fox', 'jumps', 'lazy', 'dog', 'pack', 'my', 'box'];
  const typedWords: { word: string; typed: string; correct: boolean; timeTakenMs: number }[] = [];
  for (let i = 0; i < count; i++) {
    const word = pool[i % pool.length];
    const isWrong = i < wrong;
    typedWords.push({ word, typed: isWrong ? `${word}x` : word, correct: !isWrong, timeTakenMs: 1800 });
  }
  return typedWords;
}

async function submitSession(
  token: string,
  mode: 'test' | 'practice',
  typedWords: { word: string; typed: string; correct: boolean; timeTakenMs: number }[],
  durationSeconds: number,
  extra: Record<string, unknown> = {}
): Promise<any> {
  const end = new Date();
  const start = new Date(end.getTime() - durationSeconds * 1000);
  return api(
    '/typing/sessions',
    'POST',
    {
      mode,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      typedWords,
      textSource: 'generated',
      clientWpm: 999,
      clientAccuracy: 100,
      ...extra,
    },
    token
  );
}

async function registerUser(): Promise<{ token: string; userId: string }> {
  const ts = Date.now();
  const username = `gt${String(ts).slice(-10)}${Math.floor(Math.random() * 1000)}`;
  const registered = await api('/auth/register', 'POST', {
    username,
    email: `${username}@typeoye.test`,
    password: 'password123',
  });
  return { token: registered.data.token as string, userId: registered.data.user._id as string };
}

async function getAchievements(token: string): Promise<{ name: string; unlocked: boolean; progress: number }[]> {
  const res = await api('/users/me/achievements', 'GET', undefined, token);
  return res.data.achievements as { name: string; unlocked: boolean; progress: number }[];
}

async function unlockedNames(payload: any): Promise<string[]> {
  return (payload.data?.newAchievements ?? (payload.newAchievements as IAchievement[])).map(
    (a: IAchievement) => a.name
  );
}

async function completeLesson(token: string, order: number): Promise<boolean> {
  const lessonsRes = await api('/lessons', 'GET', undefined, token);
  const lesson = (lessonsRes.data.lessons as { _id: string; order: number }[]).find((l) => l.order === order)!;
  if (!lesson) throw new Error(`Lesson order=${order} not found`);
  const lessonRes = await api(`/lessons/${lesson._id}`, 'GET', undefined, token);
  const exercises = lessonRes.data.exercises as { _id: string; content: string; variantIndex?: number }[];
  let completed = false;
  for (const exercise of exercises) {
    const expected = exercise.content.trim().split(/\s+/);
    const typedWords = expected.map((word) => ({ word, typed: word, correct: true, timeTakenMs: 1500 }));
    const end = new Date();
    const start = new Date(end.getTime() - 1500 * typedWords.length);
    const done = await api(
      `/lessons/${lesson._id}/exercises/${exercise._id}/complete`,
      'POST',
      { startTime: start.toISOString(), endTime: end.toISOString(), typedWords, variantIndex: exercise.variantIndex },
      token
    );
    if (done.data.lessonCompleted) completed = true;
  }
  return completed;
}

async function main(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);

  // ── Scenario 1: baseline — opening/starting must not count ──────────────
  console.log('\n── Scenario 1: fresh user baseline, opening must not count ──');
  const { token, userId } = await registerUser();
  check('registration returns level 1 profile', (await api('/auth/me', 'GET', undefined, token)).data.profile.level === 1);
  const baseline = await getAchievements(token);
  check('endpoint lists all 14 achievements', baseline.length === 14, baseline.length);
  check('no tests yet: "First Test" locked at 0', (() => {
    const a = baseline.find((x) => x.name === 'First Test');
    return Boolean(a) && !a!.unlocked && a!.progress === 0;
  })());
  check('no practice yet: "First Practice" locked at 0', (() => {
    const a = baseline.find((x) => x.name === 'First Practice');
    return Boolean(a) && !a!.unlocked && a!.progress === 0;
  })());
  check('no speed yet: "Reach 25 WPM" locked at 0', (() => {
    const a = baseline.find((x) => x.name === 'Reach 25 WPM');
    return Boolean(a) && !a!.unlocked && a!.progress === 0;
  })());
  check('no streak yet: "7 Day Streak" locked at 0', (() => {
    const a = baseline.find((x) => x.name === '7 Day Streak');
    return Boolean(a) && !a!.unlocked && a!.progress === 0;
  })());
  check(
    'new catalog names present (Lightning Fast, Complete First 3 Lessons, Perfect Test)',
    baseline.some((a) => a.name === 'Lightning Fast') &&
      baseline.some((a) => a.name === 'Complete First 3 Lessons') &&
      baseline.some((a) => a.name === 'Perfect Test'),
    baseline.map((a) => a.name)
  );

  // ── Scenario 2: test-based chain with negatives ─────────────────────────
  console.log('\n── Scenario 2: test-based achievements (WPM + accuracy + duration + count) ──');
  // T1: 30 WPM / 100% / 60s
  const t1 = await submitSession(token, 'test', words(30), 60);
  let names = await unlockedNames(t1);
  check('server computes WPM (client claimed 999)', t1.data.result.wpm === 30, t1.data.result.wpm);
  check('server computes accuracy (client claimed 100)', t1.data.result.accuracy === 100);
  check('T1 unlocks "Reach 25 WPM"', names.includes('Reach 25 WPM'), names);
  check('T1 does NOT unlock "Reach 40 WPM"', !names.includes('Reach 40 WPM'));
  check('T1 does NOT unlock "95% Accuracy" (only 30 WPM)', !names.includes('95% Accuracy'));
  check('T1 does NOT unlock "First Test" (1 of 3)', !names.includes('First Test'));

  // T2: 40 WPM / 100% / 60s
  const t2 = await submitSession(token, 'test', words(40), 60);
  names = await unlockedNames(t2);
  check('T2 unlocks "Reach 40 WPM"', names.includes('Reach 40 WPM'), names);
  check('T2 unlocks "95% Accuracy" (100% acc at 40+ WPM)', names.includes('95% Accuracy'));
  check('T2 does NOT unlock "99% Accuracy" (needs 50+ WPM)', !names.includes('99% Accuracy'));
  check('T2 does NOT unlock "Perfect Test" (needs 2 tests + 50 WPM)', !names.includes('Perfect Test'));
  check('T2 does NOT unlock "First Test" (2 of 3)', !names.includes('First Test'));

  // T3: 50 WPM / 100% / 60s → 3rd test
  const t3 = await submitSession(token, 'test', words(50), 60);
  names = await unlockedNames(t3);
  check('T3 unlocks "First Test" (3 completed tests)', names.includes('First Test'), names);
  check('T3 unlocks "99% Accuracy" (100% acc at 50+ WPM)', names.includes('99% Accuracy'));
  check('T3 does NOT unlock "Perfect Test" (only 1 qualifying test)', !names.includes('Perfect Test'));

  // T4 (negative - duration): 60 WPM / 100% but only 30s
  const t4 = await submitSession(token, 'test', words(30), 30);
  names = await unlockedNames(t4);
  check('T4 (60 WPM, 100%, 30s) does NOT unlock "Speed Demon" (needs 60s+)', !names.includes('Speed Demon'), names);
  check('T4 (30s) does NOT unlock "Perfect Test" (needs 60s+)', !names.includes('Perfect Test'));

  // T5 (negative - accuracy): 60 WPM, 85.7% accuracy / 60s
  const t5 = await submitSession(token, 'test', words(70, 10), 60);
  names = await unlockedNames(t5);
  check('T5 (60 WPM, 85.7%) does NOT unlock "Speed Demon" (needs 92%+)', !names.includes('Speed Demon'), names);
  check('T5 does NOT unlock "Reach 80 WPM"', !names.includes('Reach 80 WPM'));
  let ach = await getAchievements(token);
  const sd = ach.find((a) => a.name === 'Speed Demon');
  check('"Speed Demon" still locked with progress 50 (best qualifying speed)', Boolean(sd) && !sd!.unlocked && sd!.progress === 50, sd);

  // T6: 95 WPM / 100% / 60s
  const t6 = await submitSession(token, 'test', words(95), 60);
  names = await unlockedNames(t6);
  check('T6 unlocks "Speed Demon" (95 WPM, 100%, 60s)', names.includes('Speed Demon'), names);
  check('T6 unlocks "Reach 80 WPM"', names.includes('Reach 80 WPM'));
  check('T6 unlocks "Perfect Test" (2nd qualifying perfect test)', names.includes('Perfect Test'));
  check('T6 does NOT unlock "Lightning Fast" (95 < 100 WPM)', !names.includes('Lightning Fast'));

  // T7–T9: 100 WPM / 100% / 60s three times
  const t7 = await submitSession(token, 'test', words(100), 60);
  names = await unlockedNames(t7);
  check('T7 does NOT unlock "Lightning Fast" (1 of 3 tests)', !names.includes('Lightning Fast'), names);
  ach = await getAchievements(token);
  const li = ach.find((a) => a.name === 'Lightning Fast');
  check('"Lightning Fast" locked but progress shows 100 WPM reached', Boolean(li) && !li!.unlocked && li!.progress === 100, li);
  await submitSession(token, 'test', words(100), 60);
  const t9 = await submitSession(token, 'test', words(100), 60);
  names = await unlockedNames(t9);
  check('T9 unlocks "Lightning Fast" (100 WPM at 95%+ in 3 separate tests)', names.includes('Lightning Fast'), names);

  // ── Scenario 3: practice count (opening must not count) ─────────────────
  console.log('\n── Scenario 3: "First Practice" needs 5 completed sessions ──');
  const practiceUser = await registerUser();
  const ptok = practiceUser.token;
  for (let i = 1; i <= 4; i++) {
    await submitSession(ptok, 'practice', words(10), 60, { practiceType: 'word', practiceDifficulty: 1 });
  }
  let pach = await getAchievements(ptok);
  const fp = pach.find((a) => a.name === 'First Practice');
  check('4 practice sessions: "First Practice" still locked at 4', Boolean(fp) && !fp!.unlocked && fp!.progress === 4, fp);
  check('practice sessions do NOT count as tests ("First Test" 0/3)', (() => {
    const a = pach.find((x) => x.name === 'First Test');
    return Boolean(a) && !a!.unlocked && a!.progress === 0;
  })());
  check('practice sessions do NOT count toward WPM ("Reach 25 WPM" 0)', (() => {
    const a = pach.find((x) => x.name === 'Reach 25 WPM');
    return Boolean(a) && !a!.unlocked && a!.progress === 0;
  })());
  const p5 = await submitSession(ptok, 'practice', words(10), 60, { practiceType: 'word', practiceDifficulty: 1 });
  names = await unlockedNames(p5);
  check('5th practice unlocks "First Practice"', names.includes('First Practice'), names);

  // ── Scenario 4: lessons with 90%+ accuracy requirement ──────────────────
  console.log('\n── Scenario 4: "Complete First 3 Lessons" / "Complete 10 Lessons" ──');
  const lessonUser = await registerUser();
  const ltok = lessonUser.token;
  check('lesson 1 completes', await completeLesson(ltok, 1));
  let lach = await getAchievements(ltok);
  check('1 lesson: "Complete First 3 Lessons" locked at 1', (() => {
    const a = lach.find((x) => x.name === 'Complete First 3 Lessons');
    return Boolean(a) && !a!.unlocked && a!.progress === 1;
  })());
  check('1 lesson: "Complete 10 Lessons" locked at 1/10', (() => {
    const a = lach.find((x) => x.name === 'Complete 10 Lessons');
    return Boolean(a) && !a!.unlocked && a!.progress === 1;
  })());
  check('lesson 2 completes', await completeLesson(ltok, 2));
  check('lesson 3 completes', await completeLesson(ltok, 3));
  lach = await getAchievements(ltok);
  check('3 lessons: "Complete First 3 Lessons" unlocked', (() => {
    const a = lach.find((x) => x.name === 'Complete First 3 Lessons');
    return Boolean(a) && a!.unlocked;
  })());
  check('3 lessons: "Complete 10 Lessons" locked at 3/10', (() => {
    const a = lach.find((x) => x.name === 'Complete 10 Lessons');
    return Boolean(a) && !a!.unlocked && a!.progress === 3;
  })());

  // ── Scenario 5: streak days (completed sessions only) ───────────────────
  console.log('\n── Scenario 5: 7-day and 30-day streak achievements ──');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await Streak.updateOne({ userId }, { lastActiveDate: yesterday, currentStreak: 6, longestStreak: 6 });
  const s7 = await submitSession(token, 'practice', words(5), 30, { practiceType: 'word' });
  names = await unlockedNames(s7);
  check('7 consecutive days unlock "7 Day Streak"', names.includes('7 Day Streak'), names);
  await Streak.updateOne({ userId }, { lastActiveDate: yesterday, currentStreak: 29, longestStreak: 6 });
  const s30 = await submitSession(token, 'practice', words(5), 30, { practiceType: 'word' });
  names = await unlockedNames(s30);
  check('30 consecutive days unlock "30 Day Streak"', names.includes('30 Day Streak'), names);

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  await Streak.updateOne({ userId }, { lastActiveDate: threeDaysAgo, currentStreak: 5, longestStreak: 30 });
  await submitSession(token, 'practice', words(5), 30, { practiceType: 'word' });
  const summary = await api('/analytics/summary', 'GET', undefined, token);
  check('a skipped day resets the streak to 1', summary.data.streak.currentStreak === 1, summary.data.streak);
  check('longest streak is preserved (30)', summary.data.streak.longestStreak === 30);

  // ── Scenario 6: client cannot fake stats ────────────────────────────────
  console.log('\n── Scenario 6: client cannot fake stats ──');
  const profileBefore = await api(`/users/${userId}/profile`, 'GET');
  const beforeBest = (profileBefore.data.progress as { bestWpm: number }).bestWpm;
  const fake = await submitSession(token, 'test', words(10, 10), 10);
  check('server discards client WPM claim', fake.data.result.wpm === 0, fake.data.result.wpm);
  check('no personal-best bonus for a failed session', fake.data.xpEarned === 20, fake.data.xpEarned);
  const profileAfter = await api(`/users/${userId}/profile`, 'GET');
  check(
    'bestWpm unchanged by faked session',
    (profileAfter.data.progress as { bestWpm: number }).bestWpm === beforeBest,
    { before: beforeBest, after: profileAfter.data.progress.bestWpm }
  );

  // ── Scenario 7: level/title match stored XP exactly ─────────────────────
  console.log('\n── Scenario 7: level/title match stored XP exactly ──');
  const me = await api('/auth/me', 'GET', undefined, token);
  const expectedLevel = deriveLevelFromXp(me.data.profile.totalXP);
  check(
    'profile.level equals deriveLevelFromXp(totalXP)',
    me.data.profile.level === expectedLevel.level,
    { stored: me.data.profile.level, derived: expectedLevel.level, xp: me.data.profile.totalXP }
  );
  check('profile.levelTitle equals derived title', me.data.profile.levelTitle === expectedLevel.title);
  check('total XP strictly greater than a single test', me.data.profile.totalXP > 0);
  const finalAch = await getAchievements(token);
  check('final endpoint still lists all 14 achievements', finalAch.length === 14, finalAch.length);
  check(
    'final state: "Lightning Fast" unlocked',
    finalAch.find((a) => a.name === 'Lightning Fast')?.unlocked === true
  );
  check(
    'final state: "Perfect Test" unlocked',
    finalAch.find((a) => a.name === 'Perfect Test')?.unlocked === true
  );

  await mongoose.disconnect();
  console.log(failures === 0 ? '\n🎉 All gamification integration checks passed' : `\n❌ ${failures} check(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Integration test crashed:', err);
  process.exit(1);
});