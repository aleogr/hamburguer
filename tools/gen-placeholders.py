#!/usr/bin/env python3
"""
Gera os SVGs de placeholder usados pelo site enquanto as fotos e vídeos reais
não chegam. Rode `python3 tools/gen-placeholders.py` para recriar os arquivos
em assets/img/. Quando tiver as imagens de verdade, é só substituir os arquivos
mantendo os mesmos nomes (ou trocar os caminhos no index.html).
"""
import math
import os
import random

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "img")

# nome, legenda, proporcao (w, h), cor base (h, s, l), semente, legenda no canto
# "legenda no canto" = imagem usada como fundo atras de texto: a legenda vai
# discreta no rodape em vez de no meio, para nao competir com o titulo.
PLACEHOLDERS = [
    ("hero-poster",      "HERO / POSTER DO VIDEO", (1920, 1080), (14, 62, 10), 1, True),
    # tela cheia na seção "como fazemos": legenda no canto, para não brigar
    # com o texto que fica por cima
    ("processo-01",      "A CARNE",                (1920, 1080), (10, 55, 11), 8, True),
    ("processo-02",      "A BRASA",                (1920, 1080), (22, 74, 12), 9, True),
    ("processo-03",      "A MONTAGEM",             (1920, 1080), (33, 60, 11), 10, True),
    ("casa-salao",       "O SALAO",                (1200, 900),  (20, 40, 11), 12, False),
    ("casa-balcao",      "O BALCAO",               (1200, 900),  (28, 36, 10), 13, False),
    ("sobre-equipe",     "A EQUIPE",               (1200, 1400), (30, 34, 10), 15, False),
]


def hsl(h, s, l):
    return f"hsl({h % 360} {s}% {l}%)"


def build(name, label, size, base, seed, corner_label=False):
    w, h = size
    bh, bs, bl = base
    rnd = random.Random(seed)

    grain = "".join(
        f'<circle cx="{rnd.randint(0, w)}" cy="{rnd.randint(0, h)}" '
        f'r="{rnd.choice([1, 1, 1, 2, 2, 3])}" fill="{hsl(bh + rnd.randint(-8, 14), bs, bl + rnd.randint(6, 30))}" '
        f'opacity="{rnd.uniform(0.04, 0.16):.2f}"/>'
        for _ in range(220)
    )

    # arcos concentricos, lembrando a brasa/chapa quente
    arcs = ""
    for i in range(7):
        r = (min(w, h) * 0.16) + i * (min(w, h) * 0.085)
        arcs += (
            f'<circle cx="{w * 0.5:.0f}" cy="{h * 0.52:.0f}" r="{r:.0f}" fill="none" '
            f'stroke="{hsl(bh + i * 3, bs, bl + 28 - i * 2)}" stroke-width="{max(1, 3 - i * 0.3):.1f}" '
            f'opacity="{max(0.03, 0.20 - i * 0.025):.2f}"/>'
        )

    # linhas diagonais discretas
    lines = ""
    step = max(48, int(min(w, h) / 14))
    for x in range(-h, w + h, step):
        lines += (
            f'<line x1="{x}" y1="0" x2="{x + h}" y2="{h}" stroke="{hsl(bh, bs, bl + 22)}" '
            f'stroke-width="1" opacity="0.05"/>'
        )

    fs = max(18, int(min(w, h) * 0.048))
    sub_fs = max(11, int(fs * 0.42))
    ratio = f"{w}×{h}"
    corner = max(14, int(min(w, h) * 0.035))

    if corner_label:
        # No alto e a direita: essas imagens ficam atras de texto, e no site o
        # texto sempre mora embaixo e a esquerda. Legenda no rodape colidia.
        cfs = max(13, int(min(w, h) * 0.022))
        caption = (
            f'<g text-anchor="end" font-family="Helvetica Neue, Arial, sans-serif" '
            f'transform="translate({w - corner * 2}, {corner * 2.4:.0f})">'
            f'<text font-size="{cfs}" font-weight="700" letter-spacing="{cfs * 0.2:.1f}" fill="#f4efe6" opacity="0.55">{label}</text>'
            f'<text y="{cfs * 1.5:.0f}" font-size="{max(10, int(cfs * 0.72))}" letter-spacing="{cfs * 0.16:.1f}" fill="#f4efe6" opacity="0.3">PLACEHOLDER · {ratio}</text>'
            f'</g>'
        )
    else:
        caption = (
            f'<g text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif">'
            f'<text x="{w / 2:.0f}" y="{h / 2:.0f}" font-size="{fs}" font-weight="700" letter-spacing="{fs * 0.06:.1f}" fill="#f4efe6" opacity="0.92">{label}</text>'
            f'<text x="{w / 2:.0f}" y="{h / 2 + fs * 1.15:.0f}" font-size="{sub_fs}" letter-spacing="{sub_fs * 0.22:.1f}" fill="#f4efe6" opacity="0.45">PLACEHOLDER · {ratio}</text>'
            f'</g>'
        )

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="Placeholder: {label}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{hsl(bh, bs, bl + 10)}"/>
      <stop offset="55%" stop-color="{hsl(bh - 6, bs - 10, max(4, bl - 4))}"/>
      <stop offset="100%" stop-color="{hsl(bh - 14, bs - 18, max(3, bl - 8))}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="52%" r="62%">
      <stop offset="0%" stop-color="{hsl(bh + 8, min(95, bs + 20), min(60, bl + 34))}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="{hsl(bh, bs, bl)}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="{w}" height="{h}" fill="url(#g)"/>
  {lines}
  <rect width="{w}" height="{h}" fill="url(#glow)"/>
  {arcs}
  {grain}
  <g fill="none" stroke="#FF951B" stroke-width="2" opacity="0.5">
    <path d="M{corner} {corner * 2} V{corner} H{corner * 2}"/>
    <path d="M{w - corner * 2} {corner} H{w - corner} V{corner * 2}"/>
    <path d="M{corner} {h - corner * 2} V{h - corner} H{corner * 2}"/>
    <path d="M{w - corner} {h - corner * 2} V{h - corner} H{w - corner * 2}"/>
  </g>
  {caption}
</svg>
"""


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, label, size, base, seed, corner_label in PLACEHOLDERS:
        path = os.path.join(OUT, name + ".svg")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(build(name, label, size, base, seed, corner_label))
        print("gerado:", os.path.relpath(path))


if __name__ == "__main__":
    main()
