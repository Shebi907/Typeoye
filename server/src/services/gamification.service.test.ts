import { deriveLevelFromXp, computeSessionXp, XP_VALUES, LEVEL_TIERS } from './gamification.service';
import { assert } from 'console';

function check(name: string, condition: boolean): void {
  if (!condition) {
    console.error(`✗ FAIL: ${name}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${name}`);
  }
}

const stats = (wpm: number, accuracy: number) => ({
  wpm,
  accuracy,
  correctWords: Math.round((accuracy / 100) * 10),
  attemptedWords: 10,
  errorsCount: 10 - Math.round((accuracy / 100) * 10),
});

// ── deriveLevelFromXp ───────────────────────────────────────────────
check('0 XP is Typing Beginner (level 1)', deriveLevelFromXp(0).title === 'Typing Beginner');
check('0 XP progress is 0%', deriveLevelFromXp(0).progressPct === 0);
check('99 XP is still level 1', deriveLevelFromXp(99).level === 1);
check('100 XP crosses into Typing Learner', deriveLevelFromXp(100).title === 'Typing Learner');
check('249 XP is Typing Learner', deriveLevelFromXp(249).level === 2);
check('250 XP is Typing Apprentice', deriveLevelFromXp(250).title === 'Typing Apprentice');
check('450 XP is Typing Pro', deriveLevelFromXp(450).title === 'Typing Pro');
check('700 XP is Typing Expert', deriveLevelFromXp(700).title === 'Typing Expert');
check('1000 XP is Keyboard Master', deriveLevelFromXp(1000).title === 'Keyboard Master');
check('Keyboard Master is max level', deriveLevelFromXp(1000).isMaxLevel === true);
check('Keyboard Master progress capped at 100%', deriveLevelFromXp(5000).progressPct === 100);

const learner = deriveLevelFromXp(150);
check('150 XP into level: xpIntoLevel = 50', learner.xpIntoLevel === 50);
check('150 XP into level: xpForLevel = 150', learner.xpForLevel === 150);
check('150 XP into level: xpToNext = 100', learner.xpToNext === 100);
check('150 XP into level: nextTitle is Typing Apprentice', learner.nextTitle === 'Typing Apprentice');

const tiersIncreasing = LEVEL_TIERS.every(
  (tier, i, arr) => i === 0 || tier.xpRequired - arr[i - 1].xpRequired > 0
);
check('Level gaps increase between tiers', tiersIncreasing);

// ── computeSessionXp ────────────────────────────────────────────────
const plainTest = computeSessionXp({
  mode: 'test',
  stats: stats(50, 90),
  isPersonalBest: false,
  isFirstActivityToday: false,
});
check('plain test = testComplete XP', plainTest.total === XP_VALUES.testComplete);

const firstTest = computeSessionXp({
  mode: 'test',
  stats: stats(50, 90),
  isPersonalBest: false,
  isFirstActivityToday: true,
});
check('first activity of day adds daily bonus', firstTest.total === XP_VALUES.testComplete + XP_VALUES.dailyActivityBonus);

const pbTest = computeSessionXp({
  mode: 'test',
  stats: stats(60, 90),
  isPersonalBest: true,
  isFirstActivityToday: true,
});
check(
  'personal best + first activity stacks bonuses',
  pbTest.total === XP_VALUES.testComplete + XP_VALUES.personalBestBonus + XP_VALUES.dailyActivityBonus
);

const perfect = computeSessionXp({
  mode: 'test',
  stats: stats(55, 100),
  isPersonalBest: false,
  isFirstActivityToday: false,
});
check('perfect accuracy adds perfect bonus', perfect.total === XP_VALUES.testComplete + XP_VALUES.perfectAccuracyBonus);

const highAcc = computeSessionXp({
  mode: 'test',
  stats: stats(55, 96),
  isPersonalBest: false,
  isFirstActivityToday: false,
});
check('95-99% accuracy adds high-accuracy bonus (not perfect)', highAcc.total === XP_VALUES.testComplete + XP_VALUES.highAccuracyBonus);

const practice = computeSessionXp({
  mode: 'practice',
  stats: stats(40, 92),
  isPersonalBest: false,
  isFirstActivityToday: false,
});
check('practice base XP is lower than test', practice.total === XP_VALUES.practiceComplete && XP_VALUES.practiceComplete < XP_VALUES.testComplete);

const game = computeSessionXp({
  mode: 'game',
  stats: stats(40, 92),
  isPersonalBest: false,
  isFirstActivityToday: false,
});
check('game base XP = gameComplete', game.total === XP_VALUES.gameComplete);

if (!process.exitCode) {
  console.log('\nAll gamification service tests passed');
} else {
  console.error('\nSome gamification service tests failed');
}
