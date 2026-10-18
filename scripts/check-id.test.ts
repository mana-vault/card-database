import { expect, test } from "vitest";

import { check } from "./check-id";

// The tests break one value of an otherwise sound tree, so the tree is read loosely.
type Tree = Map<string, unknown>;

/** The parsed content of one file, read loosely so that a test can break one value. */
const at = (tree: Tree, path: string) =>
  tree.get(path) as Record<string, unknown>;

const list = (...entries: [string, string][]) =>
  entries.map(([id, value]) => ({ id, value }));

// The smallest tree that every check is happy with.
function sound(): Tree {
  return new Map<string, unknown>([
    [
      "data/component/card_type.json",
      list(["creature", "Creature"], ["instant", "Instant"]),
    ],
    ["data/component/color.json", list(["red", "red"])],
    ["data/component/mana_symbol.json", list(["R", "{R}"])],
    ["data/component/special_type.json", list(["legendary", "Legendary"])],
    ["data/component/subtype.json", []],
    [
      "data/set/sta.json",
      {
        set_code: "STA",
        name: "Strixhaven Mystical Archive",
        released_at: "2021-04-23",
      },
    ],
    [
      "data/card/li/lightning-bolt.json",
      {
        card_id: "lightning-bolt",
        kind: "normal",
        name: "Lightning Bolt",
        mana_cost: ["R"],
        colors: ["red"],
        card_types: ["instant"],
        oracle_text: "Lightning Bolt deals 3 damage to any target.",
      },
    ],
    [
      "data/print/ja/sta/105.json",
      {
        card_id: "lightning-bolt",
        set_code: "STA",
        lang: "ja",
        number: "105",
        rarity: "rare",
      },
    ],
    [
      "data/translation/card/li/lightning-bolt/ja.json",
      { card_id: "lightning-bolt", lang: "ja", name: "稲妻" },
    ],
    [
      "data/translation/set/sta/ja.json",
      { set_code: "STA", lang: "ja", name: "ミスティカルアーカイヴ" },
    ],
  ]);
}

const problemsOf = (tree: Tree) => check(tree).join("\n");

test("a sound tree passes", () => {
  expect(check(sound())).toEqual([]);
});

test("an id that appears twice in one component list is reported", () => {
  const tree = sound();
  tree.set("data/component/color.json", list(["red", "red"], ["red", "red"]));
  expect(problemsOf(tree)).toContain(
    "data/component/color.json: the id red appears twice",
  );
});

test("a card that refers to an unknown mana symbol is reported", () => {
  const tree = sound();
  at(tree, "data/card/li/lightning-bolt.json").mana_cost = ["U"];
  expect(problemsOf(tree)).toContain(
    "mana_cost: U is not an id in data/component/mana_symbol.json",
  );
});

test("a card that refers to an unknown color is reported", () => {
  const tree = sound();
  at(tree, "data/card/li/lightning-bolt.json").colors = ["purple"];
  expect(problemsOf(tree)).toContain(
    "colors: purple is not an id in data/component/color.json",
  );
});

test("a card that refers to an unknown card type is reported", () => {
  const tree = sound();
  at(tree, "data/card/li/lightning-bolt.json").card_types = ["interrupt"];
  expect(problemsOf(tree)).toContain(
    "card_types: interrupt is not an id in data/component/card_type.json",
  );
});

test("a card that refers to an unknown subtype is reported", () => {
  const tree = sound();
  at(tree, "data/card/li/lightning-bolt.json").subtypes = ["wizard"];
  expect(problemsOf(tree)).toContain(
    "subtypes: wizard is not an id in data/component/subtype.json",
  );
});

test("a card that does not live where its id says is reported", () => {
  const tree = sound();
  tree.delete("data/card/li/lightning-bolt.json");
  tree.set("data/card/xx/lightning-bolt.json", {
    ...at(sound(), "data/card/li/lightning-bolt.json"),
  });
  expect(problemsOf(tree)).toContain(
    "the folder does not match the id lightning-bolt",
  );
});

test("two cards that claim the same id are reported", () => {
  const tree = sound();
  tree.set("data/card/xx/lightning-bolt.json", {
    ...at(sound(), "data/card/li/lightning-bolt.json"),
  });
  expect(problemsOf(tree)).toContain("the id lightning-bolt appears twice");
});

test("a print whose card has no file is reported", () => {
  const tree = sound();
  at(tree, "data/print/ja/sta/105.json").card_id = "shock";
  expect(problemsOf(tree)).toContain("the card shock has no file");
});

test("a print whose set has no file is reported", () => {
  const tree = sound();
  at(tree, "data/print/ja/sta/105.json").set_code = "MKM";
  expect(problemsOf(tree)).toContain("the set MKM has no file");
});

test("a print that does not live where its values say is reported", () => {
  const tree = sound();
  const print = tree.get("data/print/ja/sta/105.json");
  tree.delete("data/print/ja/sta/105.json");
  tree.set("data/print/en/sta/165.json", print);
  expect(problemsOf(tree)).toContain("the language folder does not match ja");
  expect(problemsOf(tree)).toContain(
    "the file name does not match the number 105",
  );
});

test("two prints that claim the same set, language, and number are reported", () => {
  const tree = sound();
  tree.set("data/print/en/mkm/105.json", {
    ...at(sound(), "data/print/ja/sta/105.json"),
  });
  expect(problemsOf(tree)).toContain("appears twice");
});

test("a card translation whose card has no file is reported", () => {
  const tree = sound();
  at(tree, "data/translation/card/li/lightning-bolt/ja.json").card_id = "shock";
  expect(problemsOf(tree)).toContain("the card shock has no file");
});

test("a set translation whose set has no file is reported", () => {
  const tree = sound();
  at(tree, "data/translation/set/sta/ja.json").set_code = "MKM";
  expect(problemsOf(tree)).toContain("the set MKM has no file");
});

test("a file under data/ that no layer covers is reported", () => {
  const tree = sound();
  tree.set("data/notes.json", {});
  expect(problemsOf(tree)).toContain("no layer of data/ covers this file");
});
