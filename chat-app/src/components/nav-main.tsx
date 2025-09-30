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
import { ActionDialog } from "./blocks/action-dialog";
import { useState, useEffect } from "react";
import { ConfirmAlert } from "./blocks/confirm-alert";
import { Button, buttonVariants } from "./ui/button";
import type { Chat } from "@/lib/types";

export function NavMain({ items }: { items: Chat[] }) {
	const { isMobile } = useSidebar();
	const currentPath = window.location.pathname;

	const [renameTarget, setRenameTarget] = useState<Chat | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Chat | null>(null);
	const [newTitle, setNewTitle] = useState("");

	// Keep a local copy of items so we can update the UI immediately after
	// renaming without requiring a full page refresh. Sync when parent prop
	// changes.
	const [localItems, setLocalItems] = useState<Chat[]>(items);
	useEffect(() => setLocalItems(items), [items]);

	// Rename handler — returns true when the rename succeeded
	const handleRename = async () => {
		if (!renameTarget) return false;
		const trimmed = newTitle.trim();
		if (!trimmed) {
			toast.error("Title cannot be empty");
			return false;
		}
		const res = await actions.updateChat({
			activeChatId: renameTarget.id,
			newTitle: trimmed,
		});

		if (!res.data?.success) {
			toast.error(res.data?.message as string);
			return false;
		} else {
			// Update local list so UI updates immediately without refresh
			setNewTitle("");
			setLocalItems((prev) =>
				prev.map((c) =>
					c.id === renameTarget.id ? { ...c, title: trimmed } : c
				)
			);
			toast.success("Chat renamed successfully");
			return true;
		}
	};

	// Delete handler
	const handleDeleteChat = async () => {
		if (!deleteTarget) return;
		const res = await actions.deleteChat({ activeChatId: deleteTarget.id });

		if (!res.data?.success) {
			toast.error(res.data?.message as string);
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
					{localItems.map((item) => (
						<SidebarMenuItem key={item.id} className="flex items-center">
							<SidebarMenuButton
								className="flex-1 text-left"
								onClick={() => navigate(`/chat/${item.id}`)}
								isActive={currentPath === `/chat/${item.id}`}
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
			<ActionDialog
				open={!!renameTarget}
				onOpenChange={(open) => !open && setRenameTarget(null)}
				title="Rename Chat"
				description={
					<input
						className="w-full rounded border p-2"
						value={newTitle}
						onChange={(e) => setNewTitle(e.target.value)}
						onKeyDown={async (e) => {
							if (e.key === "Enter") {
								const ok = await handleRename();
								if (ok) setRenameTarget(null);
							}
						}}
						autoFocus
					/>
				}
				actionLabel="Rename"
				onAction={handleRename}
				actionDisabled={!newTitle.trim()}
				authRedirect={false}
			/>

			{/* Delete Confirmation (reusable) */}
			<ConfirmAlert
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
