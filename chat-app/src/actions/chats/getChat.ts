import { supabaseServerClient } from "@/lib/supabase";
import type { Chat } from "@/lib/types";
import { defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";

type GetChatResult = {
	success: boolean;
	message: Chat | string;
};

const getChatById = async (
	chatId: string,
	context: ActionAPIContext
): Promise<GetChatResult> => {
	try {
		const supabaseBE = supabaseServerClient({
			request: context.request,
			cookies: context.cookies,
		});

		const { error, data } = await supabaseBE
			.from("chats")
			.select("*")
			.eq("id", chatId)
			.single();

		if (error) {
			console.log("ERROR FINDING CHAT:", error);
			return {
				success: false,
				message: "Error getting from chat table",
			};
		} else {
			console.log("GET CHAT BY ID", data);
			return {
				success: true,
				message: data,
			};
		}
	} catch (error) {
		console.log("READ CHATS ERROR:", error);
		return {
			success: false,
			message: "Error getting from chat table",
		};
	}
};

export const getChat = defineAction({
	input: z.object({ chatId: z.string() }),
	handler: async (input, context) => {
		const { chatId } = input;
		return getChatById(chatId, context);
	},
});
