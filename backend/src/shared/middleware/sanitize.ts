import { Request, Response, NextFunction } from "express";
import { sanitizeText } from "@/shared/utils/sanitize";

export const sanitizeFields =
	(...fields: string[]) =>
	(req: Request, _res: Response, next: NextFunction): void => {
		for (const field of fields) {
			if (typeof req.body?.[field] === "string") {
				req.body[field] = sanitizeText(req.body[field]);
			}
		}
		next();
	};
