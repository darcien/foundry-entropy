<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Derived values from data (static for prerendered page)
	const days = $derived(data.days);
	const latestBuild = $derived(data.latestBuild);
	const changeType = $derived(data.changeType);
	const checks = $derived(data.checks);
	const lastUpdatedAt = $derived(data.lastUpdatedAt);
	const region = $derived(data.region);

	// Dynamic log field widths (recalculated on client)
	let logContainer: HTMLDivElement | undefined = $state();
	let buildWidth = $state(48);
	let hashWidth = $state(24);

	function calculateWidths() {
		if (!logContainer) return;

		// Measure character width using a test element with the same font as the log
		const testEl = document.createElement('span');
		testEl.style.visibility = 'hidden';
		testEl.style.position = 'absolute';
		testEl.style.whiteSpace = 'pre';
		// Inherit font from container (which has font-mono class)
		testEl.textContent = '0'.repeat(100);
		logContainer.appendChild(testEl);
		const charWidth = testEl.offsetWidth / 100;
		logContainer.removeChild(testEl);

		// Sanity check: if charWidth is 0 or unreasonably small, skip this calculation
		if (charWidth < 1) return;

		// Calculate available width (container width minus padding)
		const containerWidth = logContainer.clientWidth - 32;
		if (containerWidth <= 0) return;

		// Fixed chars: [time] (18) + status (3) + region (4) + separators (4*3=12) + NEW (4) = 41
		const fixedChars = 41;
		const availableChars = Math.floor(containerWidth / charWidth) - fixedChars;

		// Distribute: ~66% to build, ~34% to hash
		buildWidth = Math.max(28, Math.floor(availableChars * 0.66));
		hashWidth = Math.max(10, availableChars - buildWidth);
	}

	$effect(() => {
		if (!logContainer) return;

		// Wait for fonts to load and layout to complete
		const setup = async () => {
			// Wait for fonts
			await document.fonts.ready;

			// Wait for next frame to ensure layout is done
			await new Promise(resolve => requestAnimationFrame(resolve));

			calculateWidths();
		};

		setup();

		// Recalculate on resize
		const resizeObserver = new ResizeObserver(() => {
			requestAnimationFrame(() => calculateWidths());
		});
		resizeObserver.observe(logContainer);

		return () => resizeObserver.disconnect();
	});

	function formatDateTime(iso: string): string {
		const d = new Date(iso);
		const year = d.getUTCFullYear();
		const month = String(d.getUTCMonth() + 1).padStart(2, '0');
		const day = String(d.getUTCDate()).padStart(2, '0');
		const hour = String(d.getUTCHours()).padStart(2, '0');
		const min = String(d.getUTCMinutes()).padStart(2, '0');
		const sec = String(d.getUTCSeconds()).padStart(2, '0');
		return `${year}.${month}.${day} // ${hour}:${min}:${sec}Z`;
	}

	function formatLogTime(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleString('en-US', {
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		});
	}

	function formatRegion(region: string): string {
		return region.toUpperCase();
	}

	function shortRegion(region: string): string {
		const abbrevs: Record<string, string> = {
			eastus: 'eus',
			eastus2: 'eus2',
			westus: 'wus',
			westus2: 'wus2',
			westcentralus: 'wcus',
			centralus: 'cus',
			northeurope: 'neu',
			westeurope: 'weu',
			southeastasia: 'sea',
			japaneast: 'jpe'
		};
		return abbrevs[region.toLowerCase()] ?? region.slice(0, 4);
	}

	function formatBuildNumber(build: string): string {
		return build.replace(/^AiFoundry-/, '');
	}

	// Garbled log aesthetic helpers (ASCII + basic blocks for reliable monospace width)
	const GARBLE_CHARS = '░▒▓█#@%&*=-~.:;!?+<>^';

	function seededRandom(seed: number): number {
		const x = Math.sin(seed) * 10000;
		return x - Math.floor(x);
	}

	function randomGarble(length: number, seed: number): string {
		let result = '';
		for (let i = 0; i < length; i++) {
			const idx = (seededRandom(seed + i) * GARBLE_CHARS.length) | 0;
			result += GARBLE_CHARS[idx];
		}
		return result;
	}

	function garbleFieldParts(value: string | undefined, width: number, seed: number): { left: string; value: string; right: string } {
		if (!value) return { left: randomGarble(width, seed), value: '', right: '' };
		if (value.length >= width) return { left: '', value: value.slice(0, width), right: '' };

		const padding = width - value.length;
		const leftPad = (seededRandom(seed) * (padding + 1)) | 0;
		const rightPad = padding - leftPad;

		return {
			left: randomGarble(leftPad, seed),
			value,
			right: randomGarble(rightPad, seed + 100)
		};
	}
</script>

<svelte:head>
	<title>Days Since Last Foundry Build</title>
</svelte:head>

<div
	class="min-h-screen bg-neutral-950 font-mono flex items-center justify-center p-4 relative overflow-hidden"
	style="--vfd: 233, 114, 37;"
>
	<!-- Scanline overlay -->
	<div class="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)]"></div>

	<!-- Subtle vignette -->
	<div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>

	<div class="relative z-10 w-full max-w-4xl">
		<!-- Top status bar -->
		<div
			class="border px-4 py-2 grid grid-cols-3 items-center text-xs uppercase tracking-wider mb-6"
			style="border-color: rgba(var(--vfd), 0.3); background-color: rgba(var(--vfd), 0.05);"
		>
			<span style="color: rgb(var(--vfd)); text-shadow: 0 0 8px rgba(var(--vfd), 0.6);">[ SYSTEM MONITOR ]</span>
			<span class="text-center" style="color: rgba(var(--vfd), 0.7); text-shadow: 0 0 6px rgba(var(--vfd), 0.4);">◈ {formatRegion(region)}</span>
			<span class="text-right" style="color: rgba(var(--vfd), 0.5);">BUILD TRACKER v0.1</span>
		</div>

		<!-- Main display -->
		<div
			class="p-8 md:p-12 relative border"
			style="border-color: rgba(var(--vfd), 0.3); background-color: rgba(var(--vfd), 0.03);"
		>
			<!-- Corner accents -->
			<div class="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2" style="border-color: rgba(var(--vfd), 0.6);"></div>
			<div class="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2" style="border-color: rgba(var(--vfd), 0.6);"></div>
			<div class="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2" style="border-color: rgba(var(--vfd), 0.6);"></div>
			<div class="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2" style="border-color: rgba(var(--vfd), 0.6);"></div>

			<div class="text-center">
				<p
					class="text-sm uppercase tracking-[0.3em] mb-4"
					style="color: rgba(var(--vfd), 0.6); text-shadow: 0 0 10px rgba(var(--vfd), 0.3);"
				>
					Days Since Last Build
				</p>

				<!-- VFD-style number display -->
				<div class="relative inline-block">
					<!-- Glow layer (behind) -->
					<div
						class="absolute inset-0 text-[10rem] md:text-[14rem] font-bold leading-none blur-md select-none"
						style="color: rgba(var(--vfd), 0.3);"
						aria-hidden="true"
					>
						{days.toString().padStart(3, '0')}
					</div>
					<!-- Main number -->
					<div
						class="relative text-[10rem] md:text-[14rem] font-bold leading-none tracking-tight"
						style="color: rgb(var(--vfd)); text-shadow: 0 0 20px rgba(var(--vfd), 0.8), 0 0 40px rgba(var(--vfd), 0.4), 0 0 80px rgba(var(--vfd), 0.2);"
					>
						{days.toString().padStart(3, '0')}
					</div>
				</div>

				<p
					class="text-sm uppercase tracking-[0.2em] mt-4"
					style="color: rgba(var(--vfd), 0.6); text-shadow: 0 0 10px rgba(var(--vfd), 0.3);"
				>
					{days === 1 ? 'Day' : 'Days'} Elapsed
				</p>
			</div>
		</div>

		<!-- Bottom info panels -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
			<!-- Build info -->
			<div
				class="border px-4 py-3"
				style="border-color: rgba(var(--vfd), 0.3); background-color: rgba(var(--vfd), 0.03);"
			>
				<p class="text-[10px] uppercase tracking-widest mb-1" style="color: rgba(var(--vfd), 0.4);">Latest Build</p>
				<p class="text-lg font-bold" style="color: rgb(var(--vfd)); text-shadow: 0 0 8px rgba(var(--vfd), 0.5);">{formatBuildNumber(latestBuild.buildNumber)}</p>
			</div>

			<!-- Manifest hash -->
			<div
				class="border px-4 py-3"
				style="border-color: rgba(var(--vfd), 0.3); background-color: rgba(var(--vfd), 0.03);"
			>
				<p class="text-[10px] uppercase tracking-widest mb-1" style="color: rgba(var(--vfd), 0.4);">Manifest Hash</p>
				<p class="text-lg font-bold" style="color: rgb(var(--vfd)); text-shadow: 0 0 8px rgba(var(--vfd), 0.5);">{latestBuild.manifestHash}</p>
			</div>

			<!-- Last check -->
			<div
				class="border px-4 py-3"
				style="border-color: rgba(var(--vfd), 0.3); background-color: rgba(var(--vfd), 0.03);"
			>
				<p class="text-[10px] uppercase tracking-widest mb-1" style="color: rgba(var(--vfd), 0.4);">Last Check</p>
				<p class="text-lg font-bold" style="color: rgb(var(--vfd)); text-shadow: 0 0 8px rgba(var(--vfd), 0.5);">{formatDateTime(lastUpdatedAt)}</p>
			</div>
		</div>

		<!-- Change indicator -->
		<div class="mt-6 flex items-center justify-center gap-4 text-xs uppercase tracking-wider">
			<span style="color: rgba(var(--vfd), 0.4);">Last Change:</span>
			<span
				style="color: {changeType === 'build' || changeType === 'both' ? 'rgb(var(--vfd))' : 'rgba(var(--vfd), 0.2)'}; text-shadow: {changeType === 'build' || changeType === 'both' ? '0 0 8px rgba(var(--vfd), 0.6)' : 'none'};"
			>
				▲ BUILD
			</span>
			<span
				style="color: {changeType === 'hash' || changeType === 'both' ? 'rgb(var(--vfd))' : 'rgba(var(--vfd), 0.2)'}; text-shadow: {changeType === 'hash' || changeType === 'both' ? '0 0 8px rgba(var(--vfd), 0.6)' : 'none'};"
			>
				▲ MANIFEST
			</span>
		</div>

		<!-- System Log -->
		<div
			class="mt-6 border"
			style="border-color: rgba(var(--vfd), 0.3); background-color: rgba(var(--vfd), 0.03);"
		>
			<div
				class="px-4 py-2 border-b flex items-center gap-2"
				style="border-color: rgba(var(--vfd), 0.3);"
			>
				<span style="color: rgb(var(--vfd)); text-shadow: 0 0 8px rgba(var(--vfd), 0.6);">▌</span>
				<span class="text-xs uppercase tracking-wider" style="color: rgba(var(--vfd), 0.6);">System Log</span>
			</div>
			<div class="p-4 text-xs overflow-x-auto" bind:this={logContainer}>
				{#if checks.length === 0}
					<div style="color: rgba(var(--vfd), 0.4);">No check history available yet.</div>
				{:else}
					{#each checks as check, i}
						{@const seed = new Date(check.checkedAt).getTime()}
						{@const prevCheck = checks[i + 1]}
						{@const buildChanged = prevCheck && check.buildNumber !== prevCheck.buildNumber}
						{@const hashChanged = prevCheck && check.manifestHash !== prevCheck.manifestHash}
						{@const regionChanged = prevCheck && check.region !== prevCheck.region}
						{@const statusColor = check.status === 'ok' ? 'rgb(var(--vfd))' : 'rgb(220, 38, 38)'}
						{@const buildParts = garbleFieldParts(check.buildNumber ? formatBuildNumber(check.buildNumber) : undefined, buildWidth, seed)}
						{@const hashParts = garbleFieldParts(check.manifestHash, hashWidth, seed + 50)}
						<div class="py-0.5 whitespace-nowrap">
							<span style="color: rgba(var(--vfd), 0.4);">[{formatLogTime(check.checkedAt)}]</span>
							<span style="color: {statusColor}; text-shadow: 0 0 6px {check.status === 'ok' ? 'rgba(var(--vfd), 0.5)' : 'rgba(220, 38, 38, 0.5)'};">{check.status.toUpperCase().padStart(3)}</span>
							<span style="color: rgba(var(--vfd), 0.3);"> │ </span>
							<span style="color: {regionChanged ? 'rgb(var(--vfd))' : 'rgba(var(--vfd), 0.6)'}; text-shadow: {regionChanged ? '0 0 8px rgba(var(--vfd), 0.6)' : 'none'};">{shortRegion(check.region)}</span>
							<span style="color: rgba(var(--vfd), 0.3);"> │ </span>
							<span style="color: rgba(var(--vfd), 0.25);">{buildParts.left}</span><span style="color: {buildChanged ? 'rgb(var(--vfd))' : 'rgba(var(--vfd), 0.7)'}; text-shadow: {buildChanged ? '0 0 8px rgba(var(--vfd), 0.6)' : 'none'};">{buildParts.value}</span><span style="color: rgba(var(--vfd), 0.25);">{buildParts.right}</span>
							<span style="color: rgba(var(--vfd), 0.3);"> │ </span>
							<span style="color: rgba(var(--vfd), 0.25);">{hashParts.left}</span><span style="color: {hashChanged ? 'rgb(var(--vfd))' : 'rgba(var(--vfd), 0.7)'}; text-shadow: {hashChanged ? '0 0 8px rgba(var(--vfd), 0.6)' : 'none'};">{hashParts.value}</span><span style="color: rgba(var(--vfd), 0.25);">{hashParts.right}</span>
							<span style="color: rgba(var(--vfd), 0.3);"> │ </span>
							<span style="color: {check.isNewBuild ? 'rgb(var(--vfd))' : 'rgba(var(--vfd), 0.2)'}; text-shadow: {check.isNewBuild ? '0 0 8px rgba(var(--vfd), 0.8)' : 'none'};">{check.isNewBuild ? '*NEW' : '░░░░'}</span>
							{#if check.errorMessage}
								<span style="color: rgba(220, 38, 38, 0.7);"> {check.errorMessage}</span>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- Status indicator -->
		<div class="mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
			<span
				class="w-2 h-2 rounded-full animate-pulse"
				style="background-color: rgb(var(--vfd)); box-shadow: 0 0 8px rgba(var(--vfd), 0.8);"
			></span>
			<span style="color: rgba(var(--vfd), 0.5);">Monitoring (Hopefully) Active</span>
		</div>
	</div>

	<!-- CRT glitch interference overlay -->
	<div class="glitch-bands pointer-events-none absolute inset-0 overflow-hidden"></div>
</div>

<style>
	@keyframes display-glitch {
		0%, 100% {
			transform: none;
			filter: none;
			opacity: 1;
		}
		/* Calm period */
		5%, 84% {
			transform: none;
			filter: none;
			opacity: 1;
		}
		/* Glitch burst - horizontal shifts like v-sync issues */
		85% {
			transform: translateX(-4px);
			filter: contrast(1.15) brightness(1.05);
			opacity: 1;
		}
		85.5% {
			transform: translateX(6px);
			opacity: 0.9;
		}
		86% {
			transform: translateX(-2px);
			filter: contrast(0.95) brightness(1.1);
			opacity: 1;
		}
		86.5% {
			transform: translateX(3px);
			opacity: 0.95;
		}
		87% {
			transform: translateX(-5px);
			filter: contrast(1.1);
			opacity: 1;
		}
		87.5% {
			transform: translateX(0);
			opacity: 0.85;
		}
		88% {
			transform: translateX(2px);
			filter: brightness(1.08);
			opacity: 1;
		}
		88.5% {
			transform: translateX(-1px);
			opacity: 1;
		}
		89% {
			transform: none;
			filter: contrast(1.05);
			opacity: 1;
		}
		90% {
			transform: none;
			filter: none;
			opacity: 1;
		}
	}

	@keyframes chromatic-aberration {
		0%, 100% {
			text-shadow: none;
		}
		5%, 84% {
			text-shadow: none;
		}
		/* RGB channel separation */
		85% {
			text-shadow: -2px 0 rgba(255, 0, 64, 0.75), 2px 0 rgba(0, 255, 255, 0.75);
		}
		85.5% {
			text-shadow: 3px 0 rgba(255, 0, 64, 0.8), -3px 0 rgba(0, 255, 255, 0.8);
		}
		86% {
			text-shadow: -4px 0 rgba(255, 0, 64, 0.7), 4px 0 rgba(0, 255, 255, 0.7);
		}
		86.5% {
			text-shadow: 2px 0 rgba(255, 0, 64, 0.85), -2px 0 rgba(0, 255, 255, 0.85);
		}
		87% {
			text-shadow: -3px 0 rgba(255, 0, 64, 0.65), 3px 0 rgba(0, 255, 255, 0.65);
		}
		87.5% {
			text-shadow: 1px 0 rgba(255, 0, 64, 0.6), -1px 0 rgba(0, 255, 255, 0.6);
		}
		88% {
			text-shadow: -2px 0 rgba(255, 0, 64, 0.5), 2px 0 rgba(0, 255, 255, 0.5);
		}
		88.5% {
			text-shadow: 1px 0 rgba(255, 0, 64, 0.4), -1px 0 rgba(0, 255, 255, 0.4);
		}
		89% {
			text-shadow: -1px 0 rgba(255, 0, 64, 0.25), 1px 0 rgba(0, 255, 255, 0.25);
		}
		90% {
			text-shadow: none;
		}
	}

	@keyframes scan-interference {
		0%, 84% {
			transform: translateY(-100%);
			opacity: 0;
		}
		85% {
			transform: translateY(0%);
			opacity: 0.3;
		}
		86% {
			transform: translateY(20%);
			opacity: 0.5;
		}
		87% {
			transform: translateY(40%);
			opacity: 0.4;
		}
		88% {
			transform: translateY(60%);
			opacity: 0.6;
		}
		89% {
			transform: translateY(80%);
			opacity: 0.3;
		}
		90%, 100% {
			transform: translateY(100%);
			opacity: 0;
		}
	}


	:global(.glitch-bands::before),
	:global(.glitch-bands::after) {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(to bottom,
			transparent,
			rgba(233, 114, 37, 0.4) 40%,
			rgba(233, 114, 37, 0.6) 50%,
			rgba(233, 114, 37, 0.4) 60%,
			transparent);
		box-shadow: 0 0 8px rgba(233, 114, 37, 0.5);
		animation: scan-interference 12s steps(1) infinite;
	}

	:global(.glitch-bands::after) {
		height: 2px;
		background: linear-gradient(to bottom,
			transparent,
			rgba(233, 114, 37, 0.3) 50%,
			transparent);
		animation-delay: 0.5s;
	}

	/* Apply glitch effects to main content */
	:global(.relative.z-10) {
		animation: display-glitch 12s steps(1) infinite, chromatic-aberration 12s steps(1) infinite;
	}

	/* Respect reduced motion preference */
	@media (prefers-reduced-motion: reduce) {
		:global(.relative.z-10) {
			animation: none;
		}
		:global(.glitch-bands::before),
		:global(.glitch-bands::after) {
			animation: none;
			opacity: 0;
		}
	}
</style>
