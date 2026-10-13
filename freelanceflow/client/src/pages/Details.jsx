import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Mail,
  Phone,
  Building2,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { useData } from "../hooks/useData";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { DataState, Badge, Empty } from "../components/ui/common";
import RecordForm from "../components/RecordForm";
import { Panel } from "./dashboard/Dashboard";
import { dateLabel, initials } from "../lib/utils";
export default function Details({ type }) {
  const { id } = useParams();
  const { data, loading, error, reload } = useData(`/${type}/${id}`);
  const { money } = useAuth();
  const [edit, setEdit] = useState(false),
    [payment, setPayment] = useState(false);
  const c = type === "clients" ? data : data?.clientId;
  return (
    <>
      <Link className="back-link" to={"/" + type}>
        <ArrowLeft size={16} /> Back to {type}
      </Link>
      <DataState {...{ loading, error, reload }} />
      {data && !loading && !error && (
        <>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {type === "projects" ? "PROJECT DETAILS" : "CLIENT PROFILE"}
              </div>
              <h1>{data.name}</h1>
              <p>
                {type === "projects"
                  ? data.clientId?.name
                  : data.company || "Independent client"}
              </p>
            </div>
            <Button variant="outline" onClick={() => setEdit(true)}>
              <Pencil size={16} /> Edit {type.slice(0, -1)}
            </Button>
          </div>
          {type === "projects" && (
            <div className="detail-stats">
              {[
                ["Project fee", data.fee],
                ["Total received", data.totalPaid],
                ["Remaining balance", data.remainingBalance],
              ].map(([label, value]) => (
                <div className="stat-card" key={label}>
                  <span>{label}</span>
                  <strong>{money(value)}</strong>
                </div>
              ))}
            </div>
          )}
          <div className="detail-grid">
            <div>
              {type === "projects" ? (
                <>
                  <Panel title="Project information">
                    <div className="detail-body">
                      <div className="detail-meta">
                        <div>
                          <small>Status</small>
                          <Badge value={data.status} />
                        </div>
                        <div>
                          <small>Priority</small>
                          <strong>{data.priority}</strong>
                        </div>
                        <div>
                          <small>Start date</small>
                          <strong>{dateLabel(data.startDate)}</strong>
                        </div>
                        <div>
                          <small>Deadline</small>
                          <strong>{dateLabel(data.deadline)}</strong>
                        </div>
                      </div>
                      <h4>About this project</h4>
                      <p className="preserve-text">
                        {data.description || "No description added."}
                      </p>
                      <div className="progress-heading">
                        <span>Payment progress</span>
                        <strong>
                          {data.fee
                            ? Math.round((data.totalPaid / data.fee) * 100)
                            : 0}
                          %
                        </strong>
                      </div>
                      <div className="progress-track">
                        <div
                          style={{
                            width: `${data.fee ? (data.totalPaid / data.fee) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </Panel>
                  <Panel
                    title="Payment history"
                    subtitle="Payments received for this project"
                    action={
                      <Button
                        variant="outline"
                        onClick={() => setPayment(true)}
                      >
                        <Plus size={16} /> Record payment
                      </Button>
                    }
                  >
                    {data.payments.length ? (
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Method / Reference</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.payments.map((p) => (
                              <tr key={p._id}>
                                <td>{dateLabel(p.paymentDate)}</td>
                                <td>
                                  {p.paymentMethod}
                                  <small>{p.reference}</small>
                                  {p.notes && <small>{p.notes}</small>}
                                </td>
                                <td className="amount">{money(p.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Empty
                        title="No payments yet"
                        text="Record your first payment when it arrives."
                      />
                    )}
                  </Panel>
                </>
              ) : (
                <Panel
                  title="Associated projects"
                  subtitle={`${data.projects.length} projects together`}
                >
                  {data.projects.length ? (
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Project</th>
                            <th>Status</th>
                            <th>Fee</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.projects.map((p) => (
                            <tr key={p._id}>
                              <td>
                                <Link
                                  className="table-title"
                                  to={`/projects/${p._id}`}
                                >
                                  {p.name}
                                </Link>
                              </td>
                              <td>
                                <Badge value={p.status} />
                              </td>
                              <td className="amount">{money(p.fee)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty
                      title="A new partnership"
                      text="Create a project for this client from the Projects page."
                      action={
                        <Button asChild variant="outline">
                          <Link to="/projects?new=1">Create project</Link>
                        </Button>
                      }
                    />
                  )}
                </Panel>
              )}
            </div>
            <Panel title="Client information">
              <div className="client-profile">
                <span className="avatar large">{initials(c?.name)}</span>
                <h3>{c?.name}</h3>
                <p>{c?.company}</p>
                <div className="contact-list">
                  {[
                    [Mail, c?.email],
                    [Phone, c?.phone],
                    [Building2, c?.company],
                    [MapPin, c?.address],
                  ].map(
                    ([Icon, text], i) =>
                      text && (
                        <div key={i}>
                          <Icon size={16} />
                          <span>{text}</span>
                        </div>
                      ),
                  )}
                </div>
                {c?.notes && (
                  <>
                    <h4>Notes</h4>
                    <p className="preserve-text">{c.notes}</p>
                  </>
                )}
                {type === "projects" && (
                  <Button variant="outline" asChild>
                    <Link to={`/clients/${c?._id}`}>View client profile</Link>
                  </Button>
                )}
                <small className="created-label">
                  Added {dateLabel(c?.createdAt || data.createdAt)}
                </small>
              </div>
            </Panel>
          </div>
          <Dialog
            open={edit}
            onOpenChange={setEdit}
            title={`Edit ${type.slice(0, -1)}`}
          >
            {edit && (
              <RecordForm
                type={type}
                record={data}
                onCancel={() => setEdit(false)}
                onSuccess={() => {
                  setEdit(false);
                  reload();
                }}
              />
            )}
          </Dialog>
          <Dialog
            open={payment}
            onOpenChange={setPayment}
            title="Record payment"
          >
            {payment && (
              <RecordForm
                type="payments"
                projectId={id}
                onCancel={() => setPayment(false)}
                onSuccess={() => {
                  setPayment(false);
                  reload();
                }}
              />
            )}
          </Dialog>
        </>
      )}
    </>
  );
}
