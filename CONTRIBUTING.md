# Contributing

Translations: [日本語](docs/ja/contributing.md)

Thanks for helping to improve the card database.

| Way | What it involves |
| --- | --- |
| Add a new `card` | write a `card file`. See `docs/en/design.md` for the schema and where files go |
| Fix data in an existing `card` | typos, wrong values, or missing `print`s |
| Report issues | anything that looks wrong on a `card` or in the schema |

## Process

1. Check whether the `card` already exists under `data/cards/`.
2. Follow `docs/en/design.md` for the file format and naming; `card file`s live at
   `data/cards/<first_set>/<card_id>.json`.
3. Open a pull request. Reference the `card_id` or the `set_code` in the PR description.

## Review criteria

- Values match what is actually printed on the referenced `card`, including set, name, costs, and
  rarity.
- Strings are written exactly as they appear on the card, including spacing and line breaks.
- `card_id` follows the rules in `docs/en/design.md` and does not collide with an existing one.

## Ground rules

Card names and texts are intellectual property of Wizards of the Coast. Contributions must respect
the Wizards of the Coast [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy)
and the applicable laws of each jurisdiction. See [LICENSE](LICENSE) for what is and is not licensed
here.

In every pull request and issue, you must confirm, using the checkboxes in the templates, that you
waive copyright and related rights in your contribution, including moral rights to the extent
recognized under applicable law, and that your contribution respects the Fan Content Policy.
