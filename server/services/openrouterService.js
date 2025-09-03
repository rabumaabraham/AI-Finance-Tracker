// server/services/geminiService.js
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

/**
 * Categorizes a bank transaction using the OpenRouter API.
 * @param {string} transactionName - The name or description of the transaction.
 * @returns {Promise<string>} The predicted category for the transaction.
 */
export async function categorizeWithOpenRouter(transactionName) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-405b-instruct:free",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that categorizes bank transactions. Return ONLY the category name without any prefixes, labels, or additional text. Examples: 'Food', 'Transport', 'Entertainment', 'Bills', 'Salary', 'Health', 'Shopping', 'Other'. Do not include 'Category:', 'Type:', or any other prefixes."
          },
          {
            role: "user",
            content: `Categorize this bank transaction: "${transactionName}". Return only the category name (Food, Transport, Entertainment, Bills, Salary, Health, Shopping, or Other) without any prefixes or labels.`
          }
        ],
        max_tokens: 10,
        temperature: 0.1,
        extra_body: { fallbacks: [] } // 🚫 prevents fallback
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error("No response from model");
    }

    // Extract the category from the response
    const category = data.choices[0].message.content.trim();

    // Robust normalization to remove various prefixes
    let normalizedCategory = category;
    const prefixesToRemove = [
      /^category:\s*/i,
      /^type:\s*/i,
      /^cat:\s*/i,
      /^spending category:\s*/i,
      /^transaction category:\s*/i,
      /^the category is:\s*/i,
      /^this is:\s*/i,
      /^classified as:\s*/i,
      /^categorized as:\s*/i
    ];

    prefixesToRemove.forEach(prefix => {
      normalizedCategory = normalizedCategory.replace(prefix, "");
    });

    normalizedCategory = normalizedCategory.replace(/['"]/g, "").replace(/\.$/, "").trim();

    return normalizedCategory || "Uncategorized";
  } catch (err) {
    console.error("❌ OpenRouter categorization failed:", err.message);
    return "Uncategorized";
  }
}