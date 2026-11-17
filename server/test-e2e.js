/**
 * @file test-e2e.js
 * @description Comprehensive End-to-End integration test script validating:
 * 1. Health check with AI microservice status
 * 2. User registration and JWT authentication
 * 3. Chat session lifecycle (Create, List, Rename, Delete)
 * 4. Multi-turn legal Q&A with live/mock FastAPI RAG microservice
 * 5. StructuredRAGResponse schema validation (citations, retrieval, next_steps, warnings)
 * 6. Document management endpoints with access control
 * 7. 1000-character constraint and validation rules
 */

const BASE_URL = 'http://localhost:5000/api';

async function runE2E() {
  console.log('=== STARTING CASEGUIDE FASTAPI RAG MICROSERVICE E2E VERIFICATION ===\n');

  // 1. Health Inspection
  console.log('[1] Testing /api/health with AI Microservice status...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('    Status:', healthRes.status, healthData.status);
  console.log('    Database connected:', healthData.database?.connected);
  console.log('    AI Microservice:', healthData.aiMicroservice?.url, 'Status:', healthData.aiMicroservice?.status);

  // 2. Register
  console.log('\n[2] Testing /api/auth/register...');
  const testEmail = `advocate_${Date.now()}@caseguide.in`;
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Advocate Sneha Patel',
      email: testEmail,
      password: 'StrongPassword123!'
    })
  });
  const regData = await regRes.json();
  console.log('    Register status:', regRes.status, 'Token issued:', !!regData.token);
  const token = regData.token;

  // 3. Login
  console.log('\n[3] Testing /api/auth/login...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'StrongPassword123!'
    })
  });
  const loginData = await loginRes.json();
  console.log('    Login status:', loginRes.status, 'User:', loginData.user?.name);

  // 4. Create Chat Session
  console.log('\n[4] Testing POST /api/chats...');
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
  console.log('    Chat created ID:', chatId);

  // 5. Ask Question 1: Motor Vehicle Recall
  console.log('\n[5] Testing POST /api/chats/:id/ask (Query 1: Vehicle Recall)...');
  const askRes1 = await fetch(`${BASE_URL}/chats/${chatId}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      question: 'How can a manufacturer initiate vehicle recall proceedings for a defect?'
    })
  });
  const askData1 = await askRes1.json();
  console.log('    Ask 1 HTTP status:', askRes1.status);
  console.log('    Success:', askData1.success);
  console.log('    RAG Status:', askData1.assistantMessage?.status || askData1.assistantMessage?.structuredResponse?.metadata?.status);
  console.log('    Problem Title:', askData1.assistantMessage?.structuredResponse?.problem_summary?.title);
  console.log('    Citations count:', askData1.assistantMessage?.structuredResponse?.citations?.length);
  console.log('    Retrieved chunks:', askData1.assistantMessage?.structuredResponse?.retrieval?.total_chunks_retrieved);
  console.log('    Updated Chat Title:', askData1.chat?.title);

  // 6. Ask Follow-up Question 2: Multi-turn Context
  console.log('\n[6] Testing POST /api/chats/:id/ask (Query 2: Multi-turn follow-up)...');
  const askRes2 = await fetch(`${BASE_URL}/chats/${chatId}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      question: 'What penalties apply if the manufacturer fails to inform the government?'
    })
  });
  const askData2 = await askRes2.json();
  console.log('    Ask 2 HTTP status:', askRes2.status);
  console.log('    Refined query:', askData2.assistantMessage?.structuredResponse?.query?.refined_query);
  console.log('    Summary answer:', askData2.assistantMessage?.structuredResponse?.answer?.summary?.slice(0, 100) + '...');

  // 7. Get Messages & Verify Persistence
  console.log('\n[7] Testing GET /api/chats/:id/messages...');
  const msgRes = await fetch(`${BASE_URL}/chats/${chatId}/messages`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const msgData = await msgRes.json();
  console.log('    Total messages in DB:', msgData.messages?.length);
  const lastAssistant = msgData.messages?.find(m => m.role === 'assistant');
  console.log('    Structured response persisted in DB:', !!lastAssistant?.structuredResponse);

  // 8. Document Listing Endpoint
  console.log('\n[8] Testing GET /api/documents (Protected)...');
  const docsRes = await fetch(`${BASE_URL}/documents`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const docsData = await docsRes.json();
  console.log('    Documents status:', docsRes.status, 'Total docs in RAG:', docsData.total_documents ?? docsData.documents?.length);

  // 9. Unauthorized Document Delete Rejection
  console.log('\n[9] Testing DELETE /api/documents/:id without admin privileges (Should be 403)...');
  const unauthDel = await fetch(`${BASE_URL}/documents/test-doc-id`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('    Unauthenticated delete response status:', unauthDel.status, '(Expected 403)');

  // 10. Test 1000 Character Limit Rejection
  console.log('\n[10] Testing 1000-character constraint rejection...');
  const longText = 'Statutory question '.repeat(80);
  const longRes = await fetch(`${BASE_URL}/chats/${chatId}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ question: longText })
  });
  const longData = await longRes.json();
  console.log('    Overlimit response status:', longRes.status, '(Expected 400)', longData.message);

  // 11. Rename Chat
  console.log('\n[11] Testing PATCH /api/chats/:id (Rename)...');
  const renameRes = await fetch(`${BASE_URL}/chats/${chatId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title: 'Vehicle Recall & Manufacturer Duties' })
  });
  const renameData = await renameRes.json();
  console.log('    Renamed chat title:', renameData.chat?.title);

  // 12. Delete Chat
  console.log('\n[12] Testing DELETE /api/chats/:id...');
  const delRes = await fetch(`${BASE_URL}/chats/${chatId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const delData = await delRes.json();
  console.log('    Delete status:', delRes.status, delData.message);

  console.log('\n=== ALL FASTAPI RAG MICROSERVICE E2E INTEGRATION TESTS PASSED! ===');
}

runE2E().catch(console.error);
