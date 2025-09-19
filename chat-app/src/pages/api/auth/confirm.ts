import type { APIRoute } from "astro";
import { supabaseServerClient } from "../../../lib/supabase";

export const GET: APIRoute = async ({ url, cookies, redirect, request }) => {
	const code = url.searchParams.get("code") as string;

	// Create server-side Supabase client using the new approach
	const supabaseBE = supabaseServerClient({
		request,
		cookies,
	});

	if (!code) {
		return new Response("No code provided", { status: 400 });
	}

	const { data, error } = await supabaseBE.auth.exchangeCodeForSession(code);

	if (error) {
		console.error("error at confirm.ts", error);
		return new Response(error.message, { status: 500 });
	}

	console.log("user data at confirm.ts", data);

	// No need to manually set cookies as they are now handled by the createBEClient
	// The cookie management is now handled by the Supabase SSR client

	return redirect("/chat");
};
