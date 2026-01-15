## Installation

`nvm use 20.9.0`

```bash
$ npm install
```

## Create .env file

## Running the app

```bash
# development
$ npm run dev
```

# How to use

`npm install` or `pnpm install` or `yarn add`

`nvm use 20.9.0`

`npm run dev` You can play with docs and demos of your packages in local develop environment.

## Auditing recipe instructions

Use the helper script to find recipes (especially ones referenced inside meal plans) that are missing detailed cooking steps:

```bash
npm run audit:recipe-instructions
```

Add the `--apply` flag to generate fallback instructions from `processing_food`, `content`, or `description` fields when possible:

```bash
npm run audit:recipe-instructions -- --apply --verbose
```

Additional flags:

- `--all-recipes`: scan the entire `recipes` collection instead of only those used in meal plans.
- `--recipe=<id>`: inspect a single recipe document.
- `--limit=<number>`: set an upper bound on documents fetched (useful for large datasets).
- `--verbose`: log every affected record while running.
