import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const root = resolve(process.cwd());
const entries = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => name.startsWith("smag_") || name === "tier_comparison")
  .sort((a, b) => a.localeCompare(b));

function slugToTitle(slug) {
  return slug
    .replace(/^smag_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractTitle(html, fallback) {
  const match = html.match(/<title>(.*?)<\/title>/i);
  if (!match) return fallback;
  return match[1].replace(/\s+/g, " ").trim();
}

const screens = entries.map((folder) => {
  const htmlPath = join(root, folder, "code.html");
  const imagePath = join(root, folder, "screen.png");
  const html = readFileSync(htmlPath, "utf8");
  const title = extractTitle(html, slugToTitle(folder));
  const imageStats = statSync(imagePath);

  return {
    id: folder,
    folder,
    title,
    imagePath: `${folder}/screen.png`,
    imageBytes: imageStats.size
  };
});

const tsOutput = `/* eslint-disable max-len */
export type ReferenceScreen = {
  id: string;
  folder: string;
  title: string;
  imagePath: string;
  imageBytes: number;
};

export const screens: ReferenceScreen[] = ${JSON.stringify(screens, null, 2)} as ReferenceScreen[];

export function getScreenById(id?: string) {
  if (!id) return undefined;
  return screens.find((screen) => screen.id === id);
}
`;

writeFileSync(join(root, "src", "generated", "screens.ts"), tsOutput, "utf8");

const reportLines = [
  "# Smag Reference Analysis",
  "",
  `Total folders analyzed: ${screens.length}`,
  "",
  "| Folder | Title | HTML | Image | Image Size (bytes) |",
  "| --- | --- | --- | --- | ---: |",
  ...screens.map(
    (screen) =>
      `| ${screen.folder} | ${screen.title} | code.html | ${basename(
        screen.imagePath
      )} | ${screen.imageBytes} |`
  ),
  "",
  "All entries are wired to native React Native routes: `/:id`."
];

writeFileSync(join(root, "docs", "analysis.md"), reportLines.join("\n"), "utf8");

console.log(`Generated ${screens.length} screens and docs/analysis.md`);
