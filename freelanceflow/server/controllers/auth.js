import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { config } from "../config/env.js";
import { fail } from "../middleware/index.js";
import * as v from "../validators/index.js";
export const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  preferredCurrency: u.preferredCurrency,
  createdAt: u.createdAt,
});
const cookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: config.production,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
function session(res, u) {
  res.cookie(
    "session",
    jwt.sign({ sub: u.id, version: u.tokenVersion }, config.secret, {
      expiresIn: "7d",
    }),
    cookieOptions,
  );
}
export async function register(req, res) {
  const input = v.parse(v.register, req.body);
  const u = await User.create({
    ...input,
    password: undefined,
    passwordHash: await bcrypt.hash(input.password, 12),
  });
  session(res, u);
  res.status(201).json(publicUser(u));
}
export async function login(req, res) {
  const input = v.parse(v.login, req.body);
  const u = await User.findOne({ email: input.email }).select("+passwordHash");
  if (!u || !(await bcrypt.compare(input.password, u.passwordHash)))
    fail(401, "Email or password is incorrect.");
  session(res, u);
  res.json(publicUser(u));
}
export async function logout(req, res) {
  await User.updateOne({ _id: req.user.id }, { $inc: { tokenVersion: 1 } });
  res.clearCookie("session", { ...cookieOptions, maxAge: undefined });
  res.json({ message: "Signed out." });
}
export async function profile(req, res) {
  const input = v.parse(v.profile, req.body);
  Object.assign(req.user, input);
  await req.user.save();
  res.json(publicUser(req.user));
}
export async function password(req, res) {
  const input = v.parse(v.changePassword, req.body);
  const u = await User.findById(req.user.id).select("+passwordHash");
  if (!(await bcrypt.compare(input.currentPassword, u.passwordHash)))
    fail(400, "Current password is incorrect.");
  u.passwordHash = await bcrypt.hash(input.newPassword, 12);
  u.tokenVersion += 1;
  await u.save();
  session(res, u);
  res.json({ message: "Password changed. Other sessions were signed out." });
}
