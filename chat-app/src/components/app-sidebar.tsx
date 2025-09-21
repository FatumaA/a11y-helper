import * as React from "react";
import { GalleryVerticalEnd, MessageSquare } from "lucide-react";

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

			<SidebarFooter>
				<div className="p-2 text-xs text-muted-foreground">
					{new Date().getFullYear()} © WCAG Explained
				</div>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
