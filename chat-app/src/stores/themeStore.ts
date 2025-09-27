import { onMount } from "nanostores";
import { persistentAtom } from "@nanostores/persistent";

export const THEME_MAP = {
	light: "light",
	dark: "dark",
	system: "system",
} as const;

export type Theme = keyof typeof THEME_MAP;

// Persistent store that automatically saves to localStorage
export const themeStore = persistentAtom<Theme>("theme", "system");

// Function to apply theme to DOM
function applyTheme(theme: Theme) {
	const isDark =
		theme === "dark" ||
		(theme === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches);
	document.documentElement.classList[isDark ? "add" : "remove"]("dark");
}

// Function to handle system preference changes
function setupSystemListener() {
	///mediaquery
	const mq = window.matchMedia("(prefers-color-scheme: dark)");
	const handler = () => {
		if (themeStore.get() === "system") {
			applyTheme("system");
		}
	};
	mq.addEventListener("change", handler);
	return () => mq.removeEventListener("change", handler);
}

// Helper function to change theme
export function setTheme(theme: Theme) {
	themeStore.set(theme);
}

// Auto-initialize when store is mounted (browser only)
if (typeof window !== "undefined") {
	onMount(themeStore, () => {
		// Apply initial theme
		applyTheme(themeStore.get());

		// Setup system preference listener
		const cleanup = setupSystemListener();

		// Listen to store changes and apply them
		const unsubscribe = themeStore.listen((theme) => {
			applyTheme(theme);
			// Re-setup system listener when switching to/from system
			if (theme === "system") {
				setupSystemListener();
			}
		});

		// Handle route transitions in Astro
		const handleRouteChange = () => {
			setTimeout(() => {
				applyTheme(themeStore.get());
				setupSystemListener();
			}, 10);
		};

		document.addEventListener("astro:after-swap", handleRouteChange);

		// Cleanup function
		return () => {
			cleanup?.();
			unsubscribe();
			document.removeEventListener("astro:after-swap", handleRouteChange);
		};
	});
}
