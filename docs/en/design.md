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

This database names this collection of components a `card`. A `card` holds them as structure, not as
printed text: the mana cost and the type line as references to the component lists, and the rules
text as the concepts the rules name, such as abilities, costs, targets, and effects. The words a
paper shows are held per language, under `print/<lang>/`, English included, except the flavor text,
which belongs to the `print`.
No product or language information enters a `card`.

Cards come in `layout`s. Most cards are ordinary, and the others carry several faces or parts, such
as double-faced, split, and adventure cards. A `card` names its `layout` by the id of a value in
`data/oracle/card/component/layout.json`. The shape of the values is fixed per `layout`, and is never
shared as one shape across the `layout`s. An ordinary `card` holds its components directly. The
`layout`s with several faces hold the values per face, in fields named for the face. Each `layout`
has its own schema.

A `card` is registered once, and its identity never changes afterwards.

### Print

The same card does not always appear the same way in products: sets reprint cards, languages print
their own names and texts, and collaboration releases carry a card under another name. The
appearance of a `card` in one product is named a `print`.

A `print` is kept apart from the `card`, and holds:

- the set
- the collector number
- the language
- the platforms it appeared on
- the rarity
- the artist
- the image URL
- the flavor text it shows

A `print` points at the `card` it belongs to by its id. The flavor text is held here, because a
reprint can carry a different one; the other words the paper shows come from the card's words,
which every print shows the same way, unless the print holds its own. A card with several faces
shows one flavor text per face, so the `print`
holds them the same way the card holds its faces.

Rarity belongs to each `print`, not to the `card`, so a card's rarities are read from its prints. A
format's legality is worked out from those prints and is not stored here: a card with a common print
is Pauper-legal, unless the format bans it.

## Directory layout

### data

```text
data/
  oracle/
    card/
      component/
        layout.json
        color.json
        mana_symbol.json
        counter_type.json
        rarity.json
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
    set/
      sta.json
  platform.json
  print/
    en/
      card/
        base/
          entity/li/lightning-bolt.json
          component/
            layout.json
            rarity.json
            ...
        fca/31.json
      set/
        base/sta.json
        sta/42.json
    ja/
      card/
        base/
          entity/li/lightning-bolt.json
          component/
            ...
        fca/31.json
      set/
        base/sta.json
        sta/105.json
```

The fixed data and the paper are held apart. `data/oracle/` holds the `card`s and the sets as
structure, without a word of any language. `data/platform.json` lists the platforms. `data/print/`
holds the paper, one folder per language, and the language folder holds three things by containment:
`card/`, the words of the cards; `set/`, for each set — the set's own name in `base/`, and the
prints inside it; and inside `card/`, the words themselves, `base/` for the words every print of
the card shows, and prints whose words differ hold their own file beside `base/`.

#### Component lists

`data/oracle/card/component/` holds one list per kind of component. Each entry holds the id that
card and print data reference; the word each language shows for the id lives in that language's
name list, under `data/print/<lang>/card/base/component/`, in the same shape: an id and its value.

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
| Rarities | `rarity.json` | `Common`, `Rare`, `Mythic rare` |

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
- `type_line`

The other values are held when the card has them. A `card` is assembled by referencing the values of
the component lists by id. Color is derived from the mana cost, color indicator, and
characteristic-defining abilities; it is not stored as a separate value.

The first folder of a card file is the `layout`, and below it come the first two characters of the
`card_id`. Lightning Bolt has the `card_id` `lightning-bolt`, so it sits in
`data/oracle/card/normal/li/lightning-bolt.json`.

#### Words

The words a paper shows live under `print/<lang>/card/`, in the language the folder names. The
words every print of a card shows the same way sit in `base/entity/`, one file per card:

- `lang`
- `card_id`

It holds the name, the type line, and the rules text. The name and the rules text are words, and
the rules text is one entry per ability, paired by `ability_id` with the card's structure; the type
line holds the same IDs the card holds, and the words for them are in the component name lists. The
Japanese words for the IDs live in `data/print/ja/card/base/component/`. The Japanese words of
Lightning Bolt are
`data/print/ja/card/base/entity/li/lightning-bolt.json`. Flavor text is not here: a reprint can
change it, so it belongs to the `print`.

A print whose words differ from the base — a collaboration release that prints another name, an
appearance that shows an older wording — holds its own file at `card/<set>/<number>.json`, named
for the print that shows them, and carries the same fields. The Final Fantasy release of Rhystic
Study is printed under the name Stay with Me, so its words sit at
`data/print/en/card/fca/31.json`.

The names of the components live under `base/` too, at `base/component/<list>.json`: each pairs the
id with the word that language shows. The
name of a set is a word of the paper, so it lives beside them, under `set/`: the English name of
Strixhaven Mystical Archive is `data/print/en/set/base/sta.json`.

#### Sets

Each set has one file. A set file needs:

- `set_code`
- `released_at`

Strixhaven Mystical Archive uses `STA` as its `set_code`. Its data is in `data/oracle/set/sta.json`.
The name of a set is a word, so it is held per language, like the words of a card: the English name
is `data/print/en/set/base/sta.json`.

Every `set_code` used anywhere in the repository has a file here.

#### Prints

One `print` per file, inside the folder of the set it belongs to, under `print/<lang>/set/`. A
`print` file needs:

- `card_id`
- `set_code`
- `number`
- `rarity`
- `platforms`

The `card` and the set it names must already have files, and the card's words must have one under
`card/base/entity/` in the print's language. Rarity is an id from
`data/oracle/card/component/rarity.json` and belongs to each `print`, so it may differ between
sets. Platforms are ids from `data/platform.json`, such as `paper` and `magic_online`. A `print`
also holds the flavor text this appearance shows, in the language of the print, when it has one.
Lightning Bolt appears in Strixhaven Mystical Archive as the Japanese print with collector number
105, so that file is `data/print/ja/set/sta/105.json`.

Register every `print` of a card. Format legality is read from the prints, so a card that has only
a rare print here and a common print left out would look illegal.

### schema

The content of each file is governed by a schema written in the
[JSON Schema](https://json-schema.org/) format.

```text
schema/
  data.schema.json
  component.schema.json
  oracle/
    set.json
    card/
      card.schema.json
      normal.schema.json
      split.schema.json
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
  print/
    print.json
    set.schema.json
    card/
      card.schema.json
      normal.json
      split.json
      nonmodal_double_faced.json
      component/
        identity.schema.json
        face.schema.json
        type_line.schema.json
        rules_text.schema.json
  correction.schema.json
```

Most schema paths follow the data paths. `schema/component.schema.json` governs the lists that pair
an id with a value: `data/platform.json` and the name lists under
`data/print/<lang>/card/base/component/`. `schema/oracle/card/component/list.schema.json` governs
the id lists under `data/oracle/card/component/`. The subtype list has its own schema because each
subtype also names the card types it can accompany. The layout schemas govern the cards:
`schema/oracle/card/normal.schema.json` governs `data/oracle/card/normal/`, and
`schema/oracle/card/split.schema.json` governs `data/oracle/card/split/`.

`schema/data.schema.json` is the schema of every file under `data/`: for each kind of file it names
the schema that governs it.

Where the shape of a file depends on something else, another file picks the schema:
`schema/oracle/card/card.schema.json` picks by `layout`.

#### Cards

`face.schema.json` defines one face's characteristics, and `type_line.schema.json` defines its type
line. Under `rules_text/`, schemas are grouped by the rule concept they describe.

`schema/component.schema.json` holds the shape of an id-and-value list, and
`schema/oracle/card/component/list.schema.json` the shape of an id list.
`type_line/subtype.schema.json` also checks the card types associated with each subtype.

#### Words

A words file has one schema per layout under `schema/print/card/`, and the layouts compose the
parts in `card/component/`: the identity, one face's words, and the history. The base and the
exception share the schema: which one a file is follows its path, and check-id checks it. A set's
words (its name) have `schema/print/set.schema.json`.

#### The other files

`schema/correction.schema.json` holds one record of an official correction, which a `card`, a
`print`, and a words file append to their `history`. `schema/print/print.json` and
`schema/oracle/set.json` govern a `print` and a set.

## Official corrections

When Wizards of the Coast publishes a correction, the edit fixes the value and appends a record to
the `history` of the object that holds it. Records are appended, never written over, so every past
value stays visible in the data.

A record names the corrected value with a `path`, a JSON Pointer (RFC 6901) from the root of that
object. The path names fields only and never steps into a list, so an array is corrected as a whole.
`was` holds the value the path held before the correction, `source` the official announcement, and
`corrected_at` the date the value changed here.
