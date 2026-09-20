<script lang="ts">
import Menu from "@components/atoms/navigation/Menu.svelte";
import { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants.ts";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import {
	applyThemeToDocument,
	getStoredTheme,
	setTheme,
} from "@utils/setting-utils.ts";
import { onMount } from "svelte";
import type { LIGHT_DARK_MODE } from "@/types/config.ts";

let mode: LIGHT_DARK_MODE = $state(AUTO_MODE);
let menuOpen = $state(false);
let isDesktop = $state(false);

onMount(() => {
	mode = getStoredTheme();
	const darkModePreference = window.matchMedia("(prefers-color-scheme: dark)");
	const changeThemeWhenSchemeChanged: Parameters<
		typeof darkModePreference.addEventListener<"change">
	>[1] = (_e) => {
		applyThemeToDocument(mode);
	};
	darkModePreference.addEventListener("change", changeThemeWhenSchemeChanged);

	const desktopQuery = window.matchMedia("(min-width: 1024px)");
	isDesktop = desktopQuery.matches;
	const onDesktopChange = (e: MediaQueryListEvent) => {
		isDesktop = e.matches;
	};
	desktopQuery.addEventListener("change", onDesktopChange);

	return () => {
		darkModePreference.removeEventListener(
			"change",
			changeThemeWhenSchemeChanged,
		);
		desktopQuery.removeEventListener("change", onDesktopChange);
	};
});

const seq: LIGHT_DARK_MODE[] = [LIGHT_MODE, DARK_MODE, AUTO_MODE];

function switchScheme(newMode: LIGHT_DARK_MODE) {
	mode = newMode;
	setTheme(newMode);
	menuOpen = false;
}

function toggleScheme() {
	let i = 0;
	for (; i < seq.length; i++) {
		if (seq[i] === mode) {
			break;
		}
	}
	switchScheme(seq[(i + 1) % seq.length]);
}

function onMainButtonClick() {
	if (isDesktop) {
		menuOpen = !menuOpen;
	} else {
		toggleScheme();
	}
}
</script>

{#snippet sunnyIcon()}
	<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11 3V2q0-.425.288-.712T12 1t.713.288T13 2v1q0 .425-.288.713T12 4t-.712-.288T11 3m0 19v-1q0-.425.288-.712T12 20t.713.288T13 21v1q0 .425-.288.713T12 23t-.712-.288T11 22m11-9h-1q-.425 0-.712-.288T20 12t.288-.712T21 11h1q.425 0 .713.288T23 12t-.288.713T22 13M3 13H2q-.425 0-.712-.288T1 12t.288-.712T2 11h1q.425 0 .713.288T4 12t-.288.713T3 13m16.75-7.325l-.35.35q-.275.275-.687.275T18 6q-.275-.275-.288-.687t.263-.713l.375-.375q.275-.3.7-.3t.725.3t.288.725t-.313.725M6.025 19.4l-.375.375q-.275.3-.7.3t-.725-.3t-.288-.725t.313-.725l.35-.35q.275-.275.688-.275T6 18q.275.275.288.688t-.263.712m12.3.35l-.35-.35q-.275-.275-.275-.687T18 18q.275-.275.688-.287t.712.262l.375.375q.3.275.3.7t-.3.725t-.725.288t-.725-.313M4.6 6.025l-.375-.375q-.3-.275-.3-.7t.3-.725t.725-.288t.725.313l.35.35q.275.275.275.688T6 6q-.275.275-.687.288T4.6 6.025M7.75 16.25Q6 14.5 6 12t1.75-4.25T12 6t4.25 1.75T18 12t-1.75 4.25T12 18t-4.25-1.75m7.088-1.412Q16 13.675 16 12t-1.162-2.838T12 8T9.162 9.163T8 12t1.163 2.838T12 16t2.838-1.162M12 12" /></svg>
{/snippet}
{#snippet darkIcon()}
	<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21q-3.775 0-6.387-2.613T3 12q0-3.45 2.25-5.988T11 3.05q.325-.05.575.088t.4.362t.163.525t-.188.575q-.425.65-.638 1.375T11.1 7.5q0 2.25 1.575 3.825T16.5 12.9q.775 0 1.538-.225t1.362-.625q.275-.175.563-.162t.512.137q.25.125.388.375t.087.6q-.35 3.45-2.937 5.725T12 21m0-2q2.2 0 3.95-1.213t2.55-3.162q-.5.125-1 .2t-1 .075q-3.075 0-5.238-2.163T9.1 7.5q0-.5.075-1t.2-1q-1.95.8-3.163 2.55T5 12q0 2.9 2.05 4.95T12 19m-.25-6.75" /></svg>
{/snippet}
{#snippet autoIcon()}
	<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 17V7Q9.925 7 8.463 8.463T7 12t1.463 3.538T12 17m0 5q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20" /></svg>
{/snippet}

<!-- z-50 make the menu higher than other float panels -->
<div class="relative z-50 flex h-10 w-10 shrink-0 items-center justify-center">
    <button aria-label="Light/Dark Mode" aria-haspopup="menu" aria-expanded={menuOpen}
            class="m3-state-layer relative inline-flex items-center justify-center rounded-full h-10 w-10 border-none cursor-pointer select-none text-[var(--on-surface)]"
            style="font-size: 1.25rem; line-height: 1; --m3e-state-color: var(--on-surface); --m3e-focus-outline: var(--on-surface);"
            id="scheme-switch" onclick={onMainButtonClick}>
        <!-- 图标显隐由 <html data-theme-mode> 纯 CSS 驱动（预置脚本水合前写入），
             避免 SSR 首帧空白/水合后闪跳 -->
        <div class="absolute scheme-icon scheme-icon--light">{@render sunnyIcon()}</div>
        <div class="absolute scheme-icon scheme-icon--dark">{@render darkIcon()}</div>
        <div class="absolute scheme-icon scheme-icon--auto">{@render autoIcon()}</div>
    </button>

    <Menu bind:open={menuOpen} label="Light/Dark Mode" class="absolute top-11 right-0 hidden lg:block">
        <button class="m3-menu-item" class:selected={mode === LIGHT_MODE}
                onclick={() => switchScheme(LIGHT_MODE)}>
            {@render sunnyIcon()}
            {i18n(I18nKey.lightMode)}
        </button>
        <button class="m3-menu-item" class:selected={mode === DARK_MODE}
                onclick={() => switchScheme(DARK_MODE)}>
            {@render darkIcon()}
            {i18n(I18nKey.darkMode)}
        </button>
        <button class="m3-menu-item" class:selected={mode === AUTO_MODE}
                onclick={() => switchScheme(AUTO_MODE)}>
            {@render autoIcon()}
            {i18n(I18nKey.systemMode)}
        </button>
    </Menu>
</div>

<style>
	/* 显隐完全跟随 <html data-theme-mode>（applyThemeToDocument 维护），
	   不走 Svelte 状态：SSR 首帧即可显示正确图标 */
	.scheme-icon {
		opacity: 0;
	}
	.scheme-icon > :global(svg) {
		width: 1.25rem;
		height: 1.25rem;
		display: block;
	}
	/* 菜单项里的裸 SVG 没有 width/height 属性，浏览器默认尺寸会导致
	   三个图标大小不一（第三个尤其小），显式统一为 20px */
	.m3-menu-item > :global(svg) {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
	}
	:global(html[data-theme-mode='light']) .scheme-icon--light {
		opacity: 1;
	}
	:global(html[data-theme-mode='dark']) .scheme-icon--dark {
		opacity: 1;
	}
	:global(html[data-theme-mode='auto']) .scheme-icon--auto {
		opacity: 1;
	}
</style>
