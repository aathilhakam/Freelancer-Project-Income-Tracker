export const cents = (value) => Math.round(value * 100);
export function summarize(
  projects,
  payments,
  clients,
  year = new Date().getFullYear(),
) {
  const totalIncomeCents = payments.reduce((sum, p) => sum + p.amountCents, 0);
  const outstandingCents = projects.reduce(
    (sum, p) => sum + Math.max(0, p.feeCents - p.paidCents),
    0,
  );
  const monthly = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(Date.UTC(year, i, 1)).toLocaleString("en", {
      month: "short",
      timeZone: "UTC",
    }),
    income: 0,
  }));
  payments.forEach((p) => {
    const d = new Date(p.paymentDate);
    if (d.getUTCFullYear() === year)
      monthly[d.getUTCMonth()].income += p.amountCents;
  });
  monthly.forEach((m) => (m.income /= 100));
  const statuses = [
    "Pending",
    "In Progress",
    "Completed",
    "On Hold",
    "Cancelled",
  ].map((name) => ({
    name,
    value: projects.filter((p) => p.status === name).length,
  }));
  const byClient = clients
    .map((c) => {
      const ids = new Set(
        projects
          .filter(
            (p) => String(p.clientId?._id || p.clientId) === String(c._id),
          )
          .map((p) => String(p._id)),
      );
      return {
        name: c.name,
        income:
          payments
            .filter((p) => ids.has(String(p.projectId?._id || p.projectId)))
            .reduce((sum, p) => sum + p.amountCents, 0) / 100,
      };
    })
    .sort((a, b) => b.income - a.income);
  return {
    totalIncome: totalIncomeCents / 100,
    pendingPayments: outstandingCents / 100,
    activeProjects: projects.filter((p) => p.status === "In Progress").length,
    totalClients: clients.length,
    completedProjects: projects.filter((p) => p.status === "Completed").length,
    monthly,
    statuses,
    byClient,
  };
}
