import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

const RESET = "\x1b[0m";

function sanitizeStatusText(text: string): string {
	return text.replace(/[\r\n\t]/g, " ").replace(/ +/g, " ").trim();
}

function formatTokens(count: number): string {
	if (count < 1000) return count.toString();
	if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
	if (count < 1000000) return `${Math.round(count / 1000)}k`;
	if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
	return `${Math.round(count / 1000000)}M`;
}

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
	const normalized = hex.replace("#", "");
	return [
		Number.parseInt(normalized.slice(0, 2), 16),
		Number.parseInt(normalized.slice(2, 4), 16),
		Number.parseInt(normalized.slice(4, 6), 16),
	];
}

function fg(hex: string, text: string): string {
	const [r, g, b] = hexToRgb(hex);
	return `\x1b[38;2;${r};${g};${b}m${text}${RESET}`;
}

function bg(hex: string, text: string): string {
	const [r, g, b] = hexToRgb(hex);
	return `\x1b[48;2;${r};${g};${b}m${text}${RESET}`;
}

function blend(a: string, b: string, t: number): string {
	const [ar, ag, ab] = hexToRgb(a);
	const [br, bg, bb] = hexToRgb(b);
	const channel = (start: number, end: number) => Math.round(start + (end - start) * t);
	return `#${[channel(ar, br), channel(ag, bg), channel(ab, bb)]
		.map((v) => v.toString(16).padStart(2, "0"))
		.join("")}`;
}

const providerBrandColors: Record<string, string> = {
	anthropic: "#DD7B5F",
	claude: "#DD7B5F",
	openai: "#10A37F",
	google: "#4285F4",
	gemini: "#4285F4",
	xai: "#F2F2F2",
	grok: "#F2F2F2",
	groq: "#F55036",
	mistral: "#FF7000",
	deepseek: "#4D6BFE",
	meta: "#0866FF",
	llama: "#0866FF",
	cohere: "#39594D",
	perplexity: "#20B8CD",
	openrouter: "#8B5CF6",
	bedrock: "#FF9900",
	aws: "#FF9900",
	azure: "#0078D4",
	ollama: "#A3A3A3",
	local: "#A3A3A3",
	github: "#6E40C9",
	copilot: "#6E40C9",
	gitlab: "#FC6D26",
	"gitlab-duo": "#FC6D26",
	moonshot: "#A855F7",
	kimi: "#A855F7",
	qwen: "#FF6A00",
	alibaba: "#FF6A00",
	zhipu: "#2F80ED",
};

function modelBrandColor(model: any): string {
	const provider = String(model?.provider ?? "").toLowerCase();
	const id = String(model?.id ?? "").toLowerCase();
	const haystack = `${provider} ${id}`;

	for (const [key, color] of Object.entries(providerBrandColors)) {
		if (haystack.includes(key)) return color;
	}

	if (/\b(o\d|gpt|chatgpt)\b/.test(haystack)) return providerBrandColors.openai;
	if (haystack.includes("claude")) return providerBrandColors.anthropic;
	if (haystack.includes("gemini")) return providerBrandColors.google;
	if (haystack.includes("grok")) return providerBrandColors.xai;
	if (haystack.includes("llama")) return providerBrandColors.meta;
	if (haystack.includes("deepseek")) return providerBrandColors.deepseek;
	if (haystack.includes("mistral") || haystack.includes("codestral")) return providerBrandColors.mistral;
	if (haystack.includes("qwen")) return providerBrandColors.qwen;
	if (haystack.includes("kimi")) return providerBrandColors.kimi;

	return "#9CA3AF";
}

function effortColor(level: string): string {
	switch (level.toLowerCase()) {
		case "low":
			return "#F8C038";
		case "medium":
			return "#50B868";
		case "high":
			return "#A8A8E0";
		case "xhigh": {
			const pulse = (Math.sin(Date.now() / 650) + 1) / 2;
			return blend("#8E6EDB", "#B088F8", pulse);
		}
		case "max": {
			const palette = ["#E06058", "#F8C038", "#50B868", "#20B8CD", "#A078E0"];
			return palette[Math.floor(Date.now() / 120) % palette.length] ?? "#E06058";
		}
		case "minimal":
			return "#9CA3AF";
		default:
			return "#6B7280";
	}
}

function styleEffort(level: string, text: string): string {
	const normalized = level.toLowerCase();
	if (normalized === "max") {
		const palette = ["#E06058", "#F8C038", "#50B868", "#20B8CD", "#A078E0"];
		const offset = Math.floor(Date.now() / 90);
		return Array.from(text)
			.map((char, index) => fg(palette[(index + offset) % palette.length] ?? "#E06058", char))
			.join("");
	}
	if (normalized === "xhigh") {
		return bg("#241B31", fg(effortColor(level), text));
	}
	return fg(effortColor(level), text);
}

function styleRightSide(
	plain: string,
	modelName: string,
	model: any,
	thinkingLevel: string,
	dim: (text: string) => string,
): string {
	const effortText = thinkingLevel === "off" ? "thinking off" : thinkingLevel;
	const spans: Array<{ start: number; end: number; render: (text: string) => string }> = [];
	const modelIndex = plain.indexOf(modelName);
	if (modelIndex >= 0) {
		spans.push({
			start: modelIndex,
			end: modelIndex + modelName.length,
			render: (text) => fg(modelBrandColor(model), text),
		});
	}

	const effortIndex = plain.lastIndexOf(effortText);
	if (effortIndex >= 0) {
		spans.push({
			start: effortIndex,
			end: effortIndex + effortText.length,
			render: (text) => styleEffort(thinkingLevel, text),
		});
	}

	spans.sort((a, b) => a.start - b.start);
	let cursor = 0;
	let styled = "";
	for (const span of spans) {
		if (span.start < cursor) continue;
		styled += dim(plain.slice(cursor, span.start));
		styled += span.render(plain.slice(span.start, span.end));
		cursor = span.end;
	}
	styled += dim(plain.slice(cursor));
	return styled;
}

function latestThinkingLevelFromBranch(ctx: any): string {
	let level = "off";
	for (const entry of ctx.sessionManager.getBranch()) {
		if (entry.type === "thinking_level_change") {
			level = entry.thinkingLevel;
		}
	}
	return level;
}

export default function (pi: ExtensionAPI) {
	let currentModel: any;
	let requestRender: (() => void) | undefined;

	pi.on("session_start", (_event, ctx) => {
		currentModel = ctx.model;

		ctx.ui.setFooter((tui, theme, footerData) => {
			requestRender = () => tui.requestRender();
			const branchUnsub = footerData.onBranchChange(() => tui.requestRender());
			const animation = setInterval(() => {
				const level = pi.getThinkingLevel?.();
				if (level === "xhigh" || (level as string) === "max") tui.requestRender();
			}, 250);

			return {
				dispose() {
					branchUnsub();
					clearInterval(animation);
					requestRender = undefined;
				},
				invalidate() {},
				render(width: number): string[] {
					const model = currentModel ?? ctx.model;
					let totalInput = 0;
					let totalOutput = 0;
					let totalCacheRead = 0;
					let totalCacheWrite = 0;
					let totalCost = 0;

					for (const entry of ctx.sessionManager.getEntries()) {
						if (entry.type === "message" && entry.message.role === "assistant") {
							totalInput += entry.message.usage.input;
							totalOutput += entry.message.usage.output;
							totalCacheRead += entry.message.usage.cacheRead;
							totalCacheWrite += entry.message.usage.cacheWrite;
							totalCost += entry.message.usage.cost.total;
						}
					}

					const contextUsage = ctx.getContextUsage();
					const contextWindow = contextUsage?.contextWindow ?? model?.contextWindow ?? 0;
					const contextPercentValue = contextUsage?.percent ?? 0;
					const contextPercent =
						contextUsage?.percent !== null && contextUsage?.percent !== undefined
							? contextPercentValue.toFixed(1)
							: "?";

					let pwd = ctx.sessionManager.getCwd();
					const home = process.env.HOME || process.env.USERPROFILE;
					if (home && pwd.startsWith(home)) {
						pwd = `~${pwd.slice(home.length)}`;
					}

					const branch = footerData.getGitBranch();
					if (branch) pwd = `${pwd} (${branch})`;

					const sessionName = ctx.sessionManager.getSessionName();
					if (sessionName) pwd = `${pwd} • ${sessionName}`;

					const statsParts: string[] = [];
					if (totalInput) statsParts.push(`↑${formatTokens(totalInput)}`);
					if (totalOutput) statsParts.push(`↓${formatTokens(totalOutput)}`);
					if (totalCacheRead) statsParts.push(`R${formatTokens(totalCacheRead)}`);
					if (totalCacheWrite) statsParts.push(`W${formatTokens(totalCacheWrite)}`);

					const usingSubscription = model ? ctx.modelRegistry.isUsingOAuth(model) : false;
					if (totalCost || usingSubscription) {
						statsParts.push(`$${totalCost.toFixed(3)}${usingSubscription ? " (sub)" : ""}`);
					}

					const autoIndicator = " (auto)";
					const contextPercentDisplay =
						contextPercent === "?"
							? `?/${formatTokens(contextWindow)}${autoIndicator}`
							: `${contextPercent}%/${formatTokens(contextWindow)}${autoIndicator}`;
					let contextPercentStr = contextPercentDisplay;
					if (contextPercentValue > 90) {
						contextPercentStr = theme.fg("error", contextPercentDisplay);
					} else if (contextPercentValue > 70) {
						contextPercentStr = theme.fg("warning", contextPercentDisplay);
					}
					statsParts.push(contextPercentStr);

					let statsLeft = statsParts.join(" ");
					let statsLeftWidth = visibleWidth(statsLeft);
					if (statsLeftWidth > width) {
						statsLeft = truncateToWidth(statsLeft, width, "...");
						statsLeftWidth = visibleWidth(statsLeft);
					}

					const modelName = model?.id || "no-model";
					const thinkingLevel = model?.reasoning ? pi.getThinkingLevel?.() ?? latestThinkingLevelFromBranch(ctx) : "off";
					const minPadding = 2;
					let rightSideWithoutProvider = modelName;
					if (model?.reasoning) {
						rightSideWithoutProvider =
							thinkingLevel === "off" ? `${modelName} • thinking off` : `${modelName} • ${thinkingLevel}`;
					}

					let rightSide = rightSideWithoutProvider;
					if (footerData.getAvailableProviderCount() > 1 && model) {
						rightSide = `(${model.provider}) ${rightSideWithoutProvider}`;
						if (statsLeftWidth + minPadding + visibleWidth(rightSide) > width) {
							rightSide = rightSideWithoutProvider;
						}
					}

					const rightSideWidth = visibleWidth(rightSide);
					const totalNeeded = statsLeftWidth + minPadding + rightSideWidth;
					let padding = "";
					let renderedRight = "";
					if (totalNeeded <= width) {
						padding = " ".repeat(width - statsLeftWidth - rightSideWidth);
						renderedRight = rightSide;
					} else {
						const availableForRight = width - statsLeftWidth - minPadding;
						if (availableForRight > 0) {
							renderedRight = truncateToWidth(rightSide, availableForRight, "");
							padding = " ".repeat(Math.max(0, width - statsLeftWidth - visibleWidth(renderedRight)));
						}
					}

					const dimStatsLeft = theme.fg("dim", statsLeft);
					const dimPadding = theme.fg("dim", padding);
					const styledRight = styleRightSide(renderedRight, modelName, model, thinkingLevel, (text) =>
						theme.fg("dim", text),
					);
					const pwdLine = truncateToWidth(theme.fg("dim", pwd), width, theme.fg("dim", "..."));
					const lines = [pwdLine, dimStatsLeft + dimPadding + styledRight];

					const extensionStatuses = footerData.getExtensionStatuses();
					if (extensionStatuses.size > 0) {
						const statusLine = Array.from(extensionStatuses.entries())
							.sort(([a], [b]) => a.localeCompare(b))
							.map(([, text]) => sanitizeStatusText(text))
							.join(" ");
						lines.push(truncateToWidth(statusLine, width, theme.fg("dim", "...")));
					}

					return lines;
				},
			};
		});
	});

	pi.on("model_select", (event, ctx) => {
		currentModel = event.model;
		requestRender?.();
	});

	pi.on("thinking_level_select", (_event, ctx) => {
		requestRender?.();
	});

	pi.on("session_shutdown", () => {
		currentModel = undefined;
		requestRender = undefined;
	});
}
