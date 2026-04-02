import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { sanitizeText } from "@/shared/utils/sanitize";

// Feature: farmconnect-implementation, Property 14: Sanitizer Strips HTML from Text Fields
describe("sanitizeText", () => {
	it("Property 14: strips HTML tags and event attributes from input", () => {
		const htmlTemplates = [
			(s: string) => `<script>${s}</script>`,
			(s: string) => `<img src="x" onerror="${s}">`,
			(s: string) => `<b>${s}</b>`,
			(s: string) => `<a href="javascript:void(0)">${s}</a>`,
		];

		fc.assert(
			fc.property(
				fc.string(),
				fc.integer({ min: 0, max: 3 }),
				(s, idx) => {
					const input = htmlTemplates[idx](s);
					const output = sanitizeText(input);
					expect(output).not.toMatch("<");
					expect(output).not.toMatch(">");
				},
			),
			{ numRuns: 100 },
		);
	});

	// Feature: farmconnect-implementation, Property 15: Sanitizer Preserves Plain Text
	it("Property 15: preserves plain text with no HTML", () => {
		fc.assert(
			fc.property(
				fc
					.unicodeString()
					.filter(
						(s) =>
							!s.includes("<") &&
							!s.includes(">") &&
							!s.includes("&") &&
							!s.includes('"') &&
							!s.includes("'"),
					),
				(input) => {
					expect(sanitizeText(input)).toBe(input);
				},
			),
			{ numRuns: 100 },
		);
	});
});
