import { useState } from "react";
import { Check } from "lucide-react";
import Modal from "../components/Modal.jsx";
import { iso } from "../utils/helpers";

export default function WithdrawalForm({ value, onClose, onSave }) {
  const [form, setForm] = useState(
    value === "new"
      ? {
          id: "",
          platform: "TikTok",
          amount: "",
          date: iso(new Date()),
          status: "Pending",
        }
      : value,
  );

  return (
    <Modal
      title={value === "new" ? "Add withdrawal" : "Edit withdrawal"}
      subtitle="Record actual TikTok payouts only."
      onClose={onClose}
    >
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...form,
            platform: "TikTok",
            amount: Number(form.amount),
          });
        }}
      >
        <label>
          Amount (RM)
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </label>

        <label>
          Withdrawal date
          <input
            required
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </label>

        <label className="wide">
          Status
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option>Pending</option>
            <option>Received</option>
          </select>
        </label>

        <div className="modal-actions wide">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>

          <button className="primary-button" type="submit">
            <Check size={16} />
            Save withdrawal
          </button>
        </div>
      </form>
    </Modal>
  );
}
