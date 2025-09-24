import { magicAuth } from "./auth/magicAuth";
import { signOut } from "./auth/signOut";
import { generateResponse } from "./chat/generateLLMResponse";
import { readChats } from "./chats/CRUD/readChat";
import { migrateChat } from "./chats/migrateChat";
import { insertChatMsg } from "./chatMsgs/insertChatMsg";
import { createChat } from "./chats/CRUD/createChat";
import { updateChatMsg } from "./chatMsgs/updateChatMsg";
import { deleteChat } from "./chats/CRUD/deleteChat";
import { readChatMsgs } from "./chatMsgs/readChatMsgs";
import { updateChat } from "./chats/CRUD/updateChat";
import { getChat } from "./chats/getChat";
import { deleteAccount } from "./auth/deleteAccount";
import { deleteChats } from "./chats/CRUD/deleteChats";

export const server = {
	generateResponse,
	// auth
	deleteAccount,
	magicAuth,
	signOut,
	// chats
	migrateChat,
	getChat,
	createChat,
	readChats,
	updateChat,
	deleteChat,
	deleteChats,
	// chat messages
	insertChatMsg,
	readChatMsgs,
	updateChatMsg,
};
