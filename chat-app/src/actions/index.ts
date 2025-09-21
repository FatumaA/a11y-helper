import { magicAuth } from "./auth/magicAuth";
import { signOut } from "./auth/signOut";
import { generateResponse } from "./chat/generateLLMResponse";
import { migrateChat } from "./chatDB/migrateChat";
import { insertChatMsg } from "./chatMsgs/insertChatMsg";
import { readChatMsgs } from "./chatMsgs/readChatMsgs";
import { deleteChat } from "./chats/CRUD/deleteChat";
import { readChats } from "./chats/CRUD/readChat";
import { getChat } from "./chats/getChat";

export const server = {
	generateResponse,
	magicAuth,
	signOut,
	migrateChat,
	insertChatMsg,
	getChat,
	readChatMsgs,
	readChats,
	deleteChat,
};
