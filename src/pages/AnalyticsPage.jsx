import { Play, TrendingUp } from "lucide-react";

import PageTitle from "../components/PageTitle";
import Empty from "../components/Empty";
import Badge from "../components/Badge";

export default function AnalyticsPage({ samples, content }) {
  const totalVideos = content.length;

  const fypVideos = content.filter(
    (item) => item.fyp === true || item.fyp === "Yes",
  ).length;

  const fypRate = totalVideos ? Math.round((fypVideos / totalVideos) * 100) : 0;

  const topVideos = [...content]
    .sort((a, b) => {
      const aFyp = a.fyp === true || a.fyp === "Yes" ? 1 : 0;
      const bFyp = b.fyp === true || b.fyp === "Yes" ? 1 : 0;

      return bFyp - aFyp;
    })
    .slice(0, 5);

  const topProducts = samples
    .map((sample) => {
      const linkedVideos = content.filter(
        (item) => item.sampleId === sample.id,
      );

      return {
        ...sample,
        videos: linkedVideos.length,
      };
    })
    .sort((a, b) => b.videos - a.videos)
    .slice(0, 5);

  return (
    <div className="page">
      <PageTitle
        eyebrow="PERFORMANCE OVERVIEW"
        title="Analytics"
        text="Understand which content and products are performing best."
      />

      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <Play size={19} />
          </div>
          <p>Total videos</p>
          <h2>{totalVideos}</h2>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp size={19} />
          </div>
          <p>FYP rate</p>
          <h2>{fypRate}%</h2>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="table-card">
          <div className="section-heading">
            <div>
              <h2>Performance summary</h2>
              <p>Your overall content statistics</p>
            </div>
          </div>

          <div className="analytics-summary">
            <div>
              <span>Videos reaching FYP</span>
              <strong>{fypVideos}</strong>
            </div>

            <div>
              <span>Videos not reaching FYP</span>
              <strong>{totalVideos - fypVideos}</strong>
            </div>
          </div>

          <div className="insight-box">
            <h3>Your FYP performance</h3>
            <p>
              {totalVideos === 0
                ? "Log your videos to start measuring your FYP performance."
                : fypRate >= 50
                  ? "More than half of your logged videos reached FYP. Keep analysing what works!"
                  : "Try experimenting with different hooks, video formats and posting times."}
            </p>
          </div>
        </section>

        <section className="table-card">
          <div className="section-heading">
            <div>
              <h2>Top products</h2>
              <p>Ranked by number of videos posted</p>
            </div>
          </div>

          {topProducts.length === 0 ? (
            <Empty
              icon={TrendingUp}
              title="No product data yet"
              text="Your product performance will appear here."
            />
          ) : (
            <div className="ranking-list">
              {topProducts.map((product, index) => (
                <div className="ranking-item" key={product.id}>
                  <span className="ranking-number">{index + 1}</span>

                  <div>
                    <strong>{product.product}</strong>
                    <span>{product.videos} video(s)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="table-card">
        <div className="section-heading">
          <div>
            <h2>Top performing videos</h2>
            <p>Videos that reached FYP are shown first</p>
          </div>
        </div>

        {topVideos.length === 0 ? (
          <Empty
            icon={Play}
            title="No videos to analyse"
            text="Start logging your content first."
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Video</th>
                  <th>FYP</th>
                </tr>
              </thead>

              <tbody>
                {topVideos.map((item, index) => (
                  <tr key={item.id}>
                    <td>#{index + 1}</td>
                    <td>{item.title || "Untitled video"}</td>
                    <td>
                      <Badge
                        tone={
                          item.fyp === true || item.fyp === "Yes"
                            ? "green"
                            : "gray"
                        }
                      >
                        {item.fyp === true || item.fyp === "Yes"
                          ? "FYP"
                          : "Not FYP"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
