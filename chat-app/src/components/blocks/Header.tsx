import React from "react";
import { Button } from "../ui/button";
import { navigate } from "astro/virtual-modules/transitions-router.js";

const enum AuthAction {
	SIGN_IN = "sign-in",
	SIGN_UP = "sign-up",
}

const Header = ({ user }) => {
	console.log("USERRRR", user);
	const handleAuth = (actionType: AuthAction) => {
		navigate("/auth", { state: { actionType } });
	};

	const handleSignOut = () => {};

	const isSignedIn = user ? true : false;
	return (
		<div className="flex justify-between my-4 mx-8">
			<h1>Logo</h1>

			{isSignedIn ? (
				<div className="flex items-center gap-4">
					<p>{user.email}</p>
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
