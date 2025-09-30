import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { actions } from "astro:actions";
import type { APIRoute } from "astro";

export const POST: APIRoute = async (context) => {
	const { request } = context;

	try {
		// 1. Origin validation - blocks requests from other domains
		const origin = request.headers.get("origin");
		const allowedOrigins = [
			import.meta.env.PUBLIC_SITE_URL,
			...(import.meta.env.DEV ? [import.meta.env.PUBLIC_SITE_URL_LOCAL] : []),
		];

		if (!origin || !allowedOrigins.some((allowed) => origin === allowed)) {
			return new Response(JSON.stringify({ error: "Forbidden" }), {
				status: 403,
				headers: { "Content-Type": "application/json" },
			});
		}

		// 2. Parse and validate request body
		const { messages } = await request.json();

		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			return new Response(JSON.stringify({ error: "Invalid message format" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const userMessage = messages[messages.length - 1];

		// Support both .content and .parts formats from ui
		let content = userMessage?.content;
		if (!content && Array.isArray(userMessage?.parts)) {
			content = userMessage.parts.map((p: any) => p.text).join(" ");
		}

		// 3. Validate content exists and is a string
		if (!content || typeof content !== "string") {
			return new Response(
				JSON.stringify({ error: "Invalid message content" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		// 4. Length validation - prevents token abuse
		if (content.length > 500) {
			return new Response(
				JSON.stringify({
					error: "Message too long. Please keep it under 500 characters.",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		// Get WCAG data from action
		const formData = new FormData();
		formData.set("userInput", content);
		const actionResult = await context.callAction(
			actions.generateResponse,
			formData
		);

		if (actionResult.error || !actionResult.data?.success) {
			console.error("Action error:", actionResult.error);
			return new Response(
				JSON.stringify({ error: "Service temporarily unavailable" }),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				}
			);
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
		// Don't leak error details to client
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
