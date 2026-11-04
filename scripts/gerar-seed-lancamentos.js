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

function parseTree(buf) {
  const entries = []
  let i = 0
  while (i < buf.length) {
    const spaceIdx = buf.indexOf(0x20, i)
    if (spaceIdx === -1) break
    const mode = buf.slice(i, spaceIdx).toString("utf8")
    const nullIdx = buf.indexOf(0x00, spaceIdx)
    if (nullIdx === -1) break
    const name = buf.slice(spaceIdx + 1, nullIdx).toString("utf8")
    const sha = buf.slice(nullIdx + 1, nullIdx + 21).toString("hex")
    entries.push({ mode, name, sha })
    i = nullIdx + 21
  }
  return entries
}

export function extractFromGit() {
  const tagSha = fs.readFileSync(".git/refs/tags/v0.0.408", "utf8").trim()
  const commit = readGitObject(tagSha)
  if (!commit) {
    throw new Error("Commit 0.0.408 not found: " + tagSha)
  }

  // Parse tree from commit
  const commitText = commit.content.toString("utf8")
  const treeMatch = commitText.match(/^tree ([0-9a-f]{40})/m)
  if (!treeMatch) {
    throw new Error("Tree not found in commit: " + commitText)
  }
  const rootTreeSha = treeMatch[1]
  const rootTree = readGitObject(rootTreeSha)
  const rootEntries = parseTree(rootTree.content)

  // Find src
  const srcEntry = rootEntries.find((e) => e.name === "src")
  if (!srcEntry) throw new Error("src not found in root tree")
  const srcTree = readGitObject(srcEntry.sha)
  const srcEntries = parseTree(srcTree.content)

  // Find pages
  const pagesEntry = srcEntries.find((e) => e.name === "pages")
  if (!pagesEntry) throw new Error("pages not found in src tree")
  const pagesTree = readGitObject(pagesEntry.sha)
  const pagesEntries = parseTree(pagesTree.content)

  // Find FolhaPagamento.tsx
  const folhaEntry = pagesEntries.find((e) => e.name === "FolhaPagamento.tsx")
  if (!folhaEntry) throw new Error("FolhaPagamento.tsx not found in pages tree")

  const folhaBlob = readGitObject(folhaEntry.sha)
  if (!folhaBlob) throw new Error("FolhaPagamento.tsx blob not found")

  fs.writeFileSync("src/pages/FolhaPagamento.tsx", folhaBlob.content)
  console.log(
    "Restored src/pages/FolhaPagamento.tsx, size:",
    folhaBlob.content.length,
  )
}

extractFromGit()
