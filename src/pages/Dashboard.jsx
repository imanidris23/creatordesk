import {
  ArrowUpRight,
  Clock,
  Package,
  Play,
  Plus,
  AlertCircle,
  Target,
  CalendarDays,
} from "lucide-react";

import PageTitle from "../components/PageTitle";
import Badge from "../components/Badge";
import Empty from "../components/Empty";
import { shortDate, daysTo } from "../utils/helpers";

export default function Dashboard({
  totals,
  urgent,
  samples,
  content,
  postedFor,
  go,
  onLog,
  onAddSample,
}) {
  const now = new Date();

  // Check whether a video has been posted.
  // Scheduled videos become posted once their scheduled time passes.
  const isPosted = (item) => {
    if (item.postingMethod !== "scheduled") {
      return true;
    }

    if (!item.postingDate || !item.postingTime) {
      return false;
    }

    const scheduledTime = new Date(
      `${item.postingDate}T${item.postingTime}:00+08:00`,
    );

    return scheduledTime <= now;
  };

  // Separate posted and upcoming scheduled videos.
  const postedContent = content.filter(isPosted);

  const scheduledContent = content.filter((item) => {
    if (item.postingMethod !== "scheduled") return false;
    if (!item.postingDate || !item.postingTime) return false;

    const scheduledTime = new Date(
      `${item.postingDate}T${item.postingTime}:00+08:00`,
    );

    return scheduledTime > now;
  });

  // Count posted videos linked to each sample.
  const postedForSample = (sampleId) =>
    postedContent.filter((item) => item.sampleId === sampleId).length;

  // Count scheduled videos linked to each sample.
  const scheduledForSample = (sampleId) =>
    scheduledContent.filter((item) => item.sampleId === sampleId).length;

  // Count samples with ZERO posted and ZERO scheduled videos.
  const pendingFulfilment = samples.filter(
    (sample) =>
      postedForSample(sample.id) === 0 && scheduledForSample(sample.id) === 0,
  ).length;

  // Calculate the actual number of video deliverables still unplanned.
  const videosStillNeeded = samples.reduce((total, sample) => {
    const deliverables = Number(sample.deliverables || 1);
    const posted = postedForSample(sample.id);
    const scheduled = scheduledForSample(sample.id);

    return total + Math.max(deliverables - posted - scheduled, 0);
  }, 0);

  // Recent published videos.
  const recentContent = [...postedContent]
    .sort((a, b) => {
      const dateA = `${a.postingDate || ""}T${a.postingTime || "00:00"}`;
      const dateB = `${b.postingDate || ""}T${b.postingTime || "00:00"}`;

      return dateB.localeCompare(dateA);
    })
    .slice(0, 5);

  // Upcoming scheduled videos, earliest first.
  const upcomingContent = [...scheduledContent]
    .sort((a, b) => {
      const dateA = `${a.postingDate}T${a.postingTime}`;
      const dateB = `${b.postingDate}T${b.postingTime}`;

      return dateA.localeCompare(dateB);
    })
    .slice(0, 5);

  const metrics = [
    {
      label: "Samples needing videos",
      value: pendingFulfilment,
      icon: AlertCircle,
      description: "pending",
      highlight: true,
    },
    {
      label: "Remaining deliverables",
      value: videosStillNeeded,
      icon: Target,
      description: "remaining",
    },
    {
      label: "Total samples",
      value: totals.samples,
      icon: Package,
      description: "received",
    },
    {
      label: "Videos posted",
      value: postedContent.length,
      icon: Play,
      description: "posted",
    },
  ];

  return (
    <div className="page">
      <PageTitle
        eyebrow="YOUR CREATOR SPACE"
        title="Dashboard"
        text="A quick overview of your TikTok affiliate journey."
        action={
          <div className="dashboard-actions">
            <button className="secondary-button" onClick={onAddSample}>
              <Plus size={16} />
              Add sample
            </button>

            <button className="primary-button" onClick={onLog}>
              <Plus size={16} />
              Log content
            </button>
          </div>
        }
      />

      {/* Dashboard metrics */}
      <div className="metric-grid dashboard-metrics">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              className={`metric-card ${
                metric.highlight ? "metric-card-highlight" : ""
              }`}
              key={metric.label}
            >
              <div className="metric-icon">
                <Icon size={20} />
              </div>

              <p>{metric.label}</p>
              <h2>{metric.value}</h2>
              <span className="metric-description">{metric.description}</span>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        {/* Recent posted content */}
        <section className="table-card">
          <div className="section-heading">
            <div>
              <h2>Recent content</h2>
              <p>Your latest TikTok posts</p>
            </div>

            <button className="text-button" onClick={() => go("content")}>
              View all <ArrowUpRight size={15} />
            </button>
          </div>

          {recentContent.length === 0 ? (
            <Empty
              icon={Play}
              title="No content yet"
              text="Your posted videos will appear here."
            />
          ) : (
            <div className="recent-list">
              {recentContent.map((item) => (
                <div className="recent-item" key={item.id}>
                  <div className="recent-icon">
                    <Play size={17} />
                  </div>

                  <div className="recent-info">
                    <strong>{item.title || "Untitled video"}</strong>
                    <span>{shortDate(item.postingDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming scheduled posts */}
        <section className="table-card">
          <div className="section-heading">
            <div>
              <h2>Upcoming posts</h2>
              <p>{scheduledContent.length} videos scheduled</p>
            </div>

            <CalendarDays size={19} />
          </div>

          {upcomingContent.length === 0 ? (
            <Empty
              icon={CalendarDays}
              title="No scheduled posts"
              text="Your upcoming scheduled videos will appear here."
            />
          ) : (
            <div className="recent-list">
              {upcomingContent.map((item) => (
                <div className="recent-item" key={item.id}>
                  <div className="recent-icon">
                    <Clock size={17} />
                  </div>

                  <div className="recent-info">
                    <strong>{item.title || "Untitled video"}</strong>
                    <span>
                      {shortDate(item.postingDate)}
                      {item.postingTime ? ` · ${item.postingTime}` : ""}
                    </span>
                  </div>

                  <Badge tone="orange">Scheduled</Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming sample deadlines */}
        <section className="table-card">
          <div className="section-heading">
            <div>
              <h2>Upcoming deadlines</h2>
              <p>Samples that need your attention</p>
            </div>

            <Clock size={19} />
          </div>

          {urgent.length === 0 ? (
            <Empty
              icon={Clock}
              title="All caught up!"
              text="You have no urgent sample deadlines."
            />
          ) : (
            <div className="recent-list">
              {urgent.map((sample) => {
                const remaining = daysTo(sample.deadline);

                return (
                  <div className="recent-item" key={sample.id}>
                    <div className="recent-icon">
                      <Package size={17} />
                    </div>

                    <div className="recent-info">
                      <strong>{sample.product}</strong>
                      <span>{shortDate(sample.deadline)}</span>
                    </div>

                    <Badge tone={remaining < 0 ? "red" : "orange"}>
                      {remaining < 0
                        ? `${Math.abs(remaining)}d overdue`
                        : remaining === 0
                          ? "Due today"
                          : `${remaining}d left`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Sample fulfilment overview */}
      <section className="table-card">
        <div className="section-heading">
          <div>
            <h2>Sample overview</h2>
            <p>Track your product collaborations and video obligations</p>
          </div>

          <button className="text-button" onClick={() => go("samples")}>
            Manage samples <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="overview-row">
          <div>
            <span>Samples needing videos</span>
            <strong>{pendingFulfilment}</strong>
          </div>

          <div>
            <span>Videos still unplanned</span>
            <strong>{videosStillNeeded}</strong>
          </div>

          <div>
            <span>Already scheduled</span>
            <strong>{scheduledContent.length}</strong>
          </div>

          <div>
            <span>Posted videos</span>
            <strong>{postedContent.length}</strong>
          </div>

          <div>
            <span>Today's post</span>
            <strong>{postedFor} posts</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
