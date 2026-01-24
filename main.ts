import { readFile, writeFile } from "node:fs/promises";
import type { Check, CheckStatus, Data, FoundryBuild, FoundryConfig } from "./types";

const FOUNDRY_URL = "https://ai.azure.com/nextgen";
const DATA_FILE_PATH = "./data.json";
const MAX_CHECKS = 168; // 1 week of hourly checks

async function readData(filePath: string): Promise<Data> {
  try {
    const content = await readFile(filePath, "utf-8");
    const data = JSON.parse(content);

    if (
      typeof data === "object" &&
      data != null &&
      Array.isArray(data.builds)
    ) {
      // Ensure checks array exists for backward compatibility
      if (!Array.isArray(data.checks)) {
        data.checks = [];
      }
      return data as Data;
    }
    throw new Error("invalid data structure in data.json");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      console.log("data.json not found, creating a new one");
      return {
        lastUpdatedAt: new Date().toISOString(),
        builds: [],
        checks: [],
      };
    }
    throw error;
  }
}

async function writeData(filePath: string, data: Data): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  await writeFile(filePath, content, "utf-8");
}

function extractFoundryConfig(html: string): FoundryConfig | undefined {
  const scriptIdMatch = html.match(
    /<script id="ai-foundry-host-context"[^>]*>([\s\S]*?)<\/script>/,
  );

  if (scriptIdMatch) {
    const content = scriptIdMatch[1].trim();
    const decoded = decodeURIComponent(content);
    try {
      const config = JSON.parse(decoded);
      return config as FoundryConfig;
    } catch (error) {
      console.error("failed to parse Foundry config JSON:", error);
      return undefined;
    }
  }
  return undefined;
}

function addCheckToData(data: Data, check: Check): void {
  data.checks.unshift(check);
  if (data.checks.length > MAX_CHECKS) {
    data.checks = data.checks.slice(0, MAX_CHECKS);
  }
  data.lastUpdatedAt = check.checkedAt;
}

async function main() {
  const startTime = Date.now();
  const data = await readData(DATA_FILE_PATH);

  const createCheck = (
    status: CheckStatus,
    extra: Partial<Omit<Check, "checkedAt" | "status" | "durationMs">> = {},
  ): Check => ({
    checkedAt: new Date().toISOString(),
    status,
    durationMs: Date.now() - startTime,
    ...extra,
  });

  let res: Response;
  try {
    res = await fetch(FOUNDRY_URL);
  } catch (error) {
    const check = createCheck("network_error", {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    addCheckToData(data, check);
    await writeData(DATA_FILE_PATH, data);
    console.error(`failed to fetch ${FOUNDRY_URL}:`, error);
    process.exit(1);
  }

  if (!res.ok) {
    const check = createCheck("http_error", {
      httpStatus: res.status,
      errorMessage: `${res.status} ${res.statusText}`,
    });
    addCheckToData(data, check);
    await writeData(DATA_FILE_PATH, data);
    console.error(
      `failed to fetch ${FOUNDRY_URL}: ${res.status} ${res.statusText}`,
    );
    process.exit(1);
  }

  const rawHtml = await res.text();
  const config = extractFoundryConfig(rawHtml);

  console.log("<<config start");
  console.log(config);
  console.log("<<config end");

  if (!config) {
    const check = createCheck("parse_error", {
      httpStatus: res.status,
      errorMessage: "failed to extract config from HTML",
    });
    addCheckToData(data, check);
    await writeData(DATA_FILE_PATH, data);
    console.error("failed to extract Foundry config from HTML");
    process.exit(1);
  }

  if (!config.environment?.buildNumber) {
    const check = createCheck("missing_build_info", {
      httpStatus: res.status,
      errorMessage: "fonfig found but no buildNumber present",
    });
    addCheckToData(data, check);
    await writeData(DATA_FILE_PATH, data);
    console.log("could not find build information");
    process.exit(1);
  }

  const now = new Date().toISOString();
  const { buildNumber, ...foundryEnv } = config.environment;

  const existingBuildIndex = data.builds.findIndex(
    (build) => build.foundryEnv.buildNumber === buildNumber,
  );

  const isNewBuild = existingBuildIndex === -1;

  if (!isNewBuild) {
    console.log(`build ${buildNumber} already exists`);
    data.builds[existingBuildIndex].lastSeenAt = now;
  } else {
    console.log(`found new build: ${buildNumber}`);
    const newBuild: FoundryBuild = {
      firstSeenAt: now,
      lastSeenAt: now,
      foundryEnv: {
        ...foundryEnv,
        buildNumber,
      },
      rawConfig: config,
    };
    data.builds.unshift(newBuild);
  }

  const check = createCheck("ok", {
    httpStatus: res.status,
    buildNumber,
    isNewBuild,
  });
  addCheckToData(data, check);
  await writeData(DATA_FILE_PATH, data);

  console.log("done");
}

main().catch(async (error) => {
  console.error("unexpected error:", error);

  try {
    const data = await readData(DATA_FILE_PATH);
    const check: Check = {
      checkedAt: new Date().toISOString(),
      status: "unknown_error",
      durationMs: 0,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
    addCheckToData(data, check);
    await writeData(DATA_FILE_PATH, data);
  } catch {
    // Ignore errors when trying to save the error state
  }

  process.exit(1);
});
