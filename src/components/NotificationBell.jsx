import { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  CalendarCheck,
  Package,
  Video,
  Link as LinkIcon,
  Wallet,
  CircleDot,
  X,
} from "lucide-react";

import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../services/notificationService.js";

function getNotificationIcon(type) {
  switch (type) {
    case "sample_added":
      return Package;
    case "content_logged":
    case "content_scheduled":
    case "content_posted":
      return Video;
    case "link_added":
      return LinkIcon;
    case "withdrawal_added":
      return Wallet;
    default:
      return CalendarCheck;
  }
}

function formatNotificationDate(timestamp) {
  if (!timestamp?.toDate) return "Just now";

  const date = timestamp.toDate();
  const now = new Date();
  const difference = Math.floor((now - date) / 60000);

  if (difference < 1) return "Just now";
  if (difference < 60) return `${difference} minutes ago`;

  const hours = Math.floor(difference / 60);

  if (hours < 24) return `${hours} hours ago`;
  if (hours < 48) return "Yesterday";

  return date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NotificationBell({ uid }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) return;

    const unsubscribe = subscribeToNotifications(
      uid,
      (records) => {
        setNotifications(records);
        setError("");
      },
      () => {
        setError("Unable to load notifications.");
      },
    );

    return unsubscribe;
  }, [uid]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleMarkRead = async (id) => {
    try {
      await markNotificationAsRead(uid, id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(uid, notifications);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(uid, id);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all notifications?",
    );

    if (!confirmed) return;

    try {
      await clearAllNotifications(uid);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  return (
    <div className="notification-wrapper">
      <button
        className="icon-button notification-trigger"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
      >
        <Bell size={19} />

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            className="notification-backdrop"
            onClick={() => setIsOpen(false)}
            aria-label="Close notifications"
          />

          <section className="notification-panel">
            <div className="notification-panel-header">
              <div>
                <h3>Notifications</h3>
                <span>
                  {unreadCount > 0
                    ? `${unreadCount} unread`
                    : "You're all caught up"}
                </span>
              </div>

              <div className="notification-header-actions">
                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                      <button
                        className="mark-all-read"
                        onClick={handleMarkAllRead}
                        title="Mark all as read"
                        aria-label="Mark all as read"
                      >
                        <CheckCheck size={17} />
                      </button>
                    )}

                    <button
                      className="clear-all-button"
                      onClick={handleClearAll}
                      title="Clear all notifications"
                    >
                      Clear all
                    </button>
                  </>
                )}

                <button
                  className="icon-button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {error ? (
              <div className="notification-empty">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={30} />
                <strong>No notifications yet</strong>
                <span>CreatorDesk updates will appear here.</span>
              </div>
            ) : (
              <div className="notification-list">
                {notifications.map((item) => {
                  const Icon = getNotificationIcon(item.type);

                  return (
                    <article
                      key={item.id}
                      className={`notification-item ${
                        item.isRead ? "" : "unread"
                      }`}
                      onClick={() => {
                        if (!item.isRead) handleMarkRead(item.id);
                      }}
                    >
                      <div className="notification-item-icon">
                        <Icon size={18} />
                      </div>

                      <div className="notification-item-content">
                        <div className="notification-item-title">
                          <strong>{item.title}</strong>
                          {!item.isRead && (
                            <CircleDot
                              size={10}
                              className="notification-unread-dot"
                            />
                          )}
                        </div>

                        <p>{item.message}</p>

                        <span>{formatNotificationDate(item.createdAt)}</span>
                      </div>

                      <button
                        className="notification-delete"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(item.id);
                        }}
                        aria-label="Delete notification"
                      >
                        <Trash2 size={15} />
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
