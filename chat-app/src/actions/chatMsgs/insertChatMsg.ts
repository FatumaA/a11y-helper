import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { supabaseServerClient } from "../../lib/supabase";

type InsertMsgInput = {
	chat_id: string;
	role: "user" | "assistant";
	content: string;
	message_id: string;
};

const insertMsg = async (
	{ chat_id, role, content, message_id }: InsertMsgInput,
	context: any
) => {
	const supabaseBE = supabaseServerClient({
		request: context.request,
		cookies: context.cookies,
	});
	const { error } = await supabaseBE.from("chat_messages").insert({
		chat_id,
		message_content: content,
		role,
		message_id,
	});
	return { success: !error };
};

export const insertChatMsg = defineAction({
	input: z.object({
		chat_id: z.string(),
		role: z.enum(["user", "assistant"]),
		content: z.string(),
		message_id: z.string(),
	}),
	handler: async (input, context) => {
		return insertMsg(input, context);
	},
});
