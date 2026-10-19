# Contributing

Translations: [日本語](docs/ja/contributing.md)

Thanks for helping to improve the card database.

## Ways to contribute

This repository keeps the card data in `data/`, its JSON Schemas in `schema/`, and the design
documents in `docs/`. A contribution touches one of the areas:

| Area | What it involves |
| --- | --- |
| `card` | write a card file such as `data/oracle/card/normal/li/lightning-bolt.json`. The lists in `data/oracle/card/component/` hold the ids that a `card` references. |
| `print` | one file per print, such as `data/print/ja/sta/105.json`, with the words file it pairs with under `card/entity/`. The set of the print must be registered already. |
| Official corrections | when Wizards of the Coast publishes a correction, fix the values and append a record to the object's `history`. The record follows the schema. |
| Schemas and docs | changes under `schema/` or `docs/`. If the design of the change is not settled, raise an issue first. |

## Process

1. Check what already exists for the `card`, the set, or the language values you are about to touch.
2. Follow `docs/en/design.md` for the file format and where files live, and check the files you
   edit against their schemas under `schema/`.
3. Open a pull request, referencing the `card_id` or the `set_code`. For a schema or docs change,
   link the issue that settled the design.

## Review criteria

- Values match what is actually printed on the referenced `card`, including set, name, costs, and
  rarity.
- Strings are written exactly as they appear on the card, including spacing and line breaks.
- Every file touched by the change validates against its schema in `schema/`.
- A new `card_id` follows the rules in `docs/en/design.md` and does not collide with an existing
  one.
- An official correction appends its record to `history`, and past records are never rewritten.

## Ground rules

Card names and texts are intellectual property of Wizards of the Coast. Contributions must respect
the Wizards of the Coast [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy)
and the applicable laws of each jurisdiction. See [LICENSE](LICENSE) for what is and is not licensed
here.

In every pull request and issue, you must confirm, using the checkboxes in the templates, the two
points below.

1. You waive copyright and related rights in your contribution, including moral rights to the extent
   recognized under applicable law, or agree not to exercise or assert them. Where a right cannot be
   waived, the fallback grant in CC0 section 3 applies.
2. Your contribution respects the Fan Content Policy.
