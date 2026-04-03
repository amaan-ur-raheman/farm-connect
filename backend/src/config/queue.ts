import { Queue, ConnectionOptions } from "bullmq";
import { env } from "@/config/env";

export const redisConnection: ConnectionOptions = {
	host: env.redis.host,
	port: env.redis.port,
	password: env.redis.password,
	username: env.redis.username,
	// Upstash and most cloud providers require TLS. 
	// We enable it if we're not on localhost.
	tls: env.redis.host !== "localhost" && env.redis.host !== "127.0.0.1" ? {} : undefined,
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
