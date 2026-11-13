import { useMemo, useState } from "react";
import { Download, Edit, Package, Plus, Search, Trash2 } from "lucide-react";

import PageTitle from "../components/PageTitle";
import Badge from "../components/Badge";
import Empty from "../components/Empty";
import { shortDate, daysTo } from "../utils/helpers";

export default function SamplesPage({
  samples,
  postedFor,
  onAdd,
  onEdit,
  onDelete,
  onExport,
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("deadline");

  const getSampleStatus = (sample) => {
    const posted = postedFor(sample.id);
    const required = Number(sample.deliverables || 1);

    const completed = posted >= required;

    // Existing samples default to First delivery only
    const deadlineScope = sample.deadlineScope || "first";

    const deadlineStillApplies =
      deadlineScope === "all" ? !completed : posted === 0;

    const remaining = sample.deadline ? daysTo(sample.deadline) : null;

    const overdue = deadlineStillApplies && remaining !== null && remaining < 0;

    return {
      posted,
      required,
      completed,
      overdue,
      deadlineStillApplies,
      remaining,
    };
  };

  const filteredSamples = useMemo(() => {
    let result = samples.filter((sample) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        sample.product?.toLowerCase().includes(keyword) ||
        sample.brand?.toLowerCase().includes(keyword);

      const sampleStatus = getSampleStatus(sample);

      let matchesStatus = true;

      if (status === "Completed") {
        matchesStatus = sampleStatus.completed;
      }

      if (status === "Overdue") {
        matchesStatus = sampleStatus.overdue;
      }

      if (status === "Pending") {
        matchesStatus = !sampleStatus.completed && !sampleStatus.overdue;
      }

      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      if (sort === "deadline") {
        return (a.deadline || "").localeCompare(b.deadline || "");
      }

      if (sort === "newest") {
        return (b.received || "").localeCompare(a.received || "");
      }

      return (a.product || "").localeCompare(b.product || "");
    });

    return result;
  }, [samples, search, status, sort, postedFor]);

  return (
    <div className="page">
      <PageTitle
        eyebrow="COLLABORATION MANAGEMENT"
        title="Sample tracker"
        text="Keep track of products, deliverables and deadlines."
        action={
          <button className="primary-button" onClick={onAdd}>
            <Plus size={16} />
            Add sample
          </button>
        }
      />

      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            placeholder="Search product or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>All</option>
          <option>Pending</option>
          <option>Completed</option>
          <option>Overdue</option>
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="deadline">Sort by deadline</option>
          <option value="newest">Newest received</option>
          <option value="name">Product name</option>
        </select>

        <button className="secondary-button" onClick={onExport}>
          <Download size={16} />
          Export
        </button>
      </div>

      <div className="table-card">
        {filteredSamples.length === 0 ? (
          <Empty
            icon={Package}
            title="No samples found"
            text="Add a sample or try a different search."
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Received</th>
                  <th>Deadline</th>
                  <th>Deliverables</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSamples.map((sample) => {
                  const {
                    posted,
                    required,
                    completed,
                    overdue,
                    deadlineStillApplies,
                    remaining,
                  } = getSampleStatus(sample);

                  return (
                    <tr key={sample.id}>
                      <td>
                        <div className="sample-product-info">
                          <strong>{sample.product}</strong>

                          <div className="sample-product-tags">
                            <span className="sample-tag brand-tag">
                              {sample.brand}
                            </span>

                            <span className="sample-tag category-tag">
                              {sample.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>{shortDate(sample.received)}</td>

                      <td>
                        <div>
                          {shortDate(sample.deadline)}

                          {deadlineStillApplies &&
                            remaining !== null &&
                            remaining >= 0 &&
                            remaining <= 7 && (
                              <div className="sample-deadline-hint">
                                {remaining === 0
                                  ? "Due today"
                                  : `${remaining} day(s) left`}
                              </div>
                            )}

                          {!deadlineStillApplies && (
                            <div className="sample-deadline-hint">
                              Deadline fulfilled
                            </div>
                          )}
                        </div>
                      </td>

                      <td>{required} video(s)</td>

                      <td>
                        <div className="sample-progress">
                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (posted / required) * 100,
                                )}%`,
                              }}
                            />
                          </div>

                          <span>
                            {posted}/{required}
                          </span>
                        </div>
                      </td>

                      <td>
                        <Badge
                          tone={
                            completed ? "green" : overdue ? "red" : "orange"
                          }
                        >
                          {completed
                            ? "Completed"
                            : overdue
                              ? "Overdue"
                              : "Pending"}
                        </Badge>
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-button"
                            onClick={() => onEdit(sample)}
                            aria-label="Edit sample"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            className="icon-button danger"
                            onClick={() => onDelete(sample.id)}
                            aria-label="Delete sample"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
