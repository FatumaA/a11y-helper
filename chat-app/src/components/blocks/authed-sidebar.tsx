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
		<SidebarProvider className="flex">
			<AppSidebar />

			<div className="flex-1 flex flex-col">
				<div className="fixed top-16 z-10">
					<SidebarTrigger />
				</div>
				<div className="flex justify-center items-center min-h-screen">
					{children}
				</div>
			</div>
		</SidebarProvider>
	);
}
