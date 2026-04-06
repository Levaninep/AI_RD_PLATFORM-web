const { spawnSync } = require("child_process");
const path = require("path");

if (process.env.AI_RD_SKIP_ROOT_POSTINSTALL === "1") {
  process.exit(0);
}

const webDir = path.join(__dirname, "..", "web");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const commonOptions = {
  cwd: webDir,
  stdio: "inherit",
  env: {
    ...process.env,
    AI_RD_SKIP_ROOT_POSTINSTALL: "1",
  },
};

const installResult = spawnSync(
  npmCmd,
  ["install", "--workspaces=false", "--ignore-scripts"],
  commonOptions,
);

if (installResult.status !== 0) {
  process.exit(installResult.status ?? 1);
}

const postinstallResult = spawnSync(
  npmCmd,
  ["run", "postinstall", "--workspaces=false"],
  commonOptions,
);

process.exit(postinstallResult.status ?? 1);
