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

const SUGGESTIONS = [
	"How do I make buttons accessible?",
	"Color contrast requirements",
	"WCAG 2.1.1 keyboard navigation",
];

export default function WCAGChatPage() {
	const [input, setInput] = useState("");

	const { messages, sendMessage, status, error } = useChat({
		transport: new DefaultChatTransport({
			api: "/api/streamChatResponse",
		}),
		onError: (error) => {
			console.error("Chat error:", error);
		},
	});

	const isLoading = status === "streaming";

	// Scroll to bottom on new messages
	const chatEndRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isLoading]);

	// Handle form submission
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;

		sendMessage({ text: input });
		setInput("");
	};

	// Suggestion click handler
	const handleSuggestionClick = (suggestion: string) => {
		setInput(suggestion);
	};

	return (
		<div className="flex flex-col justify-center max-w-6xl mx-auto">
			{/* Chat Messages */}
			<Conversation className="flex-1 overflow-hidden p-4 space-y-4">
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
					<Message
						key={message.id}
						from={message.role}
						className={message.role === "user" ? "ml-12" : "mr-12"}
					>
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
										<Response key={idx} className="prose prose-sm">
											{part.text}
										</Response>
									) : (
										<span key={idx} className="text-sm">
											{part.text}
										</span>
									);
								}
							})}

							{/* Display Sources for assistant messages */}
							{message.role === "assistant" && message.metadata?.sources && (
								<Sources>
									<SourcesTrigger count={message.metadata.sources.length}>
										Used {message.metadata.sources.length} WCAG{" "}
										{message.metadata.sources.length === 1
											? "guideline"
											: "guidelines"}
									</SourcesTrigger>
									<SourcesContent>
										{message.metadata.sources.map(
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
							<div className="flex items-center space-x-3">
								<div className="flex space-x-1">
									<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
									<div
										className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
										style={{ animationDelay: "0.1s" }}
									></div>
									<div
										className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
										style={{ animationDelay: "0.2s" }}
									></div>
								</div>
								<span className="text-sm text-muted-foreground">
									Searching WCAG guidelines...
								</span>
							</div>
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
				<form onSubmit={handleSubmit} className="space-y-3">
					<div className="flex gap-3">
						<div className="flex-1 relative">
							<input
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder="Ask about WCAG guidelines, accessibility patterns, or code examples..."
								disabled={isLoading}
								className="w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 bg-background"
								maxLength={500}
							/>
							<span className="absolute right-3 top-3 text-xs text-muted-foreground">
								{input.length}/500
							</span>
						</div>
						<Button
							type="submit"
							disabled={!input.trim() || isLoading}
							className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-50 flex items-center gap-2"
						>
							{isLoading ? (
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
							) : (
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
									/>
								</svg>
							)}
							Send
						</Button>
					</div>

					{/* Suggestion Pills */}
					{messages.length === 0 && (
						<div className="flex gap-2 flex-wrap justify-center">
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
				</form>
			</div>
		</div>
	);
}
