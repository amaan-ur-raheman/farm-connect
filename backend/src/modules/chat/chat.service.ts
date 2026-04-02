import { prisma } from "@/config/database";
import { NotFoundError, ForbiddenError } from "@/shared/errors";
import { io } from "@/server";
import type { CreateConversationInput, SendMessageInput } from "./chat.schema";

export const getOrCreateConversation = async (
	userId: string,
	input: CreateConversationInput,
) => {
	const { participant_id, contract_id } = input;

	if (userId === participant_id)
		throw new ForbiddenError("Cannot create conversation with yourself");

	const existing = await prisma.conversation.findFirst({
		where: {
			OR: [
				{
					participant_one_id: userId,
					participant_two_id: participant_id,
				},
				{
					participant_one_id: participant_id,
					participant_two_id: userId,
				},
			],
		},
		include: {
			participant_one: {
				select: { id: true, name: true, avatar_url: true },
			},
			participant_two: {
				select: { id: true, name: true, avatar_url: true },
			},
		},
	});

	if (existing) return existing;

	return prisma.conversation.create({
		data: {
			participant_one_id: userId,
			participant_two_id: participant_id,
			contract_id,
		},
		include: {
			participant_one: {
				select: { id: true, name: true, avatar_url: true },
			},
			participant_two: {
				select: { id: true, name: true, avatar_url: true },
			},
		},
	});
};

export const getUserConversations = async (userId: string) => {
	return prisma.conversation.findMany({
		where: {
			OR: [
				{ participant_one_id: userId },
				{ participant_two_id: userId },
			],
		},
		include: {
			participant_one: {
				select: { id: true, name: true, avatar_url: true },
			},
			participant_two: {
				select: { id: true, name: true, avatar_url: true },
			},
			messages: {
				orderBy: { created_at: "desc" },
				take: 1,
				select: {
					id: true,
					text: true,
					sender_id: true,
					created_at: true,
					read: true,
				},
			},
		},
		orderBy: { last_message_at: { sort: "desc", nulls: "last" } },
	});
};

export const getConversationMessages = async (
	conversationId: string,
	userId: string,
	since?: string,
	limit = 50,
) => {
	const conversation = await prisma.conversation.findUnique({
		where: { id: conversationId },
	});
	if (!conversation) throw new NotFoundError("Conversation");
	if (
		conversation.participant_one_id !== userId &&
		conversation.participant_two_id !== userId
	) {
		throw new ForbiddenError("Not your conversation");
	}

	const where: Record<string, unknown> = { conversation_id: conversationId };
	if (since) {
		where.created_at = { gt: new Date(since) };
	}

	const messages = await prisma.message.findMany({
		where,
		include: {
			sender: { select: { id: true, name: true, avatar_url: true } },
		},
		orderBy: { created_at: "asc" },
		take: limit,
	});

	await prisma.message.updateMany({
		where: {
			conversation_id: conversationId,
			sender_id: { not: userId },
			read: false,
		},
		data: { read: true },
	});

	return messages;
};

export const sendMessage = async (
	conversationId: string,
	senderId: string,
	input: SendMessageInput,
) => {
	const conversation = await prisma.conversation.findUnique({
		where: { id: conversationId },
	});
	if (!conversation) throw new NotFoundError("Conversation");
	if (
		conversation.participant_one_id !== senderId &&
		conversation.participant_two_id !== senderId
	) {
		throw new ForbiddenError("Not your conversation");
	}

	const [message] = await prisma.$transaction([
		prisma.message.create({
			data: {
				conversation_id: conversationId,
				sender_id: senderId,
				text: input.text,
				media_url: input.media_url,
			},
			include: {
				sender: { select: { id: true, name: true, avatar_url: true } },
			},
		}),
		prisma.conversation.update({
			where: { id: conversationId },
			data: {
				last_message: input.text ?? "📎 Media",
				last_message_at: new Date(),
			},
		}),
	]);

	io.to(conversation.participant_one_id)
		.to(conversation.participant_two_id)
		.emit("new_message", message);

	return message;
};

export const getUnreadMessageCount = async (userId: string) => {
	return prisma.message.count({
		where: {
			conversation: {
				OR: [
					{ participant_one_id: userId },
					{ participant_two_id: userId },
				],
			},
			sender_id: { not: userId },
			read: false,
		},
	});
};
