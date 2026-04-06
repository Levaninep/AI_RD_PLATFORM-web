const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function resolvePrismaCli() {
  try {
    const prismaPackagePath = require.resolve("prisma/package.json", {
      paths: [process.cwd()],
    });
    const prismaCliPath = path.join(
      path.dirname(prismaPackagePath),
      "build",
      "index.js",
    );

    return fs.existsSync(prismaCliPath) ? prismaCliPath : null;
  } catch {
    return null;
  }
}

const prismaCliPath = resolvePrismaCli();

if (!prismaCliPath) {
  process.exit(0);
}

const prismaResult = spawnSync(process.execPath, [prismaCliPath, "generate"], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: process.env,
});

if (prismaResult.status !== 0) {
  process.exit(prismaResult.status ?? 1);
}

const lightningCssResult = spawnSync(
  process.execPath,
  ["scripts/ensure-lightningcss-binary.cjs"],
  {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  },
);

process.exit(lightningCssResult.status ?? 1);
