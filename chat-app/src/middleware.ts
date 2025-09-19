import { defineMiddleware } from "astro:middleware";
import { supabaseServerClient } from "./lib/supabase";

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;

	// Create Supabase server client for this request
	const supabaseBE = supabaseServerClient({
		request: context.request,
		cookies: context.cookies,
	});

	// Get active user
	const {
		data: { user },
	} = await supabaseBE.auth.getUser();

	const isActiveUser = Boolean(user?.id && user?.email);

	// protect /chat and its subroutes from unauthed access
	if (pathname.startsWith("/chat")) {
		if (!isActiveUser) {
			return context.redirect("/");
		}
		return next();
	}

	// redirect authed users to chat from auth page
	if ((pathname === "/auth" || pathname === "/") && isActiveUser) {
		return context.redirect("/chat");
	}

	return next();
});
