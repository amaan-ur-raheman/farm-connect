import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/database";
import { getRefreshToken } from "./config/redis";

const httpServer = http.createServer(app);

export const io = new Server(httpServer, {
	cors: {
		origin: env.corsOrigin,
		credentials: true,
	},
});

// Authenticate WebSocket connections via JWT with token revocation check
io.use(async (socket, next) => {
	const token = socket.handshake.auth?.token as string | undefined;
	if (!token) {
		return next(new Error("Unauthorized"));
	}
	try {
		const payload = jwt.verify(token, env.jwt.secret) as { userId: string };

		// Check if token is revoked (user logged out)
		const storedToken = await getRefreshToken(payload.userId);
		if (!storedToken) {
			return next(new Error("Token revoked"));
		}

		socket.data.userId = payload.userId;
		next();
	} catch {
		next(new Error("Unauthorized"));
	}
});

io.on("connection", (socket) => {
	socket.join(socket.data.userId);
});

httpServer.listen(env.port, () => {
	console.log(`🚀 Server running on port ${env.port} in ${env.node} mode`);
	console.log(`📖 Health check: http://localhost:${env.port}/health`);
});

const shutdown = async () => {
	console.log("\nShutting down gracefully...");
	await prisma.$disconnect();
	httpServer.close(() => {
		console.log("Server closed");
		process.exit(0);
	});
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
