import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../../components/layout/Layout";
import { Button } from "../../components/ui/button";
import { Field } from "../../components/ui/common";
import { errorMessage } from "../../lib/utils";
export default function Auth({ mode }) {
  const registerMode = mode === "register";
  const schema = z
    .object({
      email: z.string().email("Enter a valid email"),
      password: z
        .string()
        .min(
          registerMode ? 8 : 1,
          registerMode ? "Use at least 8 characters" : "Enter your password",
        )
        .max(128),
      ...(registerMode
        ? {
            name: z.string().trim().min(2, "Enter your full name").max(120),
            confirmPassword: z.string(),
          }
        : {}),
    })
    .refine((v) => !registerMode || v.password === v.confirmPassword, {
      path: ["confirmPassword"],
      message: "Passwords do not match",
    });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });
  const { user, signIn, loading } = useAuth();
  const [error, setError] = useState(""),
    [show, setShow] = useState(false);
  if (loading)
    return (
      <div className="app-loading">
        <div className="loader" />
        <p>Getting your workspace ready…</p>
      </div>
    );
  if (user) return <Navigate to="/dashboard" replace />;
  async function submit(input) {
    try {
      setError("");
      await signIn(mode, input);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Logo />
        <div className="auth-copy">
          <div className="eyebrow">A LITTLE LESS ADMIN. A LOT MORE FLOW.</div>
          <h1>
            Great work deserves
            <br />
            <em>a clear picture.</em>
          </h1>
          <p>
            Your projects, clients, and income. One calm space to keep your
            freelance business moving.
          </p>
          <div className="auth-features">
            {[
              "Keep every project on track",
              "Know exactly what you’re owed",
              "Watch your business grow",
            ].map((t) => (
              <div key={t}>
                <Check size={18} />
                {t}
              </div>
            ))}
          </div>
          <div className="auth-visual">
            <span>PROJECT → PAYMENT → POSSIBILITY</span>
            <div className="visual-bars">
              {[28, 45, 38, 65, 54, 83, 73, 100].map((h, i) => (
                <div key={i} style={{ height: h + "%" }} />
              ))}
            </div>
            <p>More clarity. More momentum.</p>
          </div>
        </div>
        <small>Made for the way you work.</small>
      </section>
      <section className="auth-form-panel">
        <div className="auth-form">
          <span className="eyebrow">WELCOME TO FREELANCEFLOW</span>
          <h2>
            {registerMode ? "Your next chapter starts here." : "Welcome back."}
          </h2>
          <p>
            {registerMode
              ? "Create an account and get your business in flow."
              : "Sign in to pick up where you left off."}
          </p>
          <form onSubmit={handleSubmit(submit)}>
            {registerMode && (
              <Field label="Full name" error={errors.name?.message}>
                <input
                  autoComplete="name"
                  placeholder="Your full name"
                  {...register("name")}
                />
              </Field>
            )}
            <Field label="Email address" error={errors.email?.message}>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("email")}
              />
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <div className="password-field">
                <input
                  type={show ? "text" : "password"}
                  autoComplete={
                    registerMode ? "new-password" : "current-password"
                  }
                  placeholder={
                    registerMode
                      ? "At least 8 characters"
                      : "Enter your password"
                  }
                  {...register("password")}
                />
                <button
                  type="button"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            {registerMode && (
              <Field
                label="Confirm password"
                error={errors.confirmPassword?.message}
              >
                <input
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  {...register("confirmPassword")}
                />
              </Field>
            )}
            {error && (
              <div role="alert" className="error-banner">
                {error}
              </div>
            )}
            <Button className="full-width" disabled={isSubmitting}>
              {isSubmitting
                ? "Please wait…"
                : registerMode
                  ? "Create account"
                  : "Sign in"}
              <ArrowRight size={18} />
            </Button>
          </form>
          <p className="auth-switch">
            {registerMode
              ? "Already have an account?"
              : "New to FreelanceFlow?"}{" "}
            <Link to={registerMode ? "/login" : "/register"}>
              {registerMode ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <div className="auth-privacy">Your work. Your data. Your space.</div>
        </div>
      </section>
    </div>
  );
}
