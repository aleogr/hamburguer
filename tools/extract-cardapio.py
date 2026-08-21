#!/usr/bin/env python3
"""
Extrai as imagens do cardápio em PDF da Maná e grava em assets/img/ como WebP.

    python3 tools/extract-cardapio.py caminho/para/cardapio.pdf

As fotos dos lanches, o logo e as texturas estão embutidos no PDF com a
transparência guardada à parte, numa "soft mask" (SMask). Se a máscara não for
aplicada, cada recorte vem com um retângulo preto em volta — por isso o
Pixmap(base, mask) abaixo.

Precisa de pymupdf e pillow:  pip install pymupdf pillow

As imagens saem na resolução em que estavam no PDF, que é baixa (o maior
lanche tem 379 px de altura). Se você tiver as fotos originais, prefira elas:
é só substituir os arquivos em assets/img/ mantendo os nomes.
"""
import os
import sys

import pymupdf
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img")

# xref no PDF -> nome do arquivo. Os xrefs vêm da primeira página, que é a dos
# especiais; as demais reaproveitam as mesmas imagens de fundo.
IMAGENS = {
    270: ("burger-classico", 88),
    272: ("burger-hothoney", 88),
    273: ("burger-queijos", 88),
    271: ("burger-texas", 88),
    275: ("burger-romeu", 88),
    274: ("burger-big", 88),
    276: ("burger-hero", 90),
    277: ("logo-mana", 92),
    268: ("textura-madeira", 76),
    322: ("chama", 70),
}


def rgba(doc, xref, smask):
    """Junta a imagem com a máscara de transparência e devolve um PIL RGBA."""
    base = pymupdf.Pixmap(doc, xref)
    if base.colorspace and base.colorspace.n == 4:      # CMYK
        base = pymupdf.Pixmap(pymupdf.csRGB, base)
    if smask:
        base = pymupdf.Pixmap(base, pymupdf.Pixmap(doc, smask))
    modo = "RGBA" if base.alpha else "RGB"
    im = Image.frombytes(modo, (base.width, base.height), base.samples)
    return im.convert("RGBA")


def recorta(im):
    """Tira a moldura totalmente transparente que sobra em volta do recorte."""
    bb = im.split()[-1].getbbox()
    return im.crop(bb) if bb else im


def main():
    if len(sys.argv) < 2:
        sys.exit("uso: python3 tools/extract-cardapio.py caminho/para/cardapio.pdf")

    doc = pymupdf.open(sys.argv[1])
    mascaras = {}
    for pagina in doc:
        for img in pagina.get_images(full=True):
            mascaras.setdefault(img[0], img[1])

    faltando = [x for x in IMAGENS if x not in mascaras]
    if faltando:
        sys.exit("xrefs não encontrados no PDF: %s\n"
                 "O PDF provavelmente mudou — reveja o dicionário IMAGENS." % faltando)

    os.makedirs(OUT, exist_ok=True)
    for xref, (nome, q) in IMAGENS.items():
        im = recorta(rgba(doc, xref, mascaras[xref]))
        destino = os.path.join(OUT, nome + ".webp")
        im.save(destino, "WEBP", quality=q, method=6)
        print("%-18s %4dx%-5d %5d KB" % (nome, im.width, im.height,
                                         os.path.getsize(destino) // 1024))


if __name__ == "__main__":
    main()
