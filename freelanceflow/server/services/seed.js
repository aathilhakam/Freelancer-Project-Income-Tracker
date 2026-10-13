import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import bcrypt from "bcryptjs";
import { config, validateConfig } from "../config/env.js";
import { User, Client, Project, Payment } from "../models/index.js";
import { randomBytes } from "node:crypto";
const email = process.env.SEED_EMAIL || "demo@freelanceflow.local";
const password =
  process.env.SEED_PASSWORD || randomBytes(12).toString("base64url");
let createdUserId;
try {
  validateConfig();
  await connectDatabase(config.mongo);
  if (await User.exists({ email }))
    throw new Error(
      "Demo user already exists. Seed stops without changing existing data.",
    );
  {
    const [user] = await User.create(
      [
        {
          name: "Alex Morgan",
          email,
          passwordHash: await bcrypt.hash(password, 12),
          preferredCurrency: "USD",
        },
      ],
      { ordered: true },
    );
    const userId = user.id;
    createdUserId = userId;
    const clients = await Client.create(
      [
        {
          userId,
          name: "Olivia Chen",
          email: "olivia@example.com",
          company: "Forma Studio",
          phone: "+1 555 0101",
          notes: "Brand and digital design partner.",
        },
        {
          userId,
          name: "James Wilson",
          email: "james@example.com",
          company: "Northstar Labs",
          phone: "+1 555 0102",
        },
        {
          userId,
          name: "Sophie Laurent",
          email: "sophie@example.com",
          company: "Bloom Collective",
        },
        {
          userId,
          name: "Daniel Park",
          email: "daniel@example.com",
          company: "Vertex Digital",
        },
      ],
      { ordered: true },
    );
    const year = new Date().getFullYear(),
      m = new Date().getMonth();
    const projects = await Project.create(
      [
        {
          userId,
          clientId: clients[0].id,
          name: "Forma — Brand identity",
          description:
            "A thoughtful identity system for a growing creative studio. Deliverables include logo explorations, color, typography, and brand guidelines.",
          feeCents: 320000,
          startDate: `${year}-01-05`,
          deadline: `${year}-11-20`,
          status: "In Progress",
          priority: "High",
        },
        {
          userId,
          clientId: clients[1].id,
          name: "Northstar — Website redesign",
          description: "Responsive marketing website design and development.",
          feeCents: 480000,
          startDate: `${year}-02-01`,
          deadline: `${year}-12-15`,
          status: "In Progress",
          priority: "High",
        },
        {
          userId,
          clientId: clients[2].id,
          name: "Bloom — Social campaign",
          description: "A visual campaign celebrating the launch of Bloom.",
          feeCents: 180000,
          startDate: `${year}-01-01`,
          deadline: `${year}-03-15`,
          status: "Completed",
          priority: "Medium",
        },
        {
          userId,
          clientId: clients[3].id,
          name: "Vertex — Product experience",
          description: "Product discovery and interface design.",
          feeCents: 250000,
          startDate: `${year}-09-01`,
          deadline: `${year}-12-20`,
          status: "Pending",
          priority: "Medium",
        },
        {
          userId,
          clientId: clients[0].id,
          name: "Forma — Editorial design",
          description: "Quarterly publication layout.",
          feeCents: 120000,
          startDate: `${year}-07-01`,
          deadline: `${year}-12-01`,
          status: "On Hold",
          priority: "Low",
        },
      ],
      { ordered: true },
    );
    const entries = [
      { project: projects[2], cents: 60000, month: 0 },
      { project: projects[2], cents: 120000, month: 2 },
      { project: projects[0], cents: 100000, month: 3 },
      { project: projects[1], cents: 80000, month: 5 },
      { project: projects[0], cents: 90000, month: 7 },
      { project: projects[1], cents: 160000, month: Math.min(8, m) },
      { project: projects[4], cents: 30000, month: Math.min(9, m) },
    ].filter((e) => e.month <= m);
    for (const e of entries) {
      await Payment.create(
        [
          {
            userId,
            projectId: e.project.id,
            amountCents: e.cents,
            paymentDate: new Date(Date.UTC(year, e.month, 1)),
            paymentMethod: "Bank Transfer",
            reference: `DEMO-${e.month + 1}-${e.project.id.slice(-4)}`,
            notes: "Optional sample payment.",
          },
        ],
        { ordered: true },
      );
    }
  }
  console.log(
    `Demo account created. Email: ${email}\nPassword: ${password}\nKeep these local demo credentials private. They are not production credentials.`,
  );
} catch (e) {
  if (createdUserId) {
    await Payment.deleteMany({ userId: createdUserId });
    await Project.deleteMany({ userId: createdUserId });
    await Client.deleteMany({ userId: createdUserId });
    await User.deleteOne({ _id: createdUserId });
  }
  console.error("Seed stopped:", e.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
