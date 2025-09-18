import { defineAction, type ActionAPIContext } from "astro:actions";
import { supabaseServerClient } from "../../lib/supabase";
import { z } from "astro:schema";

const domain =
	import.meta.env.MODE === "production"
		? "https://wcagexplained.com"
		: "http://localhost:4321";

const magicSignIn = async (
	// { email, captchaToken }: { email: string; captchaToken: string },
	{ email }: { email: string },
	context: ActionAPIContext
) => {
	try {
		// Create server client for this request
		const supabaseBE = supabaseServerClient({
			request: context.request,
			cookies: context.cookies,
		});

		const { error } = await supabaseBE.auth.signInWithOtp({
			email,
			options: {
				// captchaToken,
				emailRedirectTo: `${domain}/api/auth/confirm`,
			},
		});

		if (error) {
			console.error("Sign in error - magiclink", error);
			return {
				success: false,
				message: error.message,
			};
		} else {
			console.log("Sign in success - magiclink");
			return {
				success: true,
				message: "Check your email for the login link!",
			};
		}
	} catch (err) {
		console.error("SignIn action other error", err);
		return {
			success: false,
			message: "Unexpected error",
		};
	}
};

export const magicAuth = defineAction({
	accept: "form",
	input: z.object({
		email: z.string().email(),
		// captchaToken: z.string(),
	}),
	handler: async (input, context) => {
		return magicSignIn(input, context);
	},
});
