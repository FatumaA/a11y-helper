import { Skeleton } from "../ui/skeleton";

function ChatMessageSkeleton() {
	return (
		<div className="space-y-3">
			<div className="flex items-start space-x-3">
				<Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-4 w-[250px]" />
					<Skeleton className="h-4 w-[200px]" />
					<Skeleton className="h-4 w-[180px]" />
				</div>
			</div>
		</div>
	);
}

export function ChatLoadingSkeleton() {
	return (
		<div className="space-y-6 animate-in fade-in duration-300">
			<ChatMessageSkeleton />
			<ChatMessageSkeleton />
			<ChatMessageSkeleton />
		</div>
	);
}
