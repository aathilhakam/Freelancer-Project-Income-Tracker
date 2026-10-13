import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs) => twMerge(clsx(inputs));
export const errorMessage = (e) =>
  e.response?.data?.message ||
  "Unable to connect. Check that the API is running and try again.";
export const day = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";
export const today = () =>
  [
    new Date().getFullYear(),
    String(new Date().getMonth() + 1).padStart(2, "0"),
    String(new Date().getDate()).padStart(2, "0"),
  ].join("-");
export const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";
export const initials = (name) =>
  (name || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
