import { defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { supabaseServerClient } from "@/lib/supabase";

const updateDBChat = async (
	activeChatId: string,
	newTitle: string,
	context: ActionAPIContext
) => {
	try {
		const supabaseBE = supabaseServerClient({
			request: context.request,
			cookies: context.cookies,
		});

		if (!activeChatId) {
			console.error("No active chat ID provided");
			return { success: false, message: "No chat data provided" };
		}

		// Update chat title
		const { data: chat, error: chatError } = await supabaseBE
			.from("chats")
			.update({
				title: newTitle,
			})
			.eq("id", activeChatId)
			.select();

		if (chatError || !chat) {
			console.error("Failed to update chat", chatError);
			return { success: false, message: "Failed to update chat" };
		}

		return {
			success: true,
			message: "Chat updated successfully",
		};
	} catch (error) {
		console.error(
			error instanceof Error ? error.message : "MigrateChat action error"
		);
		return {
			success: false,
			message: "Unexpected error",
		};
	}
};

export const updateChat = defineAction({
	input: z.object({
		activeChatId: z.string(),
		newTitle: z.string(),
	}),
	handler: async (input, context) => {
		const { activeChatId, newTitle } = input;
		return updateDBChat(activeChatId, newTitle, context);
	},
});
