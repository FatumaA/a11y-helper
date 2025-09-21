import { defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { supabaseServerClient } from "@/lib/supabase";

const updateChat = async (
	activeChatMsgId: string,
	newMsgContent: string,
	context: ActionAPIContext
) => {
	try {
		const supabaseBE = supabaseServerClient({
			request: context.request,
			cookies: context.cookies,
		});

		if (!activeChatMsgId) {
			console.error("No active chat message ID provided");
			return { success: false, message: "No chat message data provided" };
		}

		// Update chat message
		const { data: chatMsg, error: chatMsgError } = await supabaseBE
			.from("chat_messages")
			.update({
				message_content: newMsgContent,
			})
			.eq("id", activeChatMsgId)
			.select();

		if (chatMsgError || !chatMsg) {
			console.error("Failed to update chat msg", chatMsgError);
			return { success: false, message: "Failed to update chat msg" };
		}

		return {
			success: true,
			message: "Chat msg updated successfully",
		};
	} catch (error) {
		return {
			success: false,
			message: "Unexpected error",
		};
	}
};

export const updateChatMsg = defineAction({
	input: z.object({
		activeChatMsgId: z.string(),
		newMsgContent: z.string(),
	}),
	handler: async (input, context) => {
		const { activeChatMsgId, newMsgContent } = input;
		return updateChat(activeChatMsgId, newMsgContent, context);
	},
});
