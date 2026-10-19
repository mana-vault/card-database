# Design: mana-vault card-database

Translations: [日本語](../ja/design.md)

## Aim

The aim of this database is to describe a card correctly as data.

Two things are needed first:

1. Give the card a stable name, so a card identifies itself.
2. Keep only the components the rules define on the card; product and language information lives
   outside it.

## Terms

### Card

The rules of Magic define what a card is: a game object composed of a card name, a mana cost,
colors, a type line, and rules text. The type line is composed of supertypes, card types, and
subtypes. Depending on the card type, power and toughness, loyalty, or a battle's defense is added.
The rules also allow one card to carry several faces or parts.

This database names this collection of components a `card`. A `card` holds the type line and the
mana cost as their parts, not as printed lines. Its values are English, and its component names
follow the official rules. No product or language information enters a `card`.

Cards come in `layout`s. Most cards are ordinary, and the others carry several faces or parts, such
as double-faced, split, and adventure cards. A `card` names its `layout` by the id of a value in
`data/card/component/layout.json`. The shape of the values is fixed per `layout`, and is never
shared as one shape across the `layout`s. An ordinary `card` holds its components directly. The
`layout`s with several faces hold the values per face, in fields named for the face. Each `layout`
has its own schema.

A `card` is registered once, and its identity never changes afterwards.

### Translation

What one language's paper shows is held as a `translation`: the pair of the thing that owns the
values and the language, writing only the values that differ from the English. The values on a paper
come from laying that language's `translation` over the English values.

A card's `translation` records the supertypes, card types, and subtypes of its type line in separate
fields, and its rules text in one entry per ability. The Japanese values of Lightning Bolt, for
example, record `インスタント` as its card type and its rules text under the `spell` ability.

Two kinds of thing own values so far: the `card`, and the set. A set's name too differs per
language: Strixhaven Mystical Archive is `ミスティカルアーカイブ` in Japanese.

### Print

The same card does not always appear the same way in products: sets reprint cards, languages print
their own names and texts, and collaboration releases carry a card under another name. The
appearance of a `card` in one product is named a `print`.

A `print` is kept apart from the `card`, and holds:

- the set
- the collector number
- the language
- the rarity
- the artist
- the image URL

A `print` points at the `card` it belongs to by its id. The values printed on the paper are not held
here.

## Directory layout

### data

```text
data/
  card/
    component/
      layout.json
      color.json
      mana_symbol.json
      counter_type.json
      type_line/
        supertype.json
        card_type.json
        subtype.json
      ability/
        ability_word.json
        keyword_ability.json
      action/
        keyword_action.json
    normal/li/lightning-bolt.json
  translation/
    card/li/lightning-bolt/ja.json
    set/sta/ja.json
  print/
    component/
      rarity.json
    en/sta/42.json
    ja/sta/105.json
  set/
    sta.json
```

#### Component lists

`data/card/component/` pairs each id with the value that Wizards of the Coast defines:

| Component | File | Example values |
| --- | --- | --- |
| Layouts | `layout.json` | `Normal`, `Split`, `Modal double-faced` |
| Colors | `color.json` | `white`, `blue`, `black`, `red`, `green` |
| Mana symbols | `mana_symbol.json` | `{W}`, `{U}`, `{R}` |
| Supertypes | `type_line/supertype.json` | `Basic`, `Legendary`, `World` |
| Card types | `type_line/card_type.json` | `Creature`, `Instant`, `Land` |
| Subtypes | `type_line/subtype.json` | `Human`, `Aura`, `Mountain` |
| Keyword abilities | `ability/keyword_ability.json` | `Flying`, `Ward`, `Flash` |
| Ability words | `ability/ability_word.json` | `Landfall`, `Metalcraft`, `Threshold` |
| Keyword actions | `action/keyword_action.json` | `Scry`, `Destroy`, `Exile` |
| Counter types | `counter_type.json` | `+1/+1`, `Loyalty`, `Poison` |

A list that serves one part of a card sits in a folder named for that part: type-line lists in
`type_line/`, ability lists in `ability/`, and action lists in `action/`. Each subtype entry also
lists the card types it can accompany. `layout.json` holds the `card`'s own `layout`; `color.json`,
`mana_symbol.json`, and `counter_type.json` serve several parts, so they stay directly under
`component/`.

A list takes a new value when Wizards of the Coast defines one. The id and its value stay a pair for
good: correcting the value leaves the id alone.

Numeric mana symbols use the number itself as the id and are not listed in `mana_symbol.json`.

#### Cards

A card file needs:

- `card_id`
- `layout`
- `name`
- `type_line`

The other values are held when the card has them. A `card` is assembled by referencing the values of
the component lists by id. Color is derived from the mana cost, color indicator, and
characteristic-defining abilities; it is not stored as a separate value.

The first folder of a card file is the `layout`, and below it come the first two characters of the
`card_id`. Lightning Bolt has the `card_id` `lightning-bolt`, so it sits in
`data/card/normal/li/lightning-bolt.json`.

#### Translations

A `translation` sits under `card/` or `set/`, whichever holds the thing it translates. It needs:

- `lang`
- the id of the thing it translates: `card_id` for a card, `set_code` for a set

A card's `translation` uses the same folders as the card: the Japanese values of Lightning Bolt are
`data/translation/card/li/lightning-bolt/ja.json`. A set's `translation` is one file per set: the
Japanese values of Strixhaven Mystical Archive are `data/translation/set/sta/ja.json`.

#### Sets

Each set has one file. A set file needs:

- `set_code`
- `name`
- `released_at`

Strixhaven Mystical Archive uses `STA` as its `set_code`. Its data is in `data/set/sta.json`.

Every `set_code` used anywhere in the repository has a file here.

#### Prints

One `print` per file, in folders by language, then by set. A `print` file needs:

- `card_id`
- `set_code`
- `number`
- `rarity`

The `card` and the set it names must already have files. Rarity is an id from
`data/print/component/rarity.json` and belongs to each `print`, so it may differ between sets.
Lightning Bolt appears in Strixhaven Mystical Archive as the Japanese print with collector number
105, so that file is `data/print/ja/sta/105.json`.

### schema

The content of each file is governed by a schema written in the
[JSON Schema](https://json-schema.org/) format.

```text
schema/
  data.schema.json
  component.schema.json
  card/
    card.schema.json
    normal.schema.json
    component/
      face.schema.json
      type_line.schema.json
      type_line/
        subtype.schema.json
      rules_text/
        rules_text.schema.json
        ability/
        condition/
          conditions/
          events/
        cost/
        effect/
          continuous/
            text_tokens/
          operation/
            keyword_action_arguments/
            mana_production/
        target/
        value/
          durations/
  translation/
    translation.schema.json
    card.schema.json
    set.schema.json
  print.json
  set.json
  correction.schema.json
```

Most schema paths follow the data paths. `schema/component.schema.json` governs the component
lists under both `data/card/component/` and `data/print/component/`. The subtype list has its own
schema because each subtype also names the card types it can accompany. The layout schema
`schema/card/normal.schema.json` governs `data/card/normal/`.

`schema/data.schema.json` is the schema of every file under `data/`: for each kind of file it names
the schema that governs it.

Where the shape of a file depends on something else, another file picks the schema:
`schema/card/card.schema.json` picks by `layout`, and
`schema/translation/translation.schema.json` by the thing a `translation` translates.

#### Cards

`face.schema.json` defines one face's characteristics, and `type_line.schema.json` defines its type
line. Under `rules_text/`, schemas are grouped by the rule concept they describe.

`schema/component.schema.json` holds the shape of a component list: an id and its value.
`type_line/subtype.schema.json` also checks the card types associated with each subtype.

#### Translations

A `translation` has one schema for a card and another for a set:
`schema/translation/card.schema.json` and `schema/translation/set.schema.json`.

#### The other files

`schema/correction.schema.json` holds one record of an official correction, which a `card` and a
`translation` both append to their `history`. `schema/print.json` and `schema/set.json` govern a
`print` and a set.

## Official corrections

When Wizards of the Coast publishes a correction to a card's text, the edit fixes the value and
appends a record to the `history` of the object that holds it, in the shape its schema defines.
Records are appended, never written over, so every past value stays visible in the data.
