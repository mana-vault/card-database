// Check the ids of the data: no id collides with another in its scope, and every
// reference between files points at an id that exists. JSON Schema sees one file
// at a time, so the ties between files are checked here.

import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// The component list that each field of a card refers to.
const CARD_FIELDS = {
  mana_cost: "mana_symbol",
  colors: "color",
  special_types: "special_type",
  card_types: "card_type",
  subtypes: "subtype",
} as const;

type CardField = keyof typeof CARD_FIELDS;

// Only the fields a check reads are written down; JSON Schema holds the full shape.
type Component = { id: string; value: string };
type Card = { card_id: string } & Partial<Record<CardField, string[]>>;
type SetFile = { set_code: string };
type Print = {
  card_id: string;
  set_code: string;
  lang: string;
  number: string;
};
type CardTranslation = { card_id: string; lang: string };
type SetTranslation = { set_code: string; lang: string };

/** The paths of the files under data/, mapped to the parsed content of each. */
export type FileTree = Map<string, unknown>;

// Every file is checked, so the patterns name each layer of data/.
const COMPONENT = /^data\/component\/([a-z_]+)\.json$/;
const CARD = /^data\/card\/([a-z0-9]{2})\/([a-z0-9_-]+)\.json$/;
const SET = /^data\/set\/([a-z0-9]+)\.json$/;
const PRINT = /^data\/print\/([a-z0-9-]+)\/([a-z0-9]+)\/([^/]+)\.json$/;
const CARD_TRANSLATION =
  /^data\/translation\/card\/([a-z0-9]{2})\/([a-z0-9_-]+)\/([a-z0-9-]+)\.json$/;
const SET_TRANSLATION =
  /^data\/translation\/set\/([a-z0-9]+)\/([a-z0-9-]+)\.json$/;

/**
 * Check a tree of parsed files against itself.
 *
 * @param files Paths such as data/component/color.json, mapped to the parsed content of each file.
 * @returns One line per problem, empty when the tree is sound.
 */
export function check(files: FileTree): string[] {
  const problems: string[] = [];
  const add = (path: string, message: string) =>
    problems.push(`${path}: ${message}`);
  const paths = [...files.keys()].sort();

  const componentIds = new Map<string, Set<string>>();
  for (const path of paths) {
    const match = COMPONENT.exec(path);
    if (!match) continue;
    const ids = new Set<string>();
    for (const entry of files.get(path) as Component[]) {
      if (ids.has(entry.id)) add(path, `the id ${entry.id} appears twice`);
      ids.add(entry.id);
    }
    componentIds.set(match[1], ids);
  }

  const cardIds = new Set<string>();
  for (const path of paths) {
    const match = CARD.exec(path);
    if (!match) continue;
    const card = files.get(path) as Card;
    if (cardIds.has(card.card_id))
      add(path, `the id ${card.card_id} appears twice`);
    cardIds.add(card.card_id);
    if (card.card_id !== match[2])
      add(path, `the file name does not match the id ${card.card_id}`);
    if (match[1] !== card.card_id.slice(0, 2))
      add(path, `the folder does not match the id ${card.card_id}`);
    for (const [field, list] of Object.entries(CARD_FIELDS) as [
      CardField,
      string,
    ][]) {
      const ids = componentIds.get(list) ?? new Set<string>();
      for (const value of card[field] ?? []) {
        if (!ids.has(value))
          add(
            path,
            `${field}: ${value} is not an id in data/component/${list}.json`,
          );
      }
    }
  }

  const setCodes = new Set<string>();
  for (const path of paths) {
    const match = SET.exec(path);
    if (!match) continue;
    const set = files.get(path) as SetFile;
    if (setCodes.has(set.set_code))
      add(path, `the code ${set.set_code} appears twice`);
    setCodes.add(set.set_code);
    if (match[1] !== set.set_code.toLowerCase())
      add(path, `the file name does not match the code ${set.set_code}`);
  }

  const printKeys = new Set<string>();
  for (const path of paths) {
    const match = PRINT.exec(path);
    if (!match) continue;
    const print = files.get(path) as Print;
    const key = `${print.set_code}|${print.lang}|${print.number}`;
    if (printKeys.has(key)) add(path, `the print ${key} appears twice`);
    printKeys.add(key);
    if (!cardIds.has(print.card_id))
      add(path, `the card ${print.card_id} has no file`);
    if (!setCodes.has(print.set_code))
      add(path, `the set ${print.set_code} has no file`);
    if (match[1] !== print.lang)
      add(path, `the language folder does not match ${print.lang}`);
    if (match[2] !== print.set_code.toLowerCase())
      add(path, `the set folder does not match ${print.set_code}`);
    if (match[3] !== print.number)
      add(path, `the file name does not match the number ${print.number}`);
  }

  for (const path of paths) {
    const match = CARD_TRANSLATION.exec(path);
    if (!match) continue;
    const translation = files.get(path) as CardTranslation;
    if (!cardIds.has(translation.card_id))
      add(path, `the card ${translation.card_id} has no file`);
    if (match[2] !== translation.card_id)
      add(path, `the card folder does not match ${translation.card_id}`);
    if (match[3] !== translation.lang)
      add(
        path,
        `the file name does not match the language ${translation.lang}`,
      );
  }

  for (const path of paths) {
    const match = SET_TRANSLATION.exec(path);
    if (!match) continue;
    const translation = files.get(path) as SetTranslation;
    if (!setCodes.has(translation.set_code))
      add(path, `the set ${translation.set_code} has no file`);
    if (match[1] !== translation.set_code.toLowerCase())
      add(path, `the set folder does not match ${translation.set_code}`);
    if (match[2] !== translation.lang)
      add(
        path,
        `the file name does not match the language ${translation.lang}`,
      );
  }

  for (const path of paths) {
    const known =
      COMPONENT.test(path) ||
      CARD.test(path) ||
      SET.test(path) ||
      PRINT.test(path) ||
      CARD_TRANSLATION.test(path) ||
      SET_TRANSLATION.test(path);
    if (path.startsWith("data/") && !known)
      add(path, "no layer of data/ covers this file");
  }

  return problems;
}

async function loadTree(
  root: string,
): Promise<{ files: FileTree; errors: string[] }> {
  const files: FileTree = new Map();
  const errors: string[] = [];
  const entries = await readdir(join(root, "data"), {
    recursive: true,
    withFileTypes: true,
  });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const path = relative(root, join(entry.parentPath, entry.name));
    try {
      files.set(path, JSON.parse(await readFile(join(root, path), "utf8")));
    } catch (error) {
      errors.push(
        `${path}: cannot be read as JSON (${(error as Error).message})`,
      );
    }
  }
  return { files, errors };
}

async function main(): Promise<void> {
  const { files, errors } = await loadTree(ROOT);
  const problems = [...errors, ...check(files)];
  for (const problem of problems) console.error(problem);
  console.log(`${files.size} files checked, ${problems.length} problems`);
  process.exit(problems.length === 0 ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
