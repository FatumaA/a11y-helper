import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { actions } from "astro:actions";
import type { APIRoute } from "astro";

export const POST: APIRoute = async (context) => {
	const { request } = context;

	try {
		const { messages } = await request.json();
		const userMessage = messages[messages.length - 1];

		// upport both .content and .parts formats from ui
		let content = userMessage?.content;
		if (!content && Array.isArray(userMessage?.parts)) {
			content = userMessage.parts.map((p: any) => p.text).join(" ");
		}

		if (!content) {
			return new Response("Invalid message format", { status: 400 });
		}

		// Get WCAG data from action
		const formData = new FormData();
		formData.set("userInput", content);
		const actionResult = await context.callAction(
			actions.generateResponse,
			formData
		);

		if (actionResult.error || !actionResult.data?.success) {
			return new Response("Action failed", { status: 500 });
		}

		// get data
		const userInput = actionResult.data.message.userInput || "";
		const results = actionResult.data.message.results || [];

		// Format WCAG context for the LLM
		const wcagContext =
			results.length > 0
				? results
						.map(
							(r: any, i: number) =>
								`${i + 1}. **WCAG ${r.ref_id}** (Level ${r.level}): ${
									r.title
								}\n` + `Description: ${r.description}\nURL: ${r.url}`
						)
						.join("\n\n")
				: "";

		const anthropic = createAnthropic({
			apiKey: import.meta.env.ANTHROPIC_API_KEY!,
		});

		const systemPrompt = `You are an expert WCAG accessibility assistant. Provide practical, actionable advice with proper markdown formatting and complete code examples. Keep the advice short and give a bullet point summary at the end with the title 'Summary' in bold`;

		let userPrompt = `User question: ${userInput}`;
		if (wcagContext) {
			userPrompt += `\n\nRelevant WCAG guidelines:\n${wcagContext}`;
		}

		// Stream the response
		const result = streamText({
			model: anthropic("claude-3-haiku-20240307"),
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			temperature: 0.1,
		});

		return result.toUIMessageStreamResponse({
			headers: {
				"Transfer-Encoding": "chunked",
				Connection: "keep-alive",
			},
			originalMessages: messages,
			messageMetadata: ({ part }) => {
				if (part.type === "start" && results.length > 0) {
					return {
						sources: results.map((r: any) => ({
							url: r.url,
							level: r.level,
						})),
					};
				}
			},
		});
	} catch (error) {
		console.error("Chat API error:", error);
		return new Response("Internal server error", { status: 500 });
	}
};
