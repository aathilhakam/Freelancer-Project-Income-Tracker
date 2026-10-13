import { withWorkspaceLock } from "../services/workspace.js";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { auth, asyncHandler as wrap } from "../middleware/index.js";
import * as authentication from "../controllers/auth.js";
import {
  clients,
  projects,
  payments,
  dashboard,
} from "../controllers/records.js";
const recordHandler = (fn) =>
  wrap((req, res) => withWorkspaceLock(req.user.id, () => fn(req, res)));
const router = Router();
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { message: "Too many attempts. Try again in 15 minutes." },
});
router.post("/auth/register", authLimit, wrap(authentication.register));
router.post("/auth/login", authLimit, wrap(authentication.login));
router.use(auth);
router.get("/auth/me", (req, res) =>
  res.json(authentication.publicUser(req.user)),
);
router.post("/auth/logout", wrap(authentication.logout));
for (const [path, controller] of Object.entries({
  clients,
  projects,
  payments,
})) {
  router.get(`/${path}`, recordHandler(controller.list));
  router.post(`/${path}`, recordHandler(controller.create));
  router.get(`/${path}/:id`, recordHandler(controller.detail));
  router.put(`/${path}/:id`, recordHandler(controller.update));
  router.delete(`/${path}/:id`, recordHandler(controller.remove));
}
router.get("/dashboard/summary", recordHandler(dashboard));
router.get("/analytics/income", recordHandler(dashboard));
router.get("/analytics/projects", recordHandler(dashboard));
router.put("/users/profile", wrap(authentication.profile));
router.put("/users/password", wrap(authentication.password));
export default router;
