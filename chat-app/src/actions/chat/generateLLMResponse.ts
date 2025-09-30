import { defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { embed } from "ai";
import { createCohere } from "@ai-sdk/cohere";
import { supabasePrivateClient } from "@/lib/supabase";

const cohereKey =
	import.meta.env.MODE === "production"
		? import.meta.env.COHERE_API_KEY
		: import.meta.env.COHERE_API_KEY_LOCAL;

const generateLLMResponse = async (
	userInput: string,
	context: ActionAPIContext
) => {
	try {
		// 1. Input validation
		const trimmedInput = userInput.trim();

		if (!trimmedInput) {
			return {
				success: false,
				message: {
					userInput,
					results: [],
					error: "Empty input",
				},
			};
		}

		// 2. Length validation (defense in depth - already validated in schema)
		if (trimmedInput.length > 500) {
			return {
				success: false,
				message: {
					userInput,
					results: [],
					error: "Input too long",
				},
			};
		}

		const supabase = supabasePrivateClient({
			request: context.request,
			cookies: context.cookies,
		});

		const cohere = createCohere({ apiKey: cohereKey });

		// 3. Generate embedding (relies on Netlify timeout + Cohere limits)
		const { embedding } = await embed({
			model: cohere.textEmbeddingModel("embed-english-light-v3.0"),
			value: trimmedInput,
		});

		// 4. Search WCAG database
		const { data: results, error } = await supabase.rpc("search_wcag_smart", {
			user_query: trimmedInput,
			query_embedding: embedding,
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
				results, // Return raw results for API to handle
			},
		};
	} catch (err) {
		console.error(
			"Error generating LLM response:",
			err instanceof Error ? err.message : err
		);
		return {
			success: false,
			message: {
				userInput,
				results: [],
				error: "Failed to fetch context",
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
