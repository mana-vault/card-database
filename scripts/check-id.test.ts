import { expect, test } from "vitest";

import { check } from "./check-id";

// The tests break one value of an otherwise sound tree, so the tree is read loosely.
type Tree = Map<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The parsed content of one file, read loosely so a test can break one value. */
const at = (tree: Tree, path: string) => {
  const value = tree.get(path);
  if (!isRecord(value)) throw new Error(`${path} is not an object`);
  return value;
};

const list = (...entries: [string, string][]) =>
  entries.map(([id, value]) => ({ id, value }));

const damage = (targetID = "recipient") => ({
  kind: "one_shot",
  operation: {
    kind: "deal_damage",
    amount: { kind: "fixed", value: 3 },
    target_ref: targetID,
  },
});

function sound(): Tree {
  return new Map<string, unknown>([
    [
      "data/card/component/ability/ability_word.json",
      list(["landfall", "Landfall"]),
    ],
    [
      "data/card/component/ability/keyword_ability.json",
      list(["flying", "Flying"], ["ward", "Ward"]),
    ],
    [
      "data/card/component/action/keyword_action.json",
      list(["scry", "Scry"], ["fateseal", "Fateseal"]),
    ],
    ["data/card/component/color.json", list(["red", "Red"])],
    [
      "data/card/component/layout.json",
      list(["normal", "Normal"], ["modal_double_faced", "Modal double-faced"]),
    ],
    ["data/card/component/mana_symbol.json", list(["R", "{R}"])],
    [
      "data/card/component/type_line/card_type.json",
      list(
        ["creature", "Creature"],
        ["instant", "Instant"],
        ["kindred", "Kindred"],
      ),
    ],
    [
      "data/card/component/type_line/subtype.json",
      [
        {
          id: "creature_wizard",
          value: "Wizard",
          card_types: ["creature", "kindred"],
        },
      ],
    ],
    [
      "data/card/component/type_line/supertype.json",
      list(["legendary", "Legendary"]),
    ],
    [
      "data/print/component/rarity.json",
      list(["common", "Common"], ["rare", "Rare"]),
    ],
    [
      "data/print/component/platform.json",
      list(["paper", "Paper"], ["magic_online", "Magic Online"]),
    ],
    [
      "data/set/sta.json",
      {
        set_code: "STA",
        name: "Strixhaven Mystical Archive",
        released_at: "2021-04-23",
      },
    ],
    [
      "data/card/normal/li/lightning-bolt.json",
      {
        card_id: "lightning-bolt",
        layout: "normal",
        name: "Lightning Bolt",
        mana_cost: ["R"],
        type_line: { card_types: ["instant"] },
        rules_text: {
          abilities: [
            {
              ability_id: "spell",
              kind: "spell",
              body: {
                targets: [
                  {
                    target_id: "recipient",
                    subject: { kind: "any_target" },
                    minimum: 1,
                    maximum: 1,
                  },
                ],
                steps: [{ kind: "effect", effect: damage() }],
              },
            },
          ],
        },
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
        platforms: ["paper"],
      },
    ],
    [
      "data/translation/card/li/lightning-bolt/ja.json",
      {
        card_id: "lightning-bolt",
        lang: "ja",
        name: "稲妻",
        type_line: { card_types: ["インスタント"] },
        rules_text: {
          abilities: [
            { ability_id: "spell", text: "３点のダメージを与える。" },
          ],
        },
      },
    ],
    [
      "data/translation/set/sta/ja.json",
      { set_code: "STA", lang: "ja", name: "ミスティカルアーカイブ" },
    ],
  ]);
}

const problemsOf = (tree: Tree) => check(tree).join("\n");

test("a sound tree passes", () => {
  expect(check(sound())).toEqual([]);
});

test("an id that appears twice in one component list is reported", () => {
  const tree = sound();
  tree.set(
    "data/card/component/color.json",
    list(["red", "Red"], ["red", "Red"]),
  );
  expect(problemsOf(tree)).toContain(
    "data/card/component/color.json: the id red appears twice",
  );
});

test("a card that refers to an unknown mana symbol is reported", () => {
  const tree = sound();
  at(tree, "data/card/normal/li/lightning-bolt.json").mana_cost = ["U"];
  expect(problemsOf(tree)).toContain(
    "mana_cost: U is not an id in data/card/component/mana_symbol.json",
  );
});

test("generic mana symbols use their numeric ID without a finite catalog entry", () => {
  const tree = sound();
  at(tree, "data/card/normal/li/lightning-bolt.json").mana_cost = ["12"];
  expect(check(tree)).toEqual([]);
});

test("a card that refers to an unknown color indicator is reported", () => {
  const tree = sound();
  at(tree, "data/card/normal/li/lightning-bolt.json").color_indicator = [
    "purple",
  ];
  expect(problemsOf(tree)).toContain(
    "color_indicator: purple is not an id in data/card/component/color.json",
  );
});

test("a card with an unknown layout is reported", () => {
  const tree = sound();
  at(tree, "data/card/normal/li/lightning-bolt.json").layout = "sideways";
  expect(problemsOf(tree)).toContain(
    "sideways is not an id in data/card/component/layout.json",
  );
});

test("a card that refers to an unknown card type is reported", () => {
  const tree = sound();
  at(tree, "data/card/normal/li/lightning-bolt.json").type_line = {
    card_types: ["interrupt"],
  };
  expect(problemsOf(tree)).toContain(
    "type_line.card_types: interrupt is not an id in data/card/component/type_line/card_type.json",
  );
});

test("a card that refers to an unknown subtype is reported", () => {
  const tree = sound();
  at(tree, "data/card/normal/li/lightning-bolt.json").type_line = {
    card_types: ["instant"],
    subtypes: ["mystic"],
  };
  expect(problemsOf(tree)).toContain(
    "type_line.subtypes: mystic is not an id in data/card/component/type_line/subtype.json",
  );
});

test("a subtype cannot be paired with an unrelated card type", () => {
  const tree = sound();
  at(tree, "data/card/normal/li/lightning-bolt.json").type_line = {
    card_types: ["instant"],
    subtypes: ["creature_wizard"],
  };
  expect(problemsOf(tree)).toContain(
    "type_line.subtypes: creature_wizard is not valid for these card types",
  );
});

test("a subtype is valid when the type line includes an allowed card type", () => {
  const tree = sound();
  at(tree, "data/card/normal/li/lightning-bolt.json").type_line = {
    card_types: ["creature"],
    subtypes: ["creature_wizard"],
  };
  expect(check(tree)).toEqual([]);
});

test("a type line may include more than one card type", () => {
  const tree = sound();
  at(tree, "data/card/normal/li/lightning-bolt.json").type_line = {
    card_types: ["creature", "instant"],
  };
  expect(check(tree)).toEqual([]);
});

test("references on each face of a multi-face layout are checked", () => {
  const tree = sound();
  const path = "data/card/normal/li/lightning-bolt.json";
  const card = at(tree, path);
  tree.delete(path);
  card.layout = "modal_double_faced";
  delete card.name;
  delete card.mana_cost;
  delete card.type_line;
  delete card.rules_text;
  card.front = {
    name: "Front",
    type_line: { card_types: ["instant"] },
  };
  card.back = {
    name: "Back",
    type_line: { card_types: ["creature"], subtypes: ["mystic"] },
  };
  tree.set("data/card/modal_double_faced/li/lightning-bolt.json", card);
  expect(problemsOf(tree)).toContain(
    "type_line.subtypes: mystic is not an id in data/card/component/type_line/subtype.json",
  );
});

test("an ability word that has no catalog entry is reported", () => {
  const tree = sound();
  const card = at(tree, "data/card/normal/li/lightning-bolt.json");
  card.rules_text = {
    abilities: [
      {
        ability_id: "spell",
        kind: "spell",
        ability_word_id: "unknown",
        body: {
          steps: [
            {
              kind: "effect",
              effect: {
                kind: "one_shot",
                operation: {
                  kind: "keyword_action",
                  action_id: "scry",
                  arguments: {
                    kind: "amount",
                    amount: { kind: "fixed", value: 1 },
                  },
                },
              },
            },
          ],
        },
      },
    ],
  };
  expect(problemsOf(tree)).toContain(
    "ability_word_id: unknown is not an id in data/card/component/ability/ability_word.json",
  );
});

test("a keyword ability that has no catalog entry is reported", () => {
  const tree = sound();
  const card = at(tree, "data/card/normal/li/lightning-bolt.json");
  card.rules_text = {
    abilities: [
      {
        ability_id: "flying",
        kind: "static",
        keyword_ability_id: "shadow",
        effects: [
          {
            kind: "continuous",
            form: { kind: "rule_change", rule: "cannot_block" },
          },
        ],
      },
    ],
  };
  expect(problemsOf(tree)).toContain(
    "keyword_ability_id: shadow is not an id in data/card/component/ability/keyword_ability.json",
  );
});

test("an effect that refers to an unknown keyword action is reported", () => {
  const tree = sound();
  const card = at(tree, "data/card/normal/li/lightning-bolt.json");
  card.rules_text = {
    abilities: [
      {
        ability_id: "spell",
        kind: "spell",
        body: {
          steps: [
            {
              kind: "effect",
              effect: {
                kind: "one_shot",
                operation: {
                  kind: "keyword_action",
                  action_id: "unknown",
                  arguments: { kind: "none" },
                },
              },
            },
          ],
        },
      },
    ],
  };
  expect(problemsOf(tree)).toContain(
    "action_id: unknown is not an id in data/card/component/action/keyword_action.json",
  );
});

test("rule-node color references are checked by ID", () => {
  const tree = sound();
  const card = at(tree, "data/card/normal/li/lightning-bolt.json");
  card.rules_text = {
    abilities: [
      {
        ability_id: "static",
        kind: "static",
        effects: [
          {
            kind: "continuous",
            form: {
              kind: "characteristic_change",
              subjects: [{ kind: "any_target" }],
              changes: [
                {
                  kind: "color_change",
                  operation: "add",
                  color_ids: ["purple"],
                },
              ],
            },
          },
        ],
      },
    ],
  };
  expect(problemsOf(tree)).toContain(
    "color_ids: purple is not an id in data/card/component/color.json",
  );
});

test("counter types in triggers are checked by ID", () => {
  const tree = sound();
  const card = at(tree, "data/card/normal/li/lightning-bolt.json");
  card.rules_text = {
    abilities: [
      {
        ability_id: "triggered",
        kind: "triggered",
        trigger: {
          event: { kind: "counter_change", counter_type_id: "rad" },
        },
        body: { steps: [] },
      },
    ],
  };
  expect(problemsOf(tree)).toContain(
    "counter_type_id: rad is not an id in data/card/component/counter_type.json",
  );
});

test("a keyword action nested in a chosen mode is checked", () => {
  const tree = sound();
  const card = at(tree, "data/card/normal/li/lightning-bolt.json");
  card.rules_text = {
    abilities: [
      {
        ability_id: "spell",
        kind: "spell",
        body: {
          steps: [
            {
              kind: "mode_selection",
              mode_group_id: "choose",
              selection: { minimum: 1, maximum: 1 },
              modes: [
                {
                  mode_id: "first",
                  body: {
                    steps: [
                      {
                        kind: "effect",
                        effect: {
                          kind: "one_shot",
                          operation: {
                            kind: "keyword_action",
                            action_id: "not_a_keyword_action",
                            arguments: { kind: "none" },
                          },
                        },
                      },
                    ],
                  },
                },
                {
                  mode_id: "second",
                  body: {
                    steps: [
                      {
                        kind: "effect",
                        effect: {
                          kind: "one_shot",
                          operation: {
                            kind: "keyword_action",
                            action_id: "scry",
                            arguments: {
                              kind: "amount",
                              amount: { kind: "fixed", value: 1 },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };
  expect(problemsOf(tree)).toContain(
    "action_id: not_a_keyword_action is not an id in data/card/component/action/keyword_action.json",
  );
});

test("an activated ability cost that refers to an unknown mana symbol is reported", () => {
  const tree = sound();
  const card = at(tree, "data/card/normal/li/lightning-bolt.json");
  card.rules_text = {
    abilities: [
      {
        ability_id: "activated",
        kind: "activated",
        cost: { kind: "mana", symbols: ["G"] },
        body: {
          steps: [
            {
              kind: "effect",
              effect: {
                kind: "one_shot",
                operation: {
                  kind: "keyword_action",
                  action_id: "scry",
                  arguments: {
                    kind: "amount",
                    amount: { kind: "fixed", value: 1 },
                  },
                },
              },
            },
          ],
        },
      },
    ],
  };
  expect(problemsOf(tree)).toContain(
    "symbols: G is not an id in data/card/component/mana_symbol.json",
  );
});

test("an effect that refers to an undeclared target is reported", () => {
  const tree = sound();
  const card = at(tree, "data/card/normal/li/lightning-bolt.json");
  card.rules_text = {
    abilities: [
      {
        ability_id: "spell",
        kind: "spell",
        body: {
          steps: [{ kind: "effect", effect: damage("missing") }],
        },
      },
    ],
  };
  expect(problemsOf(tree)).toContain(
    "target_ref missing is not declared in ability spell",
  );
});

test("a card that does not live where its id says is reported", () => {
  const tree = sound();
  tree.delete("data/card/normal/li/lightning-bolt.json");
  tree.set("data/card/normal/xx/lightning-bolt.json", {
    ...at(sound(), "data/card/normal/li/lightning-bolt.json"),
  });
  expect(problemsOf(tree)).toContain(
    "the folder does not match the id lightning-bolt",
  );
});

test("a card whose folder names another layout is reported", () => {
  const tree = sound();
  tree.delete("data/card/normal/li/lightning-bolt.json");
  tree.set("data/card/split/li/lightning-bolt.json", {
    ...at(sound(), "data/card/normal/li/lightning-bolt.json"),
  });
  expect(problemsOf(tree)).toContain(
    "the layout folder does not match the layout normal",
  );
});

test("two cards that claim the same id are reported", () => {
  const tree = sound();
  tree.set("data/card/normal/xx/lightning-bolt.json", {
    ...at(sound(), "data/card/normal/li/lightning-bolt.json"),
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

test("a print whose rarity has no component ID is reported", () => {
  const tree = sound();
  at(tree, "data/print/ja/sta/105.json").rarity = "mythic";
  expect(problemsOf(tree)).toContain(
    "mythic is not an id in data/print/component/rarity.json",
  );
});

test("a print whose platform has no component ID is reported", () => {
  const tree = sound();
  at(tree, "data/print/ja/sta/105.json").platforms = ["cardboard"];
  expect(problemsOf(tree)).toContain(
    "platforms: cardboard is not an id in data/print/component/platform.json",
  );
});

test("prints of a card may have different rarities in different sets", () => {
  const tree = sound();
  tree.set("data/set/mkm.json", {
    set_code: "MKM",
    name: "Murders at Karlov Manor",
    released_at: "2024-02-09",
  });
  tree.set("data/print/en/mkm/1.json", {
    card_id: "lightning-bolt",
    set_code: "MKM",
    lang: "en",
    number: "1",
    rarity: "common",
    platforms: ["paper", "magic_online"],
  });
  expect(check(tree)).toEqual([]);
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
  tree.set("data/print/en/sta/105.json", {
    ...at(sound(), "data/print/ja/sta/105.json"),
  });
  expect(problemsOf(tree)).toContain("appears twice");
});

test("a card translation whose card has no file is reported", () => {
  const tree = sound();
  at(tree, "data/translation/card/li/lightning-bolt/ja.json").card_id = "shock";
  expect(problemsOf(tree)).toContain("the card shock has no file");
});

test("a card translation that does not live where its id says is reported", () => {
  const tree = sound();
  tree.delete("data/translation/card/li/lightning-bolt/ja.json");
  tree.set("data/translation/card/xx/lightning-bolt/ja.json", {
    ...at(sound(), "data/translation/card/li/lightning-bolt/ja.json"),
  });
  expect(problemsOf(tree)).toContain(
    "the folder does not match the id lightning-bolt",
  );
});

test("a translation of an ability the card does not have is reported", () => {
  const tree = sound();
  at(tree, "data/translation/card/li/lightning-bolt/ja.json").rules_text = {
    abilities: [{ ability_id: "static", text: "..." }],
  };
  expect(problemsOf(tree)).toContain(
    "rules_text: static is not an ability of card lightning-bolt",
  );
});

test("two translations of the same ability are reported", () => {
  const tree = sound();
  at(tree, "data/translation/card/li/lightning-bolt/ja.json").rules_text = {
    abilities: [
      { ability_id: "spell", text: "..." },
      { ability_id: "spell", text: "..." },
    ],
  };
  expect(problemsOf(tree)).toContain("the ability id spell appears twice");
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
