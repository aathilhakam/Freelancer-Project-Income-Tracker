import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { UserRound, ShieldCheck, LockKeyhole } from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Field } from "../../components/ui/common";
import { Panel } from "../dashboard/Dashboard";
import { errorMessage, dateLabel, initials } from "../../lib/utils";
const currencies = ["USD", "LKR", "EUR", "GBP", "INR", "AUD", "CAD"];
const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  preferredCurrency: z.enum(currencies),
});
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Use at least 8 characters").max(128),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export default function Settings() {
  const { user, setUser } = useAuth();
  const [profileError, setProfileError] = useState(""),
    [passwordError, setPasswordError] = useState("");
  const p = useForm({
      resolver: zodResolver(profileSchema),
      defaultValues: user,
    }),
    s = useForm({ resolver: zodResolver(passwordSchema) });
  async function saveProfile(values) {
    try {
      setProfileError("");
      setUser((await api.put("/users/profile", values)).data);
      toast.success("Profile updated.");
    } catch (e) {
      setProfileError(errorMessage(e));
    }
  }
  async function savePassword(values) {
    try {
      setPasswordError("");
      await api.put("/users/password", values);
      s.reset();
      toast.success("Password changed.");
    } catch (e) {
      setPasswordError(errorMessage(e));
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE YOURSELF AT HOME</div>
          <h1>Settings</h1>
          <p>A few details that make this workspace yours.</p>
        </div>
      </div>
      <div className="settings-grid">
        <div>
          <Panel
            title="Profile & preferences"
            subtitle="Your personal details and display currency"
          >
            <form
              className="settings-form"
              onSubmit={p.handleSubmit(saveProfile)}
            >
              <div className="settings-avatar">
                <span className="avatar large">{initials(user.name)}</span>
                <div>
                  <strong>{user.name}</strong>
                  <p>Freelancer account</p>
                </div>
              </div>
              <div className="form-grid">
                <Field
                  label="Full name"
                  error={p.formState.errors.name?.message}
                >
                  <input autoComplete="name" {...p.register("name")} />
                </Field>
                <Field
                  label="Email address"
                  error={p.formState.errors.email?.message}
                >
                  <input
                    type="email"
                    autoComplete="email"
                    {...p.register("email")}
                  />
                </Field>
                <Field
                  label="Display currency"
                  error={p.formState.errors.preferredCurrency?.message}
                >
                  <select {...p.register("preferredCurrency")}>
                    {currencies.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <p className="form-help">
                Currency changes the display format only. All amounts use one
                currency; existing amounts are not converted.
              </p>
              {profileError && (
                <div role="alert" className="error-banner">
                  {profileError}
                </div>
              )}
              <div className="form-actions">
                <Button disabled={p.formState.isSubmitting}>
                  {p.formState.isSubmitting ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </Panel>
          <Panel
            title="Password & security"
            subtitle="Keep your account protected"
          >
            <form
              className="settings-form"
              onSubmit={s.handleSubmit(savePassword)}
            >
              <Field
                label="Current password"
                error={s.formState.errors.currentPassword?.message}
              >
                <input
                  type="password"
                  autoComplete="current-password"
                  {...s.register("currentPassword")}
                />
              </Field>
              <div className="form-grid">
                <Field
                  label="New password"
                  error={s.formState.errors.newPassword?.message}
                >
                  <input
                    type="password"
                    autoComplete="new-password"
                    {...s.register("newPassword")}
                  />
                </Field>
                <Field
                  label="Confirm new password"
                  error={s.formState.errors.confirmPassword?.message}
                >
                  <input
                    type="password"
                    autoComplete="new-password"
                    {...s.register("confirmPassword")}
                  />
                </Field>
              </div>
              {passwordError && (
                <div role="alert" className="error-banner">
                  {passwordError}
                </div>
              )}
              <div className="form-actions">
                <Button disabled={s.formState.isSubmitting}>
                  <LockKeyhole size={16} />
                  {s.formState.isSubmitting ? "Updating…" : "Update password"}
                </Button>
              </div>
            </form>
          </Panel>
        </div>
        <Panel title="Account details">
          <div className="account-info">
            <div className="stat-icon purple">
              <UserRound size={22} />
            </div>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <hr />
            <div className="snapshot-row">
              <span>Member since</span>
              <strong>{dateLabel(user.createdAt)}</strong>
            </div>
            <div className="snapshot-row">
              <span>Account type</span>
              <strong>Freelancer</strong>
            </div>
            <div className="security-note">
              <ShieldCheck size={20} />
              <div>
                <strong>A private workspace</strong>
                <p>Only you can access your clients, projects, and payments.</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
