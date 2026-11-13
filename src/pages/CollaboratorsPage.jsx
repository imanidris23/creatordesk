import { useMemo, useState } from "react";
import {
  UsersRound,
  Package,
  Play,
  TrendingUp,
  CheckCircle2,
  Clock3,
  Search,
} from "lucide-react";

import PageTitle from "../components/PageTitle";
import Empty from "../components/Empty";
import Badge from "../components/Badge";

export default function CollaboratorsPage({ samples, content }) {
  const [search, setSearch] = useState("");

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const isPosted = (item) =>
    !item.postingDate || item.postingDate <= todayString;

  const isFyp = (item) => item.fyp === true || item.fyp === "Yes";

  const collaborators = useMemo(() => {
    const brandMap = new Map();

    const normalizeBrand = (brand) =>
      (brand || "").trim().replace(/\s+/g, " ").toLowerCase();

    // Create brand groups from samples.
    samples.forEach((sample) => {
      const brandName = sample.brand?.trim().replace(/\s+/g, " ");

      if (!brandName) return;

      const key = normalizeBrand(brandName);

      if (!brandMap.has(key)) {
        brandMap.set(key, {
          brand: brandName,
          samples: [],
          videos: [],
        });
      }

      brandMap.get(key).samples.push(sample);
    });

    // Add content to the corresponding brand.
    content.forEach((item) => {
      const linkedSample = samples.find(
        (sample) => sample.id === item.sampleId,
      );

      const brandName = (linkedSample?.brand || item.brand || "")
        .trim()
        .replace(/\s+/g, " ");

      if (!brandName) return;

      const key = normalizeBrand(brandName);

      if (!brandMap.has(key)) {
        brandMap.set(key, {
          brand: brandName,
          samples: [],
          videos: [],
        });
      }

      brandMap.get(key).videos.push(item);
    });

    return Array.from(brandMap.values())
      .map((group) => {
        const postedVideos = group.videos.filter(isPosted);
        const fypVideos = postedVideos.filter(isFyp).length;

        const sampleDetails = group.samples.map((sample) => {
          const posted = postedVideos.filter(
            (video) => video.sampleId === sample.id,
          ).length;

          const required = Math.max(1, Number(sample.deliverables || 1));

          const completed = posted >= required;

          return {
            ...sample,
            posted,
            required,
            completed,
            remaining: Math.max(required - posted, 0),
          };
        });

        const completedSamples = sampleDetails.filter(
          (sample) => sample.completed,
        ).length;

        const videosStillNeeded = sampleDetails.reduce(
          (total, sample) => total + sample.remaining,
          0,
        );

        return {
          brand: group.brand,
          samples: sampleDetails,
          totalSamples: sampleDetails.length,
          totalVideos: postedVideos.length,
          fypVideos,
          fypRate: postedVideos.length
            ? Math.round((fypVideos / postedVideos.length) * 100)
            : 0,
          videosStillNeeded,
          completedSamples,
          pendingSamples: sampleDetails.length - completedSamples,
        };
      })
      .sort((a, b) => a.brand.localeCompare(b.brand));
  }, [samples, content]);

  const filteredCollaborators = collaborators.filter((item) =>
    item.brand.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const totals = collaborators.reduce(
    (result, item) => ({
      samples: result.samples + item.totalSamples,
      videos: result.videos + item.totalVideos,
      fyp: result.fyp + item.fypVideos,
      needed: result.needed + item.videosStillNeeded,
      pending: result.pending + item.pendingSamples,
      completed: result.completed + item.completedSamples,
    }),
    {
      samples: 0,
      videos: 0,
      fyp: 0,
      needed: 0,
      pending: 0,
      completed: 0,
    },
  );

  const overallFypRate = totals.videos
    ? Math.round((totals.fyp / totals.videos) * 100)
    : 0;

  return (
    <div className="page">
      <PageTitle
        eyebrow="BRAND PARTNERSHIPS"
        title="Collaborators"
        text="Track your brand partnerships, content performance and remaining deliverables."
      />

      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <UsersRound size={19} />
          </div>
          <p>Total brands</p>
          <h2>{collaborators.length}</h2>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Package size={19} />
          </div>
          <p>Total samples</p>
          <h2>{totals.samples}</h2>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Play size={19} />
          </div>
          <p>Videos posted</p>
          <h2>{totals.videos}</h2>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp size={19} />
          </div>
          <p>Overall FYP rate</p>
          <h2>{overallFypRate}%</h2>
        </div>
      </div>

      <div className="collaborator-summary">
        <div>
          <span>Videos still needed</span>
          <strong>{totals.needed}</strong>
        </div>

        <div>
          <span>Pending samples</span>
          <strong>{totals.pending}</strong>
        </div>

        <div>
          <span>Completed samples</span>
          <strong>{totals.completed}</strong>
        </div>
      </div>

      <section className="table-card">
        <div className="section-heading">
          <div>
            <h2>Your brands</h2>
            <p>Partnership overview grouped by brand</p>
          </div>
        </div>

        <div className="toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands..."
            />
          </div>
        </div>

        {filteredCollaborators.length === 0 ? (
          <Empty
            icon={UsersRound}
            title={
              collaborators.length === 0
                ? "No collaborators yet"
                : "No matching brands"
            }
            text={
              collaborators.length === 0
                ? "Add samples to start tracking your brand partnerships."
                : "Try searching for another brand."
            }
          />
        ) : (
          <div className="collaborator-list">
            {filteredCollaborators.map((brand) => (
              <article className="collaborator-card" key={brand.brand}>
                <div className="collaborator-header">
                  <div>
                    <h3>{brand.brand}</h3>
                    <span>
                      {brand.totalSamples} sample(s) · {brand.totalVideos}{" "}
                      video(s) posted
                    </span>
                  </div>

                  <Badge tone={brand.pendingSamples > 0 ? "orange" : "green"}>
                    {brand.pendingSamples > 0
                      ? `${brand.pendingSamples} pending`
                      : "All completed"}
                  </Badge>
                </div>

                <div className="collaborator-stats">
                  <div>
                    <span>FYP videos</span>
                    <strong>{brand.fypVideos}</strong>
                  </div>

                  <div>
                    <span>FYP rate</span>
                    <strong>{brand.fypRate}%</strong>
                  </div>

                  <div>
                    <span>Videos needed</span>
                    <strong>{brand.videosStillNeeded}</strong>
                  </div>
                </div>

                {brand.samples.length > 0 && (
                  <div className="collaborator-products">
                    <h4>Sample deliverables</h4>

                    {brand.samples.map((sample) => (
                      <div className="collaborator-product" key={sample.id}>
                        <div className="collaborator-product-info">
                          <strong>{sample.product}</strong>
                          <span>
                            {sample.posted} / {sample.required} videos posted
                          </span>
                        </div>

                        <Badge tone={sample.completed ? "green" : "orange"}>
                          {sample.completed ? (
                            <>
                              <CheckCircle2 size={13} />
                              Completed
                            </>
                          ) : (
                            <>
                              <Clock3 size={13} />
                              {sample.remaining} left
                            </>
                          )}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
