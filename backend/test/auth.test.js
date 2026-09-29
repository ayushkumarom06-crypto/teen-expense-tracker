import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../src/middleware/auth.js';

process.env.JWT_SECRET = 'unit-test-secret-with-at-least-32-characters';

function callMiddleware(authorization) {
  const req = { get: () => authorization };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  let continued = false;
  requireAuth(req, res, () => { continued = true; });
  return { req, res, continued };
}

test('auth middleware trusts only the verified JWT subject', () => {
  const token = jwt.sign({}, process.env.JWT_SECRET, { subject: 'user-123' });
  const result = callMiddleware(`Bearer ${token}`);
  assert.equal(result.continued, true);
  assert.equal(result.req.userId, 'user-123');
});

test('auth middleware rejects missing and malformed bearer tokens', () => {
  for (const authorization of [undefined, 'Bearer not-a-token']) {
    const result = callMiddleware(authorization);
    assert.equal(result.continued, false);
    assert.equal(result.res.statusCode, 401);
    assert.equal(result.res.body.success, false);
  }
});