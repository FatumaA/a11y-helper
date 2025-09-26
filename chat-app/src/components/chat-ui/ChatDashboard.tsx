import { useState } from "react";
import { useStore } from "@nanostores/react";
import { userStore } from "@/stores/userStore";
import { actions } from "astro:actions";
import { navigate } from "astro:transitions/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Zap } from "lucide-react";

const SUGGESTIONS = [
	"How do I make buttons accessible?",
	"Color contrast requirements",
	"WCAG 2.1.1 keyboard navigation",
	"Screen reader best practices",
	"Form accessibility guidelines",
	"Focus management techniques",
];

export default function ChatDashboard() {
	const user = useStore(userStore);
	const [isCreating, setIsCreating] = useState(false);

	const handleNewChat = async () => {
		if (!user?.id) {
			toast.error("Please sign in to start a chat");
			return;
		}

		setIsCreating(true);
		try {
			const result = await actions.createChat({ activeUserId: user.id });
			if (result.data?.success) {
				const chat = result.data.message as any;
				navigate(`/chat/${chat.id}`);
			} else {
				toast.error("Failed to create new chat");
			}
		} catch (error) {
			console.error("Failed to create chat:", error);
			toast.error("Failed to create new chat");
		} finally {
			setIsCreating(false);
		}
	};

	const handleSuggestionClick = async (suggestion: string) => {
		if (!user?.id) {
			toast.error("Please sign in to start a chat");
			return;
		}

		setIsCreating(true);
		try {
			// Create the chat
			const result = await actions.createChat({ activeUserId: user.id });
			if (result.data?.success) {
				const chat = result.data.message as any;
				// Navigate with the suggestion as a URL parameter
				navigate(`/chat/${chat.id}?message=${encodeURIComponent(suggestion)}`);
			} else {
				toast.error("Failed to create new chat");
			}
		} catch (error) {
			console.error("Failed to create chat:", error);
			toast.error("Failed to create new chat");
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-[80vh] max-w-4xl mx-auto px-6">
			<div className="text-center mb-8">
				<div className="flex items-center justify-center mb-4">
					<div className="bg-primary/10 p-3 rounded-full">
						<MessageSquare className="h-8 w-8 text-primary" />
					</div>
				</div>
				<h1 className="text-3xl font-bold mb-2 text-foreground">
					WCAG Accessibility Assistant
				</h1>
				<p className="text-lg text-muted-foreground max-w-2xl">
					Get expert on web accessibility guidelines, implementation best
					practices, and code examples.
				</p>
				guidance
			</div>

			<div className="mb-8">
				<Button
					onClick={handleNewChat}
					disabled={isCreating}
					size="lg"
					className="text-lg px-8 py-6 h-auto"
				>
					<Plus className="mr-2 h-5 w-5" />
					{isCreating ? "Creating..." : "Start New Conversation"}
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
					{SUGGESTIONS.map((suggestion) => (
						<Button
							key={suggestion}
							variant="outline"
							onClick={() => handleSuggestionClick(suggestion)}
							disabled={isCreating}
							className="text-left justify-start h-auto py-4 px-4 hover:bg-muted/50 transition-colors"
						>
							<MessageSquare className="h-4 w-4 mr-3 flex-shrink-0 text-muted-foreground" />
							<span className="text-sm">{suggestion}</span>
						</Button>
					))}
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
