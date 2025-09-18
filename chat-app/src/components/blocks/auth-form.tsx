import { cn } from "@/lib/utils";
import { supabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

export function AuthForm({
	className,
	...props
}: React.ComponentPropsWithoutRef<"div">) {
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [actionType, setActionType] = useState<string>("sign-in");

	useEffect(() => {
		// Read from browser history state
		const state = window.history.state;
		if (state && state.actionType) {
			setActionType(state.actionType);
		}
		console.log(state?.actionType, "ACTION TYPE", state);
	}, []);

	const supabase = supabaseBrowserClient;

	const handleMagicLinkLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const { error } = await supabase.auth.signInWithOtp({
				email,
			});
			if (error) throw error;
			setError("Check your email for the magic link!");
		} catch (error: unknown) {
			setError(error instanceof Error ? error.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
			});
			if (error) throw error;
			// Supabase will redirect automatically
		} catch (error: unknown) {
			setError(error instanceof Error ? error.message : "An error occurred");
			setIsLoading(false);
		}
	};

	const isSignUp = actionType === "sign-up";

	return (
		<div
			className={cn("flex flex-col gap-6 max-w-3xl mx-auto w-full", className)}
			{...props}
		>
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">
						{isSignUp ? "Sign Up" : "Sign In"}
					</CardTitle>
					<CardDescription>
						{isSignUp
							? "Create a new account"
							: "Continue to login to your account"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleMagicLinkLogin}>
						<div className="flex flex-col gap-6">
							<div className="grid gap-2">
								<Label htmlFor="email">
									{isSignUp ? "Email for Sign Up" : "Email for Sign In"}
								</Label>
								<Input
									id="email"
									type="email"
									placeholder="m@example.com"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
							</div>
							{error && <p className="text-sm text-red-500">{error}</p>}
							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading
									? isSignUp
										? "Sending..."
										: "Sending..."
									: isSignUp
									? "Send Sign Up Link"
									: "Send Sign In Link"}
							</Button>
							<div className="relative flex items-center my-4">
								<span className="flex-grow border-t" />
								<span className="mx-2 text-xs text-muted-foreground">or</span>
								<span className="flex-grow border-t" />
							</div>
							<Button
								type="button"
								className="w-full"
								variant="outline"
								disabled={isLoading}
								onClick={handleGoogleLogin}
							>
								{isSignUp
									? "Continue with Google (Sign Up)"
									: "Continue with Google"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
