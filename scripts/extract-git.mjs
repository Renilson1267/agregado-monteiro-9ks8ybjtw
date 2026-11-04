import fs from "node:fs"
import zlib from "node:zlib"
import path from "node:path"

function readObject(sha) {
  const dir = sha.slice(0, 2)
  const file = sha.slice(2)
  const loosePath = path.join(".git", "objects", dir, file)
  if (fs.existsSync(loosePath)) {
    const buf = fs.readFileSync(loosePath)
    const decompressed = zlib.inflateSync(buf)
    const nullIdx = decompressed.indexOf(0)
    const header = decompressed.slice(0, nullIdx).toString("utf8")
    const [type, sizeStr] = header.split(" ")
    const content = decompressed.slice(nullIdx + 1)
    return { type, size: parseInt(sizeStr, 10), content }
  }
  return null
}

try {
  const tag0408 = fs.readFileSync(".git/refs/tags/v0.0.408", "utf8").trim()
  const commitObj = readObject(tag0408)
  if (!commitObj) {
    fs.writeFileSync("git_debug.txt", "Commit obj not found for " + tag0408)
  } else {
    fs.writeFileSync(
      "git_debug.txt",
      "Commit obj found: " +
        commitObj.type +
        "\n" +
        commitObj.content.toString("utf8"),
    )
  }
} catch (e) {
  fs.writeFileSync("git_debug.txt", "Error: " + e.stack)
}
