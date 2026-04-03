import { Request, Response } from "express";
import { asyncHandler } from "@/shared/middleware/handlers";
import * as adminService from "./admin.service";

export const getStatsHandler = asyncHandler(async (req: Request, res: Response) => {
	const stats = await adminService.getAdminStats();
	res.json({ success: true, data: stats });
});

export const getKycHandler = asyncHandler(async (req: Request, res: Response) => {
	const applications = await adminService.getKycApplications();
	res.json({ success: true, data: applications });
});

export const handleKycActionHandler = asyncHandler(async (req: Request, res: Response) => {
	const { userId } = req.params;
	const { action, reason } = req.body;
	const result = await adminService.handleKycAction(req.user!.userId, userId as string, action, reason);
	res.json({ success: true, data: result });
});

export const getDisputesHandler = asyncHandler(async (req: Request, res: Response) => {
	const page = parseInt(req.query.page as string) || 1;
	const limit = parseInt(req.query.limit as string) || 20;
	const disputes = await adminService.getAllDisputes(page, limit);
	res.json({ success: true, data: disputes });
});

export const resolveDisputeHandler = asyncHandler(async (req: Request, res: Response) => {
	const { disputeId } = req.params;
	const result = await adminService.resolveAdminDispute(disputeId as string, req.user!.userId, req.body);
	res.json({ success: true, data: result });
});

export const getUsersHandler = asyncHandler(async (req: Request, res: Response) => {
	const page = parseInt(req.query.page as string) || 1;
	const limit = parseInt(req.query.limit as string) || 20;
	const users = await adminService.getAllUsers(page, limit);
	res.json({ success: true, data: users });
});

export const getListingsHandler = asyncHandler(async (req: Request, res: Response) => {
	const page = parseInt(req.query.page as string) || 1;
	const limit = parseInt(req.query.limit as string) || 20;
	const listings = await adminService.getAllListings(page, limit);
	res.json({ success: true, data: listings });
});
