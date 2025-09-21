import { supabaseServerClient } from "@/lib/supabase";
import { defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";

// get all chats
const readDBChats = async (activeUserId: string, context: ActionAPIContext) => {
	try {
		const supabaseBE = supabaseServerClient({
			request: context.request,
			cookies: context.cookies,
		});

		const { data, error } = await supabaseBE
			.from("chats")
			.select("*")
			.eq("user_id", activeUserId)
			.order("created_at", { ascending: false });

		if (error) {
			console.log("ERROR READING FROM CHAT TABLE:", error);
			return {
				success: false,
				message: "Error reading from chat table",
			};
		} else {
			console.log("READ CHATS", data);
			return {
				success: true,
				message: data,
			};
		}
	} catch (error) {
		console.log("READ CHATS ERROR:", error);
		return {
			success: false,
			message: "Error reading from chat table",
		};
	}
};

export const readChats = defineAction({
	input: z.object({
		activeUserId: z.string(),
	}),
	handler: async (input, context) => {
		const { activeUserId } = input;
		return readDBChats(activeUserId, context);
	},
});
