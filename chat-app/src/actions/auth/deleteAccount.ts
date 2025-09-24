import { defineAction, type ActionAPIContext } from "astro:actions";
import { supabasePrivateClient } from "../../lib/supabase";
import { z } from "astro:schema";

const deleteUserAccount = async (
	{ activeUserId }: { activeUserId: string },
	context: ActionAPIContext
) => {
	try {
		// Create server client for this request
		const supabaseBE = supabasePrivateClient({
			request: context.request,
			cookies: context.cookies,
		});

		const { error } = await supabaseBE.auth.admin.deleteUser(activeUserId);

		if (error) {
			console.error("User account deletion error", error);
			return {
				success: false,
				message: "Could not delete user account, please try again.",
			};
		} else {
			console.log("User account deletion success");
			return {
				success: true,
				message: "User account deleted successfully.",
			};
		}
	} catch (error) {
		console.error(
			error instanceof Error ? error.message : "User account deletion error"
		);
		return {
			success: false,
			message: "Unexpected error, please try again.",
		};
	}
};

export const deleteAccount = defineAction({
	input: z.object({
		activeUserId: z.string(),
	}),
	handler: async (input, context) => {
		const { activeUserId } = input;
		return deleteUserAccount({ activeUserId }, context);
	},
});
