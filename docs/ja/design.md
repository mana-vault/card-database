# 設計:mana-vault card-database

## ねらい

このデータベースでは、カードを正確なデータとして収録します。

そのために、次の二つを基本とします。

1. カードを識別するため、変わらない名前を付けます。
2. カードにはルールで定められた情報だけを収録し、商品や言語の情報はカードと分けて収録します。

## 用語定義

### カード

Magic のルールでは、カードはカード名、マナ・コスト、色、タイプ行、ルール・テキストからなるゲームのオブジェクトです。タイプ行は、特殊タイプ、カード・タイプ、サブタイプで構成されます。カード・タイプに応じて、パワーとタフネス、忠誠度、バトルの守備値なども持ちます。両面カードや分割カードのように、通常とは異なる構成のカードもあります。

このデータベースでは、これらの情報をまとめて`カード`と呼びます。`カード`は、印刷されたものではなく、ルールにしたがって構造化して収録します。マナ・コストとタイプ行はコンポーネントの一覧を id で参照し、ルール・テキストはルールが定めた単位（能力、コスト、対象、効果など）に分けます。紙面に示す言葉は、フレイバー・テキストを除いて`print/<lang>/`の下に言語ごとに収録します。英語もその一つです。商品や言語の情報は`カード`本体には含めません。

カードのデータ形式は`レイアウト`によって異なります。`カード`には、`data/oracle/card/component/layout.json` に登録された id で`レイアウト`を指定します。通常のカードは各項目をカード本体に収録します。両面カードでは表面と裏面、分割カードではそれぞれの半分を分けて収録します。面ごとに値を分ける場合は、面の名前を付けた項目に収録します。レイアウトごとに専用のスキーマを使います。

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
- フレイバー・テキスト

`プリント`は、収録された`カード`を id で参照します。フレイバー・テキストは再録で変わることがあるため`プリント`に収録し、紙面に印刷されるそのほかの言葉は、どのプリントでも同じ言葉として、カードの言葉に取っておきます。プリントごとに違う言葉を示す場合だけ、プリントが自分の言葉を持ちます。複数の面を持つカードは面ごとに独自のフレイバー・テキストを示すので、カードが面を収録するのと同じ形で、`プリント`にも面ごとに収録します。

レアリティは`カード`ではなく`プリント`ごとに決まるので、カードのレアリティは`プリント`を並べて読みます。フォーマットのリーガル判定は`プリント`から導き、このデータベースには保存しません。common の`プリント`があればパウパーで使えますが、禁止されているカードは除きます。

## ディレクトリ構成

### data

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

変わらないデータと、紙そのものを分けて収録します。`data/oracle/` には、`カード`とセットを言葉を含まずに構造として収録し、`data/platform.json` は媒体の一覧です。`data/print/` は紙そのもので、言語ごとにフォルダを分けます。言語のフォルダの中は、収められるものごとに分かれます。`card/` はカードの言葉です。カードのどのプリントでも同じ言葉を `base/` に一つずつ収録し、プリントごとに違う言葉だけをそのプリントの名前のファイルに持たせます。`set/` はセットの言葉と、そのセットに収録されたプリントです。セット自身の言葉を `base/` に、プリントをセットの名前のフォルダの中に収録します。

#### コンポーネントの一覧

`data/oracle/card/component/` に、コンポーネントの種類ごとに一覧を置きます。各項目は、カードやプリントのデータが参照する id を持ちます。その id に対応する言葉は、`data/print/<lang>/card/base/component/` の下にある、その言語の名称の一覧に収録します。形式は同じで、id と値の組です。

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
| レアリティ | `rarity.json` | `Common`、`Rare`、`Mythic rare` |

タイプ行に使う一覧は `type_line/` に、能力に使う一覧は `ability/` に、処理に使う一覧は `action/` に置きます。サブタイプの各項目には、そのサブタイプを使えるカード・タイプも収録します。`layout.json` はカードのレイアウトを決めます。`color.json`、`mana_symbol.json`、`counter_type.json` は複数の項目に使うため、`component/` の直下に置きます。

Wizards of the Coast が新しい値を定めたときに、その値を一覧に追加します。値を修正しても、対応する id は変えません。

数字のマナ・シンボルは `mana_symbol.json` に登録せず、その数字を id として使います。

#### カード

カードのデータには、次の項目が必要です。

- `card_id`
- `layout`
- `type_line`

そのほかの項目には、カードにある値を収録します。コンポーネントの一覧にある値は id で指定します。色はマナ・コスト、色指標、特性定義能力から定まるため、独立した値としては保存しません。

カードのファイルは、`data/oracle/card/<layout>/<card_id の先頭2文字>/<card_id>.json` に置きます。たとえば、《稲妻》の英語名は Lightning Bolt で、`card_id` は `lightning-bolt`、`layout` は `normal` です。そのデータは `data/oracle/card/normal/li/lightning-bolt.json` に置きます。

#### 言葉

紙面が示す言葉は、`print/<lang>/card/` の下に、フォルダ名で示した言語で収録します。カードのどのプリントでも同じ言葉を、`base/entity/` の下に、カードごとに一つのファイルで収録します。各ファイルには、次の項目が必要です。

- `lang`
- `card_id`

ファイルには、カード名、タイプ行、ルール・テキストを収録します。カード名とルール・テキストは言葉で、ルール・テキストは能力ごとの文として、カードの構造が持つ `ability_id` と対応させます。起動型の能力の本文は、コストのコロンの後の文です（CR 602.1a）。コストはカードが構造で持つ（種類・方向・数量）ため、記号はそこから組み立てて、本文の文には含めません。タイプ行は、カードと同じ id を持ち、id に対応するその言語の言葉はコンポーネントの名称の一覧が持っています。id の言葉は、`data/print/ja/card/base/component/` に収録します。《稲妻》の日本語の言葉は、`data/print/ja/card/base/entity/li/lightning-bolt.json` に収録します。フレイバー・テキストは再録で変わることがあるため、ここには収録せず、`プリント`に収録します。

base と違う言葉を示すプリントは（別の名前で印刷されるコラボの収録、古い表記を示す版など）、その言葉を `card/<set>/<number>.json` に、それを示すプリントの名前で一つのファイルに収録します。項目は base と同じです。たとえば、《リスティックの研究》の Final Fantasy 版は Stay with Me という名前で印刷されるので、その言葉は `data/print/en/card/fca/31.json` に収録します。

コンポーネントの名称も `base/` の下に置き、`base/component/<一覧名>.json` に id とその言語で示す言葉の組を収録します。セットの名前も紙の言葉なので、その隣の `set/` に置きます。たとえば、Strixhaven Mystical Archive の日本語名は `data/print/ja/set/base/sta.json` に収録します。

#### セット

セットごとにファイルを一つ作ります。各ファイルには、次の項目が必要です。

- `set_code`
- `released_at`

たとえば、Strixhaven Mystical Archive の `set_code` は `STA` です。セットのデータは `data/oracle/set/sta.json` に置きます。セットの名前も言葉なので、カードの言葉と同じく言語ごとに収録します。日本語名は `data/print/ja/set/base/sta.json` に置きます。

リポジトリ内で使う `set_code` ごとに、`data/oracle/set/` にセットのファイルを置きます。

#### プリント

プリントごとにファイルを一つ作り、`print/<lang>/set/` の下、収録されたセットのフォルダの中に置きます。各ファイルには、次の項目が必要です。

- `card_id`
- `set_code`
- `lang`
- `number`
- `rarity`
- `platforms`

プリントを登録する前に、対応するカードとセットのデータに加えて、その言語のカードの言葉が `card/base/entity/` にあることを確かめてください。レアリティは `data/oracle/card/component/rarity.json` の id で指定します。プリントごとの値なので、同じカードでもセットによって異なることがあります。媒体は `data/platform.json` の id で指定します（`paper`、`magic_online` など）。フレイバー・テキストがある場合は、その印刷の言語で `flavor_text` に収録します。たとえば、Strixhaven Mystical Archive の日本語版に《稲妻》がコレクター番号105で収録されている場合、ファイルは `data/print/ja/set/sta/105.json` です。

カードのプリントは、すべて登録してください。リーガル判定はプリントから読むため、common のプリントが抜けていると、使えるカードが使えないように見えます。

### schema

各ファイルの形式は、[JSON Schema](https://json-schema.org/) で定めます。

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

スキーマの多くは `data/` の構成に対応します。`schema/component.schema.json` は、id と値の組からなる一覧、つまり `data/platform.json` と `data/print/<lang>/card/base/component/` の名称の一覧を定めます。`schema/oracle/card/component/list.schema.json` は、`data/oracle/card/component/` の id の一覧を定めます。サブタイプの一覧には、そのサブタイプを使えるカード・タイプもあるため、専用スキーマ `schema/oracle/card/component/type_line/subtype.schema.json` を使います。カードのレイアウトごとにスキーマがあり、`schema/oracle/card/normal.schema.json` は `data/oracle/card/normal/` の、`schema/oracle/card/split.schema.json` は `data/oracle/card/split/` のカードを定めます。

`schema/data.schema.json` では、`data/` にあるファイルの種類ごとに、適用するスキーマを指定します。

ファイルの形式がカードのレイアウトによって変わる場合は、適用するスキーマを選ぶファイルを使います。`schema/oracle/card/card.schema.json` はレイアウトに応じてカードのスキーマを選びます。

#### カード

`face.schema.json` はカード1面分の特性、`type_line.schema.json` はタイプ行の形式を定めます。ルール情報の各スキーマは `rules_text/` の下で、概念ごとに分けています。

`schema/component.schema.json` は id と値の組からなる一覧の形式を、`schema/oracle/card/component/list.schema.json` は id の一覧の形式を定めます。名称の一覧の各項目には id と値を、id の一覧の各項目には id を収録します。

#### 言葉

言葉のファイルには、レイアウトごとに `schema/print/card/` の下のスキーマを使います。レイアウトのスキーマは、`card/component/` の部品（識別、一つの面の言葉、history）を ref して組み立てます。base と例外は同じスキーマを使い、どちらかはパスが決めて、check-id が検査します。セットの言葉（名前）には `schema/print/set.schema.json` を使います。

#### その他のファイル

`schema/correction.schema.json` は公式訂正の記録1件の形式を定めます。カード、プリント、言葉のファイルの `history` には、この形式の記録を追加します。プリントとセットの形式は、それぞれ `schema/print/print.json` と `schema/oracle/set.json` で定めます。

## 公式の訂正

Wizards of the Coast が訂正を出したときは、その値を修正し、値を持つデータの `history` に記録を追加します。過去の記録は書き換えず、そのまま残します。

記録は、直した値を `path` で指します。`path` は、そのデータの根から見た JSON Pointer（RFC 6901）です。`path` に並べるのはフィールド名だけで、リストの中は指しません。配列はまるごと直します。`was` には直す前に `path` が持っていた値、`source` には公式の告知、`corrected_at` にはここで値が変わった日を持ちます。
