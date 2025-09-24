import { supabaseServerClient } from "@/lib/supabase";
import { defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { type Database } from "../../../database.types";

type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

type ReadChatMsgsResult = {
	success: boolean;
	message: ChatMessage[] | string;
};

// read all chat msgs in a particular chat
const readMsgs = async (
	activeChatId: string,
	context: ActionAPIContext
): Promise<ReadChatMsgsResult> => {
	try {
		const supabaseBE = supabaseServerClient({
			request: context.request,
			cookies: context.cookies,
		});

		const { data, error } = await supabaseBE
			.from("chat_messages")
			.select("*")
			.eq("chat_id", activeChatId)
			.order("created_at", { ascending: true });

		if (error) {
			console.log("ERROR READING FROM CHAT MSGS TABLE:", error);
			return {
				success: false,
				message: "Error reading from chat msgs table",
			};
		} else {
			console.log("READ CHAT MSGS", data);
			return {
				success: true,
				message: data as ChatMessage[],
			};
		}
	} catch (error) {
		console.log("READ CHAT MSGS ERROR:", error);
		return {
			success: false,
			message: "Error reading from chat msgs table",
		};
	}
};

export const readChatMsgs = defineAction({
	input: z.object({
		activeChatId: z.string(),
	}),
	handler: async (input, context) => {
		const { activeChatId } = input;
		return readMsgs(activeChatId, context);
	},
});
