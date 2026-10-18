const request = require('supertest');
const express = require('express');
const verifyToken = require('../src/middleware/verifyToken');
const requireRole = require('../src/middleware/requireRole');
const errorHandler = require('../src/middleware/errorHandler');
const { generateToken } = require('../src/modules/auth/auth.service');
const { ROLES } = require('../src/constants/roles');

describe('requireRole Middleware Unit/Integration Tests', () => {
  const testApp = express();
  testApp.use(express.json());

  // Protected route accessible only by lawyers
  testApp.get('/lawyer-only', verifyToken, requireRole(ROLES.LAWYER), (req, res) => {
    res.json({ message: 'Welcome Counselor' });
  });

  // Protected route accessible only by admins
  testApp.get('/admin-only', verifyToken, requireRole(ROLES.ADMIN), (req, res) => {
    res.json({ message: 'Welcome Admin' });
  });

  testApp.use(errorHandler);

  const clientToken = generateToken({
    id: '11111111-1111-1111-1111-111111111111',
    email: 'client@test.legalhub.local',
    role: ROLES.CLIENT
  });

  const lawyerToken = generateToken({
    id: '22222222-2222-2222-2222-222222222222',
    email: 'lawyer@test.legalhub.local',
    role: ROLES.LAWYER
  });

  const adminToken = generateToken({
    id: '33333333-3333-3333-3333-333333333333',
    email: 'admin@test.legalhub.local',
    role: ROLES.ADMIN
  });

  it('should return 403 Forbidden when a client attempts to access a lawyer-only route', async () => {
    const res = await request(testApp)
      .get('/lawyer-only')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('You do not have permission to perform this action');
  });

  it('should return 200 OK when a lawyer accesses a lawyer-only route', async () => {
    const res = await request(testApp)
      .get('/lawyer-only')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Welcome Counselor');
  });

  it('should return 403 Forbidden when a lawyer attempts to access an admin-only route', async () => {
    const res = await request(testApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${lawyerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('You do not have permission to perform this action');
  });

  it('should return 200 OK when an admin accesses an admin-only route', async () => {
    const res = await request(testApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Welcome Admin');
  });
});
