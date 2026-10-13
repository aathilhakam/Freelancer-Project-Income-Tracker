import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { config } from "../config/env.js";
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
export function fail(status, message) {
  const e = new Error(message);
  e.status = status;
  throw e;
}
export const auth = asyncHandler(async (req, res, next) => {
  try {
    const payload = jwt.verify(req.cookies.session || "", config.secret);
    const user = await User.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.version)
      return res.status(401).json({ message: "Please sign in to continue." });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Please sign in to continue." });
  }
});
export function errorHandler(error, req, res, next) {
  if (error.code === 11000)
    return res
      .status(409)
      .json({ message: "This email is already registered." });
  if (error.name === "CastError")
    return res.status(404).json({ message: "Record not found." });
  if (error.type === "entity.parse.failed")
    return res.status(400).json({ message: "Invalid request body." });
  if (!error.status) console.error(error);
  res.status(error.status || 500).json({
    message: error.status
      ? error.message
      : "Something went wrong. Please try again.",
  });
}
