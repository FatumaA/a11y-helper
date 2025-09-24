import { defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { supabaseServerClient } from "../../lib/supabase";

export const migrateChat = defineAction({
	input: z.object({
		messages: z.array(
			z.object({
				content: z.string(),
				role: z.enum(["user", "assistant"]),
				createdAt: z.string(),
				message_id: z.string(),
			})
		),
	}),
	handler: async (input, context: ActionAPIContext) => {
		try {
			const supabaseBE = supabaseServerClient({
				request: context.request,
				cookies: context.cookies,
			});

			// Confirm user is authed
			const {
				data: { user },
				error: userError,
			} = await supabaseBE.auth.getUser();

			if (userError || !user) {
				console.error("Not authenticated", userError);
				return { success: false, message: "Not authenticated" };
			}

			const { count: chatCount } = await supabaseBE
				.from("chats")
				.select("id", { count: "exact" });

			const title = `Chat ${chatCount ? chatCount + 1 : 1}`;

			// Create new chat
			const { data: chat, error: chatError } = await supabaseBE
				.from("chats")
				.insert({
					user_id: user.id,
					title,
				})
				.select()
				.single();

			if (chatError || !chat) {
				console.error("Failed to create chat", chatError);
				return { success: false, message: "Failed to create chat" };
			}

			// Insert all messages
			const messagesWithChatId = input.messages.map((msg) => ({
				chat_id: chat.id,
				message_content: msg.content,
				role: msg.role,
				created_at: msg.createdAt,
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
	},
});
