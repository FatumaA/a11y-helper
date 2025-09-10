import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { createClient } from "@supabase/supabase-js";
import { embedMany } from "ai";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";

const generateLLMResponse = async (userInput: string) => {
	try {
		const supabase = createClient(
			import.meta.env.SUPABASE_URL,
			import.meta.env.SUPABASE_ANON_KEY
		);

		// generate embeddings for userInput
		const { embeddings } = await embedMany({
			model: openai.embedding("text-embedding-3-small"),
			values: [userInput.trim()],
		});

		const userInputEmbedding = embeddings[0];

		// pass embeddings res to supabase rpc search func
		const { data: results, error } = await supabase.rpc("search_wcag_smart", {
			user_query: userInput.trim(),
			query_embedding: userInputEmbedding,
			match_count: 5,
		});

		if (error) {
			console.error("Supabase search error:", error);
			throw new Error(`Search failed: ${error.message}`);
		}

		if (!results || results.length === 0) {
			return {
				success: true,
				message:
					"I couldn't find specific WCAG guidelines for that question. Could you try rephrasing it or ask about a specific accessibility topic like forms, images, or keyboard navigation?",
			};
		}

		// // Format res
		// const formattedResults = results.map((result: any) => ({
		// 	id: result.id,
		// 	ref_id: result.ref_id,
		// 	title: result.title,
		// 	description: result.description,
		// 	level: result.level,
		// 	url: result.url,
		// 	final_score: Math.round(result.final_score * 100) / 100,
		// 	search_type: result.search_type,
		// 	strategy_used: result.strategy_used,
		// 	explanation: result.explanation,
		// }));

		// combine supabase rpc res with original userInput to make prompt

		const wcagContext = results
			.map(
				(result: any, index: number) =>
					`${index + 1}. **WCAG ${result.ref_id}** (Level ${result.level}): ${
						result.title
					}
   Description: ${result.description}
   Search Strategy: ${result.strategy_used}
   Official URL: ${result.url}`
			)
			.join("\n\n");

		const systemPrompt = `You are a WCAG accessibility expert assistant. Your job is to explain web accessibility guidelines in clear, practical terms.

IMPORTANT GUIDELINES:
- Always be helpful and educational
- Explain technical concepts in simple terms
- Provide actionable advice when possible
- Reference the specific WCAG guidelines provided
- Keep responses conversational but informative
- If discussing code examples, keep them simple and clear
- Focus on practical implementation, not just theory
- End with an offer to help with follow-up questions

The user asked: "${userInput}"

Here are the relevant WCAG guidelines:
${wcagContext}`;

		const userPrompt = `Please provide a clear, helpful response to: "${userInput}"

Make sure to:
- Reference the specific WCAG guidelines provided
- Explain concepts in plain English
- Give practical implementation advice
- Keep it conversational and friendly
- Be concise but thorough`;

		// pass prompt to claude haiku api to get response
		const { text } = await generateText({
			model: anthropic("claude-3-haiku-20240307"),
			system: systemPrompt,
			prompt: userPrompt,
			temperature: 0.7,
		});

		// return response to client
		return {
			success: true,
			message: text.trim(),
		};
	} catch (err) {
		console.error("LLM Response generation error:", err);
		return {
			success: false,
			message:
				err instanceof Error ? err.message : "Failed to generate response",
		};
	}
};

export const generateResponse = defineAction({
	accept: "form",
	input: z.object({
		userInput: z
			.string()
			.min(1, "Please enter a question")
			.max(500, "Question too long"),
	}),
	handler: async ({
		userInput,
	}): Promise<{ success: boolean; message: string }> => {
		return await generateLLMResponse(userInput);
	},
});
