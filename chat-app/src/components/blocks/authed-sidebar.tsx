"use client";
import * as React from "react";
import {
	SidebarProvider,
	SidebarInset,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

type Props = {
	children: React.ReactNode;
};

export function AuthedSidebar({ children }: Props) {
	return (
		<SidebarProvider>
			<div className="flex">
				<AppSidebar />
				<div className="flex-1 flex flex-col">
					<div className="sticky top-0 z-10">
						<SidebarTrigger />
					</div>
					<div className="p-4">{children}</div>
				</div>
			</div>
		</SidebarProvider>
	);
}
