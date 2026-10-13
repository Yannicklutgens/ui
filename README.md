# @jannes64/ui

A small React component library carrying the dark, red-accent "ops dashboard" look used by
this project — design tokens, base styles, and a set of ready-made components (Button, Card,
Badge, StatTile, Panel, Avatar, Field, Switch, Tabs, Modal, Log, AuthCard, AppShell, PageHeader,
Select, Tooltip, Alert, Spinner, Toast).

`Panel` is a bordered box with 16px body padding (`--panel-padding`); tables and Lists inside it
stay flush automatically, and `flush` drops the padding for other edge-to-edge content. Pass
`headerStart` and/or `headerEnd` for a toolbar header with content on the left and/or right;
without them it is just the box, and a `List` inside it shows its own header in the same style.
`TableWrap` is a deprecated alias of `Panel`.
`footerStart`/`footerEnd` add a footer row the same way. `scroll="panel"` makes the panel fit the
viewport (or `maxHeight`) with a scrolling body; the default `scroll="page"` lets the page scroll.

Everything is styled with the tokens in `tokens.css` (dark by default). Add the `theme-light` class
to any element, or `theme="light"` on a Panel, to render its contents on white, for example
content designed for a light background like emails. `theme-dark` switches back inside it.

`Avatar` shows a round image with a `mainline` (e.g. username) and optional `subline`. Without a
`src`, or when the image fails to load, it shows the first letter of the mainline on a color
derived from it.

## Using it in a new project (separate repo)

1. Add it as a git dependency in `package.json`:

   ```json
   "dependencies": {
     "@jannes64/ui": "git+ssh://git@github.com/Yannicklutgens/ui.git#main"
   }
   ```

   `npm install` clones the repo and runs its `prepare` script, which builds `dist/`
   automatically — no manual build step needed.

2. Import the stylesheet once, near your app's entry point:

   ```tsx
   import "@jannes64/ui/dist/styles/index.css";
   ```

3. Add the Google Fonts used by the design ("Space Grotesk" for UI text, "JetBrains Mono" for
   code/log output) to your `index.html`:

   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com" />
   <link
     href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
     rel="stylesheet"
   />
   ```

4. Import components from `@jannes64/ui`:

   ```tsx
   import { Page, PageHeader, Card, Button, Badge } from "@jannes64/ui";
   ```

## Developing locally

This package lives on its own at `~/Documents/packages/Jannes64/ui`. Consuming projects on
the same machine can point at it directly instead of a git URL while iterating:

```json
"dependencies": {
  "@jannes64/ui": "file:/home/Jannes/Documents/packages/Jannes64/ui"
}
```

`npm install` in the consuming project symlinks it in and runs its `prepare` script (build).
After editing `src/`, run `npm run build` (or `npm run dev` to watch) here so the change
lands in `dist/` — then `npm install` again in the consuming project only if the symlink
itself needs re-resolving (usually not needed; the symlink already points at this directory).
