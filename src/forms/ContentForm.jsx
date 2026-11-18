import { useState } from "react";
import { Check } from "lucide-react";
import Modal from "../components/Modal.jsx";
import { iso } from "../utils/helpers";

// Get today's date according to Malaysia time (UTC+8)
const getMalaysiaDate = () => {
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
};

// Get the current time according to Malaysia time
const getMalaysiaTime = () => {
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return now.toISOString().slice(11, 16);
};

export default function ContentForm({ value, samples, onClose, onSave }) {
  const empty = {
    id: "",
    sampleId: "",
    product: "",
    brand: "",
    category: "Beauty",
    title: "",
    postingDate: iso(new Date()),
    postingTime: "20:00",
    postingMethod: "manual",
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
          postingMethod: value.postingMethod || "manual",
          postingTime: value.postingTime || "20:00",
          fyp: value.fyp === true || value.fyp === "Yes",
          isNewProduct: !value.sampleId,
        },
  );

  const [formError, setFormError] = useState("");

  const today = getMalaysiaDate();
  const currentTime = getMalaysiaTime();

  const isFutureDate = form.postingDate > today;

  const selectedSample = samples.find((sample) => sample.id === form.sampleId);

  // Update form fields
  const update = (key, val) => {
    setForm((previous) => {
      const updated = {
        ...previous,
        [key]: val,
      };

      // Automatically change to Scheduled when a future date is selected
      if (key === "postingDate" && val > getMalaysiaDate()) {
        updated.postingMethod = "scheduled";
      }

      return updated;
    });

    setFormError("");
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const currentDate = getMalaysiaDate();
    const currentClock = getMalaysiaTime();

    const futureDate = form.postingDate > currentDate;

    // Future dates must always be Scheduled
    const postingMethod = futureDate ? "scheduled" : form.postingMethod;

    // Scheduled posts cannot have a past date
    if (postingMethod === "scheduled") {
      if (form.postingDate < currentDate) {
        setFormError(
          "Scheduled posts must have today's date or a future date.",
        );
        return;
      }

      // Check whether the scheduled date and time have passed
      const scheduledTimestamp = new Date(
        `${form.postingDate}T${form.postingTime}:00+08:00`,
      ).getTime();

      if (scheduledTimestamp <= Date.now()) {
        setFormError(
          "Please select a future date and time for your scheduled post.",
        );
        return;
      }
    }

    // Manual posts cannot have a future date
    if (postingMethod === "manual" && futureDate) {
      setFormError("Future posting dates are automatically set to Scheduled.");
      return;
    }

    onSave({
      ...form,
      postingMethod,
      platform: "TikTok",
      fyp: form.fyp ? "Yes" : "No",
      url: form.url.trim(),
    });
  };

  return (
    <Modal
      title={value === "new" ? "Log new content" : "Edit content"}
      subtitle="Record your TikTok post and automatically update sample progress."
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={handleSubmit}>
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

        {/* Posting method */}
        <div className="wide">
          <label>Posting method</label>

          <div className="form-choice">
            <label>
              <input
                type="radio"
                name="postingMethod"
                checked={form.postingMethod === "manual"}
                onChange={() => update("postingMethod", "manual")}
                disabled={isFutureDate}
              />
              Posted
            </label>

            <label>
              <input
                type="radio"
                name="postingMethod"
                checked={form.postingMethod === "scheduled"}
                onChange={() => update("postingMethod", "scheduled")}
              />
              Scheduled
            </label>
          </div>

          {isFutureDate && (
            <p className="form-note">
              Future posting dates are automatically treated as Scheduled.
            </p>
          )}
        </div>

        {/* Posting date */}
        <label>
          {form.postingMethod === "scheduled"
            ? "Scheduled date"
            : "Posting date"}

          <input
            type="date"
            required
            min={form.postingMethod === "scheduled" ? today : undefined}
            max={form.postingMethod === "manual" ? today : undefined}
            value={form.postingDate}
            onChange={(e) => update("postingDate", e.target.value)}
          />
        </label>

        {/* Scheduled time */}
        {form.postingMethod === "scheduled" && (
          <label>
            Scheduled time
            <input
              type="time"
              required
              min={form.postingDate === today ? currentTime : undefined}
              value={form.postingTime}
              onChange={(e) => update("postingTime", e.target.value)}
            />
          </label>
        )}

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

        {/* Validation message */}
        {formError && (
          <p className="form-error wide" role="alert">
            {formError}
          </p>
        )}

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
