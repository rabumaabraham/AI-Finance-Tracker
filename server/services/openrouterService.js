// server/services/geminiService.js
import OpenAI from "openai"; // The OpenRouter API is compatible with the OpenAI client
import dotenv from "dotenv"; // Import dotenv

dotenv.config(); // Call dotenv.config() here to load environment variables

// Initialize the OpenAI client, pointing it to the OpenRouter base URL
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY, // Use the new OPENROUTER_API_KEY
  baseURL: "https://openrouter.ai/api/v1", // OpenRouter API base URL
});

/**
 * Categorizes a bank transaction using the OpenRouter API.
 * @param {string} transactionName - The name or description of the transaction.
 * @returns {Promise<string>} The predicted category for the transaction.
 */
export async function categorizeWithOpenRouter(transactionName) {
  try {
    const completion = await openrouter.chat.completions.create({
      // Use the model format specific to OpenRouter for OpenAI's GPT-3.5-turbo
      // If you want to use other models available on OpenRouter (e.g., Anthropic, Mistral),
      // replace "openai/gpt-3.5-turbo" with the appropriate model string from OpenRouter.
      model: "meta-llama/llama-3.1-405b-instruct:free",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that categorizes bank transactions. Return ONLY the category name without any prefixes, labels, or additional text. Examples: 'Food', 'Transport', 'Entertainment', 'Bills', 'Salary', 'Health', 'Shopping', 'Other'. Do not include 'Category:', 'Type:', or any other prefixes.",
        },
        {
          role: "user",
          content: `Categorize this bank transaction: "${transactionName}". Return only the category name (Food, Transport, Entertainment, Bills, Salary, Health, Shopping, or Other) without any prefixes or labels.`,
        },
      ],
      max_tokens: 10, // Limit response length for category
      temperature: 0.1, // Keep it very low for consistent categorization
      fallbacks: [] // 🚫 prevents fallback to GPT-3.5
    });

    // Extract the category from the response
    const category = completion.choices[0].message.content.trim();
    
    // Robust normalization to remove various prefixes
    let normalizedCategory = category;
    
    // Remove common prefixes
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
      normalizedCategory = normalizedCategory.replace(prefix, '');
    });
    
    // Remove any remaining quotes, periods, or extra whitespace
    normalizedCategory = normalizedCategory.replace(/['"]/g, '').replace(/\.$/, '').trim();
    
    return normalizedCategory || "Uncategorized";
  } catch (err) {
    console.error("❌ OpenRouter categorization failed:", err.message);
    // Log more details if available in error object
    if (err.response) {
      console.error("OpenRouter error response data:", err.response.data);
    }
    return "Uncategorized";
  }
}
