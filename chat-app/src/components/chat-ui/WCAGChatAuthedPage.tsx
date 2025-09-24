// import { useEffect, useState } from "react";
// import { useStore } from "@nanostores/react";
// import { userStore } from "@/stores/userStore";
// import { actions } from "astro:actions";
// import { navigate } from "astro:transitions/client";
// import { toast } from "sonner";
// import { Loader } from "../ai-elements/loader";
// import ChatUI from "./chatUI";

// const LOCAL_STORAGE_KEY = "temp-chat";

// export default function MainChatPage() {
// 	const user = useStore(userStore);
// 	const [chatId, setChatId] = useState<string | null>(null);
// 	const [isInitializing, setIsInitializing] = useState(true);
// 	const [isMigrating, setIsMigrating] = useState(false);

// 	// Extract chat ID from current URL
// 	const getChatIdFromUrl = () => {
// 		try {
// 			const path = window.location.pathname || "";
// 			const match = path.match(/^\/chat\/([^\/\?#]+)/);
// 			return match ? match[1] : null;
// 		} catch (e) {
// 			return null;
// 		}
// 	};

// 	// Load messages from localStorage
// 	const loadMessagesFromLocalStorage = () => {
// 		try {
// 			const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
// 			return stored ? JSON.parse(stored) : [];
// 		} catch (error) {
// 			return [];
// 		}
// 	};

// 	// Convert and migrate temp chat
// 	const migrateTempChat = async () => {
// 		const tempMessages = loadMessagesFromLocalStorage();
// 		if (tempMessages.length === 0) return null;

// 		setIsMigrating(true);
// 		try {
// 			const convertedMessages = tempMessages.map((msg: any) => ({
// 				content: msg.parts?.map((part: any) => part.text).join("") || "",
// 				role: msg.role,
// 				createdAt: msg.createdAt
// 					? new Date(String(msg.createdAt)).toISOString()
// 					: new Date().toISOString(),
// 				message_id: msg.id,
// 			}));

// 			const result = await actions.migrateChat({ messages: convertedMessages });

// 			if (result.data?.success) {
// 				localStorage.removeItem(LOCAL_STORAGE_KEY);
// 				return result.data.message;
// 			} else {
// 				toast.error("Failed to save chat to your account");
// 				return null;
// 			}
// 		} catch (error) {
// 			toast.error("Failed to save chat to your account");
// 			return null;
// 		} finally {
// 			setIsMigrating(false);
// 		}
// 	};

// 	useEffect(() => {
// 		const initialize = async () => {
// 			const urlChatId = getChatIdFromUrl();

// 			if (urlChatId) {
// 				// Load existing chat
// 				setChatId(urlChatId);
// 			} else {
// 				// Check for temp chat migration
// 				const tempMessages = loadMessagesFromLocalStorage();
// 				if (tempMessages.length > 0 && user?.id) {
// 					const newChatId = await migrateTempChat();
// 					if (newChatId) {
// 						navigate(`/chat/${newChatId}`);
// 						return;
// 					}
// 				}
// 			}

// 			setIsInitializing(false);
// 		};

// 		initialize();
// 	}, [user?.id]);

// 	if (isInitializing || isMigrating) {
// 		return (
// 			<div className="flex flex-col max-w-4xl w-full">
// 				<div className="text-center text-muted-foreground mt-10">
// 					<div className="max-w-md mx-auto">
// 						<Loader />
// 						{isMigrating && (
// 							<p className="mt-2 text-sm">Saving chat to your account...</p>
// 						)}
// 					</div>
// 				</div>
// 			</div>
// 		);
// 	}

// 	return <ChatUI initialChatId={chatId} />;
// }

import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { userStore } from "@/stores/userStore";
import { actions } from "astro:actions";
import { navigate } from "astro:transitions/client";
import { toast } from "sonner";
import { Loader } from "../ai-elements/loader";
import ChatUI from "./chatUI";

const LOCAL_STORAGE_KEY = "temp-chat";

export default function MainChatPage() {
	const user = useStore(userStore);
	const [chatId, setChatId] = useState<string | null>(null);
	const [initialPendingMessage, setInitialPendingMessage] = useState<
		string | null
	>(null);
	const [isInitializing, setIsInitializing] = useState(true);
	const [isMigrating, setIsMigrating] = useState(false);

	const getChatIdFromUrl = () => {
		try {
			const path = window.location.pathname || "";
			const match = path.match(/^\/chat\/([^\/\?#]+)/);
			return match ? match[1] : null;
		} catch (e) {
			return null;
		}
	};

	const loadMessagesFromLocalStorage = () => {
		try {
			const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
			return stored ? JSON.parse(stored) : [];
		} catch (error) {
			return [];
		}
	};

	const migrateTempChat = async () => {
		const tempMessages = loadMessagesFromLocalStorage();
		if (tempMessages.length === 0) return null;

		setIsMigrating(true);
		try {
			const convertedMessages = tempMessages.map((msg: any) => ({
				content: msg.parts?.map((part: any) => part.text).join("") || "",
				role: msg.role,
				createdAt: msg.createdAt
					? new Date(String(msg.createdAt)).toISOString()
					: new Date().toISOString(),
				message_id: msg.id,
			}));

			const result = await actions.migrateChat({ messages: convertedMessages });

			if (result.data?.success) {
				localStorage.removeItem(LOCAL_STORAGE_KEY);
				return result.data.message;
			} else {
				toast.error("Failed to save chat to your account");
				return null;
			}
		} catch (error) {
			toast.error("Failed to save chat to your account");
			return null;
		} finally {
			setIsMigrating(false);
		}
	};

	useEffect(() => {
		const initialize = async () => {
			const urlChatId = getChatIdFromUrl();

			if (urlChatId) {
				setChatId(urlChatId);

				// ✅ pick up pending message from navigation state
				const navState = window.history.state as { pendingMessage?: string };
				if (navState?.pendingMessage) {
					setInitialPendingMessage(navState.pendingMessage);

					// Clear state so it doesn't repeat on refresh
					window.history.replaceState({}, "");
				}
			} else {
				const tempMessages = loadMessagesFromLocalStorage();
				if (tempMessages.length > 0 && user?.id) {
					const newChatId = await migrateTempChat();
					if (newChatId) {
						navigate(`/chat/${newChatId}`);
						return;
					}
				}
			}

			setIsInitializing(false);
		};

		initialize();
	}, [user?.id]);

	if (isInitializing || isMigrating) {
		return (
			<div className="flex flex-col max-w-4xl w-full">
				<div className="text-center text-muted-foreground mt-10">
					<div className="max-w-md mx-auto">
						<Loader />
						{isMigrating && (
							<p className="mt-2 text-sm">Saving chat to your account...</p>
						)}
					</div>
				</div>
			</div>
		);
	}

	return (
		<ChatUI
			initialChatId={chatId}
			initialPendingMessage={initialPendingMessage}
		/>
	);
}
