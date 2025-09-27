import * as React from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

type ConfirmDialogProps = {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	title: string;
	description?: React.ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: "destructive" | "default";
	// onConfirm may be async
	onConfirm: () => Promise<void> | void;
};

export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = "Delete",
	cancelLabel = "Cancel",
	variant = "destructive",
	onConfirm,
}: ConfirmDialogProps) {
	const [loading, setLoading] = React.useState(false);

	const handleConfirm = async () => {
		try {
			setLoading(true);
			await onConfirm();
			// close after successful confirm
			onOpenChange?.(false);
		} catch (err) {
			// let caller handle errors (they can show toasts)
			console.error("ConfirmDialog onConfirm error", err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<AlertDialog open={!!open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					{description && (
						<AlertDialogDescription>{description}</AlertDialogDescription>
					)}
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>
						{cancelLabel}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						disabled={loading}
						className={buttonVariants({
							variant: variant === "destructive" ? "destructive" : "default",
						})}
					>
						{loading ? "Working…" : confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default ConfirmDialog;
