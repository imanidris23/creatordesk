import { useState } from "react";
import { Check } from "lucide-react";
import Modal from "../components/Modal.jsx";
import { iso } from "../utils/helpers";

export default function ContentForm({ value, samples, onClose, onSave }) {
  const empty = {
    id: "",
    sampleId: "",
    product: "",
    brand: "",
    category: "Beauty",
    title: "",
    postingDate: iso(new Date()),
    url: "",
    fyp: false,
    isNewProduct: true,
  };

  const [form, setForm] = useState(
    value === "new"
      ? {
          ...empty,
          isNewProduct: samples.length === 0,
        }
      : {
          ...empty,
          ...value,
          fyp: value.fyp === true || value.fyp === "Yes",
          isNewProduct: false,
        },
  );

  const update = (key, val) => {
    setForm((previous) => ({
      ...previous,
      [key]: val,
    }));
  };

  const selectedSample = samples.find((sample) => sample.id === form.sampleId);

  return (
    <Modal
      title={value === "new" ? "Log new content" : "Edit content"}
      subtitle="Record your TikTok post and automatically update sample progress."
      onClose={onClose}
    >
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();

          onSave({
            ...form,
            platform: "TikTok",
            fyp: form.fyp ? "Yes" : "No",
          });
        }}
      >
        {/* Content title */}
        <label className="wide">
          Content title
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Honest review after 7 days"
          />
        </label>

        {/* Product selection */}
        <div className="wide">
          <label>Product</label>

          <div className="form-choice">
            <label>
              <input
                type="radio"
                checked={!form.isNewProduct}
                onChange={() => update("isNewProduct", false)}
                disabled={!samples.length}
              />
              Existing sample
            </label>

            <label>
              <input
                type="radio"
                checked={form.isNewProduct}
                onChange={() => update("isNewProduct", true)}
              />
              New product
            </label>
          </div>
        </div>

        {/* Existing sample */}
        {!form.isNewProduct ? (
          <label className="wide">
            Select product
            <select
              required
              value={form.sampleId}
              onChange={(e) => update("sampleId", e.target.value)}
            >
              <option value="">Choose a product</option>

              {samples.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {sample.product} — {sample.brand}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            {/* New product details */}
            <label>
              Product name
              <input
                required
                value={form.product}
                onChange={(e) => update("product", e.target.value)}
                placeholder="Product name"
              />
            </label>

            <label>
              Brand
              <input
                required
                value={form.brand}
                onChange={(e) => update("brand", e.target.value)}
                placeholder="Brand name"
              />
            </label>

            <label className="wide">
              Category
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
              >
                {[
                  "Beauty",
                  "Fashion",
                  "Wellness",
                  "Home",
                  "Food",
                  "Stationery",
                  "Other",
                ].map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
          </>
        )}

        {/* Selected sample information */}
        {selectedSample && !form.isNewProduct && (
          <p className="form-note wide">Linked to: {selectedSample.product}</p>
        )}

        {/* Posting date */}
        <label>
          Posting date
          <input
            type="date"
            required
            value={form.postingDate}
            onChange={(e) => update("postingDate", e.target.value)}
          />
        </label>

        {/* TikTok URL */}
        <label className="wide">
          TikTok post URL
          <input
            type="url"
            value={form.url}
            onChange={(e) => update("url", e.target.value)}
            placeholder="https://www.tiktok.com/@username/video/..."
          />
        </label>

        {/* FYP status */}
        <div className="wide fyp-toggle">
          <span>Did this video reach FYP?</span>

          <label>
            <input
              type="checkbox"
              checked={form.fyp}
              onChange={(e) => update("fyp", e.target.checked)}
            />
            Yes, reached FYP
          </label>
        </div>

        {/* Form buttons */}
        <div className="modal-actions wide">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>

          <button className="primary-button" type="submit">
            <Check size={16} />
            Save content
          </button>
        </div>
      </form>
    </Modal>
  );
}
