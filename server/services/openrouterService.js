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
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that categorizes bank transactions.",
        },
        {
          role: "user",
          content: `Categorize this bank transaction: "${transactionName}". Return only the most suitable category such as Food, Transport, Entertainment, Bills, Salary, Health, or Other.`,
        },
      ],
      max_tokens: 20, // Limit response length for category
      temperature: 0.2, // Keep it low for consistent categorization
    });

    // Extract the category from the response
    const category = completion.choices[0].message.content.trim();
    return category || "Uncategorized";
  } catch (err) {
    console.error("❌ OpenRouter categorization failed:", err.message);
    // Log more details if available in error object
    if (err.response) {
      console.error("OpenRouter error response data:", err.response.data);
    }
    return "Uncategorized";
  }
}
