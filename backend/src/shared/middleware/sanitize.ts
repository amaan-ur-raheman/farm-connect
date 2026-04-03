import { Request, Response, NextFunction } from "express";
import { sanitizeText } from "../utils/sanitize";

/**
 * Middleware to sanitize specific fields in the request body.
 * Strips HTML tags and JS event attributes.
 */
export const sanitizeFields = (...fields: string[]) => {
	return (req: Request, _res: Response, next: NextFunction) => {
		if (req.body) {
			fields.forEach((field) => {
				if (req.body[field] && typeof req.body[field] === "string") {
					req.body[field] = sanitizeText(req.body[field]);
				}
			});
		}
		next();
	};
};
