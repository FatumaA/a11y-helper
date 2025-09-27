import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	DialogClose,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { navigate } from "astro:transitions/client";
import * as React from "react";

type ActionDialogProps = {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	title?: string;
	description?: React.ReactNode;
	messageCount?: number;
	cancelLabel?: string;
	actionLabel?: string;
	actionVariant?:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "ghost"
		| "link";
	onAction?: () => any | Promise<any>;
	authRedirect?: boolean;
	actionDisabled?: boolean;
};

export function ActionDialog({
	open,
	onOpenChange,
	title = "Save Your Chat History",
	description,
	messageCount,
	cancelLabel = "Cancel",
	actionLabel = "Sign Up",
	actionVariant = "default",
	onAction,
	authRedirect = true,
	actionDisabled = false,
}: ActionDialogProps) {
	const defaultDescription = messageCount
		? `You have ${messageCount} message${
				messageCount !== 1 ? "s" : ""
		  } in your current chat. Sign up to save your conversation history and continue where you left off.`
		: "Sign up to save your conversation history and continue where you left off.";

	const handleAction = async () => {
		if (onAction) {
			try {
				await onAction();
			} catch (e) {
				// swallow here; caller can show its own error (toast). Don't close
				// the dialog prematurely if the action throws — still call onOpenChange
				// below to keep existing behavior consistent.
			}
		} else if (authRedirect) {
			navigate("/auth", { state: { actionType: "sign-up" } });
		}
		onOpenChange?.(false);
	};

	const handleCancel = () => {
		onOpenChange?.(false);
	};

	return (
		<Dialog open={!!open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>
						{description || defaultDescription}
					</DialogDescription>
				</DialogHeader>

				<DialogFooter>
					<DialogClose asChild>
						<button
							onClick={handleCancel}
							className={buttonVariants({ variant: "outline" })}
						>
							{cancelLabel}
						</button>
					</DialogClose>
					<button
						onClick={handleAction}
						disabled={!!actionDisabled}
						aria-disabled={!!actionDisabled}
						className={buttonVariants({
							variant: actionVariant,
						})}
					>
						{actionLabel}
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default ActionDialog;
