# Writer20

Desktop Translations Management Application built with Electron and Lit web components.

## Overview

Writer20 is a desktop application for managing translation projects. It provides a modern UI for importing, editing, and managing translation workflow with support for multiple languages.

## Tech Stack

- **Frontend**: Lit (Web Components), TypeScript, Vite
- **Backend**: Electron, better-sqlite3
- **Localization**: @lit/localize
- **Testing**: Vitest

## Prerequisites

- Node.js 20+
- npm 9+

## Development

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

```bash
npm run dev
```

This runs both Vite dev server and Electron concurrently:
- Vite dev server at http://localhost:5173
- Electron app with development flags

### Run Tests

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Building

### Build All

```bash
npm run build
```

This runs:
1. `npm run build:vite` - Builds the renderer (frontend)
2. `npm run build:electron` - Builds the main process (Electron)

### Build Only Renderer

```bash
npm run build:vite
```

### Build Only Electron

```bash
npm run build:electron
```

## Packaging

### Package for Current Platform

```bash
npm run package
```

### Package for Specific Platforms

```bash
# Windows
npm run package:win

# macOS
npm run package:mac

# Linux
npm run package:linux
```

The packaged application will be created in the `release` directory.

## Localization

### Supported Languages

- English (en) - source locale
- Spanish (es-419)
- Russian (ru)
- Chinese Simplified (zh-Hans)

### How Localization Works

The project uses `@lit/localize` for internationalization. The workflow is:

1. Source strings are marked in components using `msg()`
2. `lit localize extract` generates `.xlf` files for translation
3. Translators work on the `.xlf` files
4. `lit localize build` generates the locale TypeScript files

### Adding a New Language

To add a new supported language:

1. **Add locale code to config**: Edit `lit-localize.json` and add the new locale to `targetLocales`:

```json
{
  "targetLocales": ["ru", "es-419", "zh-Hans", "fr"]
}
```

2. **Add locale name in settings**: Add the locale and its display name to `getLocaleNames()` in `src/renderer/components/settings.ts`:

```typescript
private getLocaleNames(locale: string): string {
    const localeNames: Record<string, string> = {
        'en': 'English',
        'es-419': 'Español (Latinoamérica)',
        'ru': 'Русский',
        'zh-Hans': '简体中文',
        'fr': 'Français',  // Add new locale here
    };
    return localeNames[locale];
}
```

3. **Extract translations**: Generate the `.xlf` file for the new locale:

```bash
npm run localize:extract
```

4. **Translate**: Open the generated file in `xliff/` and add translations

5. **Build locales**: Generate the locale TypeScript files:

```bash
npm run localize:build
```

### Updating Translations

When you modify source code (add/remove/change `msg()` calls):

1. **Extract**: Update `.xlf` files with new/changed strings:

```bash
npm run localize:extract
```

2. **Translate**: Update translations in the `.xlf` files

3. **Build**: Rebuild the locale files:

```bash
npm run localize:build
```

### Using msg() in Components

Use the `msg()` function for translatable strings:

```typescript
import { msg } from '@lit/localize';

render() {
    return html`<h1>${msg('Hello World')}</h1>`;
}
```

### Changing Language at Runtime

Users can change the language in Settings. The language preference is stored via Electron's IPC and persists across sessions.

## Project Structure

```
writer20/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main/          # Main entry point
│   │   ├── preload/       # Preload scripts
│   │   ├── handlers/      # IPC handlers
│   │   └── business/      # Business logic
│   └── renderer/          # Frontend (Lit)
│       ├── components/    # Web components
│       ├── i18n/          # Localization
│       ├── styles/        # CSS styles
│       └── types/         # TypeScript types
├── resources/             # App icons and resources
├── dist/                  # Build output
├── release/               # Packaged applications
└── package.json
```

## Architecture

### Routing

The app uses `@lit-labs/router` for client-side routing. Routes are defined in `src/renderer/components/routes.ts`:

- `/` - Dashboard (project list)
- `/workflow/:projectId` - Translation workflow for a project
- `/settings` - Application settings

### Components

- **app-shell** - Main application shell with router
- **app-nav-panel** - Side navigation panel with configurable actions
- **dashboard** - Project list and management
- **workflow** - Translation workflow interface
- **settings** - Language and theme settings

### Database

The app uses SQLite (better-sqlite3) for local data storage. Database operations are handled in the main process via IPC.

## Troubleshooting

### Electron Rebuild

If you encounter native module issues:

```bash
npm run rebuild
```

### Clean Build

```bash
rm -rf dist release node_modules
npm install
npm run build
```

## License

MIT
