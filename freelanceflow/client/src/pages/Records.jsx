import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowUpRight,
  Download,
  ChevronLeft,
  ChevronRight,
  Users,
  FolderKanban,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { useData } from "../hooks/useData";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { DataState, Empty, Badge } from "../components/ui/common";
import RecordForm, { statuses } from "../components/RecordForm";
import { dateLabel, initials, errorMessage } from "../lib/utils";
const info = {
  clients: ["Clients", "Good relationships. Great work.", "Add client", Users],
  projects: [
    "Projects",
    "Keep your work moving, from first idea to final delivery.",
    "New project",
    FolderKanban,
  ],
  payments: [
    "Payments",
    "Every payment accounted for. Every milestone rewarded.",
    "Record payment",
    Wallet,
  ],
};
export default function Records({ type }) {
  const [params, setParams] = useSearchParams();
  const { data, loading, error, reload } = useData("/" + type);
  const { money, user } = useAuth();
  const [query, setQuery] = useState(params.get("q") || ""),
    [status, setStatus] = useState(""),
    [client, setClient] = useState(""),
    [sort, setSort] = useState("newest"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [page, setPage] = useState(1),
    [editing, setEditing] = useState(null),
    [open, setOpen] = useState(false),
    [deleting, setDeleting] = useState(null),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (params.get("new")) {
      setEditing(null);
      setOpen(true);
      setParams({}, { replace: true });
    }
    if (params.get("q") !== null) setQuery(params.get("q"));
  }, [params, setParams]);
  useEffect(() => {
    setPage(1);
  }, [query, status, client, sort, from, to, type]);
  const rows = useMemo(() => {
    let records = (data || []).filter((r) => {
      const c = type === "payments" ? r.projectId?.clientId : r.clientId;
      const text =
        type === "clients"
          ? `${r.name} ${r.email} ${r.company}`
          : type === "projects"
            ? `${r.name} ${c?.name}`
            : `${r.projectId?.name} ${c?.name} ${r.reference} ${r.paymentMethod}`;
      return (
        text.toLowerCase().includes(query.toLowerCase()) &&
        (!status || r.status === status) &&
        (!client || c?._id === client) &&
        (type !== "payments" ||
          ((!from || r.paymentDate.slice(0, 10) >= from) &&
            (!to || r.paymentDate.slice(0, 10) <= to)))
      );
    });
    records.sort((a, b) =>
      sort === "fee-high"
        ? (b.fee ?? b.amount) - (a.fee ?? a.amount)
        : sort === "fee-low"
          ? (a.fee ?? a.amount) - (b.fee ?? b.amount)
          : sort === "deadline"
            ? new Date(a.deadline) - new Date(b.deadline)
            : new Date(b.createdAt) - new Date(a.createdAt),
    );
    return records;
  }, [data, query, status, client, sort, from, to, type]);
  const clientOptions = [
    ...new Map(
      (data || [])
        .map((r) => (type === "payments" ? r.projectId?.clientId : r.clientId))
        .filter(Boolean)
        .map((c) => [c._id, c]),
    ).values(),
  ];
  const count = Math.max(1, Math.ceil(rows.length / 8));
  const current = Math.min(page, count);
  const visible = rows.slice((current - 1) * 8, current * 8);
  const [title, subtitle, action, Icon] = info[type];
  function close() {
    setOpen(false);
    setEditing(null);
  }
  async function remove() {
    try {
      setBusy(true);
      await api.delete(`/${type}/${deleting._id}`);
      toast.success("Record deleted.");
      setDeleting(null);
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function csv() {
    const clean = (value) => {
      const s = String(value ?? "");
      return (
        '"' + (/^[=+\-@\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""') + '"'
      );
    };
    const content = [
      [
        "Project",
        "Client",
        "Amount",
        "Currency",
        "Date",
        "Method",
        "Reference",
      ],
      ...rows.map((p) => [
        p.projectId?.name,
        p.projectId?.clientId?.name,
        p.amount,
        userCurrency,
        p.paymentDate.slice(0, 10),
        p.paymentMethod,
        p.reference,
      ]),
    ]
      .map((r) => r.map(clean).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "freelanceflow-payments.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Filtered payments exported.");
  }
  const userCurrency = user.preferredCurrency;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR WORKSPACE</div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="heading-actions">
          {type === "payments" && (
            <Button variant="outline" onClick={csv} disabled={!rows.length}>
              <Download size={16} /> Export CSV
            </Button>
          )}
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={18} />
            {action}
          </Button>
        </div>
      </div>
      <div className="list-summary">
        <Icon size={20} />
        <strong>{data?.length || 0}</strong>
        <span>{title.toLowerCase()} in your workspace</span>
        {type === "payments" && (
          <strong className="summary-total">
            {money((data || []).reduce((s, p) => s + p.amount, 0))} received
          </strong>
        )}
      </div>
      <section className="panel">
        <div className="filter-bar">
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label={`Search ${type}`}
              placeholder={`Search ${type}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {type === "projects" && (
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
          {type !== "clients" && (
            <select
              aria-label="Filter by client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
            >
              <option value="">All clients</option>
              {clientOptions.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {type === "payments" && (
            <>
              <label className="date-filter">
                From
                <input
                  aria-label="Payments from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label className="date-filter">
                To
                <input
                  aria-label="Payments until"
                  type="date"
                  min={from}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </label>
            </>
          )}
          {type !== "clients" && (
            <select
              aria-label="Sort records"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="fee-high">Amount: high to low</option>
              <option value="fee-low">Amount: low to high</option>
              {type === "projects" && (
                <option value="deadline">Deadline</option>
              )}
            </select>
          )}
        </div>
        <DataState {...{ loading, error, reload }} />
        {!loading &&
          !error &&
          (visible.length ? (
            <>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {(type === "clients"
                        ? ["Client", "Contact", "Projects", "Added", "Actions"]
                        : type === "projects"
                          ? [
                              "Project",
                              "Client",
                              "Status",
                              "Deadline",
                              "Fee",
                              "Actions",
                            ]
                          : [
                              "Project / Client",
                              "Amount",
                              "Payment date",
                              "Method",
                              "Status",
                              "Actions",
                            ]
                      ).map((label) => (
                        <th key={label}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r) => (
                      <tr key={r._id}>
                        {type === "clients" ? (
                          <>
                            <td>
                              <div className="client-cell">
                                <span className="avatar soft">
                                  {initials(r.name)}
                                </span>
                                <div>
                                  <Link
                                    className="table-title"
                                    to={`/clients/${r._id}`}
                                  >
                                    {r.name}
                                  </Link>
                                  <small>
                                    {r.company || "Independent client"}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>
                              {r.email || "—"}
                              <small>{r.phone}</small>
                            </td>
                            <td>
                              <span className="count-badge">
                                {r.projectCount} projects
                              </span>
                            </td>
                            <td>{dateLabel(r.createdAt)}</td>
                          </>
                        ) : type === "projects" ? (
                          <>
                            <td>
                              <Link
                                className="table-title"
                                to={`/projects/${r._id}`}
                              >
                                {r.name}
                              </Link>
                              <small>{r.priority} priority</small>
                            </td>
                            <td>{r.clientId?.name}</td>
                            <td>
                              <Badge value={r.status} />
                            </td>
                            <td>{dateLabel(r.deadline)}</td>
                            <td className="amount">
                              {money(r.fee)}
                              <small>
                                {money(r.remainingBalance)} remaining
                              </small>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              <Link
                                className="table-title"
                                to={`/projects/${r.projectId?._id}`}
                              >
                                {r.projectId?.name}
                              </Link>
                              <small>{r.projectId?.clientId?.name}</small>
                            </td>
                            <td className="amount">{money(r.amount)}</td>
                            <td>{dateLabel(r.paymentDate)}</td>
                            <td>
                              {r.paymentMethod}
                              <small>{r.reference}</small>
                            </td>
                            <td>
                              <Badge value="Received" />
                            </td>
                          </>
                        )}
                        <td>
                          <div className="row-actions">
                            {type !== "payments" && (
                              <Link
                                className="icon-button"
                                title="View details"
                                aria-label={`View ${r.name}`}
                                to={`/${type}/${r._id}`}
                              >
                                <ArrowUpRight size={16} />
                              </Link>
                            )}
                            <button
                              className="icon-button"
                              title="Edit"
                              aria-label={`Edit ${r.name || "payment"}`}
                              onClick={() => {
                                setEditing(r);
                                setOpen(true);
                              }}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="icon-button danger"
                              title="Delete"
                              aria-label={`Delete ${r.name || "payment"}`}
                              onClick={() => setDeleting(r)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <span>
                  Showing {(current - 1) * 8 + 1}–
                  {Math.min(current * 8, rows.length)} of {rows.length}
                </span>
                <div>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Previous page"
                    disabled={current === 1}
                    onClick={() => setPage(current - 1)}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span>
                    {current} / {count}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Next page"
                    disabled={current === count}
                    onClick={() => setPage(current + 1)}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <Empty
              title={
                data?.length ? "No matching records" : `Your ${type} start here`
              }
              text={
                data?.length
                  ? "Try a different search or filter."
                  : `Add your first ${type.slice(0, -1)} to start building your business overview.`
              }
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setOpen(true);
                  }}
                >
                  <Plus size={16} />
                  {action}
                </Button>
              }
            />
          ))}
      </section>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) close();
        }}
        title={`${editing ? "Edit" : type === "payments" ? "Record" : "Add"} ${type.slice(0, -1)}`}
        description={
          type === "payments"
            ? "Only record payments you have received."
            : "A few details to keep everything organized."
        }
      >
        {open && (
          <RecordForm
            type={type}
            record={editing}
            onCancel={close}
            onSuccess={() => {
              close();
              reload();
            }}
          />
        )}
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={(v) => {
          if (!v && !busy) setDeleting(null);
        }}
        title="Delete this record?"
        description="This action cannot be undone. Linked records must be deleted first."
      >
        <p className="delete-copy">
          {deleting?.name || `Payment of ${money(deleting?.amount)}`}
        </p>
        <div className="form-actions">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => setDeleting(null)}
          >
            Keep record
          </Button>
          <Button variant="destructive" disabled={busy} onClick={remove}>
            {busy ? "Deleting…" : "Delete record"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
