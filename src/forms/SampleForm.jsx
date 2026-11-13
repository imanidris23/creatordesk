import { useMemo, useState } from "react";
import { Check, Clock3 } from "lucide-react";
import Modal from "../components/Modal.jsx";
import { iso, shift, addDays, shortDate } from "../utils/helpers";

export default function SampleForm({ value, onClose, onSave, samples = [] }) {
  const empty = {
    id: "",
    product: "",
    brand: "",
    category: "Beauty",
    platform: "TikTok",
    received: iso(new Date()),
    deadline: shift(14),
    deliverables: 1,
    deadlineScope: "first",
  };

  const [form, setForm] = useState(
    value === "new"
      ? empty
      : {
          ...value,
          deadlineScope: value.deadlineScope || "first",
        },
  );

  // Get unique brand names from existing samples.
  const brands = useMemo(() => {
    const uniqueBrands = new Map();

    samples.forEach((sample) => {
      const brand = sample.brand?.trim().replace(/\s+/g, " ");

      if (brand) {
        const normalized = brand.toLowerCase();

        if (!uniqueBrands.has(normalized)) {
          uniqueBrands.set(normalized, brand);
        }
      }
    });

    return Array.from(uniqueBrands.values()).sort((a, b) => a.localeCompare(b));
  }, [samples]);

  const update = (key, val) => {
    setForm((previous) => ({
      ...previous,
      [key]: val,
    }));
  };

  const changeReceived = (received) => {
    setForm((previous) => ({
      ...previous,
      received,
      deadline: addDays(received, 14),
    }));
  };

  const saveSample = (e) => {
    e.preventDefault();

    const typedBrand = form.brand.trim().replace(/\s+/g, " ");

    // Reuse the existing brand spelling if it already exists.
    const existingBrand = brands.find(
      (brand) => brand.toLowerCase() === typedBrand.toLowerCase(),
    );

    onSave({
      ...form,
      brand: existingBrand || typedBrand,
      platform: "TikTok",
      deliverables: Math.max(1, Number(form.deliverables)),
      deadlineScope: form.deadlineScope || "first",
    });
  };

  return (
    <Modal
      title={value === "new" ? "Add a new sample" : "Edit sample"}
      subtitle="Deadlines default to 14 days after receiving."
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={saveSample}>
        <label className="wide">
          Product name
          <input
            required
            value={form.product}
            onChange={(e) => update("product", e.target.value)}
            placeholder="e.g. Glow Tint Balm"
          />
        </label>

        <label>
          Brand
          <input
            required
            list="existing-brands"
            value={form.brand}
            onChange={(e) => update("brand", e.target.value)}
            placeholder="Type or select a brand"
            autoComplete="off"
          />
          <datalist id="existing-brands">
            {brands.map((brand) => (
              <option key={brand} value={brand} />
            ))}
          </datalist>
        </label>

        <label>
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

        <label>
          Deliverables
          <input
            type="number"
            min="1"
            required
            value={form.deliverables}
            onChange={(e) => update("deliverables", e.target.value)}
          />
        </label>

        <label>
          Date received
          <input
            type="date"
            required
            value={form.received}
            onChange={(e) => changeReceived(e.target.value)}
          />
        </label>

        <label>
          Deadline
          <input
            type="date"
            required
            value={form.deadline}
            onChange={(e) => update("deadline", e.target.value)}
          />
        </label>

        <label className="wide">
          Deadline applies to
          <select
            value={form.deadlineScope}
            onChange={(e) => update("deadlineScope", e.target.value)}
          >
            <option value="first">First delivery only</option>
            <option value="all">All deliveries</option>
          </select>
        </label>

        <div className="form-note wide">
          <Clock3 size={16} />
          Deadline: {shortDate(form.deadline)}
        </div>

        <div className="form-note wide">
          {form.deadlineScope === "first"
            ? "The deadline stops applying once your first video is posted."
            : `The deadline applies until all ${Math.max(
                1,
                Number(form.deliverables || 1),
              )} required videos are posted.`}
        </div>

        <div className="modal-actions wide">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>

          <button className="primary-button" type="submit">
            <Check size={16} />
            Save sample
          </button>
        </div>
      </form>
    </Modal>
  );
}
