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

  // Search, filter and sort content.
  const filteredContent = useMemo(() => {
    return [...content]
      .filter((item) => {
        const keyword = search.toLowerCase();

        const sample = samples.find((sample) => sample.id === item.sampleId);

        const matchesSearch =
          item.title?.toLowerCase().includes(keyword) ||
          item.product?.toLowerCase().includes(keyword) ||
          sample?.product?.toLowerCase().includes(keyword);

        const reachedFyp = item.fyp === true || item.fyp === "Yes";

        const matchesFyp =
          fypFilter === "All" ||
          (fypFilter === "FYP" && reachedFyp) ||
          (fypFilter === "Not FYP" && !reachedFyp);

        return matchesSearch && matchesFyp;
      })
      .sort((a, b) => (b.postingDate || "").localeCompare(a.postingDate || ""));
  }, [content, samples, search, fypFilter]);

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
                  <th>Posted</th>
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

                  return (
                    <tr key={item.id}>
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
