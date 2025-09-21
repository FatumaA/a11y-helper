import { actions } from "astro:actions";
import { navigate } from "astro:transitions/client";
import { type User } from "@supabase/supabase-js";
import { Button } from "../ui/button";
import { toast } from "sonner";

const enum AuthAction {
	SIGN_IN = "sign-in",
	SIGN_UP = "sign-up",
}

const Header = ({ user }: { user: User | null }) => {
	const handleAuth = (actionType: AuthAction) => {
		navigate("/auth", { state: { actionType } });
	};

	const handleSignOut = async () => {
		try {
			const { data } = await actions.signOut();
			if (data?.success) {
				toast.success(data.message);
			}
		} catch (error: unknown) {
			toast.error("An error occurred, please try again.");
		}
	};

	const isSignedIn = user ? true : false;
	return (
		<div className="flex justify-between my-4 mx-8 sticky top-0 z-10">
			<h1>Logo</h1>
			{isSignedIn ? (
				<div className="flex items-center gap-4">
					<p>{user?.email}</p>
					<Button
						className="cursor-pointer"
						variant="outline"
						onClick={handleSignOut}
					>
						Sign Out
					</Button>
				</div>
			) : (
				<div className="flex items-center gap-4">
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
				</div>
			)}
		</div>
	);
};

export default Header;
