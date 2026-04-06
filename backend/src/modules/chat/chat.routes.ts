import { Router } from "express";
import { authenticate } from "@/shared/middleware/auth";
import { asyncHandler } from "@/shared/middleware/handlers";
import { validate } from "@/shared/middleware/validate";
import { sanitizeFields } from "@/shared/middleware/sanitize";
import { createConversationSchema, sendMessageSchema } from "./chat.schema";
import {
	getOrCreateConversation,
	getUserConversations,
	getConversationById,
	getConversationMessages,
	sendMessage,
	getUnreadMessageCount,
} from "./chat.service";

export const chatRouter = Router();

chatRouter.get(
	"/conversations",
	authenticate,
	asyncHandler(async (req, res) => {
		const conversations = await getUserConversations(req.user!.userId);
		res.json({ success: true, data: conversations });
	}),
);

chatRouter.post(
	"/conversations",
	authenticate,
	validate(createConversationSchema),
	asyncHandler(async (req, res) => {
		const conversation = await getOrCreateConversation(
			req.user!.userId,
			req.body,
		);
		res.status(201).json({ success: true, data: conversation });
	}),
);

chatRouter.get(
	"/conversations/:id",
	authenticate,
	asyncHandler(async (req, res) => {
		const conversation = await getConversationById(
			req.params.id as string,
			req.user!.userId,
		);
		res.json({ success: true, data: conversation });
	}),
);

chatRouter.get(
	"/conversations/:id/messages",
	authenticate,
	asyncHandler(async (req, res) => {
		const since = req.query.since as string | undefined;
		const limit = parseInt(req.query.limit as string) || 50;
		const messages = await getConversationMessages(
			req.params.id as string,
			req.user!.userId,
			since,
			limit,
		);
		res.json({ success: true, data: messages });
	}),
);

chatRouter.post(
	"/conversations/:id/messages",
	authenticate,
	sanitizeFields("text"),
	validate(sendMessageSchema),
	asyncHandler(async (req, res) => {
		const message = await sendMessage(
			req.params.id as string,
			req.user!.userId,
			req.body,
		);
		res.status(201).json({ success: true, data: message });
	}),
);

chatRouter.get(
	"/unread-count",
	authenticate,
	asyncHandler(async (req, res) => {
		const count = await getUnreadMessageCount(req.user!.userId);
		res.json({ success: true, data: { count } });
	}),
);
