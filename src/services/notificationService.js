import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase.js";

// Reference to one user's notifications
function getNotificationsCollection(uid) {
  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  return collection(db, "users", uid, "notifications");
}

// Create an in-app notification
export async function createNotification(uid, notification) {
  const notificationsRef = getNotificationsCollection(uid);

  return addDoc(notificationsRef, {
    title: notification.title,
    message: notification.message,
    type: notification.type || "general",
    isRead: false,
    createdAt: serverTimestamp(),
  });
}

// Listen to notifications in real time
export function subscribeToNotifications(uid, callback, onError) {
  const notificationsRef = getNotificationsCollection(uid);

  const notificationsQuery = query(
    notificationsRef,
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      callback(notifications);
    },
    (error) => {
      console.error("Notification listener failed:", error);
      onError?.(error);
    },
  );
}

// Mark one notification as read
export async function markNotificationAsRead(uid, notificationId) {
  const notificationRef = doc(
    db,
    "users",
    uid,
    "notifications",
    notificationId,
  );

  await updateDoc(notificationRef, {
    isRead: true,
  });
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(uid, notifications) {
  const unread = notifications.filter((item) => !item.isRead);

  if (unread.length === 0) return;

  const batch = writeBatch(db);

  unread.forEach((item) => {
    const notificationRef = doc(db, "users", uid, "notifications", item.id);

    batch.update(notificationRef, {
      isRead: true,
    });
  });

  await batch.commit();
}

// Delete one notification
export async function deleteNotification(uid, notificationId) {
  const notificationRef = doc(
    db,
    "users",
    uid,
    "notifications",
    notificationId,
  );

  await deleteDoc(notificationRef);
}

export async function clearAllNotifications(uid) {
  const notificationsRef = getNotificationsCollection(uid);
  const snapshot = await getDocs(notificationsRef);

  if (snapshot.empty) return;

  const batch = writeBatch(db);

  snapshot.docs.forEach((item) => {
    batch.delete(item.ref);
  });

  await batch.commit();
}
