import { defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { supabaseServerClient } from "@/lib/supabase";

const deleteAllChats = async (context: ActionAPIContext) => {
	try {
		const supabaseBE = supabaseServerClient({
			request: context.request,
			cookies: context.cookies,
		});
		const { error, data } = await supabaseBE.from("chats").select("*");

		if (error) {
			console.error("Failed to fetch chats for deletion", error.message);
			return {
				success: false,
				message: "Failed to delete chats, please try again",
			};
		}

		// Delete all chats
		const { status, statusText } = await supabaseBE
			.from("chats")
			.delete()
			.in(
				"id",
				data.map((chat) => chat.id)
			);

		if (status !== 204) {
			console.error("Failed to delete all chats", statusText);
			return {
				success: false,
				message: "Failed to delete chats, please try again",
			};
		}

		return {
			success: true,
			message: "Chats deleted successfully",
		};
	} catch (error) {
		console.error(
			error instanceof Error ? error.message : "MigrateChat action error"
		);
		return {
			success: false,
			message: "Unexpected error, please try again",
		};
	}
};

export const deleteChats = defineAction({
	handler: async (_, context) => {
		return deleteAllChats(context);
	},
});
