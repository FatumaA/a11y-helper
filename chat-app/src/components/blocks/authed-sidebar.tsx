import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

interface SidebarLayoutProps {
	children: React.ReactNode;
}

export function AuthedSidebar({ children }: SidebarLayoutProps) {
	return (
		<SidebarProvider>
			<div className="flex min-h-screen mt-38 max-w-5xl mx-auto">
				<AppSidebar />
				<main>{children}</main>
			</div>
		</SidebarProvider>
	);
}
