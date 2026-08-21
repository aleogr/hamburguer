#!/usr/bin/env python3
"""
Gera dist/mana-standalone.html: a página inteira num arquivo só, com CSS, JS,
fontes e imagens embutidos. Serve para mandar por e-mail/WhatsApp ou abrir com
dois cliques, sem precisar de servidor.

Rode `python3 tools/build-standalone.py` sempre que mexer no site.

Para publicar de verdade, use os arquivos normais (index.html + assets/): eles
carregam em paralelo e ficam em cache separadamente, o que é bem mais rápido.
"""
import base64
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "dist")
OUT = os.path.join(OUT_DIR, "mana-standalone.html")

MIME = {".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png",
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
        return fh.read()


def data_uri(rel):
    path = os.path.join(ROOT, rel)
    ext = os.path.splitext(path)[1].lower()
    with open(path, "rb") as fh:
        blob = fh.read()
    return "data:%s;base64,%s" % (MIME.get(ext, "application/octet-stream"),
                                  base64.b64encode(blob).decode("ascii"))


def main():
    html = read("index.html")

    # ── CSS: fontes primeiro, com os woff2 embutidos ──────────────────────
    css = read("assets/css/fonts.css") + "\n" + read("assets/css/style.css")
    css = re.sub(r"url\('\.\./fonts/([^']+)'\)",
                 lambda m: "url('%s')" % data_uri("assets/fonts/" + m.group(1)),
                 css)
    # o style.css referencia imagens por caminho relativo a assets/css/
    css = re.sub(r"url\(\"\.\./img/([^\"]+)\"\)",
                 lambda m: 'url("%s")' % data_uri("assets/img/" + m.group(1)),
                 css)

    # ── troca os <link> por um <style> só ─────────────────────────────────
    html = re.sub(r'\n<link rel="preload"[^>]*>', "", html)
    html = re.sub(r'\n<link rel="stylesheet" href="assets/css/fonts\.css">', "", html)
    html = html.replace('<link rel="stylesheet" href="assets/css/style.css">',
                        "<style>\n" + css + "\n</style>")

    # ── imagens, poster e favicon viram data URI ──────────────────────────
    def swap(m):
        attr, path = m.group(1), m.group(2)
        return '%s="%s"' % (attr, data_uri(path))

    html = re.sub(r'\b(src|href|poster|content)="(assets/img/[^"]+)"', swap, html)

    # ── JS embutido ───────────────────────────────────────────────────────
    html = html.replace('<script src="assets/js/main.js"></script>',
                        "<script>\n" + read("assets/js/main.js") + "\n</script>")

    # ── aviso no topo, para quem abrir o arquivo e ficar em dúvida ────────
    html = html.replace(
        "<!doctype html>",
        "<!doctype html>\n<!-- Versão de arquivo único, gerada por tools/build-standalone.py.\n"
        "     Não edite este arquivo: mexa no index.html e nos assets/ e rode o script de novo.\n"
        "     Os vídeos de fundo não estão embutidos (o hero usa a brasa animada em canvas). -->", 1)

    for leftover in re.findall(r'"(assets/[^"]+)"', html):
        if not leftover.startswith("assets/video/"):
            print("aviso: sobrou referência a %s" % leftover, file=sys.stderr)

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(html)
    print("gerado: %s (%.1f MB)" % (os.path.relpath(OUT, ROOT),
                                    os.path.getsize(OUT) / 1024 / 1024))


if __name__ == "__main__":
    main()
