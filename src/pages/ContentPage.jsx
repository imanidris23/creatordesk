import { useMemo, useState } from "react";
import { Edit, Play, Plus, Search, Trash2 } from "lucide-react";

import PageTitle from "../components/PageTitle";
import Badge from "../components/Badge";
import Empty from "../components/Empty";
import { shortDate } from "../utils/helpers";

export default function ContentPage({
  content,
  samples,
  onAdd,
  onEdit,
  onDelete,
}) {
  const [search, setSearch] = useState("");
  const [fypFilter, setFypFilter] = useState("All");

  // Get today's local date
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  // Determine whether content has been posted
  const isPosted = (item) => !item.postingDate || item.postingDate <= today;

  const filteredContent = useMemo(() => {
    return [...content]
      .filter((item) => {
        const keyword = search.trim().toLowerCase();

        const sample = samples.find((sample) => sample.id === item.sampleId);

        const matchesSearch =
          item.title?.toLowerCase().includes(keyword) ||
          item.product?.toLowerCase().includes(keyword) ||
          item.brand?.toLowerCase().includes(keyword) ||
          sample?.product?.toLowerCase().includes(keyword) ||
          sample?.brand?.toLowerCase().includes(keyword);

        const reachedFyp = item.fyp === true || item.fyp === "Yes";

        const matchesFyp =
          fypFilter === "All" ||
          (fypFilter === "FYP" && reachedFyp) ||
          (fypFilter === "Not FYP" && !reachedFyp);

        return matchesSearch && matchesFyp;
      })
      .sort((a, b) => {
        // Posted content first, scheduled content below
        const aPosted = isPosted(a);
        const bPosted = isPosted(b);

        if (aPosted !== bPosted) {
          return aPosted ? -1 : 1;
        }

        // Sort by date, newest first
        return (b.postingDate || "").localeCompare(a.postingDate || "");
      });
  }, [content, samples, search, fypFilter, today]);

  return (
    <div className="page">
      <PageTitle
        eyebrow="CONTENT MANAGEMENT"
        title="Content tracker"
        text="Manage your TikTok posts and track their performance."
        action={
          <button className="primary-button" onClick={onAdd}>
            <Plus size={16} />
            Log content
          </button>
        }
      />

      {/* Search and filter */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            placeholder="Search content or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={fypFilter}
          onChange={(e) => setFypFilter(e.target.value)}
        >
          <option>All</option>
          <option>FYP</option>
          <option>Not FYP</option>
        </select>
      </div>

      {/* Content table */}
      <div className="table-card">
        {filteredContent.length === 0 ? (
          <Empty
            icon={Play}
            title="No content found"
            text="Start logging your TikTok videos here."
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Content</th>
                  <th>Product</th>
                  <th>Posting date</th>
                  <th>Status</th>
                  <th>FYP</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredContent.map((item) => {
                  const sample = samples.find(
                    (sample) => sample.id === item.sampleId,
                  );

                  const productName =
                    item.product || sample?.product || "Unlinked product";

                  const reachedFyp = item.fyp === true || item.fyp === "Yes";

                  const posted = isPosted(item);

                  return (
                    <tr
                      key={item.id}
                      className={!posted ? "content-row-scheduled" : ""}
                    >
                      {/* Content title and TikTok link */}
                      <td>
                        <strong>{item.title || "Untitled video"}</strong>

                        {item.url && (
                          <div className="content-video">
                            <a
                              className="table-subtitle"
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open TikTok post ↗
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Product */}
                      <td>{productName}</td>

                      {/* Posting date */}
                      <td>{shortDate(item.postingDate)}</td>

                      {/* Posting status */}
                      <td>
                        <Badge tone={posted ? "green" : "orange"}>
                          {posted ? "Posted" : "Scheduled"}
                        </Badge>
                      </td>

                      {/* FYP status */}
                      <td>
                        <Badge tone={reachedFyp ? "green" : "gray"}>
                          {reachedFyp ? "Yes" : "No"}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-button"
                            onClick={() => onEdit(item)}
                            aria-label="Edit content"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            className="icon-button danger"
                            onClick={() => onDelete(item.id)}
                            aria-label="Delete content"
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
