import { GoogleGenAI } from "@google/genai";
import { adminAuth, adminDb } from "./_firebaseAdmin.js";

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

  let uid;

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

    uid = decodedToken.uid;
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

  try {
    // Retrieve the user's CreatorDesk data
    const [samplesSnapshot, contentSnapshot, withdrawalsSnapshot] =
      await Promise.all([
        adminDb.collection("users").doc(uid).collection("samples").get(),
        adminDb.collection("users").doc(uid).collection("content").get(),
        adminDb.collection("users").doc(uid).collection("withdrawals").get(),
      ]);

    const samples = samplesSnapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    const content = contentSnapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    const withdrawals = withdrawalsSnapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    // Malaysia's current date
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    // Prepare CreatorDesk context
    const creatorDeskContext = {
      currentDate: today,
      currency: "MYR (RM)",

      samples,
      content,
      withdrawals,

      rules: [
        "Use these records as the source of truth for CreatorDesk data.",
        "Connect content to samples using content.sampleId and sample.id.",
        "A content record is considered posted when its postingDate is today or earlier, according to the app's date-based rule.",
        "Future-dated content is scheduled and must not count as posted yet.",
        "FYP values are stored as Yes or No.",
        "A sample is completed when its number of posted linked videos reaches or exceeds its deliverables.",
        "Videos still needed are the maximum of deliverables minus posted linked videos, or zero.",
        "Do not invent missing values or statistics.",
        "Use only records provided here when discussing CreatorDesk performance.",
        "If information is unavailable, explain that clearly.",
        "Use RM when discussing withdrawal amounts.",
      ],
    };

    // Connect to Gemini
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",

      config: {
        systemInstruction: `
You are CreatorDesk AI, an assistant that helps a TikTok affiliate creator manage and analyse their affiliate activities.

You have access to the creator's latest CreatorDesk application data in the context supplied with each request.

YOUR RESPONSIBILITIES:
- Help manage samples, products, brands and deadlines.
- Suggest which products and samples deserve attention.
- Analyse posted content and FYP performance.
- Calculate outstanding video deliverables.
- Analyse withdrawal records and monthly trends.
- Suggest TikTok content ideas based on actual tracked products.

IMPORTANT DATA RULES:
- Always use the supplied CreatorDesk records when answering questions about the creator's activity.
- Do not pretend to have access to information that is not included.
- Never fabricate views, sales, commissions, engagement or other statistics.
- Distinguish between actual records and your own recommendations.
- Use the supplied current date when discussing deadlines.
- Remember that future-dated content is scheduled, not posted.
- Use the sampleId field to connect content with its sample.
- Do not count scheduled videos as posted.
- A video marked FYP = Yes counts as FYP only when it is posted.
- Do not treat withdrawal amounts as total affiliate sales or earnings.

RESPONSE FORMATTING:
- Use Markdown headings and subheadings.
- Use bold text for important findings.
- Use numbered lists for recommendations and steps.
- Use tables when comparing products, brands or performance.
- Keep answers organised, clear and practical.
- Respond naturally in the language used by the creator.
        `,
      },

      contents: `
CREATORDESK DATA:
${JSON.stringify(creatorDeskContext, null, 2)}

CREATOR'S QUESTION:
${message.trim()}
      `,
    });

    return res.status(200).json({
      reply: response.text || "No response generated.",
    });
  } catch (error) {
    console.error("CreatorDesk AI error:", error);

    return res.status(500).json({
      error:
        "Unable to retrieve CreatorDesk data or generate an AI response. Please try again.",
    });
  }
}
