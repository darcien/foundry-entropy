<script lang="ts">
	const days = 1; // TODO: calculate from data.json
	const buildNumber = 'AiFoundry-2026-Jan-13-2026-01-23.4'; // TODO: from data.json
	const lastChecked = '2026-01-24T08:58:43.906Z'; // TODO: from data.json
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
			class="border px-4 py-2 flex justify-between items-center text-xs uppercase tracking-wider mb-6"
			style="border-color: rgba(var(--vfd), 0.3); background-color: rgba(var(--vfd), 0.05);"
		>
			<span style="color: rgb(var(--vfd)); text-shadow: 0 0 8px rgba(var(--vfd), 0.6);">[ SYSTEM MONITOR ]</span>
			<span style="color: rgba(var(--vfd), 0.5);">AZURE AI FOUNDRY BUILD TRACKER v0.1</span>
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
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
			<!-- Build info -->
			<div
				class="border p-4"
				style="border-color: rgba(var(--vfd), 0.3); background-color: rgba(var(--vfd), 0.03);"
			>
				<p class="text-xs uppercase tracking-wider mb-2" style="color: rgba(var(--vfd), 0.4);">Latest Build</p>
				<p class="text-sm break-all" style="color: rgb(var(--vfd)); text-shadow: 0 0 8px rgba(var(--vfd), 0.5);">{buildNumber}</p>
			</div>

			<!-- Last check -->
			<div
				class="border p-4"
				style="border-color: rgba(var(--vfd), 0.3); background-color: rgba(var(--vfd), 0.03);"
			>
				<p class="text-xs uppercase tracking-wider mb-2" style="color: rgba(var(--vfd), 0.4);">Last Check</p>
				<p class="text-sm" style="color: rgb(var(--vfd)); text-shadow: 0 0 8px rgba(var(--vfd), 0.5);">{lastChecked}</p>
			</div>
		</div>

		<!-- Status indicator -->
		<div class="mt-6 flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
			<span
				class="w-2 h-2 rounded-full animate-pulse"
				style="background-color: rgb(var(--vfd)); box-shadow: 0 0 8px rgba(var(--vfd), 0.8);"
			></span>
			<span style="color: rgba(var(--vfd), 0.5);">Monitoring (Hopefully) Active</span>
		</div>
	</div>
</div>
