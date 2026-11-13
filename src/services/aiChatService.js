import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../firebase.js";

// Get a user's conversations
function getConversationsCollection(uid) {
  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  return collection(db, "users", uid, "conversations");
}

// Create a new conversation
export async function createConversation(uid) {
  const conversationRef = await addDoc(getConversationsCollection(uid), {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return conversationRef.id;
}

// Save a message
export async function saveChatMessage(uid, conversationId, message) {
  const messagesRef = collection(
    db,
    "users",
    uid,
    "conversations",
    conversationId,
    "messages",
  );

  await addDoc(messagesRef, {
    role: message.role,
    text: message.text,
    createdAt: serverTimestamp(),
  });

  // Update conversation's latest activity
  const conversationRef = doc(
    db,
    "users",
    uid,
    "conversations",
    conversationId,
  );

  await setDoc(
    conversationRef,
    { updatedAt: serverTimestamp() },
    { merge: true },
  );
}

// Load messages from a conversation
export async function getChatMessages(uid, conversationId) {
  const messagesRef = collection(
    db,
    "users",
    uid,
    "conversations",
    conversationId,
    "messages",
  );

  const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

  const snapshot = await getDocs(messagesQuery);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  }));
}

// Delete a conversation and its messages
export async function deleteConversation(uid, conversationId) {
  const messages = await getChatMessages(uid, conversationId);

  const messagesRef = collection(
    db,
    "users",
    uid,
    "conversations",
    conversationId,
    "messages",
  );

  await Promise.all(
    messages.map((message) => deleteDoc(doc(messagesRef, message.id))),
  );

  await deleteDoc(doc(db, "users", uid, "conversations", conversationId));
}
