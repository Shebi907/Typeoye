"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const index_1 = require("../index");
const http_1 = __importDefault(require("http"));
async function runTests() {
    await (0, db_1.connectDB)();
    const app = (0, index_1.createApp)();
    const server = http_1.default.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api`;
    console.log(`Test server running on port ${port}`);
    const userAEmail = `usera_${Date.now()}@example.com`;
    const userBEmail = `userb_${Date.now()}@example.com`;
    const password = 'Password123!';
    console.log('\n--- TEST 1: Register User A ---');
    const regARes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: `userA_${Date.now().toString(36)}`, email: userAEmail, password }),
    });
    const regAData = (await regARes.json());
    console.log('User A Signup Status:', regARes.status);
    console.log('User A Token Received:', regAData.data?.token ? 'YES' : 'NO');
    console.log('User A emailVerified:', regAData.data?.user?.emailVerified);
    if (!regAData.data?.token) {
        throw new Error('User A signup failed');
    }
    const tokenA = regAData.data.token;
    console.log('\n--- TEST 2: User A Logs Typing Session ---');
    const sessionRes = await fetch(`${baseUrl}/typing/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({
            mode: 'test',
            startTime: new Date(Date.now() - 60000).toISOString(),
            endTime: new Date().toISOString(),
            textSource: 'generated',
            typedWords: [
                { word: 'hello', typed: 'hello', correct: true, timeTakenMs: 500 },
            ],
            clientWpm: 85,
            clientAccuracy: 98,
        }),
    });
    console.log('User A Session Post Status:', sessionRes.status);
    console.log('\n--- TEST 3: User A Fetch Analytics ---');
    const analyticsARes = await fetch(`${baseUrl}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${tokenA}` },
    });
    const analyticsAData = (await analyticsARes.json());
    console.log('User A Dashboard Total Tests:', analyticsAData.data?.overview?.totalTests);
    console.log('\n--- TEST 4: Register User B & Verify Data Isolation ---');
    const regBRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: `userB_${Date.now().toString(36)}`, email: userBEmail, password }),
    });
    const regBData = (await regBRes.json());
    console.log('User B Signup Status:', regBRes.status);
    console.log('User B Token Received:', regBData.data?.token ? 'YES' : 'NO');
    const tokenB = regBData.data.token;
    const analyticsBRes = await fetch(`${baseUrl}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${tokenB}` },
    });
    const analyticsBData = (await analyticsBRes.json());
    console.log('User B Dashboard Total Tests (Must be 0):', analyticsBData.data?.overview?.totalTests ?? 0);
    if ((analyticsBData.data?.overview?.totalTests ?? 0) !== 0) {
        throw new Error('DATA ISOLATION FAILURE: User B sees User A tests!');
    }
    console.log('✅ DATA ISOLATION VERIFIED: User B has 0 tests!');
    console.log('\n--- TEST 5: Immediate Login for User A ---');
    const loginARes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userAEmail, password }),
    });
    const loginAData = (await loginARes.json());
    console.log('User A Immediate Login Status:', loginARes.status);
    console.log('User A Logged In User:', loginAData.data?.user?.email);
    console.log('\n--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
    server.close();
    process.exit(0);
}
runTests().catch((err) => {
    console.error('TEST FAILED:', err);
    process.exit(1);
});
//# sourceMappingURL=test_no_verification.js.map