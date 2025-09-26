import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { userStore } from "@/stores/userStore";
import { actions } from "astro:actions";
import { navigate } from "astro:transitions/client";
import { toast } from "sonner";
import { useLoadingState } from "@/hooks/useLoadingState";
import { ChatLoadingSkeleton } from "@/components/chat-ui/chat-skeleton";
import ChatDashboard from "./ChatDashboard";

const LOCAL_STORAGE_KEY = "temp-chat";

export default function ChatAuthedView() {
	const user = useStore(userStore);
	const [shouldShowDashboard, setShouldShowDashboard] = useState(false);
	const loadingState = useLoadingState("initializing");

	const loadMessagesFromLocalStorage = () => {
		try {
			const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
			return stored ? JSON.parse(stored) : [];
		} catch (error) {
			console.warn("Failed to load messages from localStorage:", error);
			return [];
		}
	};

	const migrateTempChat = async () => {
		const tempMessages = loadMessagesFromLocalStorage();
		if (tempMessages.length === 0) return null;

		return await loadingState.withTransition("loading_chat", async () => {
			const convertedMessages = tempMessages.map((msg: any) => ({
				content: msg.parts?.map((part: any) => part.text).join("") || "",
				role: msg.role,
				createdAt: msg.createdAt
					? new Date(String(msg.createdAt)).toISOString()
					: new Date().toISOString(),
				message_id: msg.id,
			}));

			const result = await actions.migrateChat({
				messages: convertedMessages,
			});

			if (result.data?.success) {
				localStorage.removeItem(LOCAL_STORAGE_KEY);
				return result.data.message;
			} else {
				toast.error("Failed to save chat to your account");
				throw new Error("Migration failed");
			}
		});
	};

	useEffect(() => {
		const initialize = async () => {
			if (!user?.id) {
				// User not authenticated, show dashboard
				setShouldShowDashboard(true);
				loadingState.setReady();
				return;
			}

			// Check for localStorage migration
			const tempMessages = loadMessagesFromLocalStorage();
			if (tempMessages.length > 0) {
				try {
					const newChatId = await migrateTempChat();
					if (newChatId) {
						navigate(`/chat/${newChatId}`);
						return;
					}
				} catch (error) {
					console.error("Migration failed:", error);
				}
			}

			// No migration needed, show dashboard
			setShouldShowDashboard(true);
			loadingState.setReady();
		};

		initialize();
	}, [user?.id, loadingState]);

	if (!loadingState.isReady) {
		return (
			<div className="flex flex-col max-w-4xl w-full">
				{loadingState.current === "initializing" && <ChatLoadingSkeleton />}
				{loadingState.current === "loading_chat" && (
					<div className="text-center text-muted-foreground mt-10">
						<div className="max-w-md mx-auto">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
							<p className="mt-2 text-sm">Saving chat to your account...</p>
						</div>
					</div>
				)}
			</div>
		);
	}

	return shouldShowDashboard ? <ChatDashboard /> : null;
}
