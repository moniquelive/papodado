from __future__ import annotations

import html
import json
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
NOTEBOOK_PATH = ROOT / "planilhas IBGE" / "Projeto-02.ipynb"
OUTPUT_HTML_PATH = ROOT / "static" / "assets" / "projects" / "projeto-02-notebook.html"
OUTPUT_IPYNB_PATH = ROOT / "static" / "assets" / "projects" / "projeto-02.ipynb"


def _join_lines(value: object) -> str:
    if isinstance(value, list):
        return "".join(str(part) for part in value)
    return "" if value is None else str(value)


def _render_cell_header(cell_type: str, cell_index: int, execution_count: object) -> str:
    execution_label = "" if execution_count is None else str(execution_count)
    return (
        '<div class="cell-head">'
        f'<span class="badge">{html.escape(cell_type)} cell {cell_index}</span>'
        f'<span class="exec">In [{execution_label}]</span>'
        "</div>"
    )


def _render_output(output: dict) -> str:
    out_type = str(output.get("output_type", "output"))
    data = output.get("data", {})

    chunks = [
        '<div class="output">',
        f'<p class="output-title">{html.escape(out_type)}</p>',
    ]

    rendered = False
    if isinstance(data, dict):
        html_output = data.get("text/html")
        if html_output:
            chunks.append(f'<div class="table-wrap">{_join_lines(html_output)}</div>')
            rendered = True

        image_png = data.get("image/png")
        if image_png:
            chunks.append('<div class="img-wrap">')
            chunks.append(
                f'<img alt="Saida do grafico do notebook" src="data:image/png;base64,{image_png}">'
            )
            chunks.append("</div>")
            rendered = True

        text_output = data.get("text/plain")
        if text_output and not rendered:
            chunks.append(f'<pre class="text-out">{html.escape(_join_lines(text_output))}</pre>')
            rendered = True

    if out_type == "error":
        traceback_lines = output.get("traceback")
        if traceback_lines:
            traceback_text = _join_lines(traceback_lines)
            chunks.append(f'<pre class="text-out">{html.escape(traceback_text)}</pre>')
            rendered = True

    if not rendered:
        chunks.append('<pre class="text-out">(sem conteudo renderizavel)</pre>')

    chunks.append("</div>")
    return "\n".join(chunks)


def render_notebook_to_html(notebook: dict) -> str:
    parts = [
        "<!doctype html>",
        '<html lang="pt-BR">',
        "<head>",
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        "<title>Projeto 02 Notebook</title>",
        "<style>",
        """
:root {
  color-scheme: light;
  --bg: #f8f6fb;
  --panel: #ffffff;
  --line: #ded6eb;
  --text: #261a33;
  --muted: #6f6180;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: radial-gradient(1200px 420px at top right, #efe6fa 0%, var(--bg) 60%);
  color: var(--text);
  font-family: "Lora", Georgia, serif;
  line-height: 1.5;
}
main {
  max-width: 1160px;
  margin: 0 auto;
  padding: 1.3rem 1rem 2rem;
}
header {
  margin-bottom: 1rem;
}
h1 {
  margin: 0;
  font-size: clamp(1.1rem, 2.7vw, 1.6rem);
}
p.lead {
  margin: 0.35rem 0 0;
  color: var(--muted);
  font-size: 0.95rem;
}
.cell {
  border: 1px solid var(--line);
  border-radius: 0.85rem;
  background: var(--panel);
  margin: 0.9rem 0;
  overflow: hidden;
}
.cell-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.85rem;
  border-bottom: 1px solid var(--line);
  background: #faf8fd;
}
.badge {
  font: 600 0.76rem/1.2 "Manrope", Arial, sans-serif;
  color: #4f3f63;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.exec {
  font: 500 0.75rem/1.2 "Manrope", Arial, sans-serif;
  color: var(--muted);
}
pre {
  margin: 0;
  padding: 0.8rem 0.9rem;
  overflow-x: auto;
  background: #1a1326;
  color: #f1ebfa;
  border-top: 1px solid #2a1f3d;
  font: 0.83rem/1.55 "SFMono-Regular", Consolas, Menlo, monospace;
}
.output {
  padding: 0.8rem 0.9rem 1rem;
  border-top: 1px solid var(--line);
}
.output + .output {
  border-top: 1px dashed var(--line);
}
.output-title {
  margin: 0 0 0.55rem;
  color: #534268;
  font: 600 0.75rem/1.2 "Manrope", Arial, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.table-wrap {
  overflow-x: auto;
}
.table-wrap table {
  border-collapse: collapse;
  width: 100%;
  min-width: 620px;
}
.table-wrap th,
.table-wrap td {
  border: 1px solid #d9d1e7;
  padding: 0.34rem 0.5rem;
  text-align: right;
  font-size: 0.84rem;
}
.table-wrap th:first-child,
.table-wrap td:first-child {
  text-align: left;
}
.img-wrap {
  overflow-x: auto;
}
.img-wrap img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0 auto;
  border: 1px solid #d9d1e7;
  border-radius: 0.6rem;
  background: #fff;
}
.text-out {
  margin: 0;
  white-space: pre-wrap;
  font: 0.82rem/1.45 "SFMono-Regular", Consolas, Menlo, monospace;
  color: #3b2d4f;
}
@media (max-width: 760px) {
  main {
    padding: 0.9rem 0.55rem 1.2rem;
  }
  .cell-head {
    padding: 0.48rem 0.66rem;
  }
  pre,
  .output {
    padding-left: 0.66rem;
    padding-right: 0.66rem;
  }
}
""",
        "</style>",
        "</head>",
        "<body>",
        "<main>",
        (
            "<header>"
            "<h1>Projeto 02 - Notebook (IBGE)</h1>"
            "<p class=\"lead\">Copia renderizada com celulas, saidas e grafico final.</p>"
            "</header>"
        ),
    ]

    for index, cell in enumerate(notebook.get("cells", []), start=1):
        cell_type = str(cell.get("cell_type", "code"))
        execution_count = cell.get("execution_count")
        source_code = _join_lines(cell.get("source"))

        parts.append('<section class="cell">')
        parts.append(_render_cell_header(cell_type, index, execution_count))

        if source_code:
            parts.append(f"<pre><code>{html.escape(source_code)}</code></pre>")

        for output in cell.get("outputs", []):
            if isinstance(output, dict):
                parts.append(_render_output(output))

        parts.append("</section>")

    parts.extend(["</main>", "</body>", "</html>"])
    return "\n".join(parts)


def main() -> None:
    if not NOTEBOOK_PATH.exists():
        raise FileNotFoundError(f"Notebook file not found: {NOTEBOOK_PATH}")

    OUTPUT_HTML_PATH.parent.mkdir(parents=True, exist_ok=True)

    notebook = json.loads(NOTEBOOK_PATH.read_text(encoding="utf-8"))
    rendered_html = render_notebook_to_html(notebook)

    OUTPUT_HTML_PATH.write_text(rendered_html, encoding="utf-8")
    shutil.copyfile(NOTEBOOK_PATH, OUTPUT_IPYNB_PATH)

    print(f"Rendered: {OUTPUT_HTML_PATH}")
    print(f"Copied:   {OUTPUT_IPYNB_PATH}")


if __name__ == "__main__":
    main()
