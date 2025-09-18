import { magicAuth } from "./auth/magicAuth";
import { generateResponse } from "./chat/generateLLMResponse";

export const server = {
	generateResponse,
	magicAuth,
};
