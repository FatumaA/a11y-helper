import { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { type UIMessage, DefaultChatTransport } from "ai";
import { useStore } from "@nanostores/react";
import { userStore } from "@/stores/userStore";
import { actions } from "astro:actions";
import { navigate } from "astro:transitions/client";
import { toast } from "sonner";
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

const LOCAL_STORAGE_KEY = "temp-chat";
const SUGGESTIONS = [
	"How do I make buttons accessible?",
	"Color contrast requirements",
	"WCAG 2.1.1 keyboard navigation",
];

interface ChatInterfaceProps {
	initialChatId: string | null;
	initialPendingMessage?: string | null;
}

import { type Database } from "../../../database.types";
type Chat = Database["public"]["Tables"]["chats"]["Row"];

export default function ChatUI({
	initialChatId,
	initialPendingMessage,
}: ChatInterfaceProps) {
	const [pendingMessage, setPendingMessage] = useState<string | null>(
		initialPendingMessage || null
	);

	const user = useStore(userStore);
	const [input, setInput] = useState("");
	const [chatId, setChatId] = useState<string | null>(initialChatId);
	const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
	const [isLoadingChat, setIsLoadingChat] = useState(false);

	const [hasInitialized, setHasInitialized] = useState(false);

	const hasLoadedInitialChat = useRef(false);
	const isProcessingPendingMessage = useRef(false);

	const { messages, setMessages, sendMessage, status, error } = useChat({
		transport: new DefaultChatTransport({
			api: "/api/streamChatResponse",
		}),
		onFinish: async (message) => {
			if (chatId && user?.id) {
				try {
					await actions.insertChatMsg({
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
				} catch (error) {
					console.error("Failed to save message:", error);
				}
			}
		},
	});

	// Load existing chat messages
	const loadChatMessages = useCallback(
		async (currentChatId: string) => {
			if (hasLoadedInitialChat.current && currentChatId === initialChatId)
				return;

			setIsLoadingChat(true);
			try {
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
					hasLoadedInitialChat.current = true;
				}
			} catch (error) {
				console.error("Failed to load chat:", error);
			} finally {
				setIsLoadingChat(false);
			}
		},
		[initialChatId, setMessages]
	);

	// Load temp messages for unauthenticated users
	const loadTempMessages = useCallback(() => {
		if (user?.id || chatId) return;
		try {
			const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (stored) {
				const tempMessages = JSON.parse(stored);
				setMessages(tempMessages);
			}
		} catch (error) {
			console.error("Failed to load temp messages:", error);
		}
	}, [user?.id, chatId, setMessages]);

	// Initialize chat
	useEffect(() => {
		const initializeChat = async () => {
			if (hasInitialized) return;
			setChatId(initialChatId);

			// Pick up pending message saved across navigation (handshake)
			if (!pendingMessage) {
				try {
					const pendingFromNav = sessionStorage.getItem("pending_chat_message");
					if (pendingFromNav) {
						setPendingMessage(pendingFromNav);
						sessionStorage.removeItem("pending_chat_message");
					}
				} catch (e) {
					console.debug("no pending message in sessionStorage", e);
				}
			}

			if (initialChatId) {
				await loadChatMessages(initialChatId);
			} else {
				loadTempMessages();
			}
			setHasInitialized(true);
		};
		initializeChat();
	}, [initialChatId, loadChatMessages, loadTempMessages, hasInitialized]);

	// Execute pending message after redirect - FIXED VERSION
	useEffect(() => {
		const executePendingMessage = async () => {
			// More strict conditions to prevent race conditions
			if (
				!pendingMessage ||
				!chatId ||
				!hasInitialized ||
				isProcessingPendingMessage.current ||
				isLoadingChat ||
				status === "streaming"
			) {
				return;
			}

			console.debug("executePendingMessage start", {
				pendingMessage,
				chatId,
				isLoadingChat,
				status,
				messagesLength: messages.length,
			});

			// Check if message already exists - IMPROVED LOGIC
			const pendingTrim = pendingMessage.trim();
			const alreadyExists = messages.some(
				(m) =>
					m.role === "user" &&
					m.parts.some(
						(p) => p.type === "text" && p.text.trim() === pendingTrim
					)
			);

			if (alreadyExists) {
				console.debug("Message already exists, clearing pending message");
				setPendingMessage(null);
				setInput("");
				return;
			}

			isProcessingPendingMessage.current = true;

			try {
				console.debug("Sending pending message:", pendingMessage);
				await sendMessage({ text: pendingMessage });

				// Clear pending message and input on success
				setPendingMessage(null);
				setInput("");

				console.debug("Pending message sent successfully");
			} catch (error) {
				console.error("Failed to send pending message:", error);
				toast.error("Failed to send message. Please try again.");
				setPendingMessage(null);
			} finally {
				isProcessingPendingMessage.current = false;
			}
		};

		// Only execute if we have all required conditions
		if (pendingMessage && chatId && hasInitialized && !isLoadingChat) {
			// Add a small delay to ensure everything is ready
			const timeoutId = setTimeout(executePendingMessage, 200);
			return () => clearTimeout(timeoutId);
		}
	}, [
		pendingMessage,
		chatId,
		hasInitialized,
		isLoadingChat,
		status,
		sendMessage,
		messages,
	]);

	// Save temp messages
	useEffect(() => {
		if (!user?.id && !chatId && messages.length > 0 && hasInitialized) {
			try {
				localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
			} catch (error) {
				console.error("Failed to save temp messages:", error);
			}
		}
	}, [messages, user?.id, chatId, hasInitialized]);

	// Create new chat
	const createNewChat = async (): Promise<string | null> => {
		if (!user?.id) return null;
		setIsCreatingNewChat(true);
		try {
			const result = await actions.createChat({ activeUserId: user.id });
			if (result.data?.success) {
				const chat = result.data.message as Chat;
				return chat.id;
			}
			return null;
		} catch (error) {
			console.error("Failed to create chat:", error);
			toast.error("Failed to create new chat");
			return null;
		} finally {
			setIsCreatingNewChat(false);
		}
	};

	// Handle form submission - IMPROVED VERSION
	const handleSubmit = async (
		message: { text?: string },
		event: React.FormEvent<HTMLFormElement>
	) => {
		event.preventDefault();
		if (!message.text?.trim() || status === "streaming" || isCreatingNewChat)
			return;

		// Creating a new chat - FIXED FLOW
		if (!chatId && user?.id && messages.length === 0) {
			console.log("Creating new chat for authenticated user");

			try {
				// Store message in sessionStorage FIRST
				sessionStorage.setItem("pending_chat_message", message.text);

				// Create the chat
				const newChatId = await createNewChat();

				if (newChatId) {
					// Navigate with the message in sessionStorage
					// The new component will pick it up during initialization
					navigate(`/chat/${newChatId}`);
				} else {
					// Cleanup on failure
					sessionStorage.removeItem("pending_chat_message");
					toast.error("Failed to create chat");
				}
			} catch (error) {
				console.error("Failed to handle new chat creation:", error);
				sessionStorage.removeItem("pending_chat_message");
				toast.error("Failed to create chat");
			}
		} else {
			// Normal message sending
			try {
				await sendMessage({ text: message.text });
				setInput("");
			} catch (error) {
				console.error("Failed to send message:", error);
				toast.error("Failed to send message. Please try again.");
			}
		}
	};

	// Save user message to db
	useEffect(() => {
		const saveUserMessage = async () => {
			if (!chatId || !user?.id || messages.length === 0 || !hasInitialized)
				return;

			const lastMessage = messages[messages.length - 1];
			if (lastMessage?.role === "user") {
				try {
					await actions.insertChatMsg({
						chat_id: chatId,
						role: "user",
						content: lastMessage.parts
							.map((part) => (part.type === "text" ? part.text : ""))
							.join(""),
						message_id: lastMessage.id,
					});
				} catch (error) {
					console.error("Failed to save user message:", error);
				}
			}
		};
		saveUserMessage();
	}, [messages.length, chatId, user?.id, hasInitialized]);

	const isLoading =
		!hasInitialized ||
		isLoadingChat ||
		status === "streaming" ||
		isCreatingNewChat ||
		(!!pendingMessage && !!chatId); // Only show loading if we have both pending message AND chatId

	const shouldShowWelcome =
		hasInitialized &&
		messages.length === 0 &&
		!pendingMessage &&
		!isLoadingChat;

	return (
		<div className="flex flex-col max-w-4xl w-full">
			{/* Chat Messages */}
			<Conversation className="overflow-hidden p-4 space-y-4">
				{!hasInitialized && (
					<div className="text-center text-muted-foreground mt-10">
						<div className="max-w-md mx-auto">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
							<p className="mt-2 text-sm">Loading chat...</p>
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

				{hasInitialized && (
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

						{/* Show pending message if it hasn't been added to messages yet */}
						{pendingMessage &&
							!messages.some(
								(m) =>
									m.role === "user" &&
									m.parts.some(
										(p) =>
											p.type === "text" &&
											p.text.trim() === pendingMessage.trim()
									)
							) && (
								<Message from="user">
									<MessageContent>
										<div>{pendingMessage}</div>
									</MessageContent>
								</Message>
							)}

						{/* Loading states */}
						{(status === "streaming" ||
							isCreatingNewChat ||
							(pendingMessage && chatId)) && (
							<Message from="assistant" className="mr-12">
								<MessageContent className="bg-background border rounded-lg p-4 shadow-sm">
									{isCreatingNewChat
										? "Creating new chat..."
										: pendingMessage && chatId
										? "Processing your message..."
										: "Searching WCAG guidelines..."}
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
						</PromptInputTools>
						<PromptInputSubmit
							disabled={!input.trim() || isLoading}
							status={status}
						/>
					</PromptInputToolbar>
				</PromptInput>

				{shouldShowWelcome && (
					<div className="flex gap-2 flex-wrap justify-center mt-3 animate-in fade-in duration-500 delay-150">
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
		</div>
	);
}
