// Test git extract
import fs from "fs"
import zlib from "zlib"
import path from "path"

function readGitObject(sha) {
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

const tagSha = fs.readFileSync(".git/refs/tags/v0.0.408", "utf8").trim()
const commit = readGitObject(tagSha)
fs.writeFileSync(
  "git_result.txt",
  "Tag: " +
    tagSha +
    ", Commit type: " +
    commit?.type +
    ", size: " +
    commit?.size,
)
