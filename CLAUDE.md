# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A "days since last Azure AI Foundry build" tracker with two components:
1. **Data scraper** (root): Fetches build info from Azure AI Foundry hourly via GitHub Actions, stores in `data.json`
2. **Web frontend** (`web/`): SvelteKit static site displaying the countdown (Cloudflare Pages)

## Commands

### Data Scraper (root directory)
```bash
node main.ts          # Run scraper (requires Node 24.13.0)
```

### Web App (web/ directory)
```bash
cd web
bun install           # Install dependencies
bun run dev           # Dev server
bun run build         # Production build
bun run preview       # Preview production build locally
bun run check         # TypeScript/Svelte type checking
```

## Architecture

- `main.ts` - Scraper that fetches `https://ai.azure.com/nextgen`, extracts build config from embedded `<script id="ai-foundry-host-context">`, and updates `data.json`
- `types.ts` - Shared types for `FoundryBuild`, `FoundryConfig`, `Data`
- `data.json` - Build history with `firstSeenAt`, `lastSeenAt`, and raw config for each build
- `.github/workflows/check.yaml` - Hourly cron job that runs scraper and auto-commits changes
- `web/` - SvelteKit 2 + Svelte 5 + Tailwind v4, prerendered static site

## Workflow Preferences

- Do NOT automatically run dev servers (`bun run dev`) - User will run these manually
