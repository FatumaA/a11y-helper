import { magicAuth } from "./auth/magicAuth";
import { signOut } from "./auth/signOut";
import { generateResponse } from "./chat/generateLLMResponse";

export const server = {
	generateResponse,
	magicAuth,
	signOut,
};
