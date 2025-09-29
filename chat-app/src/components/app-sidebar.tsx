import * as React from "react";
import {
	GalleryVerticalEnd,
	Laptop,
	MessageSquare,
	Moon,
	Plus,
	Settings,
	Sun,
} from "lucide-react";

import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarFooter,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
	SidebarRail,
} from "@/components/ui/sidebar";
import { actions } from "astro:actions";
import { NavMain } from "./nav-main";
import { Button, buttonVariants } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { type Database } from "../../database.types";
import { toast } from "sonner";
import { clearUser, userStore } from "@/stores/userStore";
import { useStore } from "@nanostores/react";
import { navigate } from "astro:transitions/client";
import { ConfirmAlert } from "./blocks/confirm-alert";
import { themeStore, setTheme, type Theme } from "@/stores/themeStore";

type Chat = Database["public"]["Tables"]["chats"]["Row"];

declare global {
	interface Window {
		setThemeProgrammatically?: (theme: string) => void;
	}
}

export function AppSidebar() {
	const user = useStore(userStore);
	const theme = useStore(themeStore);

	const [chats, setChats] = React.useState<Chat[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [openSettings, setOpenSettings] = React.useState(false);
	const [confirmDelete, setConfirmDelete] = React.useState(false);
	const [confirmDeleteAll, setConfirmDeleteAll] = React.useState(false);

	React.useEffect(() => {
		const fetchChats = async () => {
			try {
				if (!user?.id) {
					toast.error("Oops, please try again");
				}
				const res = await actions.readChats({ activeUserId: user!.id });

				if (res.data?.message) {
					setChats(res.data.message as Chat[]);
				}
			} catch (err) {
				console.error("Error fetching chats:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchChats();
	}, []);

	// Delete all handler
	const handleDeleteAllChats = async () => {
		if (!user?.id) return;
		setLoading(true);
		try {
			const res = await actions.deleteChats({ activeUserId: user.id });
			if (!res.data?.success) {
				toast.error("Failed to delete chats");
			} else {
				// Update local UI immediately
				setChats([]);
				toast.success("Chats deleted successfully");
			}
		} catch (err) {
			console.error("deleteChats error", err);
			toast.error("An error occurred, please try again");
		} finally {
			setLoading(false);
		}
	};

	const handleAddChat = async () => {
		const res = await actions.createChat({ activeUserId: user!.id });

		if (!res.data?.success) {
			toast.error(res.data?.message as string);
		} else {
			const newChat = res.data.message as Chat;
			navigate(`/chat/${newChat.id}`);
		}
	};

	return (
		<Sidebar className="mt-16">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<div className="flex items-center gap-2 px-2 py-3 select-none cursor-default">
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg pointer-none">
								<GalleryVerticalEnd className="size-4" />
							</div>
							<div className="flex flex-col gap-0.5 leading-none">
								<span className="font-medium">Previous chats</span>
							</div>
						</div>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				<SidebarMenu>
					{loading && (
						<div className="m-6 text-sm text-muted-foreground">
							Loading chats…
						</div>
					)}
					<Button className="cursor-pointer m-6" onClick={handleAddChat}>
						<Plus />
						New Chat
					</Button>
					{chats.length === 0 ? (
						<SidebarMenuItem className="m-6">No chats yet</SidebarMenuItem>
					) : (
						<Button
							className="cursor-pointer m-6"
							variant="destructive"
							onClick={() => setConfirmDeleteAll(true)}
						>
							Delete All Chats
						</Button>
					)}

					<NavMain items={chats} />
				</SidebarMenu>
			</SidebarContent>
			<SidebarFooter className="mb-4">
				<div className="flex flex-col w-full gap-12">
					<SidebarMenuButton
						className="cursor-pointer"
						onClick={() => setOpenSettings(true)}
					>
						<Settings className="mr-2 h-4 w-4" />
						Settings
					</SidebarMenuButton>

					<div className="text-xs text-muted-foreground px-2">
						{new Date().getFullYear()} © WCAG Explained
					</div>
				</div>
			</SidebarFooter>
			{/* Settings Dialog */}
			<Dialog open={openSettings} onOpenChange={setOpenSettings}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Settings</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<p className="text-sm font-medium">Email</p>
							<p className="text-sm text-muted-foreground">{user?.email}</p>
						</div>

						<Button
							className={buttonVariants({ variant: "destructive" })}
							onClick={() => setConfirmDelete(true)}
						>
							Delete Account
						</Button>
						{/* Theme toggle will go here later */}
						<div>
							<p className="text-sm font-medium mb-2">Theme</p>
							<div className="flex gap-2">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											className="w-full justify-between"
										>
											{theme}
											{theme === "light" && <Sun className="h-4 w-4" />}
											{theme === "dark" && <Moon className="h-4 w-4" />}
											{theme === "system" && <Laptop className="h-4 w-4" />}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-40">
										<DropdownMenuItem onClick={() => setTheme("light")}>
											<Sun className="mr-2 h-4 w-4" /> Light
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => setTheme("dark")}>
											<Moon className="mr-2 h-4 w-4" /> Dark
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => setTheme("system")}>
											<Laptop className="mr-2 h-4 w-4" /> System
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Confirm Delete All Chats */}
			<ConfirmAlert
				open={confirmDeleteAll}
				onOpenChange={setConfirmDeleteAll}
				description={
					<>
						Are you sure you want to delete{" "}
						<span className="font-medium">
							{"all your chats (" + chats.length + ")"}
						</span>
						? This action cannot be undone.
					</>
				}
				title="Delete All Chats"
				confirmLabel="Delete"
				variant="destructive"
				onConfirm={handleDeleteAllChats}
			/>

			<SidebarRail />
		</Sidebar>
	);
}
