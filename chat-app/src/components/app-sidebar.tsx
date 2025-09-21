import * as React from "react";
import {
	GalleryVerticalEnd,
	Laptop,
	MessageSquare,
	Moon,
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
import { useTheme } from "next-themes";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

// Local type for chat row from Supabase
interface Chat {
	id: string;
	title: string; // adjust depending on your schema
	created_at: string;
	user_id: string;
}

export function AppSidebar() {
	const [chats, setChats] = React.useState<Chat[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [openSettings, setOpenSettings] = React.useState(false);
	const [confirmDelete, setConfirmDelete] = React.useState(false);
	const { setTheme } = useTheme();

	const userEmail = "user@example.com";

	const handleDeleteAccount = async () => {
		console.log("Deleting account...");
		setConfirmDelete(false);
	};

	React.useEffect(() => {
		const fetchChats = async () => {
			try {
				const res = await actions.readChats();

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
						<div className="p-6 text-sm text-muted-foreground">
							Loading chats…
						</div>
					)}

					{!loading && chats.length === 0 && (
						<div className="p-6 text-sm text-muted-foreground">
							No chats yet
						</div>
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
							<p className="text-sm text-muted-foreground">{userEmail}</p>
						</div>

						<Button
							variant="destructive"
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
											Theme
											<Sun className="h-4 w-4 dark:hidden" />
											<Moon className="h-4 w-4 hidden dark:block" />
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
