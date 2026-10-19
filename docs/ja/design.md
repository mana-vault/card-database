# 設計:mana-vault card-database

## ねらい

このデータベースでは、カードを正確なデータとして記録します。

そのために、次の二つを基本とします。

1. カードを識別するため、変わらない名前を付けます。
2. カードにはルールで定められた情報だけを記録し、商品や言語の情報はカードと分けて記録します。

## 用語定義

### カード

Magic のルールでは、カードはカード名、マナ・コスト、色、タイプ行、ルール・テキストからなるゲームのオブジェクトです。タイプ行は、特殊タイプ、カード・タイプ、サブタイプで構成されます。カード・タイプに応じて、パワーとタフネス、忠誠度、バトルの守備値なども持ちます。両面カードや分割カードのように、通常とは異なる構成のカードもあります。

このデータベースでは、これらの情報をまとめて`カード`と呼びます。タイプ行とマナ・コストは、印刷された行をそのまま保存するのではなく、部品ごとの値に分けて記録します。値は英語で記録し、部品の名前には公式ルールの用語を使います。商品や言語の情報は`カード`本体には含めません。

カードのデータ形式は`レイアウト`によって異なります。`カード`には、`data/card/component/layout.json` に登録された id で`レイアウト`を指定します。通常のカードは各項目をカード本体に記録します。両面カードでは表面と裏面、分割カードではそれぞれの半分を分けて記録します。面ごとに値を分ける場合は、面の名前を付けた項目に記録します。レイアウトごとに専用のスキーマを使います。

カードを一度登録したら、その `card_id` は変えません。

### 翻訳

カードやセットの英語以外の表記は、`翻訳`に記録します。`翻訳`では、対象となるカードまたはセットと言語を指定し、英語のデータと異なる値だけを記録します。英語のデータにその言語の`翻訳`を反映すると、その言語での表記になります。

カードの`翻訳`では、タイプ行の特殊タイプ、カード・タイプ、サブタイプをそれぞれ別の項目に、ルール・テキストは能力ごとに記録します。たとえば《稲妻》の日本語版では、カード・タイプに `インスタント`、能力 `spell` にそのルール・テキストを記録します。

翻訳の対象は、現在は`カード`とセットです。セット名も言語によって異なります。たとえば、Strixhaven Mystical Archive の日本語名は`ミスティカルアーカイブ`です。

### プリント

同じカードが複数のセットに再録されたり、言語ごとに異なるカード名やテキストで印刷されたりすることがあります。コラボ商品では、カードが別の名前で収録されることもあります。カードが特定の商品に収録されたときの情報を`プリント`と呼びます。

`プリント`は`カード`とは別に記録し、次の情報を持ちます。

- セット
- コレクター番号
- 言語
- レアリティ
- イラストレーター
- 画像の URL

`プリント`は、収録された`カード`を id で参照します。紙面に印刷された値は`プリント`には記録しません。

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
  translation/
    card/li/lightning-bolt/ja.json
    set/sta/ja.json
  print/
    component/
      rarity.json
    en/sta/42.json
    ja/sta/105.json
  set/
    sta.json
```

#### 部品の一覧

`data/card/component/` の各一覧には、カードから参照する id と、その id に対応する値を登録します。値は Wizards of the Coast が定めたものです。

| 部品 | ファイル | 値の例 |
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

タイプ行に使う一覧は `type_line/` に、能力に使う一覧は `ability/` に、処理に使う一覧は `action/` に置きます。サブタイプの各項目には、そのサブタイプを使えるカード・タイプも記録します。`layout.json` はカードのレイアウトを決めます。`color.json`、`mana_symbol.json`、`counter_type.json` は複数の項目に使うため、`component/` の直下に置きます。

Wizards of the Coast が新しい値を定めたときに、その値を一覧に追加します。値を修正しても、対応する id は変えません。

数字のマナ・シンボルは `mana_symbol.json` に登録せず、その数字を id として使います。

#### カード

カードのデータには、次の項目が必要です。

- `card_id`
- `layout`
- `name`
- `type_line`

そのほかの項目には、カードにある値を記録します。部品の一覧にある値は id で指定します。色はマナ・コスト、色指標、特性定義能力から定まるため、独立した値としては保存しません。

カードのファイルは、`data/card/<layout>/<card_id の先頭2文字>/<card_id>.json` に置きます。たとえば、《稲妻》の英語名は Lightning Bolt で、`card_id` は `lightning-bolt`、`layout` は `normal` です。そのデータは `data/card/normal/li/lightning-bolt.json` に置きます。

#### 翻訳

翻訳データは、対象に応じて `card/` または `set/` の下に置きます。各ファイルには、次の項目が必要です。

- `lang`
- 翻訳する対象の id（カードなら `card_id`、セットなら `set_code`）

カードの翻訳ファイルは、カードと同じく `card_id` の先頭2文字で分けます。《稲妻》の日本語版の値は `data/translation/card/li/lightning-bolt/ja.json` に記録します。セットの翻訳は、セットごとにファイルを一つ作ります。たとえば、Strixhaven Mystical Archive の日本語名は `data/translation/set/sta/ja.json` に記録します。

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

プリントを登録する前に、対応するカードとセットのデータを登録してください。レアリティは `data/print/component/rarity.json` の id で指定します。プリントごとの値なので、同じカードでもセットによって異なることがあります。たとえば、Strixhaven Mystical Archive の日本語版に《稲妻》がコレクター番号105で収録されている場合、ファイルは `data/print/ja/sta/105.json` です。

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
  translation/
    translation.schema.json
    card.schema.json
    set.schema.json
  print.json
  set.json
  correction.schema.json
```

スキーマの多くは `data/` の構成に対応します。`schema/component.schema.json` は `data/card/component/` と `data/print/component/` の一覧を定めます。サブタイプの一覧には、そのサブタイプを使えるカード・タイプもあるため、専用スキーマ `schema/card/component/type_line/subtype.schema.json` を使います。`schema/card/normal.schema.json` は `data/card/normal/` のカードを定めます。

`schema/data.schema.json` では、`data/` にあるファイルの種類ごとに、適用するスキーマを指定します。

ファイルの形式がカードのレイアウトや翻訳の対象によって変わる場合は、適用するスキーマを選ぶファイルを使います。`schema/card/card.schema.json` はレイアウトに応じてカードのスキーマを選び、`schema/translation/translation.schema.json` はカード用またはセット用のスキーマを選びます。

#### カード

`face.schema.json` はカード1面分の特性、`type_line.schema.json` はタイプ行の形式を定めます。ルール情報の各スキーマは `rules_text/` の下で、概念ごとに分けています。

`schema/component.schema.json` は部品の一覧の形式を定めます。一覧の各項目には、id とその id に対応する値を記録します。

#### 翻訳

カードの翻訳データには `schema/translation/card.schema.json`、セットの翻訳データには `schema/translation/set.schema.json` を使います。

#### その他のファイル

`schema/correction.schema.json` は公式訂正の記録1件の形式を定めます。カードと翻訳の `history` には、この形式の記録を追加します。プリントとセットの形式は、それぞれ `schema/print.json` と `schema/set.json` で定めます。

## 公式の訂正

Wizards of the Coast がカードのテキストを訂正した場合は、該当する値を修正し、その値を持つカードまたは翻訳の `history` に記録を追加します。過去の記録は書き換えず、そのまま残します。
