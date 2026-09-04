import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	buildStatusMap,
	FRIEND_CHECK_TIMEOUT_MS,
	groupByFailCount,
	inZone,
	normalizeSiteUrl,
	statusLabelFor,
	statusLevelFor,
} from "../src/utils/friend-check.ts";

describe("friend-check 纯函数层", () => {
	it("normalizeSiteUrl 去尾斜杠与空白，作为匹配键", () => {
		assert.equal(normalizeSiteUrl(" https://a.example.com/ "), "https://a.example.com");
		assert.equal(normalizeSiteUrl("https://a.example.com///"), "https://a.example.com");
		assert.equal(normalizeSiteUrl(""), "");
	});

	it("statusLevelFor 按延迟分级（<0 超时 / <1s 正常 / <2s 偏慢 / 其余警告）", () => {
		assert.equal(statusLevelFor(-1), "timeout");
		assert.equal(statusLevelFor(0.25), "success");
		assert.equal(statusLevelFor(1.5), "slow");
		assert.equal(statusLevelFor(3), "warn");
		assert.equal(statusLevelFor(Number.NaN), "timeout");
	});

	it("statusLabelFor 输出毫秒文案与超时文案（{ms} 占位符替换）", () => {
		const labels = { timeout: "超时", latencyMs: "{ms} MS" };
		assert.equal(statusLabelFor(0.98, labels), "980 MS");
		assert.equal(statusLabelFor(0.0004, labels), "0 MS");
		assert.equal(statusLabelFor(-1, labels), "超时");
	});

	it("buildStatusMap 白名单清洗 result.json，归一化链接为键", () => {
		const map = buildStatusMap(
			{
				link_status: [
					{ link: "https://a.com/", latency: 0.5, fail_count: 0, siteshot: "https://shot/a.png" },
					{ link: "https://b.com", latency: -1, fail_count: 3 },
					{ link: "" },
					{ latency: 1 },
				],
			},
			{ timeout: "超时", latencyMs: "{ms} MS" },
		);
		assert.equal(map["https://a.com"].level, "success");
		assert.equal(map["https://a.com"].siteshot, "https://shot/a.png");
		assert.equal(map["https://b.com"].level, "timeout");
		assert.equal(map["https://b.com"].failCount, 3);
		assert.equal(map["https://b.com"].siteshot, "");
		// 非法条目跳过
		assert.equal(Object.keys(map).length, 2);
	});

	it("buildStatusMap 对空数据/缺字段安全降级", () => {
		const map = buildStatusMap(null, { timeout: "超时", latencyMs: "{ms} MS" });
		assert.deepEqual(map, {});
		const loose = buildStatusMap(
			{ link_status: [{ link: "https://c.com" }] },
			{ timeout: "超时", latencyMs: "{ms} MS" },
		);
		assert.equal(loose["https://c.com"].level, "timeout");
		assert.equal(loose["https://c.com"].failCount, 0);
	});

	it("inZone 判断闭区间", () => {
		assert.ok(inZone(0, [1, 6]) === false);
		assert.ok(inZone(1, [1, 6]));
		assert.ok(inZone(6, [1, 6]));
		assert.ok(inZone(7, [1, 6]) === false);
		assert.ok(inZone(7, [7, 9999]));
	});

	it("groupByFailCount 三区互斥且按 fail_count 降序", () => {
		const friends = [
			{ siteurl: "https://a.com/", title: "A" },
			{ siteurl: "https://b.com", title: "B" },
			{ siteurl: "https://c.com/", title: "C" },
			{ siteurl: "https://d.com", title: "D" },
		];
		const statusMap = {
			"https://a.com": { failCount: 0 },
			"https://b.com": { failCount: 3 },
			"https://c.com": { failCount: 9 },
			"https://d.com": { failCount: 1 },
		};
		const { pending, graveyard } = groupByFailCount(
			friends,
			statusMap,
			[1, 6],
			[7, 9999],
		);
		assert.deepEqual(pending.map((e) => e.friend.title), ["B", "D"]);
		assert.deepEqual(pending.map((e) => e.failCount), [3, 1]);
		assert.deepEqual(graveyard.map((e) => e.friend.title), ["C"]);
	});

	it("groupByFailCount 无记录的友链不落入任何分区", () => {
		const { pending, graveyard } = groupByFailCount(
			[{ siteurl: "https://x.com" }],
			{},
			[1, 6],
			[7, 9999],
		);
		assert.equal(pending.length, 0);
		assert.equal(graveyard.length, 0);
	});

	it("FRIEND_CHECK_TIMEOUT_MS 符合远程数据契约的显式超时上限", () => {
		assert.ok(FRIEND_CHECK_TIMEOUT_MS > 0);
		assert.ok(FRIEND_CHECK_TIMEOUT_MS <= 8000);
	});
});
