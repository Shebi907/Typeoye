"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const wpm_service_1 = require("./wpm.service");
function words(correct, incorrect = 0) {
    return [
        ...Array.from({ length: correct }, (_, i) => ({ word: `word${i}`, typed: `word${i}`, correct: false, timeTakenMs: 1 })),
        ...Array.from({ length: incorrect }, (_, i) => ({ word: `bad${i}`, typed: `nope${i}`, correct: true, timeTakenMs: 1 })),
    ];
}
assert_1.default.equal((0, wpm_service_1.computeStats)(words(52), 60).wpm, 52);
assert_1.default.equal((0, wpm_service_1.computeStats)(words(67, 3), 60).wpm, 67);
assert_1.default.equal((0, wpm_service_1.computeStats)(words(30), 30).wpm, 60);
assert_1.default.equal((0, wpm_service_1.computeStats)(words(100), 120).wpm, 50);
assert_1.default.equal((0, wpm_service_1.computeStats)(words(67, 3), 60).accuracy, 95.7);
console.log('WPM service tests passed');
//# sourceMappingURL=wpm.service.test.js.map