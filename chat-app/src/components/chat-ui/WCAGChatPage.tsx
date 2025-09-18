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
	const handleSubmit = (
		message: { text?: string },
		event: React.FormEvent<HTMLFormElement>
	) => {
		event.preventDefault();
		if (!message.text?.trim() || isLoading) return;
		sendMessage({ text: message.text });
		setInput("");
	};

	// Suggestion click handler
	const handleSuggestionClick = (suggestion: string) => {
		setInput(suggestion);
	};

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
				{/* </form> */}
			</div>
		</div>
	);
}
