# スキーマ:mana-vault card-database

Translations: [英語](../en/schema.md)

この文書は、リポジトリのスキーマと、それが検査するデータを説明します。ねらいと原理は
[design.md](design.md) が述べます。細かい説明はここにあります。

## スキーマ

`data/` の各ファイルは、JSON Schema で書かれたスキーマによって定められています。

```text
schema/
  data.schema.json
  component.schema.json
  oracle/
    set.json
    card/
      card.schema.json
      normal.schema.json
      split.schema.json
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
  print/
    print.json
    set.schema.json
    card/
      card.schema.json
      normal.json
      split.json
      nonmodal_double_faced.json
      component/
        identity.schema.json
        face.schema.json
        type_line.schema.json
        rules_text.schema.json
  correction.schema.json
```

スキーマの多くのパスは、`data/` のパスに対応します。`schema/component.schema.json` は、id と値の
組からなる一覧、つまり `data/platform.json` と `data/print/<lang>/card/base/component/` の名前の
一覧を定めます。`schema/oracle/card/component/list.schema.json` は、
`data/oracle/card/component/` の id の一覧を定めます。サブタイプの一覧は、そのサブタイプに使える
カード・タイプも収録するため、専用のスキーマ
`schema/oracle/card/component/type_line/subtype.schema.json` を使います。カードを定めるのは
`レイアウト`のスキーマで、`schema/oracle/card/normal.schema.json` は `data/oracle/card/normal/` を、
`schema/oracle/card/split.schema.json` は `data/oracle/card/split/` を定めます。

`schema/data.schema.json` は、`data/` のファイルの種類ごとに、適用するスキーマを指定します。
ファイルの形が`レイアウト`によって変わる場合は、選ぶファイルが使われます。
`schema/oracle/card/card.schema.json` は、レイアウトに応じてカードのスキーマを選びます。

`schema/oracle/card/component/` の下のスキーマは、カードの部品を持ちます。`face.schema.json` は
カード 1 面分の特性を、`type_line.schema.json` はタイプ行を定めます。`rules_text/` の下では、
スキーマは述べるルールの概念ごとに分かれています。

カードの文字のファイルは、`レイアウト`ごとに `schema/print/card/` の下のスキーマを使います。
スキーマは、`card/component/` の共通の部品——識別、1 つの面の文字、`history`——から
組み立てられます。base のファイルと例外のファイルは同じスキーマを使い、どちらになるかはパスが
決めて、check-id が検査します。セットの名前は `schema/print/set.schema.json` が定め、`プリント`
は `schema/print/print.json` が定めます。

`schema/correction.schema.json` は、公式訂正の記録 1 件の形式を定めます。`カード`、`プリント`、
文字のファイルは、それぞれの `history` にこの形式の記録を追加します。

## コンポーネントの一覧

`data/oracle/card/component/` に、コンポーネントの種類ごとに一覧を置きます。各項目は、カードや
プリントのデータが参照する id を持ちます。id に対応するその言語の値は、
`data/print/<lang>/card/base/component/` の下に、その言語の名前の一覧として収録します。形式は
同じで、id と値の組です。

| コンポーネント | ファイル | 値の例 |
| --- | --- | --- |
| レイアウト | `layout.json` | `Normal`、`Split`、`Modal double-faced` |
| 色 | `color.json` | `white`、`blue`、`black`、`red`、`green` |
| 特殊タイプ | `type_line/supertype.json` | `Basic`、`Legendary`、`World` |
| カード・タイプ | `type_line/card_type.json` | `Creature`、`Instant`、`Land` |
| サブタイプ | `type_line/subtype.json` | `Human`、`Aura`、`Mountain` |
| キーワード能力 | `ability/keyword_ability.json` | `Flying`、`Ward`、`Flash` |
| 能力語 | `ability/ability_word.json` | `Landfall`、`Metalcraft`、`Threshold` |
| キーワード処理 | `action/keyword_action.json` | `Scry`、`Destroy`、`Exile` |
| カウンターの種類 | `counter_type.json` | `+1/+1`、`Loyalty`、`Poison` |
| レアリティ | `rarity.json` | `Common`、`Rare`、`Mythic rare` |

カードの一部で使う一覧は、その部品の名前のフォルダに置きます。タイプ行のものは `type_line/`、
能力のものは `ability/`、処理のものは `action/` です。サブタイプの各項目は、そのサブタイプに
使えるカード・タイプも収録します。`layout.json` は`カード`自身の`レイアウト`を決め、`color.json`
と `counter_type.json` は複数の部分で使うため、`component/` の直下に置きます。

刷りが文字でないコンポーネントは、名前の一覧を持ちません。マナ記号（CR 107.4）は id で名づけられ
ます。`data/oracle/card/component/mana_symbol.json` は id だけの一覧で、`data/print/` に対応する
一覧はありません。記号が刷る表記（コストの記号は CR 107.7）も、起動型の能力のコロン（CR 602.1a）
もデータには置きません。カードはコストを構造として持ちます。

一覧に新しい値を増やすのは、Wizards of the Coast が新しい値を定めたときです。id と値の組は
ずっと変わりません。値を訂正しても、id はそのままです。

数字のマナ記号（CR 107.4b）は、刷られる数字そのものを id とし、一覧に登録しません。

## カード

カードのファイルには、次の項目が必要です。

- `card_id`
- `layout`
- `type_line`

そのほかの項目は、カードに値があるときに収録します。`カード`は、コンポーネントの一覧の値を
id で参照して組み立てます。色はマナ・コスト、色指標、特性定義能力から導けるため、独立した値と
しては保存しません。

カードのファイルの最初のフォルダは`レイアウト`で、その下に `card_id` の先頭 2 文字が続きます。
《稲妻》の `card_id` は `lightning-bolt` なので、
`data/oracle/card/normal/li/lightning-bolt.json` に置きます。

## カードの印刷された文字

紙がカードに示す文字は、`print/<lang>/card/` の下に、フォルダ名の言語で収録します。カードのどの
プリントも同じ文字は `base/entity/` に、カードごとに 1 ファイルで収録します。各ファイルには、
次の項目が必要です。

- `lang`
- `card_id`

ファイルは、名前、タイプ行、ルール・テキストを持ちます。ルール・テキストは、能力ごとに 1 つの
項目で、カードの構造の `ability_id` と対応します。能力の `text` は、能力が印刷する文です。項目
は、文の文字をこの言語の刷りのまま持つもの——
`{"kind": "rawText", "value": " deals 3 damage to any target."}`——か、文が示すコンポーネントを
種類と id で名づけるものです。種類は、id を読む一覧の名前で、たとえば `mana_symbol` や
`keyword_ability` がそうです。`{"kind": "mana_symbol", "id": "R"}` は、記号が刷られる位置に置か
れます。刷りが文字であるコンポーネントの値は、その言語の名前の一覧から id に応じて取ります。
記号は id そのものによって名づけられ、数字の記号は刷られる数字そのものを id にし（CR 107.4b）、
表記はデータのどこにも置かれません。

起動型の能力の `text` は、コストのコロンの後に続く部分です（CR 602.1a）。コストはカードが構造で
持ち、印刷される記号（忠誠度の記号は CR 107.7）とコロンは、この text に含まれません。

id の日本語の値は、`data/print/ja/card/base/component/` にあります。《稲妻》の日本語の
ルール・テキストは、`data/print/ja/card/base/entity/li/lightning-bolt.json` にあります。

フレイバー・テキストはここには置きません。再録で変わることがあるため、`プリント`に属します。

base と違う文字を示すプリント——別の名前で印刷するコラボの収録、古い表記を示す版——は、
その文字を `card/<set>/<number>.json` に、それを示すプリントの名前で 1 ファイルとして持ち、
項目は base と同じです。《リスティックの研究》の Final Fantasy 版は Stay with Me の名前で
印刷されるので、その文字は `data/print/en/card/fca/31.json` にあります。

名前の一覧も `base/` の下に置き、`base/component/<一覧名>.json` に id とその言語の値の組を収録
します。セットの名前も紙が示す文字なので、その隣の `set/` に置きます。Strixhaven Mystical
Archive の英語名は、`data/print/en/set/base/sta.json` です。

## セット

セットにはファイルを 1 つ作ります。セットのファイルには、次の項目が必要です。

- `set_code`
- `released_at`

Strixhaven Mystical Archive の `set_code` は `STA` で、そのデータは `data/oracle/set/sta.json`
にあります。セットの名前も紙が示す文字なので、カードの名前と同じく言語ごとに収録します。
英語名は `data/print/en/set/base/sta.json` です。

リポジトリ内で使われる `set_code` には、すべてこの場所にファイルがあります。

## プリント

プリントにはファイルを 1 つ作り、`print/<lang>/set/` の下、収録されたセットのフォルダの中に
置きます。プリントのファイルには、次の項目が必要です。

- `card_id`
- `set_code`
- `lang`
- `number`
- `rarity`
- `platforms`

指す`カード`とセットにはファイルがすでにあり、プリントの言語のカードの文字のファイルも
必要です。レアリティは `data/oracle/card/component/rarity.json` の id で指定します。プリント
ごとに決まる値なので、同じカードでもセットによって異なることがあります。媒体は
`data/platform.json` の id で指定します（`paper`、`magic_online` など）。フレイバー・テキストが
ある場合は、その印刷の言語で収録します。

《稲妻》は Strixhaven Mystical Archive に、コレクター番号 105 の日本語プリントとして出ており、
そのファイルは `data/print/ja/set/sta/105.json` です。

カードのプリントは、すべて登録します。フォーマットの可否はプリントから読むため、common の
プリントを落とすと、使えるカードが使えないように見えてしまいます。

## 公式の訂正

Wizards of the Coast が訂正を出したときは、その値を直し、値を持つ対象の `history` に記録を
追加します。記録は追加するだけで書き換えないため、過去の値はすべてデータの中に残ります。

記録は、直した値を `path` で指します。`path` は、その対象の根から見た JSON Pointer
（RFC 6901）です。`path` に並ぶのはフィールド名だけで、リストの中は指しません。配列はまるごと
直します。`was` には訂正前に `path` が持っていた値、`source` には公式の告知、`corrected_at` には
ここで値が変わった日を収録します。

## 検査

2 つの検査がデータをたどります。スキーマの検査が各ファイルの形を調べ、check-id はデータが
持つ参照をたどり、id が使われた場所で確かに解けることを調べます。二つとも、コミットのたびに
走り、プルリクエストでは CI でも走ります。
