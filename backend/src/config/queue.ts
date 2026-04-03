import { Queue, ConnectionOptions } from "bullmq";
import { env } from "@/config/env";

export const redisConnection: ConnectionOptions = {
	host: env.redis.host,
	port: env.redis.port,
	password: env.redis.password,
	username: env.redis.username,
};

export const escrowQueue = new Queue("escrow-release", {
	connection: redisConnection,
	defaultJobOptions: {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 1000,
		},
		removeOnComplete: true,
	},
});
