import { useEffect, useState } from "react";
import { ChatLoadingSkeleton } from "@/components/chat-ui/chat-skeleton";
import ChatUI from "./chatUI";
import { type Database } from "../../../database.types";

type Chat = Database["public"]["Tables"]["chats"]["Row"];

interface ChatDetailViewProps {
	chatId: string;
}

export default function ChatDetailView({ chatId }: ChatDetailViewProps) {
	const [initialPendingMessage, setInitialPendingMessage] = useState<
		string | null
	>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const initialize = () => {
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

			setIsLoading(false);
		};

		initialize();
	}, []);

	return (
		<div className="flex flex-col max-w-4xl w-full">
			{isLoading ? (
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
