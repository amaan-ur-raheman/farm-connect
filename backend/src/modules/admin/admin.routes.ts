import { Router } from "express";
import { authenticate, requireRole } from "@/shared/middleware/auth";
import * as adminController from "./admin.controller";

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole("ADMIN"));

adminRouter.get("/stats", adminController.getStatsHandler);
adminRouter.get("/kyc", adminController.getKycHandler);
adminRouter.patch("/kyc/:userId", adminController.handleKycActionHandler);
adminRouter.get("/disputes", adminController.getDisputesHandler);
adminRouter.patch("/disputes/:disputeId/resolve", adminController.resolveDisputeHandler);
