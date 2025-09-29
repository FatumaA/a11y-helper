import { useState } from "react";
import { useStore } from "@nanostores/react";
import { userStore } from "@/stores/userStore";
import { actions } from "astro:actions";
import { navigate } from "astro:transitions/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Zap } from "lucide-react";

const SUGGESTIONS = [
	"Color contrast requirements",
	"Screen reader best practices",
	"Form accessibility guidelines",
	"Focus management techniques",
];

export default function ChatDashboard() {
	const user = useStore(userStore);
	const [isCreatingNew, setIsCreatingNew] = useState(false);
	const [creatingSuggestion, setCreatingSuggestion] = useState<string | null>(null);

	const handleNewChat = async () => {
		if (!user?.id) {
			toast.error("Please sign in to start a chat");
			return;
		}

		setIsCreatingNew(true);
		try {
			const result = await actions.createChat({ activeUserId: user.id });
			if (result.data?.success) {
				const chat = result.data.message as any;
				return navigate(`/chat/${chat.id}`);
			} else {
				toast.error("Failed to create new chat");
				setIsCreatingNew(false);
			}
		} catch (error) {
			console.error("Failed to create chat:", error);
			toast.error("Failed to create new chat");
			setIsCreatingNew(false);
		}
	};

	const handleSuggestionClick = async (suggestion: string) => {
		if (!user?.id) {
			toast.error("Please sign in to start a chat");
			return;
		}

		setCreatingSuggestion(suggestion);
		try {
			// Create the chat
			const result = await actions.createChat({ activeUserId: user.id });
			if (result.data?.success) {
				const chat = result.data.message as any;
				// Navigate with the suggestion via navigation state
				return navigate(`/chat/${chat.id}`, {
					state: { initialMessage: suggestion },
				});
			} else {
				toast.error("Failed to create new chat");
				setCreatingSuggestion(null);
			}
		} catch (error) {
			console.error("Failed to create chat:", error);
			toast.error("Failed to create new chat");
			setCreatingSuggestion(null);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-[80vh] max-w-4xl mx-auto px-6">
			<div className="text-center mb-8">
				<h1 className="text-3xl font-bold mb-2 text-foreground">
					WCAG Accessibility Assistant
				</h1>
				<p className="text-lg text-muted-foreground max-w-2xl">
					Ask anything about web accessibility guidelines!
				</p>
			</div>

			<div className="mb-8">
				<Button
					onClick={handleNewChat}
					disabled={isCreatingNew}
					size="lg"
					className="text-lg px-4 py-3 h-auto"
				>
					<Plus className="mr-2 h-4 w-4" />
					{isCreatingNew ? "Creating..." : "Start New Conversation"}
				</Button>
			</div>

			<div className="w-full max-w-3xl">
				<div className="flex items-center mb-4">
					<Zap className="h-4 w-4 text-primary mr-2" />
					<h2 className="text-sm font-medium text-muted-foreground">
						Quick Start Topics
					</h2>
				</div>

				<div className="grid gap-3 md:grid-cols-2">
					{SUGGESTIONS.map((suggestion, index) => {
						const isCreating = creatingSuggestion === suggestion;
						return (
							<Button
								key={index}
								variant="outline"
								onClick={() => handleSuggestionClick(suggestion)}
								disabled={isCreating}
								className="text-left justify-start h-auto py-4 px-4 hover:bg-muted/50 transition-colors"
							>
								<MessageSquare className="h-4 w-4 mr-3 flex-shrink-0 text-muted-foreground" />
								<span className="text-sm">
									{isCreating ? "Creating..." : suggestion}
								</span>
							</Button>
						);
					})}
				</div>
			</div>

			<div className="mt-12 text-center">
				<p className="text-xs text-muted-foreground">
					Your conversations are automatically saved and can be accessed from
					the sidebar
				</p>
			</div>
		</div>
	);
}
