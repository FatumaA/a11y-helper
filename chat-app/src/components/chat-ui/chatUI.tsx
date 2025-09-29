import { useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { type UIMessage, DefaultChatTransport } from "ai";
import { useStore } from "@nanostores/react";
import { userStore } from "@/stores/userStore";
import { actions } from "astro:actions";
import { toast } from "sonner";
import { useLoadingState } from "@/hooks/useLoadingState";
import { ChatLoadingSkeleton } from "@/components/chat-ui/chat-skeleton";
import { Conversation } from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
	PromptInput,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
} from "../ai-elements/prompt-input";
import { Button } from "../ui/button";
import { ActionDialog } from "../blocks/action-dialog";
import { MessageSquare } from "lucide-react";

const SUGGESTIONS = [
	"How do I make buttons accessible?",
	"Color contrast requirements",
	"WCAG 2.1.1 keyboard navigation",
];

interface ChatInterfaceProps {
	initialChatId?: string | null;
	initialPendingMessage?: string | null;
}

export default function ChatUI({
	initialChatId,
	initialPendingMessage,
}: ChatInterfaceProps) {
	const user = useStore(userStore);
	const [input, setInput] = useState(initialPendingMessage || "");
	const [chatId] = useState<string | null>(initialChatId || null);
	const loadingState = useLoadingState("initializing");
	const [showSaveDialog, setShowSaveDialog] = useState(false);
	const [dismissedAtCount, setDismissedAtCount] = useState<number | null>(null);
	const [hasTempMessages, setHasTempMessages] = useState(false);

	const mode: "authenticated" | "unauthenticated" =
		user && user.id ? "authenticated" : "unauthenticated";

	const SESSION_STORAGE_KEY = "temp-chat";

	// SessionStorage for unauthenticated mode
	const loadMessagesFromSession = (): UIMessage[] => {
		if (mode === "authenticated") return [];
		try {
			const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
			if (stored) {
				const parsedMessages = JSON.parse(stored);
				if (Array.isArray(parsedMessages)) {
					return parsedMessages;
				}
			}
		} catch (error) {
			console.warn("Failed to load messages from session storage:", error);
		}
		return [];
	};

	const saveMessagesToSession = (messages: UIMessage[]) => {
		if (mode === "authenticated") return;
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
		onFinish: async (message) => {
			if (chatId && user?.id) {
				try {
					const result = await actions.insertChatMsg({
						chat_id: chatId,
						role:
							message.message.role === "user" ||
							message.message.role === "assistant"
								? message.message.role
								: "assistant",
						content: message.message.parts
							.map((part) => (part.type === "text" ? part.text : ""))
							.join(""),
						message_id: message.message.id,
					});

					// Clear unauthenticated session cache only after a successful save
					if (result?.data?.success) {
						try {
							sessionStorage.removeItem(SESSION_STORAGE_KEY);
						} catch (e) {
							console.warn("Failed to clear session storage after insert:", e);
						}
					}
				} catch (error) {
					console.error("Failed to save message:", error);
				}
			}
		},
	});

	// Load existing chat messages (authenticated mode only)
	const loadChatMessages = useCallback(
		async (currentChatId: string) => {
			if (mode === "unauthenticated") return;

			const result = await loadingState.withTransition(
				"loading_chat",
				async () => {
					const response = await actions.readChatMsgs({
						activeChatId: currentChatId,
					});
					if (response.data?.success) {
						const dbMessages = response.data.message;
						let uiMessages: UIMessage[] = [];
						if (Array.isArray(dbMessages)) {
							uiMessages = dbMessages.map((msg: any) => ({
								id: String(msg.message_id),
								role: msg.role,
								parts: [{ type: "text", text: msg.message_content || "" }],
							}));
						}
						setMessages(uiMessages);
						// Clear any unauthenticated session messages after successfully loading DB messages
						try {
							sessionStorage.removeItem(SESSION_STORAGE_KEY);
						} catch (e) {
							console.warn(
								"Failed to clear session storage after loading DB messages:",
								e
							);
						}
						return true;
					}
					throw new Error("Failed to load messages");
				}
			);

			if (!result) {
				console.error("Failed to load chat messages");
			}
		},
		[mode, initialChatId, setMessages, loadingState]
	);

	// Initialize chat
	useEffect(() => {
		const initializeChat = async () => {
			if (loadingState.isReady) return;

			if (mode === "authenticated") {
				// Authenticated mode: load from database
				if (chatId) {
					await loadChatMessages(chatId);
				}
			} else {
				// Unauthenticated mode: load from sessionStorage
				const storedMessages = loadMessagesFromSession();
				setHasTempMessages(storedMessages.length > 0);
				if (storedMessages.length > 0) {
					setMessages(storedMessages);
				}
			}

			loadingState.setReady();
		};
		initializeChat();
	}, [mode, chatId, loadChatMessages, loadingState, setMessages]);

	// No auto-execution - just prefill input (handled in initialization)

	// Handle form submission
	const handleSubmit = async (
		message: { text?: string },
		event: React.FormEvent<HTMLFormElement>
	) => {
		event.preventDefault();

		if (!message.text?.trim() || isLoading) return;

		// Clear input immediately for better UX
		setInput("");

		// Send message to existing chat
		try {
			await sendMessage({ text: message.text });
		} catch (error) {
			console.error("Failed to send message:", error);
			toast.error("Failed to send message. Please try again.");
			// Restore input on error
			setInput(message.text);
		}
	};

	// Combined: (a) pre-save when user starts typing (unauth), (b) persist messages when ready
	useEffect(() => {
		// Pre-save when user begins typing in unauthenticated mode and there are no messages yet
		if (
			mode === "unauthenticated" &&
			input.length === 1 &&
			messages.length === 0
		) {
			saveMessagesToSession([]);
		}

		// Only persist once initialization is complete and there are messages
		if (!loadingState.isReady || messages.length === 0) return;

		if (mode === "authenticated") {
			// Save user message to database (only the latest user message)
			const lastMessage = messages[messages.length - 1];
			if (lastMessage?.role === "user" && chatId && user?.id) {
				(async () => {
					try {
						await actions.insertChatMsg({
							chat_id: chatId,
							role: "user",
							content: lastMessage.parts
								.map((part) => (part.type === "text" ? part.text : ""))
								.join(""),
							message_id: lastMessage.id,
						});

						// Clear session cache after successful save (safe-guard)
						try {
							sessionStorage.removeItem(SESSION_STORAGE_KEY);
						} catch (e) {
							console.warn(
								"Failed to clear session storage after authenticated save:",
								e
							);
						}
					} catch (error) {
						console.error("Failed to save user message:", error);
					}
				})();
			}
		} else {
			// Unauthenticated: persist to session storage
			saveMessagesToSession(messages);
		}
	}, [
		mode,
		messages,
		input,
		chatId,
		user?.id,
		loadingState.isReady,
		// saveMessagesToSession is stable (declared above) so not added to deps
	]);

	// Check if we should show the save dialog when messages reach 10
	useEffect(() => {
		if (mode === "unauthenticated" && messages.length >= 10) {
			// Only show if user hasn't dismissed it, or if message count has increased since dismissal
			if (
				dismissedAtCount === null ||
				messages.length >= dismissedAtCount + 10
			) {
				setShowSaveDialog(true);
			}
		}
	}, [mode, messages.length, dismissedAtCount]);

	// Add beforeunload event listener for tab close detection
	useEffect(() => {
		if (mode === "unauthenticated") {
			const handleBeforeUnload = (event: BeforeUnloadEvent) => {
				const storedMessages = loadMessagesFromSession();
				if (storedMessages.length > 0 || messages.length > 0) {
					event.preventDefault();
					setShowSaveDialog(true);
					return (event.returnValue =
						"You have unsaved chat messages. Are you sure you want to leave?");
				}
			};

			window.addEventListener("beforeunload", handleBeforeUnload);
			return () =>
				window.removeEventListener("beforeunload", handleBeforeUnload);
		}
	}, [mode, messages.length]);

	// Clear chat handler (unauthenticated mode only)
	const handleClearChat = () => {
		if (mode === "unauthenticated") {
			setMessages([]);
			sessionStorage.removeItem(SESSION_STORAGE_KEY);
			setInput("");
		}
	};

	const isLoading = status === "streaming";

	const shouldShowWelcome = loadingState.isReady && messages.length === 0;

	return (
		<div className="flex flex-col max-w-4xl w-full">
			{/* Chat Messages */}
			<Conversation className="overflow-hidden p-4 space-y-4">
				{!loadingState.isReady && (
					<div>
						{((mode === "unauthenticated" && hasTempMessages) ||
							(mode === "authenticated" &&
								loadingState.current === "loading_chat" &&
								chatId)) && <ChatLoadingSkeleton />}
					</div>
				)}

				{messages.length === 0 && (
					<div className="text-center text-muted-foreground mt-10 transition-opacity duration-500 ease-out opacity-100">
						<div className="max-w-md mx-auto text-center mb-8">
							{/* TODO: add some visual element here */}
							{/* <div className="flex items-center justify-center mb-4">
								<div className="bg-primary/10 p-3 rounded-full">
									<MessageSquare className="h-8 w-8 text-primary" />
								</div>
							</div> */}
							<h1 className="text-3xl font-bold mb-2 text-foreground">
								WCAG Accessibility Assistant
							</h1>
							<p className="text-lg text-muted-foreground max-w-2xl">
								{window.location.pathname !== "/"
									? "Ask anything about web accessibility guidelines!"
									: "Ask anything about web accessibility guidelines, get implementation best practices, and code examples."}
							</p>
						</div>
					</div>
				)}

				{loadingState.isReady && (
					<div className="space-y-4">
						{messages.map((message) => (
							<Message key={message.id} from={message.role}>
								<MessageContent>
									{message.parts.map((part, idx) => {
										if (part.type === "text") {
											return message.role === "assistant" ? (
												<Response key={idx} className="prose prose-sm">
													{part.text}
												</Response>
											) : (
												<div key={idx}>{part.text}</div>
											);
										}
									})}
								</MessageContent>
							</Message>
						))}
						{/* Loading states */}
						{status === "streaming" && (
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
				)}
			</Conversation>

			{/* Input */}
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
							{mode === "unauthenticated" && messages.length > 0 && (
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

				{shouldShowWelcome && (
					<div className="flex gap-2 flex-wrap justify-center mt-3 transition-opacity duration-300 ease-out opacity-100">
						{SUGGESTIONS.map((suggestion) => (
							<Button
								key={suggestion}
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setInput(suggestion)}
								disabled={isLoading}
								className="text-xs hover:bg-muted"
							>
								{suggestion}
							</Button>
						))}
					</div>
				)}
			</div>

			{/* Temp Chat Save Dialog */}
			<ActionDialog
				open={showSaveDialog}
				onOpenChange={(open) => {
					setShowSaveDialog(open);
					// Track dismissal when user cancels (but not when they sign up)
					if (!open && showSaveDialog) {
						setDismissedAtCount(messages.length);
					}
				}}
				messageCount={messages.length}
			/>
		</div>
	);
}
