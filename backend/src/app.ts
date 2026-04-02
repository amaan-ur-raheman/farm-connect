import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "@/config/env";
import { errorHandler } from "@/shared/errors";
import { asyncHandler, notFoundHandler } from "@/shared/middleware/handlers";
import { authRouter } from "@/modules/auth/auth.routes";
import { userRouter } from "@/modules/user/user.routes";
import { listingRouter } from "@/modules/listing/listing.routes";
import { contractRouter } from "@/modules/contract/contract.routes";
import { walletRouter } from "@/modules/wallet/wallet.routes";
import { paymentRouter } from "@/modules/payment/payment.routes";
import { escrowRouter } from "@/modules/escrow/escrow.routes";
import { updateRouter } from "@/modules/update/update.routes";
import { deliveryRouter } from "@/modules/delivery/delivery.routes";
import { reviewRouter } from "@/modules/review/review.routes";
import { disputeRouter } from "@/modules/dispute/dispute.routes";
import { notificationRouter } from "@/modules/notification/notification.routes";
import { chatRouter } from "@/modules/chat/chat.routes";
import { kycRouter } from "@/modules/kyc/kyc.routes";

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.isDev ? "dev" : "combined"));

app.get(
	"/health",
	asyncHandler(async (_req, res) => {
		res.json({ status: "ok", timestamp: new Date().toISOString() });
	}),
);

const generalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (_req, res) => {
		res.status(429).json({
			success: false,
			message: "Too many requests, please try again later.",
		});
	},
});

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (_req, res) => {
		res.status(429).json({
			success: false,
			message:
				"Too many authentication attempts, please try again later.",
		});
	},
});

app.use("/api/", generalLimiter);
app.use("/api/auth/", authLimiter);

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/listings", listingRouter);
app.use("/api/contracts", contractRouter);
app.use("/api/escrow", escrowRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/updates", updateRouter);
app.use("/api/deliveries", deliveryRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/disputes", disputeRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/chat", chatRouter);
app.use("/api/kyc", kycRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
