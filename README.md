# mana-vault card-database

Structured card data for Magic: The Gathering, published as plain JSON files.

Translations: [日本語](docs/ja/readme.md)

The data comes in two layers.

- `data/oracle/` holds a `card` as the structure the game's rules define: its mana cost, colors, type
  line, and rules text, and each face of a multi-faced card. The sets are held here too. Not a word
  of any language is held here.
- `data/print/` holds the paper, one folder per language. A `print` is one appearance of a `card` in
  a product: set, collector number, language, platform, rarity, the artist, and the flavor text the
  appearance shows. Beside the prints, each language holds the words its papers show: the name, the
  type line, and the rules text of each print's card, the words for the component values a paper
  shows, and the names of the sets.

Every `print` references the `card` it belongs to, and pairs with the words file of the same
appearance. The flavor text belongs to the `print`. The schema and the file formats are documented
in [`docs/en/design.md`](docs/en/design.md).

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
