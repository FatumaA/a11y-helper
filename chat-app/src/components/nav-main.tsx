"use client";

import { MoreHorizontal } from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { navigate } from "astro:transitions/client";
import { actions } from "astro:actions";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import { ConfirmDialog } from "./blocks/confirm-dialog";
import { Button, buttonVariants } from "./ui/button";

import { type Database } from "../../database.types";

type Chat = Database["public"]["Tables"]["chats"]["Row"];

export function NavMain({ items }: { items: Chat[] }) {
	const { isMobile } = useSidebar();

	const [renameTarget, setRenameTarget] = useState<Chat | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Chat | null>(null);
	const [newTitle, setNewTitle] = useState("");

	// Rename handler
	const handleRename = async () => {
		if (!renameTarget) return;
		const res = await actions.updateChat({
			activeChatId: renameTarget.id,
			newTitle,
		});

		if (!res.data?.success) {
			toast.error(res.data?.message);
		} else {
			toast.success("Chat renamed successfully");
		}
		setRenameTarget(null);
		setNewTitle("");
	};

	// Delete handler
	const handleDeleteChat = async () => {
		if (!deleteTarget) return;
		const res = await actions.deleteChat({ activeChatId: deleteTarget.id });

		if (!res.data?.success) {
			toast.error(res.data?.message);
		} else {
			navigate("/chat");
			toast.success("Chat deleted successfully");
		}
		setDeleteTarget(null);
	};

	return (
		<>
			<SidebarGroup>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.id} className="flex items-center">
							<SidebarMenuButton
								className="flex-1 text-left"
								onClick={() => navigate(`/chat/${item.id}`)}
							>
								{item.title}
							</SidebarMenuButton>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										type="button"
										className="ml-2 p-1 rounded hover:bg-sidebar-accent"
										aria-label="More options"
									>
										<MoreHorizontal />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									side={isMobile ? "bottom" : "right"}
									align={isMobile ? "end" : "start"}
									className="flex flex-col gap-2 p-2"
								>
									<DropdownMenuItem asChild>
										<Button
											variant="ghost"
											onClick={() => {
												setRenameTarget(item);
												setNewTitle(item.title!);
											}}
										>
											Rename
										</Button>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Button
											variant="ghost"
											onClick={() => setDeleteTarget(item)}
										>
											Delete
										</Button>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroup>

			{/* Rename Dialog */}
			<Dialog open={!!renameTarget} onOpenChange={() => setRenameTarget(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Rename Chat</DialogTitle>
					</DialogHeader>
					<input
						className="w-full rounded border p-2"
						value={newTitle}
						onChange={(e) => setNewTitle(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleRename()}
						autoFocus
					/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setRenameTarget(null)}>
							Cancel
						</Button>
						<Button onClick={handleRename}>Rename</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation (reusable) */}
			<ConfirmDialog
				open={!!deleteTarget}
				onOpenChange={() => setDeleteTarget(null)}
				title="Delete Chat"
				description={
					<>
						Are you sure you want to delete{" "}
						<span className="font-medium">{deleteTarget?.title}</span>? This
						action cannot be undone.
					</>
				}
				confirmLabel="Delete"
				variant="destructive"
				onConfirm={handleDeleteChat}
			/>
		</>
	);
}
