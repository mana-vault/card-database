# mana-vault card-database

Structured card data for Magic: The Gathering, published as plain JSON files.

The data has two layers: **cards** (the card's identity defined by the game's rules: name, colors, costs, texts, faces, translations) and **prints** (what actually appears in a product: set, collector number, language, rarity, artwork). A print references the card it belongs to, so every fact lives in exactly one place. The schema and file formats are documented in [`docs/design.md`](docs/design.md).

See [CONTRIBUTING.md](CONTRIBUTING.md) to add or fix card data, and [LICENSE](LICENSE) for what is and is not licensed here.

## Attribution & Fan Content

Card names, artwork, and related trademarks are copyright Wizards of the Coast, LLC. This project is **unofficial Fan Content permitted under the Wizards of the Coast [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy)**. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.

[Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy) compliance is what makes this repository possible, and it applies to every user of this data:

- **Free and open** — the data is provided free of charge, with no payment, registration, or paywall attached.
- **What we own vs. what Wizards owns** — our compilation (source code and JSON files) is dedicated to the public domain under [CC0](LICENSE); no attribution required. Card names and rules texts are Wizards' IP, and no rights over them are claimed here — when reusing them, please follow the Fan Content Policy yourself.
- **Card images are not redistributed** — the data includes image URLs pointing to the original host.
- **Removal** — if Wizards of the Coast requests removal of any content, it will be removed promptly.
