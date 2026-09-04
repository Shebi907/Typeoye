import assert from 'assert';
import { computeStats } from './wpm.service';

function words(correct: number, incorrect = 0) {
  return [
    ...Array.from({ length: correct }, (_, i) => ({ word: `word${i}`, typed: `word${i}`, correct: false, timeTakenMs: 1 })),
    ...Array.from({ length: incorrect }, (_, i) => ({ word: `bad${i}`, typed: `nope${i}`, correct: true, timeTakenMs: 1 })),
  ];
}

assert.equal(computeStats(words(52), 60).wpm, 52);
assert.equal(computeStats(words(67, 3), 60).wpm, 67);
assert.equal(computeStats(words(30), 30).wpm, 60);
assert.equal(computeStats(words(100), 120).wpm, 50);
assert.equal(computeStats(words(67, 3), 60).accuracy, 95.7);
console.log('WPM service tests passed');