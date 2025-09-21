import { defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { supabaseServerClient } from "@/lib/supabase";

const deleteDBChat = async (
	activeChatId: string,
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

		// Delete chat
		const { data: chat, error: chatError } = await supabaseBE
			.from("chats")
			.delete()
			.eq("id", activeChatId)
			.select();

		if (chatError || !chat) {
			console.error("Failed to delete chat", chatError);
			return {
				success: false,
				message: "Failed to delete chat, please try again",
			};
		}

		return {
			success: true,
			message: "Chat delete successfully",
		};
	} catch (error) {
		return {
			success: false,
			message: "Unexpected error, please try again",
		};
	}
};

export const deleteChat = defineAction({
	input: z.object({
		activeChatId: z.string(),
	}),
	handler: async (input, context) => {
		const { activeChatId } = input;
		return deleteDBChat(activeChatId, context);
	},
});
