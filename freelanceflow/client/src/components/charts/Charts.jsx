import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { Empty } from "../ui/common";
export const COLORS = ["#F59E0B", "#635BFF", "#10B981", "#94A3B8", "#EF4444"];
export function IncomeChart({ data }) {
  const { money } = useAuth();
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#635BFF" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#635BFF" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 5"
            vertical={false}
            stroke="#edf0f5"
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            width={65}
            tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
          />
          <Tooltip
            formatter={(v) => [money(v), "Income"]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="income"
            stroke="#635BFF"
            strokeWidth={3}
            fill="url(#incomeFill)"
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function StatusChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total)
    return (
      <Empty
        title="Projects tell the story"
        text="Add your first project to see its progress here."
      />
    );
  return (
    <div className="status-chart">
      <div className="donut">
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              isAnimationActive={false}
              data={data}
              dataKey="value"
              innerRadius={62}
              outerRadius={82}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <strong>{total}</strong>
          <span>projects</span>
        </div>
      </div>
      <div className="chart-legend">
        {data.map((d, i) => (
          <div key={d.name}>
            <span>
              <i style={{ background: COLORS[i] }} />
              {d.name}
            </span>
            <strong>{d.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
export function ClientChart({ data }) {
  const { money } = useAuth();
  if (!data.some((d) => d.income))
    return (
      <Empty
        title="Meet your revenue drivers"
        text="Record a payment to see income by client."
      />
    );
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data.filter((d) => d.income).slice(0, 8)}
          layout="vertical"
          margin={{ left: 5, right: 25 }}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 5" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={115}
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <Tooltip formatter={(v) => [money(v), "Income"]} />
          <Bar
            isAnimationActive={false}
            dataKey="income"
            fill="#635BFF"
            radius={[0, 5, 5, 0]}
            barSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
