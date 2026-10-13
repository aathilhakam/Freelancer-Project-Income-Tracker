import mongoose from "mongoose";
const { Schema } = mongoose;
const text = { type: String, trim: true, default: "" };
const owner = {
  type: Schema.Types.ObjectId,
  ref: "User",
  required: true,
  index: true,
};
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    passwordHash: { type: String, required: true, select: false },
    preferredCurrency: { type: String, default: "USD" },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);
const clientSchema = new Schema(
  {
    userId: owner,
    name: { type: String, required: true, trim: true },
    email: text,
    phone: text,
    company: text,
    address: text,
    notes: text,
  },
  { timestamps: true },
);
const projectSchema = new Schema(
  {
    userId: owner,
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    name: { type: String, required: true, trim: true },
    description: text,
    feeCents: { type: Number, required: true, min: 0, max: 1e12 },
    startDate: { type: Date, required: true },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "On Hold", "Cancelled"],
      default: "Pending",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
  },
  { timestamps: true },
);
const paymentSchema = new Schema(
  {
    userId: owner,
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    amountCents: { type: Number, required: true, min: 1, max: 1e12 },
    paymentDate: { type: Date, required: true },
    paymentMethod: {
      type: String,
      enum: ["Bank Transfer", "Cash", "Card", "Other"],
      required: true,
    },
    reference: text,
    notes: text,
  },
  { timestamps: true },
);
projectSchema.index({ userId: 1, clientId: 1 });
paymentSchema.index({ userId: 1, projectId: 1 });
paymentSchema.index({ userId: 1, paymentDate: -1 });
export const User = mongoose.model("User", userSchema);
export const Client = mongoose.model("Client", clientSchema);
export const Project = mongoose.model("Project", projectSchema);
export const Payment = mongoose.model("Payment", paymentSchema);
