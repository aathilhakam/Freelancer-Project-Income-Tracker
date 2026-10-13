import { useState } from "react";
import { Printer, CalendarDays, TrendingUp } from "lucide-react";
import { useData } from "../../hooks/useData";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { DataState } from "../../components/ui/common";
import {
  IncomeChart,
  StatusChart,
  ClientChart,
} from "../../components/charts/Charts";
import { Stats, Panel } from "../dashboard/Dashboard";
export default function Analytics() {
  const [year, setYear] = useState(new Date().getFullYear()),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const { money } = useAuth();
  const { data, loading, error, reload } = useData(
    `/analytics/income?year=${year}${from ? "&from=" + from : ""}${to ? "&to=" + to : ""}`,
  );
  const monthly = data?.monthly || [];
  const now = new Date(),
    month = year === now.getFullYear() ? now.getMonth() : 11;
  const previous = monthly[month - 1]?.income || 0,
    current = monthly[month]?.income || 0;
  const change = previous
    ? (((current - previous) / previous) * 100).toFixed(1)
    : null;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">INSIGHTS THAT MOVE YOU FORWARD</div>
          <h1>Income analytics</h1>
          <p>Know where you stand. See where you’re headed.</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer size={16} /> Print / Save PDF
        </Button>
      </div>
      <div className="analytics-filters">
        <CalendarDays size={18} />
        <select
          aria-label="Analytics year"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {Array.from({ length: 7 }, (_, i) => now.getFullYear() + 1 - i).map(
            (y) => (
              <option key={y}>{y}</option>
            ),
          )}
        </select>
        <label className="date-filter">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="date-filter">
          To
          <input
            type="date"
            min={from}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <Button
          variant="ghost"
          onClick={() => {
            setFrom("");
            setTo("");
          }}
        >
          Reset dates
        </Button>
        <span>Dates filter income; project metrics cover all projects.</span>
      </div>
      <DataState {...{ loading, error, reload }} />
      {data && !loading && !error && (
        <>
          <Stats data={data} analytics />
          <div className="dashboard-charts">
            <Panel
              title="Revenue over time"
              subtitle={`Recorded payments in ${year}`}
            >
              <div className="chart-summary">
                <strong>
                  {money(monthly.reduce((s, p) => s + p.income, 0))}
                </strong>
                <span>annual income within selected dates</span>
              </div>
              <IncomeChart data={monthly} />
            </Panel>
            <Panel
              title="Project status"
              subtitle="Your full project portfolio"
            >
              <StatusChart data={data.statuses} />
            </Panel>
          </div>
          <div className="dashboard-bottom">
            <Panel
              title="Income by client"
              subtitle="Your top revenue relationships within selected dates"
            >
              <ClientChart data={data.byClient} />
            </Panel>
            <Panel
              title="Revenue snapshot"
              subtitle="Track the direction of your business"
            >
              <div className="revenue-snapshot">
                <span className="stat-icon purple">
                  <TrendingUp size={23} />
                </span>
                <h2>{money(current)}</h2>
                <p>
                  {monthly[month]?.month} {year} income
                </p>
                <div className="trend-label">
                  {change === null
                    ? "Record income in the previous month to compare."
                    : `${Number(change) >= 0 ? "+" : ""}${change}% compared with ${monthly[month - 1]?.month}`}
                </div>
                <div className="snapshot-row">
                  <span>Previous month</span>
                  <strong>{money(previous)}</strong>
                </div>
                <div className="snapshot-row">
                  <span>Outstanding balances</span>
                  <strong>{money(data.pendingPayments)}</strong>
                </div>
                <small>
                  Income is based on received payments. Currency is a display
                  preference; no conversion is applied.
                </small>
              </div>
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
