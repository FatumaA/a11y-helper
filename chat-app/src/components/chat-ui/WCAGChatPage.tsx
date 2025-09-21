import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Conversation } from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
	Source,
	Sources,
	SourcesContent,
	SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Button } from "../ui/button";
import { DefaultChatTransport } from "ai";
import {
	PromptInput,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
} from "../ai-elements/prompt-input";
import { type User } from "@supabase/supabase-js";
import { actions } from "astro:actions"; // Astro injects this at runtime

const SUGGESTIONS = [
	"How do I make buttons accessible?",
	"Color contrast requirements",
	"WCAG 2.1.1 keyboard navigation",
];

export default function WCAGChatPage({
	user,
	initialMessages = [],
	activeChatId,
}: {
	user: User | null;
	initialMessages?: Array<any>;
	activeChatId?: string;
}) {
	const [input, setInput] = useState("");
	const [loadingState, setLoadingState] = useState<
		"loading" | "migrating" | "ready"
	>("loading");
	const [persistedIds, setPersistedIds] = useState<Set<string>>(new Set());

	const { messages, setMessages, sendMessage, status, error } = useChat({
		transport: new DefaultChatTransport({
			api: "/api/streamChatResponse",
		}),
		onError: (error) => {
			console.error("Chat error:", error);
		},
	});

	const isLoading = status === "streaming";
	const chatEndRef = useRef<HTMLDivElement | null>(null);

	// Initialization & migration effect

	const didInitRef = useRef(false);

	useEffect(() => {
		if (didInitRef.current) return; // Prevent running more than once
		const tempChatData = JSON.parse(localStorage.getItem("temp-chat") || "{}");

		// Only migrate if user just signed in and there are messages to migrate
		if (user?.id && tempChatData.messages?.length > 0) {
			setLoadingState("migrating");
			(async () => {
				try {
					const result = await actions.migrateChat({
						messages: tempChatData.messages.map((msg: any, idx: number) => ({
							content: msg.content,
							role: msg.role,
							timestamp: msg.timestamp,
							message_id: msg.message_id,
						})),
					});
					if (result.data?.success && result.data.message) {
						localStorage.removeItem("temp-chat");
						window.location.replace(`/chat/${result.data.message}`);
						return;
					}
				} catch {}
				setLoadingState("ready");
			})();
		} else {
			let newMessages = [];
			if (!user?.id && tempChatData.messages?.length > 0) {
				newMessages = tempChatData.messages.map((msg: any, idx: number) => ({
					// id: msg.message_id,
					message_id: msg.message_id,
					role: msg.role,
					parts: [{ type: "text", text: msg.content }],
					createdAt: new Date(msg.timestamp),
				}));
			} else if (initialMessages.length > 0) {
				newMessages = initialMessages;
			}
			// Only set if different
			if (
				newMessages.length > 0 &&
				JSON.stringify(messages) !== JSON.stringify(newMessages)
			) {
				setMessages(newMessages);
			}
			setLoadingState("ready");
		}
		didInitRef.current = true;
		// eslint-disable-next-line
	}, [user?.id, initialMessages]); // Don't add messages as a dependency
	// Save messages to localStorage (anonymous only)
	useEffect(() => {
		if (!user?.id && messages.length > 0) {
			localStorage.setItem(
				"temp-chat",
				JSON.stringify({
					messages: messages.map((msg) => ({
						content: msg.parts
							.filter((p) => p.type === "text")
							.map((p) => p.text)
							.join(" "),
						role: msg.role,
						timestamp: new Date().toISOString(),
						message_id: msg.id,
					})),
					createdAt: Date.now(),
				})
			);
		}
	}, [messages, user]);

	// Scroll to bottom on new messages
	useEffect(() => {
		chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isLoading]);

	// Sync messages to DB if authed and in a chat thread
	const persistedIdsRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		if (
			!user?.id ||
			!activeChatId ||
			messages.length === 0 ||
			status === "streaming" // <-- Only sync when not streaming
		)
			return;

		const unsyncedMessages = messages.filter(
			(msg) =>
				!persistedIds.has(msg.id) &&
				(msg.role === "user" ||
					(msg.role === "assistant" &&
						msg.parts.some(
							(p) => p.type === "text" && p.text && p.text.trim()
						)))
		);

		if (unsyncedMessages.length === 0) return;

		(async () => {
			let didUpdate = false;
			const newIds = new Set(persistedIds);
			for (const msg of unsyncedMessages) {
				// Only sync messages with role "user" or "assistant"
				if (msg.role !== "user" && msg.role !== "assistant") continue;
				try {
					await actions.insertChatMsg({
						chat_id: activeChatId,
						role: msg.role, // Now guaranteed to be "user" or "assistant"
						content: msg.parts
							.filter((p) => p.type === "text")
							.map((p) => p.text)
							.join(" "),
						message_id: msg.id,
					});
					newIds.add(msg.id);
					didUpdate = true;
				} catch (err) {
					console.error("Failed to sync message", msg.id, err);
				}
			}
			if (didUpdate) setPersistedIds(newIds);
		})();
	}, [messages, user, activeChatId, persistedIds, status]);

	// Handle form submission
	const handleSubmit = async (
		message: { text?: string },
		event: React.FormEvent<HTMLFormElement>
	) => {
		event.preventDefault();
		if (!message.text?.trim() || isLoading) return;
		await sendMessage({ text: message.text });
		setInput("");
	};

	// Suggestion click handler
	const handleSuggestionClick = (suggestion: string) => {
		setInput(suggestion);
	};

	// Don't render until we've checked localStorage or if migrating
	if (loadingState === "loading" || loadingState === "migrating") {
		return (
			<div className="flex flex-col max-w-4xl w-full">
				<div className="flex items-center justify-center min-h-96">
					<div className="animate-pulse text-muted-foreground">
						{loadingState === "migrating"
							? "Migrating your conversation..."
							: "Loading..."}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col max-w-4xl w-full">
			{/* Chat Messages */}
			<Conversation className="overflow-hidden p-4 space-y-4">
				{messages.length === 0 && (
					<div className="text-center text-muted-foreground mt-10">
						<div className="max-w-md mx-auto">
							<h2 className="text-2xl font-bold mb-2 text-foreground">
								WCAG Accessibility Assistant
							</h2>
							<p className="mb-4">
								Ask anything about web accessibility guidelines!
							</p>
						</div>
					</div>
				)}

				{messages.map((message) => (
					<Message key={message.id} from={message.role}>
						<MessageContent
							className={`
							${
								message.role === "user"
									? "bg-primary text-primary-foreground"
									: "bg-background border"
							} rounded-lg p-4 shadow-sm
						`}
						>
							{/* Render message content */}
							{message.parts.map((part, idx) => {
								if (part.type === "text") {
									return message.role === "assistant" ? (
										<Response key={idx} className="prose prose-sm ">
											{part.text}
										</Response>
									) : (
										<div key={idx}>{part.text}</div>
									);
								}
							})}

							{/* Display Sources for assistant messages */}
							{message.role === "assistant" &&
								(message.metadata as any)?.sources && (
									<Sources>
										<SourcesTrigger
											count={(message.metadata as any)?.sources.length}
										>
											Used {(message.metadata as any)?.sources.length} WCAG{" "}
											{(message.metadata as any)?.sources.length === 1
												? "guideline"
												: "guidelines"}
										</SourcesTrigger>
										<SourcesContent>
											{(message.metadata as any)?.sources.map(
												(source: any, idx: number) => (
													<Source
														title={"WCAG Level" + source.level}
														key={source.id || idx}
														href={source.url}
														target="_blank"
														rel="noopener noreferrer"
														className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
													></Source>
												)
											)}
										</SourcesContent>
									</Sources>
								)}
						</MessageContent>
					</Message>
				))}

				{isLoading && (
					<Message from="assistant" className="mr-12">
						<MessageContent className="bg-background border rounded-lg p-4 shadow-sm">
							Searching WCAG guidelines...
						</MessageContent>
					</Message>
				)}

				{error && (
					<Message from="assistant" className="mr-12">
						<MessageContent className="bg-red-50 border border-red-200 rounded-lg p-4">
							<div className="flex items-center space-x-2">
								<span className="text-red-600">⚠️</span>
								<p className="text-red-700 text-sm">
									Sorry, something went wrong. Please try again.
								</p>
							</div>
						</MessageContent>
					</Message>
				)}
				<div ref={chatEndRef} />
			</Conversation>

			{/* Input Section */}
			<div className="border-t bg-background/80 backdrop-blur-sm p-4">
				<PromptInput onSubmit={handleSubmit} className="space-y-3">
					<PromptInputTextarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Ask about WCAG guidelines, accessibility, or code examples..."
						disabled={isLoading}
						maxLength={500}
						className="min-h-[60px]"
					/>
					<PromptInputToolbar className="flex justify-between items-center mx-2">
						<PromptInputTools className="flex items-center gap-2">
							<span className="text-xs text-muted-foreground">
								{input.length}/500
							</span>
						</PromptInputTools>
						<PromptInputSubmit
							disabled={!input.trim() || isLoading}
							status={status}
						/>
					</PromptInputToolbar>
				</PromptInput>

				{/* Suggestion Pills */}
				{messages.length === 0 && (
					<div className="flex gap-2 flex-wrap justify-center mt-3">
						{SUGGESTIONS.map((suggestion) => (
							<Button
								key={suggestion}
								type="button"
								variant="outline"
								size="sm"
								onClick={() => handleSuggestionClick(suggestion)}
								disabled={isLoading}
								className="text-xs hover:bg-muted"
							>
								{suggestion}
							</Button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
