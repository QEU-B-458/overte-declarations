import { exec } from "child_process";
import { copyFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs"
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = __dirname;
const OVERTE_PATH = path.join(ROOT_DIR, "overte");
const GITMODULES_PATH = path.join(ROOT_DIR, ".gitmodules");
const SOURCE_CONFIG = path.join(ROOT_DIR, "overte-tsd-config.json");
const DEST_CONFIG = path.join(OVERTE_PATH, "tools", "jsdoc", "overte-tsd-config.json");

function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n✨ Running: ${command}`);
    const proc = exec(command, { cwd: ROOT_DIR, ...options }, (err, stdout, stderr) => {
      if (err) {
        console.error(`❌ Command failed: ${command}`);
        console.error(stderr);
        return reject(err);
      }
      resolve(stdout);
    });

    proc.stdout?.pipe(process.stdout);
    proc.stderr?.pipe(process.stderr);
  });
}

function validateOverteSubmodule() {
  if (!existsSync(OVERTE_PATH)) {
    console.error("❌ 'overte' directory does not exist.");
    process.exit(1);
  }

  if (!existsSync(GITMODULES_PATH)) {
    console.error("❌ .gitmodules file not found.");
    process.exit(1);
  }

  const contents = readFileSync(GITMODULES_PATH, "utf8");
  if (!contents.includes(`[submodule "overte"]`)) {
    console.error("❌ 'overte' is not declared as a git submodule.");
    process.exit(1);
  }

  console.log("✅ 'overte' submodule verified.");
}

async function copyConfigFile() {
  try {
    await copyFile(SOURCE_CONFIG, DEST_CONFIG);
    console.log(`📁 Copied config file to: ${DEST_CONFIG}`);
  } catch (err) {
    console.error(`❌ Failed to copy config file: ${err}`);
    process.exit(1);
  }
}

async function main() {
  validateOverteSubmodule();
  await copyConfigFile();

  const jsdocCmd = [
    "npx jsdoc",
    "overte/tools/jsdoc/root.js",
    "-r overte/tools/jsdoc/api-mainpage.md",
    "-c overte/tools/jsdoc/overte-tsd-config.json",
    "-d dist"
  ].join(" ");

  await runCommand(jsdocCmd);
}

await main();
