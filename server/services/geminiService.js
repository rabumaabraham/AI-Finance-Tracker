// server/services/geminiService.js
import axios from "axios";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

export async function categorizeWithGemini(transactionName) {
  try {
    const response = await axios.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Categorize this bank transaction: "${transactionName}". Return only the most suitable category such as Food, Transport, Entertainment, Bills, Salary, Health, or Other.`
              }
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const category = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return category || "Uncategorized";
  } catch (err) {
    console.error("❌ Gemini categorization failed:", err?.response?.data || err.message);
    return "Uncategorized";
  }
}

console.log("✅ GEMINI API KEY:", GEMINI_API_KEY);

