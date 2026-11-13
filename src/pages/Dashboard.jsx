import { ArrowUpRight, Clock, Package, Play, Plus } from "lucide-react";

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
}) {
  const recentContent = [...content]
    .sort((a, b) => (b.postingDate || "").localeCompare(a.postingDate || ""))
    .slice(0, 5);

  const metrics = [
    {
      label: "Total samples",
      value: totals.samples,
      icon: Package,
    },
    {
      label: "Videos posted",
      value: totals.videos,
      icon: Play,
    },
  ];

  return (
    <div className="page">
      <PageTitle
        eyebrow="YOUR CREATOR SPACE"
        title="Dashboard"
        text="A quick overview of your TikTok affiliate journey."
        action={
          <button className="primary-button" onClick={onLog}>
            <Plus size={16} />
            Log content
          </button>
        }
      />

      <div className="metric-grid">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div className="metric-card" key={metric.label}>
              <div className="metric-icon">
                <Icon size={20} />
              </div>

              <p>{metric.label}</p>
              <h2>{metric.value}</h2>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
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

      <section className="table-card">
        <div className="section-heading">
          <div>
            <h2>Sample overview</h2>
            <p>Track your product collaborations</p>
          </div>

          <button className="text-button" onClick={() => go("samples")}>
            Manage samples <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="overview-row">
          <div>
            <span>Active samples</span>
            <strong>{samples.length}</strong>
          </div>

          <div>
            <span>Posted videos</span>
            <strong>{content.length}</strong>
          </div>

          <div>
            <span>Daily posting goal</span>
            <strong>{postedFor} posts</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
