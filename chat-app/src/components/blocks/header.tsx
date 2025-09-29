"use client";
import { actions } from "astro:actions";
import { navigate } from "astro:transitions/client";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useStore } from "@nanostores/react";
import { clearUser, userStore } from "@/stores/userStore";
import { Accessibility, Laptop, Moon, Sun } from "lucide-react";
import { setTheme, themeStore } from "@/stores/themeStore";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const enum AuthAction {
	SIGN_IN = "sign-in",
	SIGN_UP = "sign-up",
}

const Header = () => {
	const user = useStore(userStore);
	const theme = useStore(themeStore);

	const handleAuth = (actionType: AuthAction) => {
		const initialChat = sessionStorage.getItem("temp-chat");
		if (initialChat) {
			localStorage.setItem("temp-chat", initialChat);
			try {
				sessionStorage.removeItem("temp-chat");
			} catch (e) {
				console.warn("Failed to remove temp-chat from sessionStorage:", e);
			}
		}
		navigate("/auth", { state: { actionType } });
	};

	const handleSignOut = async () => {
		try {
			const { data } = await actions.signOut();
			if (data?.success) {
				toast.success(data.message);
				clearUser();
				navigate("/");
			}
		} catch (error: unknown) {
			toast.error("An error occurred, please try again.");
		}
	};

	const isSignedIn = user ? true : false;
	return (
		<div className="flex justify-between items-center h-16 mx-8 sticky top-0 z-100 border-b-2 border-b-accent">
			<a
				href="/"
				aria-label="Home"
				className="cursor-pointer bg-primary/10 p-2 rounded-full"
			>
				<Accessibility className="w-7 h-7 text-primary" />
			</a>
			<div className="flex items-center gap-4">
				{isSignedIn ? (
					<>
						<p>{user?.email}</p>
						<Button
							className="cursor-pointer"
							variant="outline"
							onClick={handleSignOut}
						>
							Sign Out
						</Button>
					</>
				) : (
					<>
						<Button
							className="cursor-pointer"
							onClick={() => handleAuth(AuthAction.SIGN_IN)}
						>
							Sign In
						</Button>
						<Button
							className="cursor-pointer"
							variant="outline"
							onClick={() => handleAuth(AuthAction.SIGN_UP)}
						>
							Sign Up
						</Button>
					</>
				)}

				{/* Theme dropdown - always visible */}
				<div className="w-fit">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" className="w-full justify-between">
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
	);
};

export default Header;
