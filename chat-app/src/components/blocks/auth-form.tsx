import { cn } from "@/lib/utils";
import { supabaseBrowserClient } from "@/lib/supabase";
import { Turnstile } from "@marsidev/react-turnstile";
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
import { actions } from "astro:actions";
import { toast } from "sonner";

export function AuthForm({
	className,
	...props
}: React.ComponentPropsWithoutRef<"div">) {
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isMagicLoading, setIsMagicLoading] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const [actionType, setActionType] = useState<string>("sign-in");
	const [captchaToken, setCaptchaToken] = useState<string | undefined>();

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

		if (!captchaToken) {
			toast.error("Please complete the captcha verification.");
			return;
		}

		setIsMagicLoading(true);

		const formData = new FormData();
		formData.append("email", email);
		formData.append("captchaToken", captchaToken);

		try {
			const { data } = await actions.magicAuth(formData);
			if (data?.success) {
				toast.success(data.message as string);
			} else {
				toast.error("Sign in error, please try again.");
				setIsMagicLoading(false);
			}
		} catch (error: unknown) {
			toast.error("An error occurred, please try again.");
			setIsMagicLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		setIsGoogleLoading(true);
		setError(null);

		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: window.location.origin + "/api/auth/confirm",
				},
			});
			if (error) {
				toast.error("Google sign in error, please try again.");
				setIsGoogleLoading(false);
			}
		} catch (error: unknown) {
			toast.error("An error occurred, please try again.");
			setIsGoogleLoading(false);
		}
	};

	const isSignUp = actionType === "sign-up";

	return (
		<div
			className={cn(
				"flex flex-col gap-6 max-w-3xl mx-auto mt-38 w-full",
				className
			)}
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
							<Turnstile
								siteKey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY_LOCAL}
								onSuccess={(token) => setCaptchaToken(token)}
								onError={() => {
									setCaptchaToken(undefined);
									toast.error("Captcha verification failed. Please try again.");
								}}
								onExpire={() => setCaptchaToken(undefined)}
							/>
							<Button
								type="submit"
								className="w-full"
								disabled={isMagicLoading || !captchaToken}
							>
								{isMagicLoading ? "Sending..." : "Send Link"}
							</Button>
						</div>
					</form>
					<div className="relative flex items-center my-4">
						<span className="flex-grow border-t" />
						<span className="mx-2 text-xs text-muted-foreground">or</span>
						<span className="flex-grow border-t" />
					</div>
					<Button
						type="button"
						className="w-full"
						variant="outline"
						disabled={isGoogleLoading}
						onClick={handleGoogleLogin}
					>
						{isGoogleLoading ? "Redirecting..." : "Continue with Google"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
