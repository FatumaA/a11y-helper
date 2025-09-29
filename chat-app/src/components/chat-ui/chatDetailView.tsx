import { useEffect, useState } from "react";
import { ChatLoadingSkeleton } from "@/components/chat-ui/chat-skeleton";
import ChatUI from "./chatUI";

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
			// Pick up pending message from navigation state
			const navigationState = window.history.state;
			if (navigationState?.initialMessage) {
				setInitialPendingMessage(navigationState.initialMessage);
				// Clear the state to prevent reuse on refresh
				window.history.replaceState({}, "", window.location.pathname);
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
