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
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
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

type Chat = Database["public"]["Tables"]["chats"]["Row"];
type Theme = "light" | "dark" | "system";

export function AppSidebar() {
	const user = useStore(userStore);

	const [chats, setChats] = React.useState<Chat[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [openSettings, setOpenSettings] = React.useState(false);
	const [confirmDelete, setConfirmDelete] = React.useState(false);

	const [theme, setThemeState] = React.useState<Theme>(
		(localStorage.getItem("theme") as Theme) || "system"
	);

	// Apply theme and save to localStorage whenever theme changes
	React.useEffect(() => {
		const applyTheme = () => {
			let isDark = false;

			if (theme === "dark") {
				isDark = true;
			} else if (theme === "light") {
				isDark = false;
			} else if (theme === "system") {
				isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
			}

			document.documentElement.classList[isDark ? "add" : "remove"]("dark");
		};

		applyTheme();

		// Save theme preference to localStorage
		localStorage.setItem("theme", theme);

		// Only listen to OS theme changes if user chose "system"
		if (theme === "system") {
			const mq = window.matchMedia("(prefers-color-scheme: dark)");
			const handler = () => applyTheme();
			mq.addEventListener("change", handler);
			return () => mq.removeEventListener("change", handler);
		}
	}, [theme]);

	const handleDeleteAccount = async () => {
		if (!user?.id) {
			return;
		}

		try {
			const res = await actions.deleteAccount({
				activeUserId: user.id,
			});

			if (res.data?.success) {
				toast.success("Account deleted successfully");
				clearUser();
				navigate("/");
			} else {
				toast.error(
					res.data?.message ?? "Failed to delete account, please try again"
				);
			}
		} catch (error) {
			console.error("Error deleting account:", error);
			toast.error("An error occurred, please try again");
			setConfirmDelete(false);
		}
	};

	// Delete all handler
	const handleDeleteAllChats = async () => {
		const res = await actions.deleteChats();

		if (!res.data?.success) {
			toast.error(res.data?.message);
		} else {
			toast.success("Chats deleted successfully");
		}
	};

	React.useEffect(() => {
		const fetchChats = async () => {
			try {
				if (!user?.id) {
					toast.error("Oops, please try again");
				}
				const res = await actions.readChats({ activeUserId: user!.id });

				if (res.data?.message) {
					setChats(res.data.message as Chat[]); // message contains your DB rows
				}
			} catch (err) {
				console.error("Error fetching chats:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchChats();
	}, []);

	return (
		<Sidebar>
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
					<Button className="cursor-pointer m-6">
						<Plus />
						New Chat
					</Button>
					{chats.length === 0 ? (
						<SidebarMenuItem className="m-6">No chats yet</SidebarMenuItem>
					) : (
						<Button
							className="cursor-pointer m-6"
							variant="destructive"
							onClick={handleDeleteAllChats}
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
										<DropdownMenuItem onClick={() => setThemeState("light")}>
											<Sun className="mr-2 h-4 w-4" /> Light
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => setThemeState("dark")}>
											<Moon className="mr-2 h-4 w-4" /> Dark
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => setThemeState("system")}>
											<Laptop className="mr-2 h-4 w-4" /> System
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Confirm Delete Alert */}
			<AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Account</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete your account and all associated data.
							Are you absolutely sure?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteAccount}
							className={buttonVariants({ variant: "destructive" })}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<SidebarRail />
		</Sidebar>
	);
}
