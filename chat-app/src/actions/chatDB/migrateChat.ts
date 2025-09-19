import { defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { supabaseServerClient } from "../../lib/supabase";

const migrate1stChat = async (
	{
		messages,
	}: {
		messages: Array<{
			content: string;
			role: "user" | "assistant";
			timestamp: string;
			message_id: string;
		}>;
	},
	context: ActionAPIContext
) => {
	try {
		const supabaseBE = supabaseServerClient({
			request: context.request,
			cookies: context.cookies,
		});

		console.log("Migrating chat with messages:", messages);
		// Confirm user is authed
		const {
			data: { user },
			error: userError,
		} = await supabaseBE.auth.getUser();

		if (userError || !user) {
			console.error("Not authenticated", userError);
			return { success: false, message: "Not authenticated" };
		}

		// Create new chat
		const { data: chat, error: chatError } = await supabaseBE
			.from("chats")
			.insert({
				user_id: user.id,
				title: "untitled",
			})
			.select()
			.single();

		if (chatError || !chat) {
			console.error("Failed to create chat", chatError);
			return { success: false, message: "Failed to create chat" };
		}

		// Insert all messages
		const messagesWithChatId = messages.map((msg) => ({
			chat_id: chat.id,
			message_content: msg.content,
			role: msg.role,
			created_at: msg.timestamp,
			message_id: msg.message_id,
		}));

		const { error: messagesError } = await supabaseBE
			.from("chat_messages")
			.insert(messagesWithChatId);

		if (messagesError) {
			console.error("Failed to insert messages", messagesError);
			return { success: false, message: "Failed to insert messages" };
		}

		return {
			success: true,
			message: chat.id,
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

export const migrateChat = defineAction({
	input: z.object({
		messages: z.array(
			z.object({
				content: z.string(),
				role: z.enum(["user", "assistant"]),
				timestamp: z.string(),
				message_id: z.string(),
			})
		),
	}),
	handler: async (input, context) => {
		return migrate1stChat(input, context);
	},
});
