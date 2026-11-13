import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ExternalLink,
  Link2,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  MousePointerClick,
  ShoppingCart,
  Trash2,
  X,
  Check,
  Copy,
} from "lucide-react";

const KEY = "creator-affiliate-products-v1";
const money = (n) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
const uid = () => Math.random().toString(36).slice(2, 10);
const blank = {
  name: "",
  shop: "",
  category: "Beauty",
  platform: "TikTok",
  price: "",
  commissionRate: "",
  link: "",
  clicks: "0",
  orders: "0",
  status: "Promoting",
  notes: "",
};

export default function ProductLinks() {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  });
  useEffect(() => {
    const syncFromCloud = (event) => setItems(event.detail || []);
    window.addEventListener("affiliate-products-updated", syncFromCloud);
    return () =>
      window.removeEventListener("affiliate-products-updated", syncFromCloud);
  }, []);
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("All");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blank);
  const [copied, setCopied] = useState("");
  const save = (next) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent("affiliate-products-updated", { detail: next }),
    );
  };
  const filtered = useMemo(
    () =>
      items.filter(
        (x) =>
          `${x.name} ${x.shop} ${x.category}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (platform === "All" || x.platform === platform),
      ),
    [items, query, platform],
  );
  const totals = useMemo(
    () => ({
      products: items.length,
      clicks: items.reduce((s, x) => s + Number(x.clicks || 0), 0),
      orders: items.reduce((s, x) => s + Number(x.orders || 0), 0),
      estimated: items.reduce(
        (s, x) =>
          s +
          (Number(x.price || 0) *
            Number(x.orders || 0) *
            Number(x.commissionRate || 0)) /
            100,
        0,
      ),
    }),
    [items],
  );
  const open = (item) => {
    setForm(item ? { ...item } : { ...blank });
    setModal(item?.id || "new");
  };
  const submit = (e) => {
    e.preventDefault();
    const next = form.id
      ? items.map((x) => (x.id === form.id ? form : x))
      : [...items, { ...form, id: uid() }];
    save(next);
    setModal(null);
  };
  const remove = (id) => {
    if (window.confirm("Delete this affiliate product?"))
      save(items.filter((x) => x.id !== id));
  };
  const copy = async (item) => {
    try {
      await navigator.clipboard.writeText(item.link);
      setCopied(item.id);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      window.prompt("Copy affiliate link:", item.link);
    }
  };
  return (
    <>
      <div className="page-title">
        <div>
          <span>GROW YOUR CATALOGUE</span>
          <h1>Affiliate products</h1>
          <p>
            Keep your favourite products, affiliate links and performance
            numbers organised.
          </p>
        </div>
        <button className="primary-button" onClick={() => open()}>
          <Plus size={17} /> Add product
        </button>
      </div>
      <div className="product-stat-grid">
        <div className="product-stat">
          <span className="stat-icon lavender">
            <ShoppingBag size={19} />
          </span>
          <small>Tracked products</small>
          <strong>{totals.products}</strong>
          <em>Across your platforms</em>
        </div>
        <div className="product-stat">
          <span className="stat-icon peach">
            <MousePointerClick size={19} />
          </span>
          <small>Total link clicks</small>
          <strong>{totals.clicks.toLocaleString()}</strong>
          <em>Manually tracked</em>
        </div>
        <div className="product-stat">
          <span className="stat-icon mint">
            <ShoppingCart size={19} />
          </span>
          <small>Orders attributed</small>
          <strong>{totals.orders.toLocaleString()}</strong>
          <em>Across tracked products</em>
        </div>
        <div className="product-stat">
          <span className="stat-icon blue">
            <Link2 size={19} />
          </span>
          <small>Estimated commission</small>
          <strong>{money(totals.estimated)}</strong>
          <em>Estimate, not a payout</em>
        </div>
      </div>
      <div className="product-toolbar">
        <label className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, shops or categories..."
          />
        </label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option>All</option>
          <option>TikTok</option>
          <option>Shopee</option>
        </select>
        <span className="result-count">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
        </span>
      </div>
      {filtered.length ? (
        <div className="affiliate-product-grid">
          {filtered.map((item) => {
            const rate = Number(item.clicks)
              ? (Number(item.orders) / Number(item.clicks)) * 100
              : 0;
            const estimate =
              (Number(item.price) *
                Number(item.orders) *
                Number(item.commissionRate)) /
              100;
            return (
              <article className="affiliate-product-card" key={item.id}>
                <div className="affiliate-card-top">
                  <span
                    className={`platform-pill ${item.platform.toLowerCase()}`}
                  >
                    {item.platform}
                  </span>
                  <span
                    className={`status-pill ${item.status === "Promoting" ? "live" : "paused"}`}
                  >
                    {item.status}
                  </span>
                  <div className="row-actions">
                    <button title="Edit" onClick={() => open(item)}>
                      <Pencil size={15} />
                    </button>
                    <button title="Delete" onClick={() => remove(item.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="affiliate-product-heading">
                  <div className="affiliate-product-icon">
                    <ShoppingBag size={21} />
                  </div>
                  <div>
                    <h3>{item.name}</h3>
                    <p>
                      {item.shop || "Shop not specified"} · {item.category}
                    </p>
                  </div>
                </div>
                <div className="affiliate-price-row">
                  <div>
                    <small>Product price</small>
                    <strong>{money(item.price)}</strong>
                  </div>
                  <div>
                    <small>Commission rate</small>
                    <strong className="commission-rate">
                      {Number(item.commissionRate || 0)}%
                    </strong>
                  </div>
                  <div>
                    <small>Est. commission</small>
                    <strong>{money(estimate)}</strong>
                  </div>
                </div>
                <div className="affiliate-performance">
                  <div>
                    <span>Clicks</span>
                    <strong>{Number(item.clicks || 0).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Orders</span>
                    <strong>{Number(item.orders || 0).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Conversion</span>
                    <strong>{rate.toFixed(1)}%</strong>
                  </div>
                </div>
                {item.notes && <p className="affiliate-note">{item.notes}</p>}
                <div className="affiliate-link-row">
                  <span>
                    <Link2 size={14} />
                    {item.link ? "Affiliate link saved" : "No link added"}
                  </span>
                  <div>
                    {item.link && (
                      <button
                        className="copy-link-button"
                        onClick={() => copy(item)}
                      >
                        {copied === item.id ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}{" "}
                        {copied === item.id ? "Copied" : "Copy link"}
                      </button>
                    )}
                    {item.link && (
                      <a
                        className="open-link-button"
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open affiliate link"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="product-empty">
          <div>
            <ShoppingBag size={25} />
          </div>
          <h3>
            {items.length
              ? "No matching products"
              : "Your product shelf is waiting"}
          </h3>
          <p>
            {items.length
              ? "Try another search or platform filter."
              : "Add products you promote regularly and keep their affiliate links close at hand."}
          </p>
          {!items.length && (
            <button className="primary-button" onClick={() => open()}>
              <Plus size={16} /> Add your first product
            </button>
          )}
        </div>
      )}
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="modal-card">
            <div className="modal-head">
              <div>
                <h2>
                  {modal === "new"
                    ? "Add affiliate product"
                    : "Edit affiliate product"}
                </h2>
                <p>Save the product details and your tracking numbers.</p>
              </div>
              <button className="icon-button" onClick={() => setModal(null)}>
                <X size={19} />
              </button>
            </div>
            <form className="form-grid" onSubmit={submit}>
              <label className="wide">
                Product name
                <input
                  required
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Wireless keyboard"
                />
              </label>
              <label>
                Shop / brand
                <input
                  value={form.shop}
                  onChange={(e) => setForm({ ...form, shop: e.target.value })}
                  placeholder="Shop name"
                />
              </label>
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {[
                    "Beauty",
                    "Fashion",
                    "Home",
                    "Food",
                    "Electronics",
                    "Stationery",
                    "Wellness",
                    "Other",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Platform
                <select
                  value={form.platform}
                  onChange={(e) =>
                    setForm({ ...form, platform: e.target.value })
                  }
                >
                  <option>TikTok</option>
                  <option>Shopee</option>
                </select>
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Promoting</option>
                  <option>Paused</option>
                </select>
              </label>
              <label>
                Product price (RM)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                />
              </label>
              <label>
                Commission (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.commissionRate}
                  onChange={(e) =>
                    setForm({ ...form, commissionRate: e.target.value })
                  }
                  placeholder="e.g. 12"
                />
              </label>
              <label className="wide">
                Affiliate URL
                <input
                  type="url"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://..."
                />
              </label>
              <label>
                Link clicks
                <input
                  type="number"
                  min="0"
                  value={form.clicks}
                  onChange={(e) => setForm({ ...form, clicks: e.target.value })}
                />
              </label>
              <label>
                Orders
                <input
                  type="number"
                  min="0"
                  value={form.orders}
                  onChange={(e) => setForm({ ...form, orders: e.target.value })}
                />
              </label>
              <label className="wide">
                Notes
                <textarea
                  rows="3"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Video angle, sample status, reminders..."
                />
              </label>
              <div className="modal-actions wide">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <Check size={16} /> Save product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
