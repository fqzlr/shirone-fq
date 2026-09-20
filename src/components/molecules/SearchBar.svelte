<script lang="ts">
/**
 * M3E SearchBar — 导航栏折叠式胶囊搜索条分子。
 * 折叠时为 40px 图标按钮，点击后展开为
 * w-48 胶囊输入条，失焦延迟自动折叠。value / expanded 可双向绑定，
 * 展开折叠交互细节全部内聚在此，Search 有机体只负责搜索与结果面板。
 * 图标用内联 SVG：本组件随 Search 岛 client:load 做 SSR，@iconify/svelte
 * 水合前不渲染图标，会在导航栏首帧留下空白按钮。
 */

let {
	value = $bindable(""),
	expanded = $bindable(false),
	id = "search-input",
	name = "search",
	placeholder = "",
	onfocus = () => {},
	oncollapse = () => {},
}: {
	value?: string;
	expanded?: boolean;
	id?: string;
	name?: string;
	placeholder?: string;
	onfocus?: () => void;
	oncollapse?: () => void;
} = $props();

let blurTimer: ReturnType<typeof setTimeout>;

const expand = (): void => {
	expanded = true;
	setTimeout(() => {
		const input = document.getElementById(id) as HTMLInputElement;
		input?.focus();
	}, 0);
};

// 失焦后延迟折叠，允许搜索结果点击先执行
const handleBlur = (): void => {
	blurTimer = setTimeout(() => {
		expanded = false;
		oncollapse();
	}, 200);
};

const handleFocus = (): void => {
	clearTimeout(blurTimer);
	onfocus();
};
</script>

<div class="hidden lg:block relative w-10 h-10 shrink-0">
    <div
        class="m3-state-layer absolute right-0 top-0 flex items-center overflow-hidden rounded-full transition-all duration-300 h-10 top-app-bar__search-shell
               {expanded ? 'top-app-bar__search-shell--expanded w-48 bg-(--surface-container-high)' : 'w-10 bg-transparent'}"
        onclick={() => {
            if (!expanded) expand();
        }}
    >
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            width="1.25rem"
            height="1.25rem"
            class="pointer-events-none shrink-0 transition-all
                   {expanded
                       ? 'ml-3 text-[var(--on-surface-variant)]'
                       : 'mx-auto text-[var(--on-surface)]'}"
        >
            <path d="M9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l5.6 5.6q.275.275.275.7t-.275.7t-.7.275t-.7-.275l-5.6-5.6q-.75.6-1.725.95T9.5 16m0-2q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14" />
        </svg>
        <input
            {id}
            {name}
            {placeholder}
            bind:value
            tabindex={expanded ? 0 : -1}
            onfocus={handleFocus}
            onblur={handleBlur}
            class="h-full bg-transparent outline-0 text-(--on-surface) caret-(--primary) transition-all
                   {expanded ? 'w-32 pl-2 opacity-100' : 'w-0 opacity-0'}"
        />
    </div>
</div>
