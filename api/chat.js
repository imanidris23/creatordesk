import { GoogleGenAI } from "@google/genai";
import { adminAuth } from "./_firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  // Verify Firebase login
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      error: "You must be logged in.",
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    const allowedUid = process.env.CREATORDESK_ALLOWED_UID;

    if (!allowedUid) {
      return res.status(500).json({
        error: "AI access is not configured.",
      });
    }

    if (decodedToken.uid !== allowedUid) {
      return res.status(403).json({
        error: "You are not authorized to use CreatorDesk AI.",
      });
    }
  } catch (error) {
    console.error("Firebase token verification failed:", {
      code: error.code,
      message: error.message,
    });

    return res.status(401).json({
      error: "Invalid or expired login session.",
    });
  }

  // Validate message
  const { message } = req.body || {};

  if (typeof message !== "string" || !message.trim() || message.length > 4000) {
    return res.status(400).json({
      error: "Please provide a valid message (maximum 4000 characters).",
    });
  }

  // Connect to Gemini
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: message.trim(),
    });

    return res.status(200).json({
      reply: response.text || "No response generated.",
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    return res.status(500).json({
      error: "Unable to generate an AI response. Please try again.",
    });
  }
}
