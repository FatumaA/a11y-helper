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

interface Chat {
	id: string;
	title: string;
	created_at: string;
	user_id: string;
}

export function NavMain({ items }: { items: Chat[] }) {
	const { isMobile } = useSidebar();

	return (
		<SidebarGroup>
			<SidebarMenu>
				{items.map((item) => (
					<DropdownMenu key={item.id}>
						<SidebarMenuItem>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
									{item.title} <MoreHorizontal className="ml-auto" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								side={isMobile ? "bottom" : "right"}
								align={isMobile ? "end" : "start"}
								className="min-w-40 rounded-lg"
							>
								<DropdownMenuItem asChild>
									<button
										className="w-full text-left"
										onClick={() => {
											/* handle rename logic here */
										}}
									>
										Rename
									</button>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<button
										className="w-full text-left text-red-600"
										onClick={() => {
											/* handle delete logic here */
										}}
									>
										Delete
									</button>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</SidebarMenuItem>
					</DropdownMenu>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
