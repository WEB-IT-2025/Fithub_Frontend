# Fithub

フィットネスとGitHubを組み合わせた新しいフィットネスアプリケーション

## プロジェクト構成

```
fithub/
├── app/                    # メインのアプリケーションコード
│   ├── (auth)/            # 認証関連の画面
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/            # メインのタブ画面
│   │   ├── home.tsx       # ホーム画面
│   │   ├── workout.tsx    # ワークアウト画面
│   │   ├── progress.tsx   # 進捗画面
│   │   └── profile.tsx    # プロフィール画面
│   └── _layout.tsx        # ルーティング設定
├── components/            # 再利用可能なコンポーネント
│   ├── common/           # 共通コンポーネント
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   ├── workout/          # ワークアウト関連コンポーネント
│   └── profile/          # プロフィール関連コンポーネント
├── hooks/                # カスタムフック
│   ├── useAuth.ts
│   └── useWorkout.ts
├── services/            # API通信や外部サービスとの連携
│   ├── api.ts
│   └── auth.ts
├── store/              # 状態管理
│   ├── auth/
│   └── workout/
├── types/              # TypeScript型定義
│   ├── workout.ts
│   └── user.ts
├── utils/              # ユーティリティ関数
│   ├── date.ts
│   └── validation.ts
├── constants/          # 定数
│   ├── theme.ts
│   └── config.ts
└── assets/            # 画像やフォントなどの静的ファイル
    ├── images/
    └── fonts/
```

## 主要な機能

- ユーザー認証（ログイン/登録）
- ワークアウトの記録と管理
- 進捗の可視化
- プロフィール管理
- ソーシャル機能

## 技術スタック

- React Native
- Expo
- TypeScript
- ESLint + Prettier

# Fithub バックエンド
**バージョン情報**

- **Expo v53.0.9**
- **React v19.0.0**
- **React-native v0.79.2**
- **Node.js v20.18.1**
- **npm v10.9.2**
- **npx v10.2.2**
- **tailwind-react-native-classnames v3.0.1**


```bash
#環境構築手順
#nodemoduleインストール
npm install 

#expoインストール
npm i --global expo-cli
#macユーザー
sudo npm i --global expo-cli

#tailwind適用
npm i tailwind-react-native-classnames

#スマホのみ実行
#npx expo start
#web版実行
npx expo start --web

#QRコードが表示されたら成功

```
## Tailwind CSS IntelliSenseを適用させる設定
setting.jsonに以下を追加

```
"tailwindCSS.experimental.classRegex": [
    "tw`([^`]*)",
    "tw\\(\"([^\"]*)",
    "tw\\('([^']*)",
    "tw\\(\\`([^`]*)",
    "classnames\\(([^)]*)\\)"
]
```
もしうまくいかない場合はAIに上手い感じに書いてもらう

#　AWESOMEアイコン用
npm install @fortawesome/react-fontawesome
npm install @fortawesome/fontawesome-svg-core

npm install @fortawesome/free-brands-svg-icons
npm install @fortawesome/free-regular-svg-icons　//使わないかも
npm install @fortawesome/free-solid-svg-icons    //使わないかも


npm install @fortawesome/free-brands-svg-icons

npm install @fortawesome/free-regular-svg-icons  //使わないかも

npm install @fortawesome/free-solid-svg-icons   //使わないかも

npm install @fortawesome/react-native-fontawesome @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/free-regular-svg-icons @fortawesome/free-brands-svg-icons

