const fs = require("fs");
const path = require("path");

if (process.platform !== "win32" || process.arch !== "x64") {
  process.exit(0);
}

const webNodeModules = path.join(__dirname, "..", "node_modules");
const rootNodeModules = path.join(__dirname, "..", "..", "node_modules");
const candidateSourcePaths = [
  path.join(
    webNodeModules,
    "lightningcss-win32-x64-msvc",
    "lightningcss.win32-x64-msvc.node",
  ),
  path.join(
    rootNodeModules,
    "lightningcss-win32-x64-msvc",
    "lightningcss.win32-x64-msvc.node",
  ),
];
const sourcePath = candidateSourcePaths.find((candidatePath) =>
  fs.existsSync(candidatePath),
);
const targetPath = path.join(
  webNodeModules,
  "lightningcss",
  "lightningcss.win32-x64-msvc.node",
);

if (!sourcePath) {
  process.exit(0);
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.copyFileSync(sourcePath, targetPath);
