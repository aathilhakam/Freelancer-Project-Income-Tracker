import { Client, Project, Payment } from "../models/index.js";
import { fail } from "../middleware/index.js";
import * as v from "../validators/index.js";
import { cents, summarize } from "../services/finance.js";
const scope = (req) => ({ userId: req.user.id });
const serializeProject = (project, paidCents = 0) => ({
  ...project,
  paidCents,
  fee: project.feeCents / 100,
  totalPaid: paidCents / 100,
  remainingBalance: (project.feeCents - paidCents) / 100,
});
const serializePayment = (payment) => ({
  ...payment,
  amount: payment.amountCents / 100,
});
async function owned(Model, req) {
  const record = await Model.findOne({ ...scope(req), _id: req.params.id });
  if (!record) fail(404, "Record not found.");
  return record;
}
async function projectPaid(req, projectId, excludePaymentId) {
  const query = { ...scope(req), projectId };
  if (excludePaymentId) query._id = { $ne: excludePaymentId };
  const payments = await Payment.find(query).select("amountCents").lean();
  return payments.reduce((sum, payment) => sum + payment.amountCents, 0);
}
async function projectList(req, filter = {}) {
  const projects = await Project.find({ ...scope(req), ...filter })
    .populate("clientId", "name email company")
    .sort({ createdAt: -1 })
    .lean();
  const payments = await Payment.find(scope(req))
    .select("projectId amountCents")
    .lean();
  const paid = new Map();
  for (const payment of payments) {
    const id = String(payment.projectId);
    paid.set(id, (paid.get(id) || 0) + payment.amountCents);
  }
  return projects.map((project) =>
    serializeProject(project, paid.get(String(project._id)) || 0),
  );
}
export const clients = {
  list: async (req, res) => {
    const clients = await Client.find(scope(req))
      .sort({ createdAt: -1 })
      .lean();
    const projects = await Project.find(scope(req)).select("clientId").lean();
    res.json(
      clients.map((client) => ({
        ...client,
        projectCount: projects.filter(
          (project) => String(project.clientId) === String(client._id),
        ).length,
      })),
    );
  },
  create: async (req, res) =>
    res
      .status(201)
      .json(
        await Client.create({ ...v.parse(v.client, req.body), ...scope(req) }),
      ),
  detail: async (req, res) => {
    const client = await owned(Client, req);
    res.json({
      ...client.toObject(),
      projects: await projectList(req, { clientId: client.id }),
    });
  },
  update: async (req, res) => {
    const client = await owned(Client, req);
    Object.assign(client, v.parse(v.client, req.body));
    await client.save();
    res.json(client);
  },
  remove: async (req, res) => {
    const client = await owned(Client, req);
    if (await Project.exists({ ...scope(req), clientId: client.id }))
      fail(409, "Delete this client’s projects before deleting the client.");
    await client.deleteOne();
    res.json({ message: "Client deleted." });
  },
};
export const projects = {
  list: async (req, res) => res.json(await projectList(req)),
  create: async (req, res) => {
    const input = v.parse(v.project, req.body);
    if (!(await Client.exists({ ...scope(req), _id: input.clientId })))
      fail(400, "Select one of your clients.");
    const project = await Project.create({
      ...input,
      feeCents: cents(input.fee),
      ...scope(req),
    });
    res.status(201).json(serializeProject(project.toObject()));
  },
  detail: async (req, res) => {
    const project = await owned(Project, req);
    await project.populate("clientId");
    const payments = await Payment.find({
      ...scope(req),
      projectId: project.id,
    })
      .sort({ paymentDate: -1 })
      .lean();
    const paidCents = payments.reduce(
      (sum, payment) => sum + payment.amountCents,
      0,
    );
    res.json({
      ...serializeProject(project.toObject(), paidCents),
      payments: payments.map(serializePayment),
    });
  },
  update: async (req, res) => {
    const input = v.parse(v.project, req.body);
    const project = await owned(Project, req);
    if (!(await Client.exists({ ...scope(req), _id: input.clientId })))
      fail(400, "Select one of your clients.");
    const paidCents = await projectPaid(req, project.id);
    if (cents(input.fee) < paidCents)
      fail(400, "Project fee cannot be less than payments already recorded.");
    if (String(project.clientId) !== input.clientId && paidCents > 0)
      fail(400, "A paid project cannot be transferred to another client.");
    Object.assign(project, input, { feeCents: cents(input.fee) });
    await project.save();
    res.json(serializeProject(project.toObject(), paidCents));
  },
  remove: async (req, res) => {
    const project = await owned(Project, req);
    if (await Payment.exists({ ...scope(req), projectId: project.id }))
      fail(409, "Delete this project’s payments before deleting the project.");
    await project.deleteOne();
    res.json({ message: "Project deleted." });
  },
};
async function validatePayment(req, input, excludePaymentId) {
  const project = await Project.findOne({
    ...scope(req),
    _id: input.projectId,
  });
  if (!project)
    fail(400, "Project not found or payment exceeds its remaining balance.");
  const paidCents = await projectPaid(req, project.id, excludePaymentId);
  if (paidCents + cents(input.amount) > project.feeCents)
    fail(400, "Project not found or payment exceeds its remaining balance.");
}
export const payments = {
  list: async (req, res) =>
    res.json(
      (
        await Payment.find(scope(req))
          .populate({
            path: "projectId",
            select: "name clientId",
            populate: { path: "clientId", select: "name" },
          })
          .sort({ paymentDate: -1, createdAt: -1 })
          .lean()
      ).map(serializePayment),
    ),
  detail: async (req, res) =>
    res.json(serializePayment((await owned(Payment, req)).toObject())),
  create: async (req, res) => {
    const input = v.parse(v.payment, req.body);
    await validatePayment(req, input);
    const payment = await Payment.create({
      ...input,
      amountCents: cents(input.amount),
      ...scope(req),
    });
    res.status(201).json(serializePayment(payment.toObject()));
  },
  update: async (req, res) => {
    const input = v.parse(v.payment, req.body);
    const payment = await owned(Payment, req);
    await validatePayment(req, input, payment.id);
    Object.assign(payment, input, { amountCents: cents(input.amount) });
    await payment.save();
    res.json(serializePayment(payment.toObject()));
  },
  remove: async (req, res) => {
    const payment = await owned(Payment, req);
    await payment.deleteOne();
    res.json({ message: "Payment deleted." });
  },
};
export async function dashboard(req, res) {
  const year = Number(req.query.year || new Date().getFullYear());
  if (!Number.isInteger(year) || year < 2000 || year > 2100)
    fail(400, "Select a valid year.");
  const { from, to } = req.query;
  const validDate = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
  if (
    (from && !validDate(from)) ||
    (to && !validDate(to)) ||
    (from && to && from > to)
  )
    fail(400, "Select a valid date range.");
  const clients = await Client.find(scope(req)).lean();
  const projects = await projectList(req);
  const query = { ...scope(req) };
  if (from || to) {
    query.paymentDate = {};
    if (from) query.paymentDate.$gte = new Date(from);
    if (to) query.paymentDate.$lte = new Date(to + "T23:59:59.999Z");
  }
  const payments = await Payment.find(query)
    .populate({
      path: "projectId",
      select: "name clientId",
      populate: { path: "clientId", select: "name" },
    })
    .sort({ paymentDate: -1 })
    .lean();
  res.json({
    ...summarize(projects, payments, clients, year),
    recentProjects: projects.slice(0, 5),
    recentPayments: payments.slice(0, 5).map(serializePayment),
  });
}
