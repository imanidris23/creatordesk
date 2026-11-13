import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Target,
  ExternalLink,
} from "lucide-react";

import PageTitle from "../components/PageTitle";
import Empty from "../components/Empty";
import Badge from "../components/Badge";

// Format dates using local time instead of UTC
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function CalendarPage({
  content,
  samples,
  dailyGoal,
  setDailyGoal,
  onAdd,
}) {
  const today = formatLocalDate(new Date());

  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: firstDay + daysInMonth }, (_, index) =>
    index < firstDay ? null : index - firstDay + 1,
  );

  // A video is posted when its posting date is today or earlier.
  const isPosted = (item) =>
    Boolean(item.postingDate) && item.postingDate <= today;

  // Get content belonging to a specific date.
  const postsForDate = (date) =>
    content.filter((item) => item.postingDate === date);

  const selectedPosts = selectedDate
    ? postsForDate(selectedDate).sort((a, b) =>
        (a.title || "").localeCompare(b.title || ""),
      )
    : [];

  // Count today's posted videos only.
  const todayPosts = postsForDate(today).filter(isPosted).length;

  const monthName = cursor.toLocaleDateString("en-MY", {
    month: "long",
    year: "numeric",
  });

  // Display selected date without UTC conversion.
  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-MY", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "No date selected";

  // Change calendar month.
  const changeMonth = (amount) => {
    setCursor(new Date(year, month + amount, 1));
    setSelectedDate(null);
  };

  // Products without a recent posted video.
  const staleProducts = samples.filter((sample) => {
    const samplePosts = content.filter(
      (item) => item.sampleId === sample.id && isPosted(item),
    );

    if (samplePosts.length === 0) return true;

    const latest = samplePosts
      .map((item) => item.postingDate)
      .sort()
      .at(-1);

    return (
      (new Date(`${today}T12:00:00`) - new Date(`${latest}T12:00:00`)) /
        86400000 >
      30
    );
  });

  // Get product and brand details from content or linked sample.
  const getProductDetails = (item) => {
    const sample = samples.find((sample) => sample.id === item.sampleId);

    return {
      product: item.product || sample?.product || "Unknown product",
      brand: item.brand || sample?.brand || "Unknown brand",
    };
  };

  return (
    <div className="page">
      <PageTitle
        eyebrow="POSTING PLANNER"
        title="Content calendar"
        text="Plan your TikTok posting schedule and stay consistent."
        action={
          <button className="primary-button" onClick={onAdd}>
            <Plus size={16} />
            Log content
          </button>
        }
      />

      <div className="dashboard-grid">
        {/* Calendar */}
        <section className="table-card calendar-card">
          <div className="section-heading">
            <div>
              <h2>{monthName}</h2>
              <p>Your monthly posting activity</p>
            </div>

            <div className="table-actions">
              <button
                className="icon-button"
                onClick={() => changeMonth(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                className="icon-button"
                onClick={() => changeMonth(1)}
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div className="calendar-weekday" key={day}>
                {day}
              </div>
            ))}

            {days.map((day, index) => {
              if (!day) {
                return <div key={`blank-${index}`} />;
              }

              const date = formatLocalDate(new Date(year, month, day));

              const posts = postsForDate(date);
              const postedCount = posts.filter(isPosted).length;
              const scheduledCount = posts.length - postedCount;

              return (
                <button
                  type="button"
                  className={[
                    "calendar-day",
                    date === today ? "today" : "",
                    date === selectedDate ? "selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  aria-pressed={date === selectedDate}
                  aria-label={`${date}, ${posts.length} video(s)`}
                >
                  <span>{day}</span>

                  {posts.length > 0 && (
                    <div className="calendar-post-count">
                      {postedCount > 0 && <span>{postedCount} posted</span>}

                      {scheduledCount > 0 && (
                        <span>{scheduledCount} scheduled</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="calendar-legend">
            <span>
              <i className="legend-dot posted-dot" />
              Posted
            </span>

            <span>
              <i className="legend-dot scheduled-dot" />
              Scheduled
            </span>
          </div>
        </section>

        {/* Daily posting goal */}
        <section className="table-card">
          <div className="section-heading">
            <div>
              <h2>Daily posting goal</h2>
              <p>Track your consistency</p>
            </div>

            <Target size={19} />
          </div>

          <div className="goal-display">
            <strong>{todayPosts}</strong>
            <span>of {dailyGoal} posts today</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(
                  100,
                  dailyGoal > 0 ? (todayPosts / dailyGoal) * 100 : 0,
                )}%`,
              }}
            />
          </div>

          <label className="goal-control">
            Daily target
            <input
              type="number"
              min="1"
              max="50"
              value={dailyGoal}
              onChange={(e) =>
                setDailyGoal(Math.max(1, Number(e.target.value)))
              }
            />
          </label>

          <p className="form-note">
            {todayPosts >= dailyGoal
              ? "Daily goal achieved. Great work!"
              : `${dailyGoal - todayPosts} more post(s) to reach your goal.`}
          </p>
        </section>
      </div>

      {/* Selected date videos */}
      <section className="table-card selected-date-card">
        <div className="section-heading">
          <div>
            <h2>{selectedDateLabel}</h2>

            <p>
              {selectedDate
                ? `${selectedPosts.length} video(s) on this date`
                : "Select a date from the calendar to view its videos."}
            </p>
          </div>

          {selectedDate && (
            <button className="secondary-button" onClick={onAdd}>
              <Plus size={15} />
              Add content
            </button>
          )}
        </div>

        {!selectedDate ? (
          <Empty
            icon={CalendarDays}
            title="Select a date"
            text="Click any date in the calendar to see its videos."
          />
        ) : selectedPosts.length === 0 ? (
          <Empty
            icon={CalendarDays}
            title="No videos on this date"
            text="There are no scheduled or posted videos for this date."
          />
        ) : (
          <div className="calendar-video-list">
            {selectedPosts.map((item) => {
              const details = getProductDetails(item);
              const posted = isPosted(item);

              return (
                <div className="calendar-video-item" key={item.id}>
                  <div className="calendar-video-info">
                    <strong>{item.title || "Untitled video"}</strong>
                    <span>{details.product}</span>
                    <span>{details.brand}</span>
                  </div>

                  <div className="calendar-video-actions">
                    <Badge tone={posted ? "green" : "orange"}>
                      {posted ? "Posted" : "Scheduled"}
                    </Badge>

                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="calendar-video-link"
                      >
                        TikTok
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Products to revisit */}
      <section className="table-card">
        <div className="section-heading">
          <div>
            <h2>Products to revisit</h2>
            <p>Products without recent posted content</p>
          </div>

          <CalendarDays size={19} />
        </div>

        {staleProducts.length === 0 ? (
          <Empty
            icon={CalendarDays}
            title="Nothing to revisit"
            text="All your tracked products have recent content."
          />
        ) : (
          <div className="recent-list">
            {staleProducts.map((sample) => (
              <div className="recent-item" key={sample.id}>
                <div className="recent-icon">
                  <CalendarDays size={17} />
                </div>

                <div className="recent-info">
                  <strong>{sample.product}</strong>
                  <span>{sample.brand}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
