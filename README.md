# mana-vault card-database

Structured card data for Magic: The Gathering, published as plain JSON files.

Translations: [日本語](docs/ja/readme.md)

The data comes in three kinds.

- A `card` is the object as the game's rules define it: its name, mana cost, type line, rules text,
  and each face of a multi-faced card, in English only.
- A `translation` holds the values of one language's paper, written only where they differ from the
  English.
- A `print` is one appearance of a `card` in a product: set, collector number, language, platform,
  rarity, and the artist.

Every `print` references the `card` it belongs to, and the values on its paper are put together from
the `card` and that language's `translation`. The schema and the file formats are documented in
[`docs/en/design.md`](docs/en/design.md).

See [CONTRIBUTING](CONTRIBUTING.md) to add or fix card data, and [LICENSE](LICENSE) for what is and
is not licensed here.

## Attribution & Fan Content

Card names, artwork, and related trademarks are copyright Wizards of the Coast, LLC. This project is
unofficial Fan Content permitted under the Wizards of the Coast
[Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy). Not approved/endorsed by
Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast
LLC.

Compliance with the [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy) is
what makes this repository possible, and it applies to every user of this data.

The data is provided free of charge, with no payment, registration, or paywall. What we make here —
the compilation and its structure — is dedicated to the public domain under [CC0](LICENSE); no
attribution is required.

Card names and rules texts are Wizards' IP; no rights over them are claimed here. Whoever reuses
the data follows the Fan Content Policy for their own reuse. If Wizards of the Coast requests
removal of any content, it is removed promptly.

Card images are not redistributed. The data carries only URLs to where the images are hosted.
