import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";
import { randomUUID } from "node:crypto";
process.env.JWT_SECRET ||= randomUUID() + randomUUID();
const { app } = await import("../app.js");
const { User, Client, Project, Payment } = await import("../models/index.js");
const { summarize } = await import("../services/finance.js");
const name = "freelanceflow_test_" + Date.now();
let owner, other, clientId, projectId, paymentId;
const client = {
  name: "Test Client",
  email: "client@example.com",
  company: "Studio",
};
const project = {
  name: "Website redesign",
  fee: 1000.15,
  startDate: "2026-01-01",
  deadline: "2026-12-01",
  status: "In Progress",
  priority: "High",
};
const payment = {
  amount: 100.1,
  paymentDate: "2026-01-15",
  paymentMethod: "Bank Transfer",
  reference: "TEST-01",
};
before(async () => {
  const uri = process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/";
  await mongoose.connect(uri, {
    dbName: name,
    serverSelectionTimeoutMS: 10000,
  });
  await Promise.all([
    User.init(),
    Client.init(),
    Project.init(),
    Payment.init(),
  ]);
  owner = request.agent(app);
  other = request.agent(app);
});
after(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
test("authentication: protected routes, registration, hashing, duplicate email, login", async () => {
  await request(app).get("/api/projects").expect(401);
  const res = await owner
    .post("/api/auth/register")
    .send({
      name: "Test Owner",
      email: "owner@example.com",
      password: "SafePassword123",
    })
    .expect(201);
  assert.ok(res.headers["set-cookie"][0].includes("HttpOnly"));
  assert.ok(res.headers["set-cookie"][0].includes("SameSite=Strict"));
  assert.equal(res.body.passwordHash, undefined);
  const u = await User.findOne({ email: "owner@example.com" }).select(
    "+passwordHash",
  );
  assert.notEqual(u.passwordHash, "SafePassword123");
  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Other",
      email: "owner@example.com",
      password: "SafePassword123",
    })
    .expect(409);
  await request(app)
    .post("/api/auth/register")
    .send({ name: "A", email: "bad", password: "123" })
    .expect(400);
  await request(app)
    .post("/api/auth/login")
    .send({ email: "owner@example.com", password: "wrong" })
    .expect(401);
  await owner
    .post("/api/auth/login")
    .send({ email: "owner@example.com", password: "SafePassword123" })
    .expect(200);
  await other
    .post("/api/auth/register")
    .send({
      name: "Other User",
      email: "other@example.com",
      password: "SafePassword123",
    })
    .expect(201);
  await owner.get("/api/auth/me").expect(200);
});
test("client CRUD persists and user ownership is enforced", async () => {
  const res = await owner.post("/api/clients").send(client).expect(201);
  clientId = res.body._id;
  assert.ok(await Client.exists({ _id: clientId }));
  await owner
    .put(`/api/clients/${clientId}`)
    .send({ ...client, phone: "12345" })
    .expect(200);
  const detail = await owner.get(`/api/clients/${clientId}`).expect(200);
  assert.equal(detail.body.phone, "12345");
  await other.get(`/api/clients/${clientId}`).expect(404);
  await other.put(`/api/clients/${clientId}`).send(client).expect(404);
  await other.delete(`/api/clients/${clientId}`).expect(404);
  assert.equal((await other.get("/api/clients")).body.length, 0);
});
test("project CRUD, dates, references and ownership", async () => {
  await owner
    .post("/api/projects")
    .send({ ...project, clientId, deadline: "2025-01-01" })
    .expect(400);
  await other
    .post("/api/projects")
    .send({ ...project, clientId })
    .expect(400);
  const res = await owner
    .post("/api/projects")
    .send({ ...project, clientId })
    .expect(201);
  projectId = res.body._id;
  assert.equal(res.body.fee, 1000.15);
  await owner
    .put(`/api/projects/${projectId}`)
    .send({ ...project, clientId, name: "Updated website" })
    .expect(200);
  await other.get(`/api/projects/${projectId}`).expect(404);
  await other
    .put(`/api/projects/${projectId}`)
    .send({ ...project, clientId })
    .expect(404);
  await other.delete(`/api/projects/${projectId}`).expect(404);
  await owner.delete(`/api/clients/${clientId}`).expect(409);
});
test("payment validation rejects negatives, excess decimals, overpayment and foreign projects", async () => {
  for (const amount of [-1, 0, 1001, 0.001])
    await owner
      .post("/api/payments")
      .send({ ...payment, projectId, amount })
      .expect(400);
  await owner
    .post("/api/payments")
    .send({ ...payment, projectId, paymentDate: "2026-02-30" })
    .expect(400);
  await other
    .post("/api/payments")
    .send({ ...payment, projectId })
    .expect(400);
  const res = await owner
    .post("/api/payments")
    .send({ ...payment, projectId })
    .expect(201);
  paymentId = res.body._id;
  assert.equal(res.body.amount, 100.1);
  await other.get(`/api/payments/${paymentId}`).expect(404);
  await other
    .put(`/api/payments/${paymentId}`)
    .send({ ...payment, projectId })
    .expect(404);
  await other.delete(`/api/payments/${paymentId}`).expect(404);
  await owner.delete(`/api/projects/${projectId}`).expect(409);
  await owner
    .put(`/api/projects/${projectId}`)
    .send({ ...project, clientId, fee: 50 })
    .expect(400);
});
test("dashboard uses payment income and exact outstanding balances; date filters work", async () => {
  const res = await owner.get("/api/dashboard/summary?year=2026").expect(200);
  assert.equal(res.body.totalIncome, 100.1);
  assert.equal(res.body.pendingPayments, 900.05);
  assert.equal(res.body.activeProjects, 1);
  assert.equal(res.body.monthly[0].income, 100.1);
  assert.equal(res.body.byClient[0].income, 100.1);
  const filtered = await owner
    .get("/api/analytics/income?year=2026&from=2026-02-01")
    .expect(200);
  assert.equal(filtered.body.totalIncome, 0);
  const privateStats = await other.get("/api/dashboard/summary").expect(200);
  assert.equal(privateStats.body.totalIncome, 0);
});
test("payment editing and failed edits preserve balances", async () => {
  await owner
    .put(`/api/payments/${paymentId}`)
    .send({ ...payment, projectId, amount: 200.15 })
    .expect(200);
  await owner
    .put(`/api/payments/${paymentId}`)
    .send({ ...payment, projectId, amount: 1200 })
    .expect(400);
  assert.equal(
    (await owner.get(`/api/projects/${projectId}`)).body.totalPaid,
    200.15,
  );
  assert.equal(
    (await owner.get(`/api/payments/${paymentId}`)).body.amount,
    200.15,
  );
});
test("moving a payment validates the destination and recalculates both project balances", async () => {
  const destination = await owner
    .post("/api/projects")
    .send({ ...project, clientId, name: "Second project", fee: 250 })
    .expect(201);
  const destinationId = destination.body._id;
  await owner
    .put(`/api/payments/${paymentId}`)
    .send({ ...payment, projectId: destinationId, amount: 300 })
    .expect(400);
  assert.equal(
    (await owner.get(`/api/projects/${projectId}`)).body.totalPaid,
    200.15,
  );
  assert.equal(
    (await owner.get(`/api/projects/${destinationId}`)).body.totalPaid,
    0,
  );
  await owner
    .put(`/api/payments/${paymentId}`)
    .send({ ...payment, projectId: destinationId, amount: 200.15 })
    .expect(200);
  assert.equal(
    (await owner.get(`/api/projects/${projectId}`)).body.totalPaid,
    0,
  );
  assert.equal(
    (await owner.get(`/api/projects/${destinationId}`)).body.totalPaid,
    200.15,
  );
  await owner
    .put(`/api/payments/${paymentId}`)
    .send({ ...payment, projectId, amount: 200.15 })
    .expect(200);
  await owner.delete(`/api/projects/${destinationId}`).expect(200);
});
test("concurrent payments cannot overpay", async () => {
  const responses = await Promise.all(
    [1, 2].map(() =>
      owner.post("/api/payments").send({ ...payment, projectId, amount: 600 }),
    ),
  );
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 400]);
  assert.equal(
    (await owner.get(`/api/projects/${projectId}`)).body.totalPaid,
    800.15,
  );
});
test("deleting payments reverses income, then project and client can be deleted", async () => {
  for (const p of (await owner.get("/api/payments")).body)
    await owner.delete(`/api/payments/${p._id}`).expect(200);
  assert.equal((await owner.get("/api/dashboard/summary")).body.totalIncome, 0);
  assert.equal(
    (await owner.get(`/api/projects/${projectId}`)).body.totalPaid,
    0,
  );
  await owner.delete(`/api/projects/${projectId}`).expect(200);
  await owner.delete(`/api/clients/${clientId}`).expect(200);
  assert.equal(await Project.countDocuments(), 0);
  assert.equal(await Client.countDocuments(), 0);
});
test("profile updates, password changes and logout revoke old sessions", async () => {
  const stale = request.agent(app);
  await stale
    .post("/api/auth/login")
    .send({ email: "owner@example.com", password: "SafePassword123" })
    .expect(200);
  await owner
    .put("/api/users/profile")
    .send({
      name: "Updated Owner",
      email: "newowner@example.com",
      preferredCurrency: "LKR",
    })
    .expect(200);
  await owner
    .put("/api/users/password")
    .send({ currentPassword: "wrong", newPassword: "NewPassword123" })
    .expect(400);
  await owner
    .put("/api/users/password")
    .send({ currentPassword: "SafePassword123", newPassword: "NewPassword123" })
    .expect(200);
  await stale.get("/api/auth/me").expect(401);
  await owner.get("/api/auth/me").expect(200);
  await owner.post("/api/auth/logout").expect(200);
  await owner.get("/api/auth/me").expect(401);
  await owner
    .post("/api/auth/login")
    .send({ email: "newowner@example.com", password: "NewPassword123" })
    .expect(200);
});
test("cross-origin mutations are rejected", async () => {
  await owner
    .post("/api/clients")
    .set("Origin", "https://untrusted.example")
    .send(client)
    .expect(403);
});
test("financial summary handles empty data and exact cent rounding", () => {
  assert.equal(summarize([], [], []).pendingPayments, 0);
  const result = summarize(
    [{ feeCents: 30, paidCents: 30, status: "Completed" }],
    [
      { amountCents: 10, paymentDate: "2026-01-01" },
      { amountCents: 20, paymentDate: "2026-01-02" },
    ],
    [],
    2026,
  );
  assert.equal(result.totalIncome, 0.3);
  assert.equal(result.monthly[0].income, 0.3);
  assert.equal(result.pendingPayments, 0);
});
