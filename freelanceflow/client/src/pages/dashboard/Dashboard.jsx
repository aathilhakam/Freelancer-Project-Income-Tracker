import { Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowUpRight,
  Plus,
  Wallet,
  FolderKanban,
  Clock,
  Users,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { useData } from "../../hooks/useData";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { DataState, Empty, Badge } from "../../components/ui/common";
import { IncomeChart, StatusChart } from "../../components/charts/Charts";
import { dateLabel, initials } from "../../lib/utils";
export function Stats({ data, analytics = false }) {
  const { money } = useAuth();
  return (
    <div className="stats-grid">
      {[
        [
          "Total income",
          money(data.totalIncome),
          Wallet,
          "From recorded payments",
          "purple",
        ],
        [
          "Active projects",
          data.activeProjects,
          FolderKanban,
          "Currently in progress",
          "blue",
        ],
        [
          "Pending payments",
          money(data.pendingPayments),
          Clock,
          "Outstanding project balances",
          "amber",
        ],
        [
          analytics ? "Completed projects" : "Total clients",
          analytics ? data.completedProjects : data.totalClients,
          Users,
          analytics ? "Delivered and completed" : "Your growing network",
          "green",
        ],
      ].map(([label, value, Icon, caption, color]) => (
        <div className="stat-card" key={label}>
          <div className="stat-top">
            <span>{label}</span>
            <div className={`stat-icon ${color}`}>
              <Icon size={19} />
            </div>
          </div>
          <strong>{value}</strong>
          <small>{caption}</small>
        </div>
      ))}
    </div>
  );
}
export function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export default function Dashboard() {
  const { user, money } = useAuth(),
    [year, setYear] = useState(new Date().getFullYear());
  const { data, loading, error, reload } = useData(
    `/dashboard/summary?year=${year}`,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR BUSINESS AT A GLANCE</div>
          <h1>
            Welcome back, {user.name.split(" ")[0]}{" "}
            <span className="wave">✦</span>
          </h1>
          <p>Here’s how your freelance business is doing.</p>
        </div>
        <Button asChild>
          <Link to="/projects?new=1">
            <Plus size={18} /> New project
          </Link>
        </Button>
      </div>
      <DataState {...{ loading, error, reload }} />
      {data && !loading && !error && (
        <>
          <Stats data={data} />
          <div className="dashboard-charts">
            <Panel
              title="Income overview"
              subtitle="A clearer view of your earnings"
              action={
                <select
                  aria-label="Income year"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {Array.from(
                    { length: 7 },
                    (_, i) => new Date().getFullYear() + 1 - i,
                  ).map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              }
            >
              <div className="chart-summary">
                <strong>
                  {money(data.monthly.reduce((s, m) => s + m.income, 0))}
                </strong>
                <span>earned in {year}</span>
                <span className="chart-key">
                  <i />
                  Income
                </span>
              </div>
              <IncomeChart data={data.monthly} />
            </Panel>
            <Panel
              title="Project overview"
              subtitle="Every project, at a glance"
            >
              <StatusChart data={data.statuses} />
            </Panel>
          </div>
          <div className="dashboard-bottom">
            <Panel
              title="Recent projects"
              subtitle="Your latest work in motion"
              action={
                <Link className="text-link" to="/projects">
                  View all <ArrowUpRight size={16} />
                </Link>
              }
            >
              {data.recentProjects.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Project / Client</th>
                        <th>Status</th>
                        <th>Deadline</th>
                        <th className="align-right">Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentProjects.map((p) => (
                        <tr key={p._id}>
                          <td>
                            <Link
                              className="table-title"
                              to={`/projects/${p._id}`}
                            >
                              {p.name}
                            </Link>
                            <small>{p.clientId?.name}</small>
                          </td>
                          <td>
                            <Badge value={p.status} />
                          </td>
                          <td>{dateLabel(p.deadline)}</td>
                          <td className="align-right amount">{money(p.fee)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title="Your next great project starts here"
                  text="Add a client, then create a project to get started."
                  action={
                    <Button asChild variant="outline">
                      <Link to="/clients?new=1">
                        <Plus size={16} /> Add your first client
                      </Link>
                    </Button>
                  }
                />
              )}
            </Panel>
            <Panel
              title="Recent payments"
              subtitle="Good work, rewarded"
              action={
                <Link className="text-link" to="/payments">
                  <ArrowUpRight size={18} />
                </Link>
              }
            >
              {data.recentPayments.length ? (
                <div className="payment-feed">
                  {data.recentPayments.map((p) => (
                    <div className="payment-feed-row" key={p._id}>
                      <span className="avatar soft">
                        {initials(p.projectId?.clientId?.name)}
                      </span>
                      <div>
                        <strong>{p.projectId?.clientId?.name}</strong>
                        <small>
                          {p.projectId?.name} · {dateLabel(p.paymentDate)}
                        </small>
                      </div>
                      <div className="align-right">
                        <strong>{money(p.amount)}</strong>
                        <small className="success-text">Received</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  title="Ready for your first payment"
                  text="Record payments as they arrive and keep your income in view."
                />
              )}
            </Panel>
          </div>
          <div className="quick-actions">
            <div>
              <span className="quick-icon">✦</span>
              <div>
                <strong>Keep the momentum going</strong>
                <p>A small step for your next big thing.</p>
              </div>
            </div>
            <div>
              <Button asChild variant="outline">
                <Link to="/clients?new=1">
                  <Users size={16} /> Add client
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/payments?new=1">
                  <Wallet size={16} /> Record payment <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
