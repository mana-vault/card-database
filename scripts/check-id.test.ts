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

const ids = (...entries: string[]) => entries.map((id) => ({ id }));

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
    ["data/oracle/card/component/ability/ability_word.json", ids("landfall")],
    [
      "data/oracle/card/component/ability/keyword_ability.json",
      ids("flying", "ward"),
    ],
    [
      "data/oracle/card/component/action/keyword_action.json",
      ids("scry", "fateseal"),
    ],
    ["data/oracle/card/component/color.json", ids("red")],
    [
      "data/oracle/card/component/layout.json",
      ids("normal", "modal_double_faced"),
    ],
    ["data/oracle/card/component/mana_symbol.json", ids("R")],
    [
      "data/oracle/card/component/type_line/card_type.json",
      ids("creature", "instant", "kindred"),
    ],
    [
      "data/oracle/card/component/type_line/subtype.json",
      [
        {
          id: "creature_wizard",
          card_types: ["creature", "kindred"],
        },
      ],
    ],
    ["data/oracle/card/component/type_line/supertype.json", ids("legendary")],
    ["data/oracle/card/component/rarity.json", ids("common", "rare")],
    ["data/print/en/card/component/color.json", list(["red", "Red"])],
    [
      "data/print/en/card/component/rarity.json",
      list(["common", "Common"], ["rare", "Rare"]),
    ],
    [
      "data/platform.json",
      list(["paper", "Paper"], ["magic_online", "Magic Online"]),
    ],
    [
      "data/oracle/set/sta.json",
      {
        set_code: "STA",
        released_at: "2021-04-23",
      },
    ],
    [
      "data/oracle/card/normal/li/lightning-bolt.json",
      {
        card_id: "lightning-bolt",
        layout: "normal",
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
        history: [
          { path: "/rarity", was: "mythic_rare", corrected_at: "2024-06-05" },
        ],
      },
    ],
    [
      "data/print/ja/card/entity/sta/105.json",
      {
        lang: "ja",
        card_id: "lightning-bolt",
        set_code: "STA",
        number: "105",
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
      "data/print/ja/set/sta.json",
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
    "data/oracle/card/component/color.json",
    list(["red", "Red"], ["red", "Red"]),
  );
  expect(problemsOf(tree)).toContain(
    "data/oracle/card/component/color.json: the id red appears twice",
  );
});

test("a card that refers to an unknown mana symbol is reported", () => {
  const tree = sound();
  at(tree, "data/oracle/card/normal/li/lightning-bolt.json").mana_cost = ["U"];
  expect(problemsOf(tree)).toContain(
    "mana_cost: U is not an id in data/oracle/card/component/mana_symbol.json",
  );
});

test("generic mana symbols use their numeric ID without a finite catalog entry", () => {
  const tree = sound();
  at(tree, "data/oracle/card/normal/li/lightning-bolt.json").mana_cost = ["12"];
  expect(check(tree)).toEqual([]);
});

test("a card that refers to an unknown color indicator is reported", () => {
  const tree = sound();
  at(tree, "data/oracle/card/normal/li/lightning-bolt.json").color_indicator = [
    "purple",
  ];
  expect(problemsOf(tree)).toContain(
    "color_indicator: purple is not an id in data/oracle/card/component/color.json",
  );
});

test("a card with an unknown layout is reported", () => {
  const tree = sound();
  at(tree, "data/oracle/card/normal/li/lightning-bolt.json").layout =
    "sideways";
  expect(problemsOf(tree)).toContain(
    "sideways is not an id in data/oracle/card/component/layout.json",
  );
});

test("a card that refers to an unknown card type is reported", () => {
  const tree = sound();
  at(tree, "data/oracle/card/normal/li/lightning-bolt.json").type_line = {
    card_types: ["interrupt"],
  };
  expect(problemsOf(tree)).toContain(
    "type_line.card_types: interrupt is not an id in data/oracle/card/component/type_line/card_type.json",
  );
});

test("a card that refers to an unknown subtype is reported", () => {
  const tree = sound();
  at(tree, "data/oracle/card/normal/li/lightning-bolt.json").type_line = {
    card_types: ["instant"],
    subtypes: ["mystic"],
  };
  expect(problemsOf(tree)).toContain(
    "type_line.subtypes: mystic is not an id in data/oracle/card/component/type_line/subtype.json",
  );
});

test("a subtype cannot be paired with an unrelated card type", () => {
  const tree = sound();
  at(tree, "data/oracle/card/normal/li/lightning-bolt.json").type_line = {
    card_types: ["instant"],
    subtypes: ["creature_wizard"],
  };
  expect(problemsOf(tree)).toContain(
    "type_line.subtypes: creature_wizard is not valid for these card types",
  );
});

test("a subtype is valid when the type line includes an allowed card type", () => {
  const tree = sound();
  at(tree, "data/oracle/card/normal/li/lightning-bolt.json").type_line = {
    card_types: ["creature"],
    subtypes: ["creature_wizard"],
  };
  expect(check(tree)).toEqual([]);
});

test("a type line may include more than one card type", () => {
  const tree = sound();
  at(tree, "data/oracle/card/normal/li/lightning-bolt.json").type_line = {
    card_types: ["creature", "instant"],
  };
  expect(check(tree)).toEqual([]);
});

test("references on each face of a multi-face layout are checked", () => {
  const tree = sound();
  const path = "data/oracle/card/normal/li/lightning-bolt.json";
  const card = at(tree, path);
  tree.delete(path);
  card.layout = "modal_double_faced";
  delete card.mana_cost;
  delete card.type_line;
  delete card.rules_text;
  card.front = {
    type_line: { card_types: ["instant"] },
  };
  card.back = {
    type_line: { card_types: ["creature"], subtypes: ["mystic"] },
  };
  tree.set("data/oracle/card/modal_double_faced/li/lightning-bolt.json", card);
  expect(problemsOf(tree)).toContain(
    "type_line.subtypes: mystic is not an id in data/oracle/card/component/type_line/subtype.json",
  );
});

test("an ability word that has no catalog entry is reported", () => {
  const tree = sound();
  const card = at(tree, "data/oracle/card/normal/li/lightning-bolt.json");
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
    "ability_word_id: unknown is not an id in data/oracle/card/component/ability/ability_word.json",
  );
});

test("a keyword ability that has no catalog entry is reported", () => {
  const tree = sound();
  const card = at(tree, "data/oracle/card/normal/li/lightning-bolt.json");
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
    "keyword_ability_id: shadow is not an id in data/oracle/card/component/ability/keyword_ability.json",
  );
});

test("an effect that refers to an unknown keyword action is reported", () => {
  const tree = sound();
  const card = at(tree, "data/oracle/card/normal/li/lightning-bolt.json");
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
    "action_id: unknown is not an id in data/oracle/card/component/action/keyword_action.json",
  );
});

test("rule-node color references are checked by ID", () => {
  const tree = sound();
  const card = at(tree, "data/oracle/card/normal/li/lightning-bolt.json");
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
    "color_ids: purple is not an id in data/oracle/card/component/color.json",
  );
});

test("counter types in triggers are checked by ID", () => {
  const tree = sound();
  const card = at(tree, "data/oracle/card/normal/li/lightning-bolt.json");
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
    "counter_type_id: rad is not an id in data/oracle/card/component/counter_type.json",
  );
});

test("a keyword action nested in a chosen mode is checked", () => {
  const tree = sound();
  const card = at(tree, "data/oracle/card/normal/li/lightning-bolt.json");
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
    "action_id: not_a_keyword_action is not an id in data/oracle/card/component/action/keyword_action.json",
  );
});

test("an activated ability cost that refers to an unknown mana symbol is reported", () => {
  const tree = sound();
  const card = at(tree, "data/oracle/card/normal/li/lightning-bolt.json");
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
    "symbols: G is not an id in data/oracle/card/component/mana_symbol.json",
  );
});

test("an effect that refers to an undeclared target is reported", () => {
  const tree = sound();
  const card = at(tree, "data/oracle/card/normal/li/lightning-bolt.json");
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
  tree.delete("data/oracle/card/normal/li/lightning-bolt.json");
  tree.set("data/oracle/card/normal/xx/lightning-bolt.json", {
    ...at(sound(), "data/oracle/card/normal/li/lightning-bolt.json"),
  });
  expect(problemsOf(tree)).toContain(
    "the folder does not match the id lightning-bolt",
  );
});

test("a card whose folder names another layout is reported", () => {
  const tree = sound();
  tree.delete("data/oracle/card/normal/li/lightning-bolt.json");
  tree.set("data/oracle/card/split/li/lightning-bolt.json", {
    ...at(sound(), "data/oracle/card/normal/li/lightning-bolt.json"),
  });
  expect(problemsOf(tree)).toContain(
    "the layout folder does not match the layout normal",
  );
});

test("two cards that claim the same id are reported", () => {
  const tree = sound();
  tree.set("data/oracle/card/normal/xx/lightning-bolt.json", {
    ...at(sound(), "data/oracle/card/normal/li/lightning-bolt.json"),
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
    "mythic is not an id in data/oracle/card/component/rarity.json",
  );
});

test("a print whose platform has no component ID is reported", () => {
  const tree = sound();
  at(tree, "data/print/ja/sta/105.json").platforms = ["cardboard"];
  expect(problemsOf(tree)).toContain(
    "platforms: cardboard is not an id in data/platform.json",
  );
});

test("prints of a card may have different rarities in different sets", () => {
  const tree = sound();
  tree.set("data/oracle/set/mkm.json", {
    set_code: "MKM",
    released_at: "2024-02-09",
  });
  tree.set("data/print/en/card/entity/mkm/1.json", {
    lang: "en",
    card_id: "lightning-bolt",
    set_code: "MKM",
    number: "1",
    name: "Lightning Bolt",
    type_line: { card_types: ["Instant"] },
    rules_text: {
      abilities: [
        {
          ability_id: "spell",
          text: "Lightning Bolt deals 3 damage to any target.",
        },
      ],
    },
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

test("a card's words whose card has no file are reported", () => {
  const tree = sound();
  at(tree, "data/print/ja/card/entity/sta/105.json").card_id = "shock";
  expect(problemsOf(tree)).toContain("the card shock has no file");
});

test("a card's words that do not live where their values say are reported", () => {
  const tree = sound();
  const words = { ...at(tree, "data/print/ja/card/entity/sta/105.json") };
  tree.delete("data/print/ja/card/entity/sta/105.json");
  tree.set("data/print/en/card/entity/sta/105.json", words);
  tree.set("data/print/ja/card/entity/mkm/105.json", { ...words });
  expect(problemsOf(tree)).toContain("the language folder does not match ja");
  expect(problemsOf(tree)).toContain("the set folder does not match STA");
});

test("words for an ability the card does not have are reported", () => {
  const tree = sound();
  at(tree, "data/print/ja/card/entity/sta/105.json").rules_text = {
    abilities: [{ ability_id: "static", text: "..." }],
  };
  expect(problemsOf(tree)).toContain(
    "rules_text: static is not an ability of card lightning-bolt",
  );
});

test("two texts for the same ability are reported", () => {
  const tree = sound();
  at(tree, "data/print/ja/card/entity/sta/105.json").rules_text = {
    abilities: [
      { ability_id: "spell", text: "..." },
      { ability_id: "spell", text: "..." },
    ],
  };
  expect(problemsOf(tree)).toContain("the ability id spell appears twice");
});

test("a set's name whose set has no file is reported", () => {
  const tree = sound();
  at(tree, "data/print/ja/set/sta.json").set_code = "MKM";
  expect(problemsOf(tree)).toContain("the set MKM has no file");
});

test("a print whose words have no file is reported", () => {
  const tree = sound();
  tree.delete("data/print/ja/card/entity/sta/105.json");
  expect(problemsOf(tree)).toContain(
    "the words of the print STA|ja|105 have no file",
  );
});

test("words of a card whose print has no file are reported", () => {
  const tree = sound();
  tree.delete("data/print/ja/sta/105.json");
  expect(problemsOf(tree)).toContain("the print STA|ja|105 has no file");
});

test("a component name for an id that has no catalog entry is reported", () => {
  const tree = sound();
  tree.set(
    "data/print/en/card/component/rarity.json",
    list(["common", "Common"], ["mythic", "Mythic"]),
  );
  expect(problemsOf(tree)).toContain(
    "mythic is not an id in data/oracle/card/component/rarity.json",
  );
});

test("a file under data/ that no layer covers is reported", () => {
  const tree = sound();
  tree.set("data/notes.json", {});
  expect(problemsOf(tree)).toContain("no layer of data/ covers this file");
});

test("a correction may point at a nested field", () => {
  const tree = sound();
  at(tree, "data/oracle/card/normal/li/lightning-bolt.json").history = [
    {
      path: "/type_line/card_types",
      was: ["sorcery"],
      corrected_at: "2024-06-05",
    },
  ];
  expect(check(tree)).toEqual([]);
});

test("a correction whose path does not exist is reported", () => {
  const tree = sound();
  at(tree, "data/print/ja/sta/105.json").history = [
    { path: "/rarityy", was: "common", corrected_at: "2024-06-05" },
  ];
  expect(problemsOf(tree)).toContain("history: /rarityy does not exist");
});

test("a correction whose path steps into a list is reported", () => {
  const tree = sound();
  at(tree, "data/print/ja/sta/105.json").history = [
    { path: "/platforms/0", was: "paper", corrected_at: "2024-06-05" },
  ];
  expect(problemsOf(tree)).toContain("history: /platforms/0 steps into a list");
});

test("a correction whose path is not a JSON Pointer is reported", () => {
  const tree = sound();
  at(tree, "data/print/ja/sta/105.json").history = [
    { path: "rarity", was: "common", corrected_at: "2024-06-05" },
  ];
  expect(problemsOf(tree)).toContain("history: rarity is not a JSON Pointer");
});

test("an unless step passes when its nested effect uses a declared target", () => {
  const tree = sound();
  const card = at(tree, "data/oracle/card/normal/li/lightning-bolt.json");
  card.rules_text = {
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
          steps: [
            {
              kind: "unless",
              player: "that_player",
              cost: { kind: "mana", symbols: ["R"] },
              steps: [{ kind: "effect", effect: damage() }],
            },
          ],
        },
      },
    ],
  };
  expect(check(tree)).toEqual([]);
});

test("an effect inside an unless step is checked against the declared target", () => {
  const tree = sound();
  const card = at(tree, "data/oracle/card/normal/li/lightning-bolt.json");
  card.rules_text = {
    abilities: [
      {
        ability_id: "spell",
        kind: "spell",
        body: {
          steps: [
            {
              kind: "unless",
              player: "that_player",
              cost: { kind: "mana", symbols: ["R"] },
              steps: [{ kind: "effect", effect: damage("missing") }],
            },
          ],
        },
      },
    ],
  };
  expect(problemsOf(tree)).toContain(
    "target_ref missing is not declared in ability spell",
  );
});

test("a color filter on a subject is checked by ID", () => {
  const tree = sound();
  const card = at(tree, "data/oracle/card/normal/li/lightning-bolt.json");
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
                  action_id: "scry",
                  arguments: {
                    kind: "subject",
                    subject: {
                      kind: "object",
                      zones: ["hand"],
                      controller: "you",
                      color: { operator: "has_any", color_ids: ["purple"] },
                    },
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
    "color_ids: purple is not an id in data/oracle/card/component/color.json",
  );
});
