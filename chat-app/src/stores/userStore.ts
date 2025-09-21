// src/stores/userStore.ts
import { atom } from "nanostores";

export interface User {
	id: string;
	email: string;
	fullName?: string;
	avatarUrl?: string;
}

export const userStore = atom<User | null>(null);
export const isLoadingStore = atom<boolean>(true);

// Helper functions
export function setUser(user: User | null) {
	console.log("Setting user in store:", user);
	userStore.set(user);
	isLoadingStore.set(false);
}

export function clearUser() {
	userStore.set(null);
	isLoadingStore.set(false);
}

// Initialize the store with server data (called from client-side)
export function initializeUserStore(userData: User | null) {
	console.log("Initializing user store:", userData);
	setUser(userData);
}

// Auto-initialize if window.initialUserData exists
if (
	typeof window !== "undefined" &&
	(window as any).initialUserData !== undefined
) {
	initializeUserStore((window as any).initialUserData);
}
