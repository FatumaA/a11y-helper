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
import { DefaultChatTransport, type UIMessage } from "ai";
import {
	PromptInput,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
} from "../ai-elements/prompt-input";
import { useStore } from "@nanostores/react";
import { userStore } from "@/stores/userStore";

const SUGGESTIONS = [
	"How do I make buttons accessible?",
	"Color contrast requirements",
	"WCAG 2.1.1 keyboard navigation",
];

import { type Database } from "../../../database.types";
import { Loader } from "../ai-elements/loader";

type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

// Session storage key
const SESSION_STORAGE_KEY = "temp-chat";

export default function WCAGInitPage() {
	const user = useStore(userStore);
	const [input, setInput] = useState("");
	const [isInitialized, setIsInitialized] = useState(false);

	// Load messages from session storage
	const loadMessagesFromSession = (): UIMessage[] => {
		try {
			const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
			if (stored) {
				const parsedMessages = JSON.parse(stored);
				// Validate the structure
				if (Array.isArray(parsedMessages)) {
					return parsedMessages;
				}
			}
		} catch (error) {
			console.warn("Failed to load messages from session storage:", error);
		}
		return [];
	};

	// Save messages to session storage
	const saveMessagesToSession = (messages: UIMessage[]) => {
		console.log(messages);
		try {
			sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
		} catch (error) {
			console.warn("Failed to save messages to session storage:", error);
		}
	};

	const { messages, setMessages, sendMessage, status, error } = useChat({
		transport: new DefaultChatTransport({
			api: "/api/streamChatResponse",
		}),
	});

	// Initialize messages from session storage on component mount
	useEffect(() => {
		const storedMessages = loadMessagesFromSession();
		if (storedMessages.length > 0) {
			setMessages(storedMessages);
		}
		// Small delay to show smooth transition
		setTimeout(() => setIsInitialized(true), 100);
	}, [setMessages]);

	// Save messages to session storage whenever messages change
	useEffect(() => {
		if (isInitialized && messages.length > 0) {
			saveMessagesToSession(messages);
		}
	}, [messages, isInitialized]);

	// Save to session storage when user starts typing (first character)
	useEffect(() => {
		if (input.length === 1 && messages.length === 0) {
			// User just started typing and there are no messages yet
			// Save an empty array to indicate chat has been initiated
			saveMessagesToSession([]);
		}
	}, [input, messages.length]);

	const isLoading = status === "streaming";

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

	// Clear chat handler
	const handleClearChat = () => {
		setMessages([]);
		sessionStorage.removeItem(SESSION_STORAGE_KEY);
		setInput("");
	};

	// Show welcome immediately if no messages, with smooth fade-in
	const shouldShowWelcome = isInitialized && messages.length === 0;

	return (
		<div className="flex flex-col max-w-4xl w-full">
			{/* Chat Messages */}
			<Conversation className="overflow-hidden p-4 space-y-4">
				{!isInitialized && (
					<div className="text-center text-muted-foreground mt-10">
						<div className="max-w-md mx-auto">
							<Loader />
						</div>
					</div>
				)}

				{shouldShowWelcome && (
					<div className="text-center text-muted-foreground mt-10 animate-in fade-in duration-300">
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

				<div
					className={`space-y-4 transition-opacity duration-300 ${
						isInitialized ? "opacity-100" : "opacity-0"
					}`}
				>
					{messages.map((message) => (
						<Message key={message.id} from={message.role}>
							<MessageContent>
								{/* Render message content */}
								{message.parts.map((part, idx) => {
									if (part.type === "text") {
										return message.role === "assistant" ? (
											<Response key={idx} className="prose prose-sm ">
												{part.text}
											</Response>
										) : (
											<Message key={idx} from={message.role}>
												{part.text}
											</Message>
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
				</div>
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
							{messages.length > 0 && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={handleClearChat}
									className="text-xs text-muted-foreground hover:text-foreground"
								>
									Clear Chat
								</Button>
							)}
						</PromptInputTools>
						<PromptInputSubmit
							disabled={!input.trim() || isLoading}
							status={status}
						/>
					</PromptInputToolbar>
				</PromptInput>

				{/* Suggestion Pills - always available when no messages */}
				{shouldShowWelcome && (
					<div className="flex gap-2 flex-wrap justify-center mt-3 animate-in fade-in duration-500 delay-150">
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
