import { defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { supabaseServerClient } from "@/lib/supabase";
import { type Database } from "../../../../database.types";

type Chat = Database["public"]["Tables"]["chats"]["Row"];

const createDBChat = async (
	activeUserId: string,
	context: ActionAPIContext
) => {
	try {
		const supabaseBE = supabaseServerClient({
			request: context.request,
			cookies: context.cookies,
		});

		if (!activeUserId) {
			console.error("Not authenticated");
			return { success: false, message: "Not authenticated" };
		}

		// request count explicitly
		const { count: chatCount } = await supabaseBE
			.from("chats")
			.select("id", { count: "exact" });

		const title = `Chat ${chatCount ? chatCount + 1 : 1}`;
		// Create new chat
		const {
			data: chat,
			error: chatError,
		}: { data: Chat | null; error: Error | null } = await supabaseBE
			.from("chats")
			.insert({
				user_id: activeUserId,
				title,
			})
			.select()
			.single();

		if (chatError || !chat) {
			console.error("Failed to create chat", chatError);
			return { success: false, message: "Failed to create chat" };
		}

		return {
			success: true,
			message: chat as Chat,
		};
	} catch (error) {
		return {
			success: false,
			message: "Unexpected error",
		};
	}
};

export const createChat = defineAction({
	input: z.object({
		activeUserId: z.string(),
	}),
	handler: async (input, context) => {
		const { activeUserId } = input;
		return createDBChat(activeUserId, context);
	},
});
