import {
	createBrowserClient,
	createServerClient,
	parseCookieHeader,
} from "@supabase/ssr";
import type { AstroCookies } from "astro";

const supabaseURL: string = import.meta.env.PUBLIC_SUPABASE_URL;

const supabaseAnonKey: string = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export function supabaseServerClient({
	request,
	cookies,
}: {
	request: Request;
	cookies: AstroCookies;
}) {
	const cookieHeader = request.headers.get("Cookie") || "";
	const parsedCookies = parseCookieHeader(cookieHeader);

	return createServerClient(supabaseURL, supabaseAnonKey, {
		cookies: {
			getAll() {
				return parsedCookies.map(({ name, value }) => ({
					name,
					value: value ?? "",
				}));
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) =>
					cookies.set(name, value, options)
				);
			},
		},
	});
}

export const supabaseBrowserClient = createBrowserClient(
	supabaseURL,
	supabaseAnonKey
);
