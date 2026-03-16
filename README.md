# Personal Portfolio Website

Plain HTML/CSS/JS portfolio site. No build tools — just a local server and a browser.

Dark/light theming, modular HTML components fetched at runtime, and a 3D wireframe animation in the hero section.

## Structure

```
.
├── index.html                 # Main page
├── blogs.html                 # Separate blog page
├── images/                    # Avatar, project GIFs (fulls/ + thumbs/)
├── assets/                    # FontAwesome
└── src/
    ├── components/            # One HTML partial per section (navbar, hero, experience, etc.)
    ├── styles/                # globals.css (theme variables), sections.css, blogs.css
    ├── scripts/               # pageBuilder.js
    └── animations/            # Factory-based canvas animations
```

## How it works

Sections are standalone HTML fragments in `src/components/`. `pageBuilder.js` fetches them in parallel, injects them in order, and wires up interactivity (theme toggle, scroll nav, fade-ins, hero animation).

```js
PageBuilder.build('app', [
  'src/components/navbar.html',
  'src/components/hero.html',
  'src/components/experience.html',
  // ...
]);
```

Adding a section = create the HTML file + append its path to the array.

### Animations

Factory pattern in `src/animations/`. Register a new animation with `AnimationFactory.register('name', factory)`, and it gets picked up automatically. Currently ships with a 3D wireframe icosahedron effect.

### Theming

CSS variables in `globals.css`, toggled via `data-theme="dark"` on `<html>`. Preference persists in `localStorage`.

## Local dev

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000
