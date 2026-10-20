import fs from "fs"

const data = fs.readFileSync(
  "scripts/backup-folha-2026-09-27-40a44.json",
  "utf8",
)
console.log("backup ok, length:", data.length)
