# 設計:mana-vault card-database

## ねらい

このデータベースでは、カードを正確なデータとして収録します。

そのために、次の二つを基本とします。

1. カードを識別するため、変わらない名前を付けます。
2. カードにはルールで定められた情報だけを収録し、商品や言語の情報はカードと分けて収録します。

## 用語定義

### カード

Magic のルールでは、カードはカード名、マナ・コスト、色、タイプ行、ルール・テキストからなるゲームのオブジェクトです。タイプ行は、特殊タイプ、カード・タイプ、サブタイプで構成されます。カード・タイプに応じて、パワーとタフネス、忠誠度、バトルの守備値なども持ちます。両面カードや分割カードのように、通常とは異なる構成のカードもあります。

このデータベースでは、これらの情報をまとめて`カード`と呼びます。`カード`は、印刷されたものではなく、ルールにしたがって構造化して収録します。マナ・コストとタイプ行はコンポーネントの一覧を id で参照し、ルール・テキストはルールが定めた単位（能力、コスト、対象、効果など）に分けます。コンポーネントの名前には公式ルールの用語を使い、紙面に印刷される言葉は言語ごとに収録します。商品や言語の情報は`カード`本体には含めません。

カードのデータ形式は`レイアウト`によって異なります。`カード`には、`data/card/component/layout.json` に登録された id で`レイアウト`を指定します。通常のカードは各項目をカード本体に収録します。両面カードでは表面と裏面、分割カードではそれぞれの半分を分けて収録します。面ごとに値を分ける場合は、面の名前を付けた項目に収録します。レイアウトごとに専用のスキーマを使います。

カードを一度登録したら、その `card_id` は変えません。

### プリント

同じカードが複数のセットに再録されたり、言語ごとに異なるカード名やテキストで印刷されたりすることがあります。コラボ商品では、カードが別の名前で収録されることもあります。カードが特定の商品に収録されたときの情報を`プリント`と呼びます。

`プリント`は`カード`とは別に収録し、次の情報を持ちます。

- セット
- コレクター番号
- 言語
- 出た媒体
- レアリティ
- イラストレーター
- 画像の URL

`プリント`は、収録された`カード`を id で参照します。紙面に印刷された値は`プリント`には収録しません。

レアリティは`カード`ではなく`プリント`ごとに決まるので、カードのレアリティは`プリント`を並べて読みます。フォーマットのリーガル判定は`プリント`から導き、このデータベースには保存しません。common の`プリント`があればパウパーで使えますが、禁止されているカードは除きます。

## ディレクトリ構成

### data

```text
data/
  card/
    component/
      layout.json
      color.json
      mana_symbol.json
      counter_type.json
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
  language/
    card/li/lightning-bolt/en.json
    card/li/lightning-bolt/ja.json
    set/sta/ja.json
  print/
    component/
      rarity.json
      platform.json
    en/sta/42.json
    ja/sta/105.json
  set/
    sta.json
```

#### コンポーネントの一覧

`data/card/component/` の各一覧には、カードから参照する id と、その id に対応する値を登録します。値は Wizards of the Coast が定めたものです。

| コンポーネント | ファイル | 値の例 |
| --- | --- | --- |
| レイアウト | `layout.json` | `Normal`、`Split`、`Modal double-faced` |
| 色 | `color.json` | `white`、`blue`、`black`、`red`、`green` |
| マナ記号 | `mana_symbol.json` | `{W}`、`{U}`、`{R}` |
| 特殊タイプ | `type_line/supertype.json` | `Basic`、`Legendary`、`World` |
| カード・タイプ | `type_line/card_type.json` | `Creature`、`Instant`、`Land` |
| サブタイプ | `type_line/subtype.json` | `Human`、`Aura`、`Mountain` |
| キーワード能力 | `ability/keyword_ability.json` | `Flying`、`Ward`、`Flash` |
| 能力語 | `ability/ability_word.json` | `Landfall`、`Metalcraft`、`Threshold` |
| キーワード処理 | `action/keyword_action.json` | `Scry`、`Destroy`、`Exile` |
| カウンターの種類 | `counter_type.json` | `+1/+1`、`Loyalty`、`Poison` |

タイプ行に使う一覧は `type_line/` に、能力に使う一覧は `ability/` に、処理に使う一覧は `action/` に置きます。サブタイプの各項目には、そのサブタイプを使えるカード・タイプも収録します。`layout.json` はカードのレイアウトを決めます。`color.json`、`mana_symbol.json`、`counter_type.json` は複数の項目に使うため、`component/` の直下に置きます。

Wizards of the Coast が新しい値を定めたときに、その値を一覧に追加します。値を修正しても、対応する id は変えません。

数字のマナ・シンボルは `mana_symbol.json` に登録せず、その数字を id として使います。

#### カード

カードのデータには、次の項目が必要です。

- `card_id`
- `layout`
- `type_line`

そのほかの項目には、カードにある値を収録します。コンポーネントの一覧にある値は id で指定します。色はマナ・コスト、色指標、特性定義能力から定まるため、独立した値としては保存しません。

カードのファイルは、`data/card/<layout>/<card_id の先頭2文字>/<card_id>.json` に置きます。たとえば、《稲妻》の英語名は Lightning Bolt で、`card_id` は `lightning-bolt`、`layout` は `normal` です。そのデータは `data/card/normal/li/lightning-bolt.json` に置きます。

#### 言語

言語ファイルには、ある言語の紙面に刷られる言葉（カード名、タイプ行、ルール・テキスト、フレイバー・テキスト）を収録します。値を持つ対象に応じて `card/` または `set/` の下に置きます。各ファイルには、次の項目が必要です。

- `lang`
- 対象の id（カードなら `card_id`、セットなら `set_code`）

カードの言語ファイルは、カードと同じく `card_id` の先頭2文字で分けます。《稲妻》の日本語版の値は `data/language/card/li/lightning-bolt/ja.json` に収録します。タイプ行の特殊タイプ、カード・タイプ、サブタイプはそれぞれ別の項目に、ルール・テキストは能力ごとに収録します。セットの言語ファイルは、セットごとにファイルを一つ作ります。たとえば、Strixhaven Mystical Archive の日本語名は `data/language/set/sta/ja.json` に収録します。

#### セット

セットごとにファイルを一つ作ります。各ファイルには、次の項目が必要です。

- `set_code`
- `name`
- `released_at`

たとえば、Strixhaven Mystical Archive の `set_code` は `STA` です。セットのデータは `data/set/sta.json` に置きます。

リポジトリ内で使う `set_code` ごとに、`data/set/` にセットのファイルを置きます。

#### プリント

プリントごとにファイルを一つ作り、言語、セットの順にフォルダを分けます。各ファイルには、次の項目が必要です。

- `card_id`
- `set_code`
- `number`
- `rarity`
- `platforms`

プリントを登録する前に、対応するカードとセットのデータを登録してください。レアリティは `data/print/component/rarity.json` の id で指定します。プリントごとの値なので、同じカードでもセットによって異なることがあります。媒体は `data/print/component/platform.json` の id で指定します（`paper`、`magic_online` など）。たとえば、Strixhaven Mystical Archive の日本語版に《稲妻》がコレクター番号105で収録されている場合、ファイルは `data/print/ja/sta/105.json` です。

カードのプリントは、すべて登録してください。リーガル判定はプリントから読むため、common のプリントが抜けていると、使えるカードが使えないように見えます。

### schema

各ファイルの形式は、[JSON Schema](https://json-schema.org/) で定めます。

```text
schema/
  data.schema.json
  component.schema.json
  card/
    card.schema.json
    normal.schema.json
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
  language/
    language.schema.json
    card.schema.json
    set.schema.json
  print.json
  set.json
  correction.schema.json
```

スキーマの多くは `data/` の構成に対応します。`schema/component.schema.json` は `data/card/component/` と `data/print/component/` の一覧を定めます。サブタイプの一覧には、そのサブタイプを使えるカード・タイプもあるため、専用スキーマ `schema/card/component/type_line/subtype.schema.json` を使います。`schema/card/normal.schema.json` は `data/card/normal/` のカードを定めます。

`schema/data.schema.json` では、`data/` にあるファイルの種類ごとに、適用するスキーマを指定します。

ファイルの形式がカードのレイアウトや対象によって変わる場合は、適用するスキーマを選ぶファイルを使います。`schema/card/card.schema.json` はレイアウトに応じてカードのスキーマを選び、`schema/language/language.schema.json` は対象に応じてカード用またはセット用のスキーマを選びます。

#### カード

`face.schema.json` はカード1面分の特性、`type_line.schema.json` はタイプ行の形式を定めます。ルール情報の各スキーマは `rules_text/` の下で、概念ごとに分けています。

`schema/component.schema.json` はコンポーネントの一覧の形式を定めます。一覧の各項目には、id とその id に対応する値を収録します。

#### 言語

カードの言語データには `schema/language/card.schema.json`、セットの言語データには `schema/language/set.schema.json` を使います。

#### その他のファイル

`schema/correction.schema.json` は公式訂正の記録1件の形式を定めます。カード、プリント、言語の `history` には、この形式の記録を追加します。プリントとセットの形式は、それぞれ `schema/print.json` と `schema/set.json` で定めます。

## 公式の訂正

Wizards of the Coast が訂正を出したときは、その値を修正し、値を持つデータの `history` に記録を追加します。過去の記録は書き換えず、そのまま残します。

記録は、直した値を `path` で指します。`path` は、そのデータの根から見た JSON Pointer（RFC 6901）です。`path` に並べるのはフィールド名だけで、リストの中は指しません。配列はまるごと直します。`was` には直す前に `path` が持っていた値、`source` には公式の告知、`corrected_at` にはここで値が変わった日を持ちます。
