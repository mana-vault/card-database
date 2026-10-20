# Schema: mana-vault card-database

Translations: [日本語](../ja/schema.md)

This document describes the schemas of the repository and the data they check. The
[design](design.md) states the aim and the principles; the details live here.

## The schemas

Every file under `data/` is governed by a schema written in the JSON Schema format.

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

Most schema paths follow the data paths. `schema/component.schema.json` governs the lists that
pair an id with a value: `data/platform.json` and the name lists under
`data/print/<lang>/card/base/component/`. `schema/oracle/card/component/list.schema.json`
governs the id lists under `data/oracle/card/component/`. The subtype list has its own schema,
because each subtype also names the card types it can accompany. The schemas of the card's
`layout`s govern the cards: `schema/oracle/card/normal.schema.json` governs
`data/oracle/card/normal/`, and `schema/oracle/card/split.schema.json` governs
`data/oracle/card/split/`.

`schema/data.schema.json` is the schema of the file kinds: for each kind of file under `data/`,
it names the schema that governs it. Where the shape of a file depends on the `layout`, another
file picks the schema: `schema/oracle/card/card.schema.json` picks by `layout`.

The schemas below `schema/oracle/card/component/` hold the parts of a card:
`face.schema.json` defines one face's characteristics, and `type_line.schema.json` defines the
type line. Under `rules_text/`, the schemas are grouped by the rule concept they describe.

A card's text file has one schema per `layout` under `schema/print/card/`, and the schemas are
composed of the shared parts in `card/component/`: the identity, one face's text, and the
history. The base file and the exception file share the schema; which one a file is follows its
path, and check-id checks it. A set's name has
`schema/print/set.schema.json`, and a `print` has `schema/print/print.json`.

`schema/correction.schema.json` holds the shape of one official-correction record, which a
`card`, a `print`, and a text file append to their `history`.

## Component lists

`data/oracle/card/component/` holds one list per kind of component. Each entry holds the id that
card and print data reference; the value each language shows for the id lives in that language's
name list, under `data/print/<lang>/card/base/component/`, in the same shape: an id and its
value.

| Component | File | Example values |
| --- | --- | --- |
| Layouts | `layout.json` | `Normal`, `Split`, `Modal double-faced` |
| Colors | `color.json` | `white`, `blue`, `black`, `red`, `green` |
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
lists the card types it can accompany. `layout.json` holds the `card`'s own `layout`;
`color.json` and `counter_type.json` serve several parts, so they stay directly under
`component/`.

A component whose print is not text has no entry in the name lists. A mana symbol (CR 107.4) is
named by its id: `data/oracle/card/component/mana_symbol.json` is the list of the ids alone, and
`data/print/` holds no list for it. The notation a symbol prints (CR 107.7 for the symbol of a
cost) and the colon of an activated ability (CR 602.1a) are not data either; a `card` holds its
cost as structure.

A list takes a new value when Wizards of the Coast defines one. The id and its value stay a pair
for good: correcting the value leaves the id alone.

A numeric mana symbol (CR 107.4b) is named by the numeral it prints, and no list holds it.

## Cards

A card file needs:

- `card_id`
- `layout`
- `type_line`

The other values are held when the card has them. A `card` is assembled by referencing the values
of the component lists by id. Color is derived from the mana cost, the color indicator, and the
characteristic-defining abilities; it is not stored as a separate value.

The first folder of a card file is the `layout`, and below it come the first two characters of
the `card_id`. Lightning Bolt has the `card_id` `lightning-bolt`, so it sits in
`data/oracle/card/normal/li/lightning-bolt.json`.

## A card's printed text

The text a paper shows for a card is held under `print/<lang>/card/`, in the language the folder
names. The text every print of a card shows the same way sits in `base/entity/`, one file per
card:

- `lang`
- `card_id`

The file holds the name, the type line, and the rules text. The rules text is one entry per
ability, paired by `ability_id` with the card's structure. The `text` of an ability is the
sentence the ability prints: an item either holds characters of the sentence, as this language
prints them — `{"kind": "rawText", "value": " deals 3 damage to any target."}` — or names a
component the sentence shows, with the component's kind and id. The kind names the list it reads
from, for instance `mana_symbol` or `keyword_ability`, so `{"kind": "mana_symbol", "id": "R"}`
stands where the symbol prints. Where a component's print is text, the value for its id comes
from this language's name list; a symbol is named by its id alone, a generic one by the numeral
it prints (CR 107.4b), and the notation holds nowhere in the data.

The `text` of an activated ability is what follows the cost's colon (CR 602.1a): the card holds
the cost as structure, and the printed symbol (CR 107.7 for the loyalty symbol) and the colon do
not belong to this text.

The values for the ids in Japanese live in `data/print/ja/card/base/component/`. The Japanese
rules text of Lightning Bolt is
`data/print/ja/card/base/entity/li/lightning-bolt.json`.

The flavor text is not here: a reprint can change it, so it belongs to the `print`.

A print whose text differs from the base — a collaboration release that prints another name, an
appearance that shows an older wording — holds its own file at `card/<set>/<number>.json`, named
for the print that shows it, and carries the same fields. The Final Fantasy release of Rhystic
Study is printed under the name Stay with Me, so its text sits at
`data/print/en/card/fca/31.json`.

The name lists live under `base/` too, at `base/component/<list>.json`, each pairing an id with
the value that language shows. A set's name is text of the paper, so it lives beside them, under
`set/`: the English name of Strixhaven Mystical Archive is `data/print/en/set/base/sta.json`.

## A set

Each set has one file. A set file needs:

- `set_code`
- `released_at`

Strixhaven Mystical Archive uses `STA` as its `set_code`, and its data is
`data/oracle/set/sta.json`. The name of a set is text of the paper, so it is held per language,
the same way a card's name is: the English name is `data/print/en/set/base/sta.json`.

Every `set_code` used anywhere in the repository has a file here.

## A print

One `print` per file, inside the folder of the set it belongs to, under `print/<lang>/set/`. A
`print` file needs:

- `card_id`
- `set_code`
- `lang`
- `number`
- `rarity`
- `platforms`

The `card` and the set it names must have their files already, and the card's text file must
exist for the print's language. Rarity is an id from `data/oracle/card/component/rarity.json`
and belongs to each `print`, so it may differ between sets. Platforms are ids from
`data/platform.json`, such as `paper` and `magic_online`. A `print` also holds the flavor text
this appearance shows, in the language of the print, when it has one.

Lightning Bolt appears in Strixhaven Mystical Archive as the Japanese print with collector
number 105, so that file is `data/print/ja/set/sta/105.json`.

Every `print` of a card is registered. Format legality is read from the prints, so a card that
holds only its rare print here and leaves a common print out would look illegal.

## Official corrections

When Wizards of the Coast publishes a correction, the edit fixes the value and appends a record
to the `history` of the object that holds it. Records are appended, never written over, so every
past value stays visible in the data.

A record names the corrected value with a `path`, a JSON Pointer (RFC 6901) from the root of
that object. The path names fields only and never steps into a list, so an array is corrected as
a whole. `was` holds the value the path had before the correction, `source` the official
announcement, and `corrected_at` the date the value changed here.

## The checks

Two scripts check the data. The schemas validate each file's shape, and check-id follows the
references the data holds and confirms that the ids resolve where they are used. Both run before
every commit and in CI on every pull request.
