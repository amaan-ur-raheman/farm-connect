import sanitizeHtml from "sanitize-html";

export const sanitizeText = (input: string): string =>
	sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
