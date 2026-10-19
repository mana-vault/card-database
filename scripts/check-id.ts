// Check IDs and references that JSON Schema cannot validate across files.

import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const CARD_FIELDS = {
  mana_cost: "card/mana_symbol",
  color_indicator: "card/color",
} satisfies Record<string, string>;

const TYPE_LINE_FIELDS = {
  supertypes: "card/type_line/supertype",
  card_types: "card/type_line/card_type",
  subtypes: "card/type_line/subtype",
} satisfies Record<string, string>;

const RULE_COMPONENT_REFERENCES: Record<string, string> = {
  ability_word_id: "card/ability/ability_word",
  keyword_ability_id: "card/ability/keyword_ability",
  action_id: "card/action/keyword_action",
  color_id: "card/color",
  card_type_id: "card/type_line/card_type",
  subtype_id: "card/type_line/subtype",
  supertype_id: "card/type_line/supertype",
  mana_symbol_id: "card/mana_symbol",
  counter_type_id: "card/counter_type",
};

const RULE_COMPONENT_REFERENCE_ARRAYS: Record<string, string> = {
  color_ids: "card/color",
  card_types: "card/type_line/card_type",
  card_type_ids: "card/type_line/card_type",
  spell_type_ids: "card/type_line/card_type",
  subtypes: "card/type_line/subtype",
  subtype_ids: "card/type_line/subtype",
  supertypes: "card/type_line/supertype",
  supertype_ids: "card/type_line/supertype",
  symbols: "card/mana_symbol",
  mana_symbol_ids: "card/mana_symbol",
};

type JsonRecord = Record<string, unknown>;
type SubtypeDefinition = { path: string; cardTypes: Set<string> };
type CardField = keyof typeof CARD_FIELDS;
type TypeLineField = keyof typeof TYPE_LINE_FIELDS;

/** Paths under data/, mapped to the parsed contents of each file. */
export type FileTree = Map<string, unknown>;

const COMPONENT = /^data\/(card|print)\/component\/(.+)\.json$/;
const CARD =
  /^data\/card\/(?!component\/)([a-z][a-z0-9_]*)\/([a-z0-9]{2})\/([a-z0-9_-]+)\.json$/;
const SET = /^data\/set\/([a-z0-9]+)\.json$/;
const PRINT =
  /^data\/print\/(?!component\/)([a-z0-9-]+)\/([a-z0-9]+)\/([^/]+)\.json$/;
const CARD_LANGUAGE =
  /^data\/language\/card\/([a-z0-9]{2})\/([a-z0-9_-]+)\/([a-z0-9-]+)\.json$/;
const SET_LANGUAGE = /^data\/language\/set\/([a-z0-9]+)\/([a-z0-9-]+)\.json$/;

function componentPath(listName: string): string {
  const [owner, ...parts] = listName.split("/");
  return `data/${owner}/component/${parts.join("/")}.json`;
}

function hasComponentId(
  componentIds: Map<string, Set<string>>,
  listName: string,
  id: string,
): boolean {
  if (listName === "card/mana_symbol" && /^\d+$/.test(id)) return true;
  return (componentIds.get(listName) ?? new Set()).has(id);
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function records(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

/** Whether a JSON Pointer of field names resolves from a root value. */
function pointerResolves(root: unknown, pointer: string): boolean {
  let current: unknown = root;
  for (const raw of pointer.split("/").slice(1)) {
    const segment = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (!isRecord(current) || !Object.hasOwn(current, segment)) return false;
    current = Reflect.get(current, segment) as unknown;
  }
  return true;
}

/** Collect the ability_id values of every rules_text in a card. */
function collectAbilityIds(value: unknown, ids: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectAbilityIds(item, ids);
    return;
  }
  if (!isRecord(value)) return;

  const abilities = value.abilities;
  if (Array.isArray(abilities)) {
    for (const ability of records(abilities)) {
      const id = stringField(ability, "ability_id");
      if (id !== undefined) ids.add(id);
    }
  }

  for (const nested of Object.values(value)) collectAbilityIds(nested, ids);
}

/** Check a tree of parsed data files against itself. */
export function check(files: FileTree): string[] {
  const problems: string[] = [];
  const add = (path: string, message: string) =>
    problems.push(`${path}: ${message}`);
  const paths = [...files.keys()].sort();
  const componentIds = new Map<string, Set<string>>();
  const subtypeCardTypes = new Map<string, SubtypeDefinition>();

  for (const path of paths) {
    const match = COMPONENT.exec(path);
    if (!match) continue;

    const listName = `${match[1]}/${match[2]}`;
    const ids = new Set<string>();
    const entries = files.get(path);
    for (const entry of records(entries)) {
      const id = stringField(entry, "id");
      if (id === undefined) continue;
      if (ids.has(id)) add(path, `the id ${id} appears twice`);
      ids.add(id);
      if (listName === "card/type_line/subtype") {
        const cardTypes = new Set(
          (Array.isArray(entry.card_types) ? entry.card_types : []).filter(
            (cardType): cardType is string => typeof cardType === "string",
          ),
        );
        subtypeCardTypes.set(id, { path, cardTypes });
      }
    }
    componentIds.set(listName, ids);
  }

  const cardTypeIds = componentIds.get("card/type_line/card_type") ?? new Set();
  for (const [subtypeID, definition] of subtypeCardTypes) {
    for (const cardType of definition.cardTypes) {
      if (!cardTypeIds.has(cardType)) {
        add(
          definition.path,
          `card_types: ${cardType} is not an id in ${componentPath("card/type_line/card_type")}`,
        );
      }
    }
    if (definition.cardTypes.size === 0)
      add(definition.path, `subtype ${subtypeID} has no card types`);
  }

  const known = (path: string, listName: string, id: string | undefined) => {
    if (id === undefined) return;
    if (!hasComponentId(componentIds, listName, id)) {
      add(path, `${id} is not an id in ${componentPath(listName)}`);
    }
  };

  const checkValues = (
    path: string,
    field: string,
    listName: string,
    values: unknown,
  ) => {
    for (const value of Array.isArray(values) ? values : []) {
      if (typeof value === "string") {
        const listPath = componentPath(listName);
        if (!hasComponentId(componentIds, listName, value)) {
          add(path, `${field}: ${value} is not an id in ${listPath}`);
        }
      }
    }
  };

  const cardIds = new Set<string>();
  const cardAbilityIds = new Map<string, Set<string>>();
  for (const path of paths) {
    const match = CARD.exec(path);
    if (!match) continue;

    const card = files.get(path);
    if (!isRecord(card)) continue;
    const cardID = stringField(card, "card_id");
    const layout = stringField(card, "layout");
    if (cardID === undefined || layout === undefined) continue;

    if (cardIds.has(cardID)) add(path, `the id ${cardID} appears twice`);
    cardIds.add(cardID);
    if (cardID !== match[3])
      add(path, `the file name does not match the id ${cardID}`);
    if (match[2] !== cardID.slice(0, 2))
      add(path, `the folder does not match the id ${cardID}`);
    if (match[1] !== layout)
      add(path, `the layout folder does not match the layout ${layout}`);
    known(path, "card/layout", layout);

    const abilityIds = new Set<string>();
    collectAbilityIds(card, abilityIds);
    cardAbilityIds.set(cardID, abilityIds);
  }

  for (const path of paths) {
    if (!CARD.test(path)) continue;
    const card = files.get(path);
    if (!isRecord(card)) continue;
    checkCardFaces(
      path,
      card,
      cardIds,
      componentIds,
      subtypeCardTypes,
      add,
      checkValues,
    );
  }

  const setCodes = new Set<string>();
  for (const path of paths) {
    const match = SET.exec(path);
    if (!match) continue;

    const set = files.get(path);
    if (!isRecord(set)) continue;
    const code = stringField(set, "set_code");
    if (code === undefined) continue;

    if (setCodes.has(code)) add(path, `the code ${code} appears twice`);
    setCodes.add(code);
    if (match[1] !== code.toLowerCase())
      add(path, `the file name does not match the code ${code}`);
  }

  const printKeys = new Set<string>();
  for (const path of paths) {
    const match = PRINT.exec(path);
    if (!match) continue;

    const print = files.get(path);
    if (!isRecord(print)) continue;
    const cardID = stringField(print, "card_id");
    const setCode = stringField(print, "set_code");
    const lang = stringField(print, "lang");
    const number = stringField(print, "number");
    const rarity = stringField(print, "rarity");
    if (
      cardID === undefined ||
      setCode === undefined ||
      lang === undefined ||
      number === undefined
    )
      continue;

    const key = `${setCode}|${lang}|${number}`;
    if (printKeys.has(key)) add(path, `the print ${key} appears twice`);
    printKeys.add(key);
    if (!cardIds.has(cardID)) add(path, `the card ${cardID} has no file`);
    if (!setCodes.has(setCode)) add(path, `the set ${setCode} has no file`);
    known(path, "print/rarity", rarity);
    checkValues(path, "platforms", "print/platform", print.platforms);
    if (match[1] !== lang)
      add(path, `the language folder does not match ${lang}`);
    if (match[2] !== setCode.toLowerCase())
      add(path, `the set folder does not match ${setCode}`);
    if (match[3] !== number)
      add(path, `the file name does not match the number ${number}`);
  }

  for (const path of paths) {
    const match = CARD_LANGUAGE.exec(path);
    if (!match) continue;

    const language = files.get(path);
    if (!isRecord(language)) continue;
    const cardID = stringField(language, "card_id");
    const lang = stringField(language, "lang");
    if (cardID === undefined || lang === undefined) continue;
    if (!cardIds.has(cardID)) add(path, `the card ${cardID} has no file`);
    if (match[1] !== cardID.slice(0, 2))
      add(path, `the folder does not match the id ${cardID}`);
    if (match[2] !== cardID)
      add(path, `the card folder does not match ${cardID}`);
    if (match[3] !== lang)
      add(path, `the file name does not match the language ${lang}`);

    const rulesText = language.rules_text;
    if (isRecord(rulesText)) {
      const seen = new Set<string>();
      for (const ability of records(rulesText.abilities)) {
        const abilityID = stringField(ability, "ability_id");
        if (abilityID === undefined) continue;
        if (seen.has(abilityID))
          add(path, `the ability id ${abilityID} appears twice`);
        seen.add(abilityID);
        if (!(cardAbilityIds.get(cardID) ?? new Set()).has(abilityID)) {
          add(
            path,
            `rules_text: ${abilityID} is not an ability of card ${cardID}`,
          );
        }
      }
    }
  }

  for (const path of paths) {
    const match = SET_LANGUAGE.exec(path);
    if (!match) continue;

    const language = files.get(path);
    if (!isRecord(language)) continue;
    const setCode = stringField(language, "set_code");
    const lang = stringField(language, "lang");
    if (setCode === undefined || lang === undefined) continue;
    if (!setCodes.has(setCode)) add(path, `the set ${setCode} has no file`);
    if (match[1] !== setCode.toLowerCase())
      add(path, `the set folder does not match ${setCode}`);
    if (match[2] !== lang)
      add(path, `the file name does not match the language ${lang}`);
  }

  for (const path of paths) {
    const record = files.get(path);
    if (isRecord(record)) checkHistory(path, record, add);
  }

  for (const path of paths) {
    const knownPath =
      COMPONENT.test(path) ||
      CARD.test(path) ||
      SET.test(path) ||
      PRINT.test(path) ||
      CARD_LANGUAGE.test(path) ||
      SET_LANGUAGE.test(path);
    if (path.startsWith("data/") && !knownPath)
      add(path, "no layer of data/ covers this file");
  }

  return problems;
}

/** Check the history records of one file against the file itself. */
function checkHistory(
  path: string,
  record: JsonRecord,
  add: (path: string, message: string) => void,
): void {
  if (!Array.isArray(record.history)) return;
  for (const entry of records(record.history)) {
    const pointer = stringField(entry, "path");
    if (pointer === undefined) continue;
    const segments = pointer.split("/").slice(1);
    if (
      !pointer.startsWith("/") ||
      segments.some((segment) => segment === "")
    ) {
      add(path, `history: ${pointer} is not a JSON Pointer`);
      continue;
    }
    if (segments.some((segment) => /^\d+$/.test(segment))) {
      add(path, `history: ${pointer} steps into a list`);
      continue;
    }
    if (!pointerResolves(record, pointer)) {
      add(path, `history: ${pointer} does not exist`);
    }
  }
}

function checkCardFaces(
  path: string,
  card: JsonRecord,
  cardIds: Set<string>,
  componentIds: Map<string, Set<string>>,
  subtypeCardTypes: Map<string, SubtypeDefinition>,
  add: (path: string, message: string) => void,
  checkValues: (
    path: string,
    field: string,
    listName: string,
    values: unknown,
  ) => void,
): void {
  const visit = (value: unknown, facePath: string): void => {
    if (Array.isArray(value)) {
      for (const [index, item] of value.entries())
        visit(item, `${facePath}/${index}`);
      return;
    }
    if (!isRecord(value)) return;

    if (isRecord(value.type_line)) {
      const cardFields: [CardField, string][] = [
        ["mana_cost", CARD_FIELDS.mana_cost],
        ["color_indicator", CARD_FIELDS.color_indicator],
      ];
      for (const [field, list] of cardFields)
        checkValues(
          path,
          `${facePath}${facePath ? "." : ""}${field}`,
          list,
          value[field],
        );

      const typeLineFields: [TypeLineField, string][] = [
        ["supertypes", TYPE_LINE_FIELDS.supertypes],
        ["card_types", TYPE_LINE_FIELDS.card_types],
        ["subtypes", TYPE_LINE_FIELDS.subtypes],
      ];
      for (const [field, list] of typeLineFields) {
        checkValues(
          path,
          `${facePath}${facePath ? "." : ""}type_line.${field}`,
          list,
          value.type_line[field],
        );
      }

      const cardTypeIDs = new Set(
        (Array.isArray(value.type_line.card_types)
          ? value.type_line.card_types
          : []
        ).filter(
          (cardType): cardType is string => typeof cardType === "string",
        ),
      );
      for (const subtype of Array.isArray(value.type_line.subtypes)
        ? value.type_line.subtypes
        : []) {
        if (typeof subtype !== "string") continue;
        const definition = subtypeCardTypes.get(subtype);
        if (
          definition !== undefined &&
          ![...definition.cardTypes].some((cardType) =>
            cardTypeIDs.has(cardType),
          )
        ) {
          add(
            path,
            `type_line.subtypes: ${subtype} is not valid for these card types`,
          );
        }
      }

      const rulesText = value.rules_text;
      if (isRecord(rulesText))
        checkAbilities(path, rulesText, cardIds, componentIds, add);
      return;
    }

    for (const [key, nested] of Object.entries(value)) {
      if (key === "history") continue;
      visit(nested, facePath ? `${facePath}.${key}` : key);
    }
  };

  visit(card, "");
}

function checkAbilities(
  path: string,
  rulesText: JsonRecord,
  cardIds: Set<string>,
  componentIds: Map<string, Set<string>>,
  add: (path: string, message: string) => void,
): void {
  checkRuleComponentReferences(path, rulesText, cardIds, componentIds, add);
  const abilities = records(rulesText.abilities);
  const ids = new Set<string>();
  const keywordInstances = new Map<string, string>();

  for (const ability of abilities) {
    const abilityID = stringField(ability, "ability_id");
    if (abilityID !== undefined) {
      if (ids.has(abilityID))
        add(path, `the ability id ${abilityID} appears twice`);
      ids.add(abilityID);
    }

    const keywordID = stringField(ability, "keyword_ability_id");
    const instanceID = stringField(ability, "keyword_instance_id");
    if (instanceID !== undefined && keywordID !== undefined) {
      const previous = keywordInstances.get(instanceID);
      if (previous !== undefined && previous !== keywordID) {
        add(
          path,
          `keyword instance ${instanceID} uses more than one keyword ID`,
        );
      }
      keywordInstances.set(instanceID, keywordID);
    }

    checkBody(path, ability.body, abilityID ?? "unknown", add);
    for (const effect of records(ability.effects))
      checkEffect(path, effect, new Set(), abilityID ?? "unknown", add);
  }
}

function checkBody(
  path: string,
  body: unknown,
  ownerID: string,
  add: (path: string, message: string) => void,
  inheritedTargets: Set<string> = new Set(),
): void {
  if (!isRecord(body)) return;
  const targets = new Set(inheritedTargets);
  for (const target of records(body.targets)) {
    const targetID = stringField(target, "target_id");
    if (targetID === undefined) continue;
    if (targets.has(targetID))
      add(path, `target id ${targetID} appears twice in one ability body`);
    targets.add(targetID);
  }

  checkSteps(path, body.steps, targets, ownerID, add);
}

function checkSteps(
  path: string,
  steps: unknown,
  targets: Set<string>,
  ownerID: string,
  add: (path: string, message: string) => void,
): void {
  for (const step of records(steps)) {
    const kind = stringField(step, "kind");
    if (kind === "effect") {
      const effect = step.effect;
      if (isRecord(effect)) checkEffect(path, effect, targets, ownerID, add);
    } else if (kind === "mode_selection") {
      checkModeGroup(path, step, targets, ownerID, add);
    } else if (kind === "unless") {
      checkSteps(path, step.steps, targets, ownerID, add);
    }
  }
}

function checkModeGroup(
  path: string,
  group: JsonRecord,
  inheritedTargets: Set<string>,
  ownerID: string,
  add: (path: string, message: string) => void,
): void {
  const modeIDs = new Set<string>();
  for (const mode of records(group.modes)) {
    const modeID = stringField(mode, "mode_id");
    if (modeID !== undefined) {
      if (modeIDs.has(modeID))
        add(path, `mode id ${modeID} appears twice in a mode group`);
      modeIDs.add(modeID);
    }
    checkBody(path, mode.body, ownerID, add, inheritedTargets);
  }
}

function checkEffect(
  path: string,
  effect: JsonRecord,
  targets: Set<string>,
  ownerID: string,
  add: (path: string, message: string) => void,
): void {
  const kind = stringField(effect, "kind");
  if (kind === "one_shot") {
    const operation = effect.operation;
    if (isRecord(operation))
      checkOperation(path, operation, targets, ownerID, add);
  } else if (kind === "continuous") {
    const form = effect.form;
    if (!isRecord(form)) return;
    if (stringField(form, "kind") === "replacement") {
      const operation = form.with;
      if (isRecord(operation))
        checkOperation(path, operation, targets, ownerID, add);
    }
  }
}

function checkOperation(
  path: string,
  operation: JsonRecord,
  targets: Set<string>,
  ownerID: string,
  add: (path: string, message: string) => void,
): void {
  const targetID = stringField(operation, "target_ref");
  if (targetID !== undefined && !targets.has(targetID))
    add(path, `target_ref ${targetID} is not declared in ability ${ownerID}`);
}

function checkRuleComponentReferences(
  path: string,
  value: unknown,
  cardIds: Set<string>,
  componentIds: Map<string, Set<string>>,
  add: (path: string, message: string) => void,
): void {
  if (Array.isArray(value)) {
    for (const item of value)
      checkRuleComponentReferences(path, item, cardIds, componentIds, add);
    return;
  }
  if (!isRecord(value)) return;

  for (const [field, nested] of Object.entries(value)) {
    if (
      field === "referenced_card_id" &&
      typeof nested === "string" &&
      !cardIds.has(nested)
    ) {
      add(path, `the referenced card ${nested} has no file`);
    }
    const singleList = RULE_COMPONENT_REFERENCES[field];
    if (singleList !== undefined && typeof nested === "string") {
      checkComponentReference(
        path,
        field,
        singleList,
        nested,
        componentIds,
        add,
      );
    }

    const arrayList = RULE_COMPONENT_REFERENCE_ARRAYS[field];
    if (arrayList !== undefined && Array.isArray(nested)) {
      for (const id of nested) {
        if (typeof id === "string")
          checkComponentReference(
            path,
            field,
            arrayList,
            id,
            componentIds,
            add,
          );
      }
    }

    checkRuleComponentReferences(path, nested, cardIds, componentIds, add);
  }
}

function checkComponentReference(
  path: string,
  field: string,
  listName: string,
  id: string | undefined,
  componentIds: Map<string, Set<string>>,
  add: (path: string, message: string) => void,
): void {
  if (id === undefined) return;
  if (!hasComponentId(componentIds, listName, id)) {
    add(path, `${field}: ${id} is not an id in ${componentPath(listName)}`);
  }
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
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${path}: cannot be read as JSON (${message})`);
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
