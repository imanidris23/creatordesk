import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Target,
} from "lucide-react";

import PageTitle from "../components/PageTitle";
import Empty from "../components/Empty";
import { iso } from "../utils/helpers";

export default function CalendarPage({
  content,
  samples,
  dailyGoal,
  setDailyGoal,
  onAdd,
}) {
  const [cursor, setCursor] = useState(new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = iso(new Date());

  const days = Array.from({ length: firstDay + daysInMonth }, (_, index) =>
    index < firstDay ? null : index - firstDay + 1,
  );

  const postsForDate = (date) =>
    content.filter((item) => item.postingDate === date);

  const todayPosts = postsForDate(today).length;

  const staleProducts = samples.filter((sample) => {
    const samplePosts = content.filter((item) => item.sampleId === sample.id);

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

  const monthName = cursor.toLocaleDateString("en-MY", {
    month: "long",
    year: "numeric",
  });

  const changeMonth = (amount) => {
    setCursor(new Date(year, month + amount, 1));
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

              const date = iso(new Date(year, month, day));
              const posts = postsForDate(date);

              return (
                <div
                  className={`calendar-day ${date === today ? "today" : ""}`}
                  key={date}
                >
                  <span>{day}</span>

                  {posts.length > 0 && (
                    <div className="calendar-post-count">
                      {posts.length} post(s)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

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

      <section className="table-card">
        <div className="section-heading">
          <div>
            <h2>Products to revisit</h2>
            <p>Products without recent content activity</p>
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
