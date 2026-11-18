import { useEffect, useMemo, useState } from "react";
import { Edit, Play, Plus, Search, Trash2, Link2 } from "lucide-react";

import PageTitle from "../components/PageTitle";
import Badge from "../components/Badge";
import Empty from "../components/Empty";
import { shortDate } from "../utils/helpers";

const getSavedPreference = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const formatTime = (time) => {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
};

export default function ContentPage({
  content,
  samples,
  onAdd,
  onEdit,
  onDelete,
  onToggleFyp,
  onAddLink,
}) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const itemsPerPage = 10;

  const [fypFilter, setFypFilter] = useState(() =>
    getSavedPreference("creatordesk-content-fyp-filter", "All"),
  );

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, fypFilter]);

  const updateFypFilter = (value) => {
    setFypFilter(value);

    localStorage.setItem(
      "creatordesk-content-fyp-filter",
      JSON.stringify(value),
    );
  };

  // Track current time so scheduled statuses update automatically
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // Determine whether content has been posted
  const isPosted = (item) => {
    if (item.postingMethod !== "scheduled") {
      return true;
    }

    if (!item.postingDate || !item.postingTime) {
      return false;
    }

    const scheduledTime = new Date(
      `${item.postingDate}T${item.postingTime}:00+08:00`,
    ).getTime();

    return scheduledTime <= currentTime;
  };

  // Quick action to add a TikTok URL
  const handleAddLink = (item) => {
    const url = window.prompt(
      `Paste the TikTok video link for "${item.title || item.product || "this video"}":`,
    );

    if (url === null) return;

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      alert("Please enter a TikTok video link.");
      return;
    }

    onAddLink(item.id, trimmedUrl);
  };

  // Filter and sort all content by posting date and time
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
        const dateA = new Date(
          `${a.postingDate || "1970-01-01"}T${a.postingTime || "00:00"}:00+08:00`,
        ).getTime();

        const dateB = new Date(
          `${b.postingDate || "1970-01-01"}T${b.postingTime || "00:00"}:00+08:00`,
        ).getTime();

        return dateB - dateA;
      });
  }, [content, samples, search, fypFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredContent.length / itemsPerPage);

  const displayedContent = showAll
    ? filteredContent
    : filteredContent.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      );

  const startItem =
    filteredContent.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;

  const endItem = showAll
    ? filteredContent.length
    : Math.min(currentPage * itemsPerPage, filteredContent.length);

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
          onChange={(e) => updateFypFilter(e.target.value)}
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
          <>
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
                  {displayedContent.map((item) => {
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
                        className={
                          !posted
                            ? "content-row-scheduled"
                            : !item.url
                              ? "content-row-no-link"
                              : ""
                        }
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
                          {posted ? (
                            <span className="badge badge-green">Posted</span>
                          ) : (
                            <span className="badge badge-orange">
                              Scheduled · {formatTime(item.postingTime)}
                            </span>
                          )}
                        </td>

                        {/* FYP status */}
                        <td>
                          <button
                            type="button"
                            className="fyp-status-toggle"
                            onClick={() => onToggleFyp(item)}
                            disabled={!posted}
                            aria-label={
                              posted
                                ? `Change FYP status for ${item.title}`
                                : "FYP can only be updated after posting"
                            }
                            title={
                              posted
                                ? "Click to change FYP status"
                                : "Available after posting"
                            }
                          >
                            <Badge tone={reachedFyp ? "green" : "gray"}>
                              {reachedFyp ? "Yes ✓" : "No"}
                            </Badge>
                          </button>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className={`icon-button ${!item.url ? "link-needed" : ""}`}
                              disabled={!posted}
                              onClick={() =>
                                item.url
                                  ? window.open(
                                      item.url,
                                      "_blank",
                                      "noopener,noreferrer",
                                    )
                                  : handleAddLink(item)
                              }
                              aria-label={
                                !posted
                                  ? "Available after publishing"
                                  : item.url
                                    ? "Open TikTok video link"
                                    : "Add TikTok video link"
                              }
                              title={
                                !posted
                                  ? "Available after publishing"
                                  : item.url
                                    ? "Open TikTok video"
                                    : "Add TikTok video link"
                              }
                            >
                              <Link2 size={16} />
                            </button>

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

            {/* Pagination and Show All */}
            <div className="content-pagination">
              <div className="pagination-info">
                Showing {startItem}–{endItem} of {filteredContent.length} videos
              </div>

              {!showAll && totalPages > 1 && (
                <div className="pagination-controls">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                  >
                    Previous
                  </button>

                  <span>
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                  >
                    Next
                  </button>
                </div>
              )}

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowAll((previous) => !previous);
                  setCurrentPage(1);
                }}
              >
                {showAll ? "Show Less" : "Show All"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
