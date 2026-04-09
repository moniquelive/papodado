export const siteCss = `:root {
  --page-max-width: 960px;
  --page-ink: #1f2830;
  --page-muted: #586473;
  --surface-soft: #f8faf7;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  color: var(--page-ink);
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif;
  background:
    radial-gradient(130% 90% at 0% 0%, #f6f0df 0%, transparent 65%),
    radial-gradient(120% 100% at 100% 0%, #e2edf3 0%, transparent 70%),
    #fdfdfb;
  display: flex;
  flex-direction: column;
}

body > header,
body > main,
body > footer {
  width: min(var(--page-max-width), calc(100% - 2rem));
  margin-inline: auto;
}

header[role="banner"] {
  padding-top: 1.2rem;
}

header nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

header nav a[aria-current="page"] {
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

main {
  flex: 1;
  padding-block: 0.8rem 2rem;
}

main [data-project-list] {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
}

main [data-project-card] {
  min-height: 10rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
}

main [data-empty-canvas] {
  min-height: 44vh;
  display: grid;
  place-items: center;
  border: 1px dashed var(--border-color);
  border-radius: var(--rounded-md);
  background: var(--surface-soft);
  padding: 1rem;
  text-align: center;
}

footer {
  padding-bottom: 1.4rem;
  color: var(--page-muted);
}

@media (max-width: 640px) {
  body > header,
  body > main,
  body > footer {
    width: calc(100% - 1.2rem);
  }

  body {
    background: linear-gradient(180deg, #f7f0de 0%, #fafbf8 45%, #e9f1f6 100%);
  }
}
`;
