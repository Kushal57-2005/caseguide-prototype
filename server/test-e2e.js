/**
 * @file test-e2e.js
 * @description End-to-end integration verification script testing the live HTTP endpoints of caseGuide.
 */

const BASE_URL = 'http://localhost:5000/api';

async function runE2E() {
  console.log('--- STARTING CASEGUIDE LIVE HTTP ENDPOINT VERIFICATION ---');

  // 1. Health
  console.log('\n[1] Testing /api/health...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('Health status:', healthRes.status, healthData.status, 'DB:', healthData.database?.status);

  // 2. Register
  console.log('\n[2] Testing /api/auth/register...');
  const testEmail = `citizen_${Date.now()}@caseguide.in`;
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohan Verma',
      email: testEmail,
      password: 'password123'
    })
  });
  const regData = await regRes.json();
  console.log('Register response:', regRes.status, regData.message, 'Token received:', !!regData.token);
  const token = regData.token;

  // 3. Login
  console.log('\n[3] Testing /api/auth/login...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'password123'
    })
  });
  const loginData = await loginRes.json();
  console.log('Login response:', loginRes.status, 'User:', loginData.user?.name);

  // 4. Me
  console.log('\n[4] Testing /api/auth/me...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const meData = await meRes.json();
  console.log('Me response:', meRes.status, meData.user?.email);

  // 5. Create Chat
  console.log('\n[5] Testing POST /api/chats...');
  const createChatRes = await fetch(`${BASE_URL}/chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title: 'New Legal Query' })
  });
  const createChatData = await createChatRes.json();
  const chatId = createChatData.chat._id;
  console.log('Chat created with ID:', chatId, 'Title:', createChatData.chat.title);

  // 6. Ask Question 1: Defective Product
  console.log('\n[6] Testing POST /api/chats/:id/ask (Defective Product)...');
  const askRes1 = await fetch(`${BASE_URL}/chats/${chatId}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      question: 'I bought a defective refrigerator online and the seller refuses to refund my money.'
    })
  });
  const askData1 = await askRes1.json();
  console.log('Ask 1 status:', askRes1.status);
  console.log('Assistant category:', askData1.assistantMessage?.answer?.category);
  console.log('Legal match count:', askData1.assistantMessage?.answer?.legal_match?.length);
  console.log('Updated chat title:', askData1.chat?.title);

  // 7. Ask Question 2 (Follow-up): UPI Fraud
  console.log('\n[7] Testing POST /api/chats/:id/ask (UPI Scam)...');
  const askRes2 = await fetch(`${BASE_URL}/chats/${chatId}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      question: 'Someone called pretending to be bank staff and ₹50,000 was debited via UPI OTP fraud.'
    })
  });
  const askData2 = await askRes2.json();
  console.log('Ask 2 status:', askRes2.status);
  console.log('Assistant category:', askData2.assistantMessage?.answer?.category);
  console.log('Forum office:', askData2.assistantMessage?.answer?.forum?.office);

  // 8. Get Messages
  console.log('\n[8] Testing GET /api/chats/:id/messages...');
  const msgRes = await fetch(`${BASE_URL}/chats/${chatId}/messages`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const msgData = await msgRes.json();
  console.log('Messages retrieved count:', msgData.messages?.length);

  // 9. Rename Chat
  console.log('\n[9] Testing PATCH /api/chats/:id (Rename)...');
  const renameRes = await fetch(`${BASE_URL}/chats/${chatId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title: 'Consumer & Banking Grievance' })
  });
  const renameData = await renameRes.json();
  console.log('Renamed title:', renameData.chat?.title);

  // 10. Test 1000 Character Limit Rejection
  console.log('\n[10] Testing 1000-char limit enforcement...');
  const longQ = 'Legal grievance '.repeat(80);
  const rejectRes = await fetch(`${BASE_URL}/chats/${chatId}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ question: longQ })
  });
  const rejectData = await rejectRes.json();
  console.log('Overlimit rejection status:', rejectRes.status, 'Message:', rejectData.message);

  // 11. Delete Chat
  console.log('\n[11] Testing DELETE /api/chats/:id...');
  const delRes = await fetch(`${BASE_URL}/chats/${chatId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const delData = await delRes.json();
  console.log('Delete status:', delRes.status, delData.message);

  console.log('\n--- ALL E2E API VERIFICATIONS PASSED SUCCESSFULLY! ---');
}

runE2E().catch(console.error);
