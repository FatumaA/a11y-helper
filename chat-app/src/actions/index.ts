import { magicAuth } from "./auth/magicAuth";
import { signOut } from "./auth/signOut";
import { generateResponse } from "./chat/generateLLMResponse";
import { migrateChat } from "./chatDB/migrateChat";
import { insertChatMsg } from "./chatMsgs/insertChatMsg";

export const server = {
	generateResponse,
	magicAuth,
	signOut,
	migrateChat,
	insertChatMsg,
};
