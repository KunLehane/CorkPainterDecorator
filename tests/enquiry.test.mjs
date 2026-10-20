import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/enquiry.js';

const payload = { name: 'Preview Test', phone: '0830000000', service: 'Interior Painting', page: '/contact/' };
const request = (data = payload, origin = 'https://corkpainterdecorator.ie') =>
  new Request('https://corkpainterdecorator.ie/api/enquiry', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

test('rejects cross-origin submissions before sending', async () => {
  const r = await onRequestPost({ request: request(payload, 'https://example.org'), env: {} });
  assert.equal(r.status, 403);
});

test('requires a name and a valid phone number', async () => {
  const r = await onRequestPost({ request: request({ ...payload, phone: '123' }), env: {} });
  assert.equal(r.status, 400);
});

test('rejects honeypot submissions', async () => {
  const r = await onRequestPost({ request: request({ ...payload, 'company-website': 'spam' }), env: {} });
  assert.equal(r.status, 400);
});

test('missing email configuration never reports success', async () => {
  const r = await onRequestPost({ request: request(), env: {} });
  assert.equal(r.status, 503);
  assert.equal((await r.json()).ok, false);
});

test('only provider-confirmed messages succeed, with fixed recipients', async (t) => {
  let body;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    body = JSON.parse(options.body);
    return new Response(JSON.stringify({ id: 'test-receipt' }), { status: 200 });
  });
  const r = await onRequestPost({
    request: request({ ...payload, to: 'attacker@example.com' }),
    env: { RESEND_API_KEY: 'test-only', LEAD_FROM: 'test@example.com' },
  });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).ok, true);
  assert.deepEqual(body.to, ['aidanlehane@gmail.com']);
});

test('LEAD_TO adds the business address and Aidan is still copied', async (t) => {
  let body;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    body = JSON.parse(options.body);
    return new Response(JSON.stringify({ id: 'test-receipt' }), { status: 200 });
  });
  const r = await onRequestPost({
    request: request(),
    env: { RESEND_API_KEY: 'test-only', LEAD_FROM: 'test@example.com', LEAD_TO: 'painter@example.com' },
  });
  assert.equal(r.status, 200);
  assert.deepEqual(body.to, ['painter@example.com', 'aidanlehane@gmail.com']);
});

test('provider failures preserve an error response', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 500 }));
  const r = await onRequestPost({ request: request(), env: { RESEND_API_KEY: 'test-only', LEAD_FROM: 'test@example.com' } });
  assert.equal(r.status, 502);
  assert.equal((await r.json()).ok, false);
});

test('syncs to GHL when configured, without blocking the email send', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url: String(url), body: options.body && JSON.parse(options.body) });
    if (String(url).includes('resend.com')) return new Response(JSON.stringify({ id: 'test-receipt' }), { status: 200 });
    return new Response('ok', { status: 200 });
  });
  const background = [];
  const r = await onRequestPost({
    request: request(),
    env: { RESEND_API_KEY: 'test-only', LEAD_FROM: 'test@example.com', GHL_WEBHOOK_URL: 'https://hooks.example.com/ghl' },
    waitUntil: (p) => background.push(p),
  });
  await Promise.all(background);
  assert.equal(r.status, 200);
  const ghlCall = calls.find((c) => c.url === 'https://hooks.example.com/ghl');
  assert.ok(ghlCall, 'expected a call to the GHL webhook URL');
  assert.equal(ghlCall.body.name, payload.name);
  assert.equal(ghlCall.body.phone, payload.phone);
});

test('a failing GHL webhook still lets the email send succeed', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).includes('resend.com')) return new Response(JSON.stringify({ id: 'test-receipt' }), { status: 200 });
    throw new Error('GHL is down');
  });
  const background = [];
  const r = await onRequestPost({
    request: request(),
    env: { RESEND_API_KEY: 'test-only', LEAD_FROM: 'test@example.com', GHL_WEBHOOK_URL: 'https://hooks.example.com/ghl' },
    waitUntil: (p) => background.push(p),
  });
  await Promise.allSettled(background);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).ok, true);
});

test('quote leads go to Aidan, ignoring supplied recipients', async (t) => {
  let body;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    body = JSON.parse(options.body);
    return new Response(JSON.stringify({ id: 'test-receipt' }), { status: 200 });
  });
  const r = await onRequestPost({
    request: request({ ...payload, page: '/quote/', service: 'Exterior Painting', to: 'attacker@example.com' }),
    env: { RESEND_API_KEY: 'test-only', LEAD_FROM: 'test@example.com' },
  });
  assert.equal(r.status, 200);
  assert.deepEqual(body.to, ['aidanlehane@gmail.com']);
});
