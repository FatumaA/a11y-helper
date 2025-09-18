import { defineAction } from "astro:actions";
import { supabaseServerClient } from "../../lib/supabase";
import type { ActionAPIContext } from "astro:actions";

const authSignOut = async (context: ActionAPIContext) => {
	try {
		// Create server client for this request
		const supabaseBE = supabaseServerClient({
			request: context.request,
			cookies: context.cookies,
		});

		const { error } = await supabaseBE.auth.signOut();

		if (error) {
			console.error("Supabase Sign out error - ", error);
			return {
				success: false,
				message: "Sign out error, please try again.",
			};
		} else {
			// The server client will handle cookie removal automatically
			// through the cookies.setAll method in supabaseServerClient
			console.log("Sign out success");
			return {
				success: true,
				message: "Signed out successfully",
			};
		}
	} catch (error) {
		console.error(
			error instanceof Error ? error.message : "Unexpected sign out error"
		);
		return {
			success: false,
			message: "Unexpected error",
		};
	}
};

export const signOut = defineAction({
	handler: async (_, context) => authSignOut(context),
});
