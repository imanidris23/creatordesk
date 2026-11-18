import { useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { enablePushNotifications } from "../messaging.js";

export default function AccountPanelNotifications() {
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");

  const handleEnable = async () => {
    setBusy(true);
    setMessage("");

    try {
      const { auth } = await import("../firebase.js");

      if (!auth?.currentUser) {
        setMessage("Please sign in first.");
        return;
      }

      const result = await enablePushNotifications(auth.currentUser.uid);

      setMessage(result.message);

      if (result.success) {
        setEnabled(true);
      }
    } catch (error) {
      setMessage(error.message || "Unable to enable notifications.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="push-settings">
      <div className="push-settings-info">
        <div className="push-settings-icon">
          {enabled ? <BellRing size={21} /> : <Bell size={21} />}
        </div>

        <div>
          <strong>Daily reminders</strong>
          <p>
            Receive reminders at 8:00 PM to log content and 9:00 PM to update
            your sample tracker.
          </p>
          <small>
            {enabled ? "Enabled on this device" : "Not enabled on this device"}
          </small>
        </div>
      </div>

      <button
        type="button"
        className="primary-button"
        onClick={handleEnable}
        disabled={busy || enabled}
      >
        {busy
          ? "Enabling..."
          : enabled
            ? "Notifications enabled"
            : "Enable notifications"}
      </button>

      {message && <p className="push-notification-message">{message}</p>}
    </div>
  );
}
