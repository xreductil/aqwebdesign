import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const dashboardDist = path.resolve(projectRoot, "../dashboardsample/dist");
const adminOutput = path.join(projectRoot, "public/admin");

if (!fs.existsSync(dashboardDist)) {
  throw new Error(`Dashboard build not found: ${dashboardDist}`);
}

fs.rmSync(adminOutput, { recursive: true, force: true });
fs.cpSync(dashboardDist, adminOutput, { recursive: true });
console.log(`Copied dashboard to ${adminOutput}`);
