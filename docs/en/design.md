# Design: mana-vault card-database

Translations: [日本語](../ja/design.md)

## Aim

This database puts each Magic card into data correctly.

Two things decide how everything else is kept:

1. A card identifies itself by a name that never changes.
2. A card holds only what the rules define. What belongs to a product or a language is kept
   apart from the card.

## Card

The rules of Magic define what a card is: a game object composed of a card name, a mana cost,
colors, a type line, and rules text. The type line is composed of supertypes, card types, and
subtypes. Depending on the card type, power and toughness, loyalty, or a battle's defense is
added. The rules also allow one card to carry several faces or parts.

This database names this collection of the rules' components a `card`. A `card` holds structure
alone: the mana cost and the type line name values of the component lists by id, and the rules
text is the concepts the rules name — abilities, costs, targets, and effects. A `card` holds no
text of any language. The text the paper shows is held under `print/<lang>/`, English included,
except the flavor text, which belongs to the `print`.

Cards come in `layout`s. Most cards are ordinary, and the others carry several faces or parts,
such as double-faced, split, and adventure cards. A `card` names its `layout` by the id of a
value in `data/oracle/card/component/layout.json`. The shape of the values is fixed per
`layout`, and each `layout` has its own schema. A `card` is registered once, and its identity
never changes afterwards.

## Print

The same card does not always appear the same way in products: sets reprint cards, languages
print their own names and text, and collaboration releases carry a card under another name. The
appearance of a `card` in one product is a `print`.

A `print` is held apart from the `card`. It records the set, the collector number, the language,
the platforms, the rarity, the artist, and the image URL, and it holds the flavor text this
appearance shows. A later reprint can change the flavor text, so it belongs to the `print`; the
text every print of a card shares is held once per language, next to the card, and a print whose
text differs holds its own beside it.

Rarity belongs to each `print`, so a card's rarities are read from its prints. A format's
legality is worked out from those prints and is not stored here: a card with a common print is
Pauper-legal unless a format bans it.

## Principles

1. The components the rules define sit in lists, one id per value. A `card` and the prints name
   values by id, so a value is held once, and correcting the value leaves the id alone.
2. What is derivable is not stored: a card's colors, a format's legality, the notation a mana
   symbol prints (CR 107.4). What derivations start from is stored completely — every print of
   every card, the official corrections, and the banned and restricted lists.
3. The text a paper prints is held per language, next to the card, matched to the same ids the
   `card` holds: the name, the type line, the sentences of the rules text, and the values of the
   component lists in that language.
4. An official correction fixes the value and appends a record to its `history`. Past records
   are never rewritten; every value the data has held stays visible in the data.

## Directory layout

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
structure, without a word of any language, and `data/platform.json` lists the platforms.
`data/print/` holds the paper, one folder per language. A language folder holds two things:
`card/`, the cards' text — under `base/`, the text every print of a card shows, and beside it,
the files of the prints whose text differs — and `set/`, the sets' names in `base/` and the
prints inside them.

The schemas and the details of the files are described in [schema.md](schema.md).
