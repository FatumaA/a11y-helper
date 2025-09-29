import { type Database } from "../../database.types";

export type Chat = Database["public"]["Tables"]["chats"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];
