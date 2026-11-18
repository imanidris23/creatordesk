import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { app, db } from "./firebase.js";

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Check whether this browser supports Firebase Messaging
export async function isMessagingSupported() {
  try {
    return await isSupported();
  } catch (error) {
    console.error("Messaging support check failed:", error);
    return false;
  }
}

// Request permission and register this device for push notifications
export async function enablePushNotifications(uid) {
  try {
    if (!app || !db) {
      throw new Error("Firebase is not configured.");
    }

    if (!uid) {
      throw new Error("User is not signed in.");
    }

    if (!(await isMessagingSupported())) {
      throw new Error("Push notifications are not supported in this browser.");
    }

    if (!vapidKey) {
      throw new Error("Firebase VAPID key is missing.");
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      return {
        success: false,
        message: "Notification permission was not granted.",
      };
    }

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );

    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      throw new Error("Unable to generate an FCM token.");
    }

    // Save this device's token under the signed-in user
    await setDoc(
      doc(db, "users", uid, "fcmTokens", token),
      {
        token,
        platform: "android-chrome",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return {
      success: true,
      message: "Push notifications enabled successfully!",
    };
  } catch (error) {
    console.error("Failed to enable push notifications:", error);

    return {
      success: false,
      message: error.message || "Unable to enable push notifications.",
    };
  }
}

// Receive push notifications while CreatorDesk is open
export async function listenToForegroundMessages(callback) {
  try {
    if (!app || !(await isMessagingSupported())) {
      return () => {};
    }

    const messaging = getMessaging(app);

    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  } catch (error) {
    console.error("Foreground messaging failed:", error);
    return () => {};
  }
}
