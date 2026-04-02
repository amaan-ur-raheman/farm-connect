import { Router } from "express";
import { authenticate } from "@/shared/middleware/auth";
import { requireRole } from "@/shared/middleware/auth";
import { validate } from "@/shared/middleware/validate";
import { sanitizeFields } from "@/shared/middleware/sanitize";
import { createListingSchema, updateListingSchema } from "./listing.schema";
import {
	createListingHandler,
	getListingHandler,
	getListingsHandler,
	updateListingHandler,
	deleteListingHandler,
	getFarmerListingsHandler,
	uploadListingImageHandler,
} from "./listing.controller";
import multer from "multer";

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 },
});

export const listingRouter = Router();

listingRouter.get("/", getListingsHandler);
listingRouter.get("/mine", authenticate, getFarmerListingsHandler);
listingRouter.get("/:id", getListingHandler);
listingRouter.post(
	"/",
	authenticate,
	requireRole("FARMER"),
	sanitizeFields("description"),
	validate(createListingSchema),
	createListingHandler,
);
listingRouter.patch(
	"/:id",
	authenticate,
	requireRole("FARMER"),
	sanitizeFields("description"),
	validate(updateListingSchema),
	updateListingHandler,
);
listingRouter.delete(
	"/:id",
	authenticate,
	requireRole("FARMER"),
	deleteListingHandler,
);
listingRouter.post(
	"/:id/upload-image",
	authenticate,
	requireRole("FARMER"),
	upload.single("image"),
	uploadListingImageHandler,
);
