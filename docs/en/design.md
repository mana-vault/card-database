# Design: mana-vault card-database

Translations: [日本語](../ja/design.md)

## Aim

The aim of this database is to define the card correctly as a dataset.

Two things are needed first:

1. Give the card a stable name, so a card identifies itself.
2. Keep only the components the rules define on the card; product and language information lives
   outside it.

## Terms

### Card

The rules of Magic define what a card is: a game object composed of a card name, a mana cost,
colors, a type line, and rules text. The type line is composed of special types, card types, and
subtypes. Depending on the card type, power and toughness, loyalty, or defense is added. The rules
also allow one card to carry several faces, as transform, split, adventure, and battle do.

This database names this collection of components a `card`. A `card` holds the type line and the
mana cost as their parts, so that no value has to be read out of a printed line. The values of a
`card` are English: the game is published by Wizards of the Coast, and English is the basis. The
component names follow the official rules. No product or language information enters a `card`.

Cards come in kinds: the ordinary kind, and the kinds that carry several faces, such as transform,
modal double-faced, split, adventure, and battle. The shape of the values is fixed per kind, and is
never flattened into one shape across the kinds. An ordinary card holds its components directly.
The kinds with several faces hold the values per face, in fields named for the face. Each kind has
its own schema.

A `card` is registered once, and its identity never changes afterwards. A wrong value is corrected
when it is found.

### Translation

English is the mold of the values. The values that a language's paper shows are held as a
`translation`. A `translation` is data of a pair: the thing that owns the values, and the language.
It writes only the values that differ from the English. The values of a paper are assembled by
overlaying its language's `translation` on the English values.

Two kinds of thing own values so far: the `card`, and the set. A set's name too differs per language
(`魔法彷徨の艦` / Murders at Karlov Manor).

### Print

In the world of products, the same card does not always appear the same way. Sets reprint cards.
Languages print their own names and texts on the paper. Collaboration releases carry a card under
another name. The appearance of a `card` in one product is named a `print`.

A `print` is kept as data of its own, apart from the `card`: the set, the collector number, the
language, the rarity, the artist, and the image URL. A `print` points at the `card` it belongs to by
its id. The values printed on the paper are not held here; they are assembled from the `card` and
the `translation`.

## Directory layout

```text
data/
  component/
    card_type.json
    subtype.json
    special_type.json
    color.json
    mana_symbol.json
  card/
    li/lightning-bolt.json
  translation/
    card/li/lightning-bolt/ja.json
    set/mh3/ja.json
  print/
    ja/mh3/170.json
  set/
    mh3.json
docs/
  en/…, ja/…
```

`data/component/` holds one list per component. An entry pairs the id with the value that Wizards of
the Coast defines:

| Component | File | Example values |
| --- | --- | --- |
| Card types | `card_type.json` | creatures, instants, lands |
| Subtypes | `subtype.json` | humans, auras, mountains |
| Special types | `special_type.json` | basic, legendary, world |
| Colors | `color.json` | white, blue, black, red, green |
| Mana symbols | `mana_symbol.json` | `{W}`, `{U}`, `{R}` |

A list grows only when Wizards of the Coast defines new values.

`data/card/` holds the `card`s. A `card` is assembled by referencing the values of these lists by
id. An id stays the same for good, so a correction to a value never invalidates the cards that point
at it. Folders split by the first two characters of the `card_id`; the file of Lightning Bolt is
`card/li/lightning-bolt.json`. No data content enters the folder names; the split only keeps every
folder growing evenly.

`data/translation/` holds the `translation`s, split first into `card/` and `set/`. A card's
`translation` splits the same way as `data/card/`, by the first two characters of the `card_id`: the
Japanese paper values of Lightning Bolt are `translation/card/li/lightning-bolt/ja.json`. Set
`translation`s are far fewer than `card_id`s, so they sit directly as one file per set: the Japanese
values of MH3 are `translation/set/mh3/ja.json`.

`data/set/` holds the body of each set as its own file: one set, one file. The fewness of sets needs
no even split. MH3 is `set/mh3.json`.

`data/print/` holds the `print`s. One `print` is one file, and folders split by language, then by
set. The Japanese print with number 170 of MH3 is `print/ja/mh3/170.json`. The values printed on the
paper do not live in this layer; they are assembled from the `card` and the `translation`.

Sets settle into this layer as well: every `set_code` used anywhere in the repository is registered
as a set file.

## Schemas

The content of each file is governed by a schema written in the
[JSON Schema](https://json-schema.org/) format. Because a schema spells out every shape of values
that a file may take, the data can be checked against it.

Schema files go into the `schema` directory, which mirrors the directory layout of `data`: the
schema of `data/component/` is `schema/component.json`; that of `data/card/` is `schema/card/`,
which holds one file per kind of `card`, the ordinary kind being
`schema/card/normal.schema.json`. A `translation` holds its schema
per kind as well, and since the shape of a `translation` does not depend on the language, languages
do not split it. A set's `translation` is about a different thing than a card's, so it holds its own
schema, `schema/translation/set.schema.json`. A `print` and a set correspond to `schema/print.json`
and `schema/set.json`.

```text
schema/
  component.json
  card/normal.schema.json
  translation/normal.schema.json
  translation/set.schema.json
  print.json
  set.json
```

## Official corrections

When an official correction to a card's text arrives, the edit appends a record to the `history` of
the thing holding the value, in the way that the schema of the file being edited defines. The edit
appends rather than rewrites, so that every value, the past ones included, stays visible in the
data.
