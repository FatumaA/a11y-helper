import { defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { createClient } from "@supabase/supabase-js";
import { embedMany } from "ai";
import { createCohere } from "@ai-sdk/cohere";
import { supabasePrivateClient } from "@/lib/supabase";

const generateLLMResponse = async (
	userInput: string,
	context: ActionAPIContext
) => {
	try {
		const supabase = supabasePrivateClient({
			request: context.request,
			cookies: context.cookies,
		});

		const cohere = createCohere({ apiKey: import.meta.env.COHERE_API_KEY });

		// embeddings + supabase search …
		const { embeddings } = await embedMany({
			model: cohere.textEmbeddingModel("embed-english-light-v3.0"),
			values: [userInput.trim()],
		});

		const { data: results, error } = await supabase.rpc("search_wcag_smart", {
			user_query: userInput.trim(),
			query_embedding: embeddings[0],
			match_count: 5,
		});

		if (error) throw new Error(error.message);

		if (!results || results.length === 0) {
			return {
				success: true,
				message: {
					userInput,
					results: [],
				},
			};
		}

		console.log("Raw WCAG results from Supabase:", results);

		return {
			success: true,
			message: {
				userInput,
				results: results, // Return raw results for API to handle
			},
		};
	} catch (err) {
		return {
			success: false,
			message: {
				userInput,
				results: [],
				error: err instanceof Error ? err.message : "Failed to fetch context",
			},
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
	handler: async (
		{ userInput },
		context
	): Promise<{
		success: boolean;
		message: {
			userInput: string;
			results: any[];
			error?: string;
		};
	}> => {
		return await generateLLMResponse(userInput, context);
	},
});
