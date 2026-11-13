import { useMemo, useState } from "react";
import { Plus, Trash2, Wallet, Edit } from "lucide-react";

import PageTitle from "../components/PageTitle";
import Badge from "../components/Badge";
import Empty from "../components/Empty";
import { money, shortDate } from "../utils/helpers";

export default function WithdrawalsPage({
  withdrawals,
  onAdd,
  onEdit,
  onDelete,
}) {
  const [year, setYear] = useState("All");

  // Get all available years from withdrawal records
  const years = [
    ...new Set(
      withdrawals.map((item) => item.date?.slice(0, 4)).filter(Boolean),
    ),
  ].sort((a, b) => b.localeCompare(a));

  // Filter withdrawals based on selected year
  const filtered = useMemo(() => {
    return withdrawals
      .filter((item) => year === "All" || item.date?.startsWith(year))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [withdrawals, year]);

  // Calculate total received payouts
  const received = filtered
    .filter((item) => item.status === "Received")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // Calculate monthly received payouts
  const monthlyTotals = Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");

    return filtered
      .filter(
        (item) =>
          item.date?.slice(5, 7) === month && item.status === "Received",
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  });

  const highest = Math.max(...monthlyTotals, 1);

  return (
    <div className="page withdrawals-page">
      <PageTitle
        eyebrow="INCOME MANAGEMENT"
        title="Withdrawals"
        text="Record and monitor your TikTok affiliate payouts."
        action={
          <button className="primary-button" onClick={onAdd}>
            <Plus size={16} />
            Add withdrawal
          </button>
        }
      />

      {/* Year filter */}
      <div className="section-heading withdrawal-filter">
        <div>
          <h2>Withdrawal overview</h2>
          <p>View your payouts by year</p>
        </div>

        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="All">All years</option>

          {years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <Wallet size={19} />
          </div>
          <p>Total received</p>
          <h2 className="withdrawal-total">{money(received)}</h2>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Plus size={19} />
          </div>
          <p>Transactions</p>
          <h2>{filtered.length}</h2>
        </div>
      </div>

      {/* Monthly payout chart */}
      <section className="table-card">
        <div className="section-heading">
          <div>
            <h2>Monthly received payouts</h2>
            <p>
              {year === "All"
                ? "Received withdrawals across all years"
                : `Received withdrawals in ${year}`}
            </p>
          </div>
        </div>

        <div className="monthly-chart">
          {monthlyTotals.map((amount, index) => (
            <div className="monthly-chart-column" key={index}>
              <strong>{amount > 0 ? money(amount) : ""}</strong>

              <div className="monthly-chart-track">
                <div
                  className="monthly-chart-bar"
                  style={{
                    height: `${(amount / highest) * 100}%`,
                  }}
                />
              </div>

              <span>
                {new Date(2000, index, 1).toLocaleDateString("en-MY", {
                  month: "short",
                })}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Payment history */}
      <section className="table-card">
        <div className="section-heading">
          <div>
            <h2>Payment history</h2>
            <p>
              {year === "All"
                ? "Your recorded withdrawal transactions"
                : `Your withdrawal transactions in ${year}`}
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <Empty
            icon={Wallet}
            title="No withdrawals recorded"
            text="Add your first payout to start tracking your income."
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Platform</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{shortDate(item.date)}</td>
                    <td>TikTok</td>
                    <td className="withdrawal-amount-cell">
                      <strong>{money(item.amount)}</strong>
                    </td>
                    <td>
                      <Badge
                        tone={item.status === "Received" ? "green" : "orange"}
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          onClick={() => onEdit(item)}
                          aria-label="Edit withdrawal"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          className="icon-button danger"
                          onClick={() => onDelete(item.id)}
                          aria-label="Delete withdrawal"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Responsive amount styling */}
      <style>{`
        .withdrawals-page .metric-card {
          min-width: 0;
        }

        .withdrawals-page .withdrawal-total {
          font-size: clamp(1.1rem, 2.5vw, 1.7rem);
          overflow-wrap: anywhere;
          max-width: 100%;
        }

        .withdrawals-page .withdrawal-amount-cell {
          overflow-wrap: anywhere;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}
