import { Router } from "express";
import { authenticate, requireRole } from "@/shared/middleware/auth";
import { validate } from "@/shared/middleware/validate";
import { handleKycActionSchema } from "./admin.schema";
import { resolveDisputeSchema } from "../dispute/dispute.schema";
import * as adminController from "./admin.controller";

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole("ADMIN"));

adminRouter.get("/stats", adminController.getStatsHandler);
adminRouter.get("/kyc", adminController.getKycHandler);
adminRouter.patch(
	"/kyc/:userId",
	validate(handleKycActionSchema),
	adminController.handleKycActionHandler,
);
adminRouter.get("/disputes", adminController.getDisputesHandler);
adminRouter.patch(
	"/disputes/:disputeId/resolve",
	validate(resolveDisputeSchema),
	adminController.resolveDisputeHandler,
);
adminRouter.get("/users", adminController.getUsersHandler);
adminRouter.get("/listings", adminController.getListingsHandler);
