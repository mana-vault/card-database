---
name: mtg-terminology
description: >-
  Verify Magic rules and card terms against English and relevant official translation
  sources when editing data or documentation.
---

# Check MTG terminology

Use this skill when adding or changing a Magic term, keyword, card type, or rule explanation in
`data/`, `schema/`, `README.md`, or `docs/`.

## Check the English meaning

1. Find the relevant rule number in the current English Comprehensive Rules.
2. Read the rule and its referenced terms in context. Do not rely on a search-result excerpt.
3. Record the rule number when the change depends on a specific rule.

## Check the translated term

1. Check official terminology sources and card printings in the target language. For Japanese, use
   the Comprehensive Rules translation on mtg-jp.com, the keyword glossary, and the Japanese card
   printing that uses the term.
2. The Comprehensive Rules translation is a translation, not an official rules document, and the
   English text is the authority. Use its wording as the Japanese term, not as rules text.
3. If no official term exists in the target language, keep the English wording in card data. Label
   translated prose as a translation, not an official term.

For the English rules source and current Japanese references, read `references/official-sources.md`.

## Keep the project languages aligned

- Keep the card's rules text as structure. Put the printed words of every language, English
  included, in `data/print/<lang>/`.
- For documentation in other languages, preserve the English meaning and use official terminology
  where available. Translate prose naturally rather than word for word.
- Before finishing data changes, run `mise run check-data` and `mise run check-id`. For docs, run
  `mise run check-md`.
