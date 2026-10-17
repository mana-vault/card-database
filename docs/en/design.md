# Design: mana-vault card-database

Translations: [日本語](../ja/design.md)

## Aim

The aim of this database is to define the card correctly as a dataset.

Two things are needed first:

1. Give the card a stable name, so a card identifies itself.
2. Keep only the components the rules define on the card; product and language information lives
   outside it.

## Card

The rules of Magic define what a card is: a game object composed of a card name, a mana cost,
colors, a type line, and rules text. The type line is composed of supertypes, card types, and
subtypes. Depending on the card type, power and toughness, loyalty, or defense is added. The rules
also allow one card to carry several faces, as transform, split, adventure, and battle do.

This database names this collection of components a `card`. The values of a `card` are English: the
game is published by Wizards of the Coast, and English is the basis. The component names follow the
official rules. No product or language information enters a `card`.

Cards come in kinds: the ordinary kind, and the kinds that carry several faces, such as transform,
modal double-faced, split, adventure, and battle. The shape of the values is fixed per kind, and is
never flattened into one shape across the kinds. An ordinary card holds its components directly.
The kinds with several faces hold the values per face, in fields named for the face. Each kind has
its own schema.

A `card` is registered once, and its identity never changes afterwards. A wrong value is corrected
when it is found.

## Print

In the world of products, the same card does not always appear the same way. Sets reprint cards.
Languages print their own names and texts on the paper. Collaboration releases carry a card under
another name. The appearance of a `card` in one product is named a `print`.

A `print` is kept as data of its own, apart from the `card`: the set, the collector number, the
language, the rarity, the artist, the image URL, and the values printed on that paper. Fields equal
to the canonical English are omitted. A `print` names the `card` it belongs to.
