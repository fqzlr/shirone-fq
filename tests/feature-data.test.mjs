import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	filterByDisabledKeys,
	resolveDevicesData,
	resolveProjectsData,
	resolveSkillsData,
	resolveTimelineData,
} from "../src/utils/feature-data.ts";

describe("Feature Data & Resolver Tests", () => {
	it("filterByDisabledKeys correctly filters items by key/id/name/title", () => {
		const items = [
			{ key: "item-1", name: "One" },
			{ key: "item-2", name: "Two" },
			{ key: "item-3", name: "Three" },
		];

		const filtered = filterByDisabledKeys(items, ["item-2"]);
		assert.equal(filtered.length, 2);
		assert.deepEqual(
			filtered.map((i) => i.key),
			["item-1", "item-3"],
		);
	});

	it("resolveProjectsData applies disabledKeys correctly", () => {
		const config = {
			enable: true,
			categories: [],
			disabledKeys: ["folkpatch"],
		};
		// 数据内容归内容仓（src/data/*.ts 会被覆盖），单测一律注入 fixture，
		// 不依赖真实数据。
		const items = [
			{ key: "shirone", name: "Shirone" },
			{ key: "kernelpatch", name: "Kernel Patch" },
			{ key: "folkpatch", name: "Folk Patch" },
		];
		const resolved = resolveProjectsData(config, items);
		assert.ok(resolved.some((p) => p.key === "shirone"));
		assert.ok(resolved.some((p) => p.key === "kernelpatch"));
		assert.ok(!resolved.some((p) => p.key === "folkpatch"));
	});

	it("resolveSkillsData applies disabledNames correctly", () => {
		const config = {
			enable: true,
			categories: [],
			disabledNames: ["PHP"],
		};
		const items = [
			{ name: "TypeScript" },
			{ name: "Rust" },
			{ name: "PHP" },
		];
		const resolved = resolveSkillsData(config, items);
		assert.ok(resolved.some((s) => s.name === "TypeScript"));
		assert.ok(!resolved.some((s) => s.name === "PHP"));
	});

	it("resolveTimelineData applies disabledTitles and order correctly", () => {
		const config = {
			enable: true,
			categories: [],
			order: "asc",
			disabledTitles: ["Senior Frontend Engineer"],
		};
		const items = [
			{ title: "Senior Frontend Engineer" },
			{ title: "Joined an Open Source Project" },
			{ title: "Started Personal Blog & Tech Notes" },
		];
		const resolved = resolveTimelineData(config, items);
		assert.ok(!resolved.some((t) => t.title === "Senior Frontend Engineer"));
		assert.equal(resolved[0].title, "Started Personal Blog & Tech Notes");
		assert.equal(resolved[1].title, "Joined an Open Source Project");
	});

	it("resolveDevicesData applies disabledIds correctly", () => {
		const config = {
			enable: true,
			categories: [],
			disabledIds: ["iphone-16-pro"],
		};
		const items = [
			{ id: "macbook-pro-16", name: "MacBook Pro" },
			{ id: "iphone-16-pro", name: "iPhone 16 Pro" },
			{ id: "pixel-9", name: "Pixel 9" },
		];
		const resolved = resolveDevicesData(config, items);
		assert.ok(resolved.some((d) => d.id === "macbook-pro-16"));
		assert.ok(!resolved.some((d) => d.id === "iphone-16-pro"));
	});
});
