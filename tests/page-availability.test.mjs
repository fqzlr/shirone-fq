import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterDisabledPageLinks } from "../src/utils/nav-utils.ts";
import {
	evaluatePageAvailability,
	isPageAvailable,
} from "../src/utils/page-availability.ts";

describe("Page Availability Tests", () => {
	it("evaluatePageAvailability keeps unregistered page keys always available", () => {
		assert.equal(evaluatePageAvailability("home", {}, {}), true);
		assert.equal(evaluatePageAvailability("archive", {}, {}), true);
		assert.equal(
			evaluatePageAvailability("github", { skills: false }, {}),
			true,
		);
	});

	it("evaluatePageAvailability returns false when the toggle is false", () => {
		assert.equal(
			evaluatePageAvailability("skills", { skills: false }, {}),
			false,
		);
	});

	it("evaluatePageAvailability intersects with the domain enable (AND)", () => {
		assert.equal(
			evaluatePageAvailability("skills", { skills: true }, { skills: false }),
			false,
		);
		assert.equal(
			evaluatePageAvailability("skills", { skills: true }, { skills: true }),
			true,
		);
		assert.equal(
			evaluatePageAvailability("friends", { friends: true }, {}),
			true,
		);
	});

	it("isPageAvailable is true for unregistered keys in local default mode", () => {
		assert.equal(isPageAvailable("home"), true);
		assert.equal(isPageAvailable("archive"), true);
		assert.equal(isPageAvailable("github"), true);
	});
});

describe("Nav Link Page Availability Filter Tests", () => {
	const isAllowed = (pageKey) => pageKey !== "skills";

	it("filters leaf links by page availability", () => {
		const links = [
			{ name: "Home", url: "/", pageKey: "home" },
			{ name: "Skills", url: "/skills/", pageKey: "skills" },
			{ name: "Custom", url: "https://example.com", pageKey: "github" },
		];
		const filtered = filterDisabledPageLinks(links, isAllowed);
		assert.equal(filtered.length, 2);
		assert.deepEqual(
			filtered.map((l) => l.pageKey),
			["home", "github"],
		);
	});

	it("hides a group whose children are all filtered out", () => {
		const links = [
			{
				name: "More",
				icon: "material-symbols:apps-rounded",
				children: [
					{ name: "Skills", url: "/skills/", pageKey: "skills" },
					{ name: "About", url: "/about/", pageKey: "about" },
				],
			},
		];
		const filtered = filterDisabledPageLinks(links, (pageKey) =>
			["about", "home"].includes(pageKey),
		);
		assert.equal(filtered.length, 1);
		assert.deepEqual(
			filtered[0].children.map((l) => l.pageKey),
			["about"],
		);
	});

	it("keeps entries without pageKey untouched by default", () => {
		const links = [{ name: "GitHub", url: "https://github.com" }];
		const filtered = filterDisabledPageLinks(links, () => false);
		assert.equal(filtered.length, 1);
	});

	it("uses an allow-all predicate by default", () => {
		const links = [
			{
				name: "More",
				children: [{ name: "Skills", url: "/skills/", pageKey: "skills" }],
			},
		];
		assert.equal(filterDisabledPageLinks(links).length, 1);
	});
});
