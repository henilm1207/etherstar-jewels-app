"use node";

import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action } from "./_generated/server";

export const analyzeProductImage = action({
  args: {
    imageDataUrl: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("AI tools are not configured. Set GEMINI_API_KEY in Convex.");
    }

    const base64Image = args.imageDataUrl.replace(/^data:[^;]+;base64,/, "");
    const mimeType = args.imageDataUrl.match(/^data:([^;]+);base64,/)?.[1] ?? "image/jpeg";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
        contents: [
          {
            parts: [
              {
                text: `You write accurate, elegant ecommerce copy for a fine jewelry catalog. Never invent measurable specifications such as carat, metal purity, gemstone quality, or certifications. Analyze this ${args.category.toLowerCase()} product photo. Create a concise premium product name and a 2-3 sentence description based only on visible details. The name should be 3-7 words and the description should mention the visible design, silhouette, setting, and styling without claiming unseen specifications. Return only JSON with exactly two string fields: name and description.`,
              },
              { inlineData: { mimeType, data: base64Image } },
            ],
          },
        ],
      }),
      },
    );

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      if (response.status === 401) {
        throw new Error("The Gemini API key was rejected. Check GEMINI_API_KEY in Convex.");
      }
      if (response.status === 429 && details.toLowerCase().includes("credits")) {
        throw new Error("Gemini rate limit reached. Try again later or check your Google AI Studio quota.");
      }
      throw new Error(`Gemini request failed (${response.status}): ${details.slice(0, 200)}`);
    }

    const result = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    let parsed: { name?: unknown; description?: unknown };
    try {
      parsed = JSON.parse(raw) as { name?: unknown; description?: unknown };
    } catch {
      throw new Error("The AI returned an invalid product description. Please try again.");
    }

    if (typeof parsed.name !== "string" || typeof parsed.description !== "string") {
      throw new Error("The AI response did not include valid product copy.");
    }

    return { name: parsed.name.trim(), description: parsed.description.trim() };
  },
});