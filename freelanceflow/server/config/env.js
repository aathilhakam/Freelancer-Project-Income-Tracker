import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });
export const config = {
  port: Number(process.env.PORT || 5001),
  mongo: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/freelanceflow",
  secret: process.env.JWT_SECRET,
  origin: process.env.CLIENT_ORIGIN || "http://127.0.0.1:5175",
  production: process.env.NODE_ENV === "production",
};
export function validateConfig() {
  if (!config.secret || config.secret.length < 32)
    throw new Error(
      "Set JWT_SECRET to at least 32 random characters in server/.env.",
    );
}
