import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../services/api";
import { useData } from "../hooks/useData";
import { useAuth } from "../context/AuthContext";
import { day, today, errorMessage } from "../lib/utils";
import { Field, DataState } from "./ui/common";
import { Button } from "./ui/button";
export const statuses = [
  "Pending",
  "In Progress",
  "Completed",
  "On Hold",
  "Cancelled",
];
const number = z.coerce
  .number()
  .min(0)
  .max(1e10)
  .refine(
    (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.0001,
    "Use at most two decimal places",
  );
const name = z.string().trim().min(2, "Use at least two characters").max(120);
const date = z.string().min(1, "Select a date");
const schemas = {
  clients: z.object({
    name,
    email: z.union([z.string().email("Enter a valid email"), z.literal("")]),
    phone: z.string().max(50),
    company: z.string().max(120),
    address: z.string().max(500),
    notes: z.string().max(3000),
  }),
  projects: z
    .object({
      name,
      clientId: z.string().min(1, "Select a client"),
      description: z.string().max(3000),
      fee: number,
      startDate: date,
      deadline: date,
      status: z.enum(statuses),
      priority: z.enum(["Low", "Medium", "High"]),
    })
    .refine((v) => v.deadline >= v.startDate, {
      path: ["deadline"],
      message: "Deadline must be on or after start date",
    }),
  payments: z.object({
    projectId: z.string().min(1, "Select a project"),
    amount: number.refine((n) => n > 0, "Enter a positive amount"),
    paymentDate: date.refine(
      (v) => v <= today(),
      "Payment cannot be in the future",
    ),
    paymentMethod: z.enum(["Bank Transfer", "Cash", "Card", "Other"]),
    reference: z.string().max(120),
    notes: z.string().max(3000),
  }),
};
export default function RecordForm({
  type,
  record,
  onSuccess,
  onCancel,
  projectId,
}) {
  const relation = useData(
    type === "clients" ? null : type === "projects" ? "/clients" : "/projects",
  );
  const { money } = useAuth();
  const [error, setError] = useState("");
  const defaults = {
    clients: {
      name: "",
      email: "",
      phone: "",
      company: "",
      address: "",
      notes: "",
    },
    projects: {
      name: "",
      clientId: "",
      description: "",
      fee: "",
      startDate: today(),
      deadline: "",
      status: "Pending",
      priority: "Medium",
    },
    payments: {
      projectId: projectId || "",
      amount: "",
      paymentDate: today(),
      paymentMethod: "Bank Transfer",
      reference: "",
      notes: "",
    },
  };
  const values = record
    ? {
        ...record,
        clientId: record.clientId?._id || record.clientId,
        projectId: record.projectId?._id || record.projectId,
        startDate: day(record.startDate),
        deadline: day(record.deadline),
        paymentDate: day(record.paymentDate),
      }
    : defaults[type];
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schemas[type]), defaultValues: values });
  const field = (key, label, inputType = "text", extra = {}) => (
    <Field label={label} error={errors[key]?.message}>
      <input type={inputType} {...register(key)} {...extra} />
    </Field>
  );
  const text = (key, label) => (
    <Field label={label} error={errors[key]?.message}>
      <textarea rows={3} {...register(key)} />
    </Field>
  );
  const select = (key, label, options) => (
    <Field label={label} error={errors[key]?.message}>
      <select {...register(key)}>
        {options.map(([value, label]) => (
          <option value={value} key={value}>
            {label}
          </option>
        ))}
      </select>
    </Field>
  );
  const selected = relation.data?.find((p) => p._id === watch("projectId"));
  async function submit(input) {
    try {
      setError("");
      if (record) await api.put(`/${type}/${record._id}`, input);
      else await api.post(`/${type}`, input);
      toast.success(
        `${type.slice(0, -1)[0].toUpperCase() + type.slice(1, -1)} ${record ? "updated" : "created"}.`,
      );
      onSuccess();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <form className="record-form" onSubmit={handleSubmit(submit)}>
      {type !== "clients" && (
        <DataState
          loading={relation.loading}
          error={relation.error}
          reload={relation.reload}
        />
      )}
      <div className="form-grid">
        {type === "clients" ? (
          <>
            {field("name", "Client name *")}
            {field("company", "Company")}
            {field("email", "Email address", "email")}
            {field("phone", "Phone", "tel")}
            <div className="span-2">
              {field("address", "Address")}
              {text("notes", "Notes")}
            </div>
          </>
        ) : type === "projects" ? (
          <>
            <div className="span-2">{field("name", "Project name *")}</div>
            {select("clientId", "Client *", [
              ["", "Select a client"],
              ...(relation.data || []).map((c) => [c._id, c.name]),
            ])}
            {field("fee", "Project fee *", "number", { min: 0, step: ".01" })}
            {field("startDate", "Start date *", "date")}
            {field("deadline", "Deadline *", "date")}
            {select(
              "status",
              "Status",
              statuses.map((s) => [s, s]),
            )}
            {select(
              "priority",
              "Priority",
              ["Low", "Medium", "High"].map((s) => [s, s]),
            )}
            <div className="span-2">{text("description", "Description")}</div>
          </>
        ) : (
          <>
            <div className="span-2">
              {select("projectId", "Related project *", [
                ["", "Select a project"],
                ...(relation.data || []).map((p) => [
                  p._id,
                  `${p.name} · ${p.clientId?.name}`,
                ]),
              ])}
              {selected && (
                <div className="balance-hint">
                  Remaining balance:{" "}
                  <strong>
                    {money(
                      selected.remainingBalance +
                        (record &&
                        String(record.projectId?._id || record.projectId) ===
                          selected._id
                          ? record.amount
                          : 0),
                    )}
                  </strong>
                </div>
              )}
            </div>
            {field("amount", "Amount *", "number", { min: ".01", step: ".01" })}
            {field("paymentDate", "Payment date *", "date", { max: today() })}
            {select(
              "paymentMethod",
              "Payment method",
              ["Bank Transfer", "Cash", "Card", "Other"].map((s) => [s, s]),
            )}
            {field("reference", "Reference number")}
            <div className="span-2">{text("notes", "Notes")}</div>
          </>
        )}
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      <div className="form-actions">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={
            isSubmitting ||
            (type !== "clients" && (relation.loading || !!relation.error))
          }
        >
          {isSubmitting
            ? "Saving…"
            : record
              ? "Save changes"
              : type === "payments"
                ? "Record payment"
                : `Add ${type.slice(0, -1)}`}
        </Button>
      </div>
    </form>
  );
}
