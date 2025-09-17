import React from "react";
import { Button } from "../ui/button";

const Header = () => {
	return (
		<div className="flex justify-between my-4 mx-8">
			<h1>Logo</h1>
			<div className="flex gap-4">
				<Button className="cursor-pointer">Sign In</Button>
				<Button className="cursor-pointer" variant="outline">
					Sign Up
				</Button>
			</div>
		</div>
	);
};

export default Header;
