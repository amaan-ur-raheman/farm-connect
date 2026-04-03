import sanitizeHtml from "sanitize-html";

/**
 * Strips all HTML tags and JavaScript event attributes from a string.
 * Preserves plain text content.
 */
export const sanitizeText = (input: string): string => {
	if (!input || typeof input !== "string") return input;
	return sanitizeHtml(input, {
		allowedTags: [],
		allowedAttributes: {},
	});
};
