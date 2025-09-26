import { useEffect, useState } from "react";
import { ChatLoadingSkeleton } from "@/components/chat-ui/chat-skeleton";
import ChatUI from "./chatUI";

export default function ChatDetailView() {
	const [chatId, setChatId] = useState<string | null>(null);
	const [initialPendingMessage, setInitialPendingMessage] = useState<
		string | null
	>(null);
	const [isLoading, setIsLoading] = useState(true);

	const getChatIdFromUrl = () => {
		try {
			const path = window.location.pathname || "";
			const match = path.match(/^\/chat\/([^\/\?#]+)/);
			return match ? match[1] : null;
		} catch (e) {
			return null;
		}
	};

	useEffect(() => {
		const initialize = () => {
			const urlChatId = getChatIdFromUrl();

			if (urlChatId) {
				setChatId(urlChatId);

				// Pick up pending message from URL parameters
				const urlParams = new URLSearchParams(window.location.search);
				const messageParam = urlParams.get("message");
				if (messageParam) {
					setInitialPendingMessage(decodeURIComponent(messageParam));
					// Clean up the URL by removing the parameter
					const cleanUrl = new URL(window.location.href);
					cleanUrl.searchParams.delete("message");
					window.history.replaceState({}, "", cleanUrl.pathname);
				}
			}

			setIsLoading(false);
		};

		initialize();
	}, []);

	return (
		<div className="flex flex-col max-w-4xl w-full">
			{isLoading || !chatId ? (
				<ChatLoadingSkeleton />
			) : (
				<ChatUI
					initialChatId={chatId}
					initialPendingMessage={initialPendingMessage}
				/>
			)}
		</div>
	);
}
