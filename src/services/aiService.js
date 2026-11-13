import { auth } from "../firebase.js";

export async function sendAIMessage(message) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Please log in to use CreatorDesk AI.");
  }

  // Get Firebase authentication token
  const token = await currentUser.getIdToken();

  // Send message to our backend
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to contact CreatorDesk AI.");
  }

  return data.reply;
}
