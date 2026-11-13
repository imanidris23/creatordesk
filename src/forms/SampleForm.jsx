import { useState } from "react";
import { Check, Clock3 } from "lucide-react";
import Modal from "../components/Modal.jsx";
import { iso, shift, addDays, shortDate } from "../utils/helpers";

export default function SampleForm({ value, onClose, onSave }) {
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

  return (
    <Modal
      title={value === "new" ? "Add a new sample" : "Edit sample"}
      subtitle="Deadlines default to 14 days after receiving."
      onClose={onClose}
    >
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();

          onSave({
            ...form,
            platform: "TikTok",
            deliverables: Math.max(1, Number(form.deliverables)),
            deadlineScope: form.deadlineScope || "first",
          });
        }}
      >
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
            value={form.brand}
            onChange={(e) => update("brand", e.target.value)}
            placeholder="Brand name"
          />
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
