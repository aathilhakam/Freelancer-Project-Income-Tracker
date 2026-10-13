import { Children, cloneElement, isValidElement, useId } from "react";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "./button";
export function DataState({ loading, error, reload }) {
  if (error)
    return (
      <div className="empty-state">
        <AlertCircle />
        <h3>We couldn’t load your data</h3>
        <p>{error}</p>
        <Button onClick={reload}>
          <RefreshCw size={16} /> Try again
        </Button>
      </div>
    );
  if (loading)
    return (
      <div className="skeleton-group" aria-label="Loading" role="status">
        {[1, 2, 3].map((n) => (
          <div key={n} className="skeleton" />
        ))}
        <span className="sr-only">Loading your data</span>
      </div>
    );
  return null;
}
export function Empty({
  title = "A fresh start",
  text = "Your records will appear here.",
  action,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Inbox size={25} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function Badge({ value }) {
  return (
    <span
      className={`badge badge-${(value || "").toLowerCase().replaceAll(" ", "-")}`}
    >
      <i />
      {value}
    </span>
  );
}
export function Field({ label, error, children }) {
  const id = useId();
  function bindControl(child) {
    if (!isValidElement(child)) return child;
    if (["input", "select", "textarea"].includes(child.type)) {
      return cloneElement(child, {
        id,
        "aria-invalid": !!error,
        "aria-describedby": error ? id + "-error" : undefined,
      });
    }
    return child.props.children
      ? cloneElement(child, {
          children: Children.map(child.props.children, bindControl),
        })
      : child;
  }
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {Children.map(children, bindControl)}
      {error && (
        <small id={id + "-error"} className="field-error">
          {error}
        </small>
      )}
    </div>
  );
}
