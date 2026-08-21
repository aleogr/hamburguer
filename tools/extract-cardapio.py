#!/usr/bin/env python3
"""
Extrai as imagens do cardápio em PDF da Maná e grava em assets/img/ como WebP.

    python3 tools/extract-cardapio.py caminho/para/cardapio.pdf

As fotos dos lanches, o logo e as texturas estão embutidos no PDF com a
transparência guardada à parte, numa "soft mask" (SMask). Se a máscara não for
aplicada, cada recorte vem com um retângulo preto em volta — por isso o
Pixmap(base, mask) abaixo.

Precisa de pymupdf e pillow:  pip install pymupdf pillow

No PDF as fotos são pequenas (o maior recorte tem 341 px). Como no site elas
aparecem grandes, os recortes saem daqui já ampliados com Lanczos + máscara de
nitidez — o que evita a ampliação borrada do navegador, mas não cria detalhe
que não existe. Se você tiver as fotos originais, prefira elas: é só substituir
os arquivos em assets/img/ mantendo os nomes.
"""
import os
import sys

import pymupdf
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img")

# Os recortes dos lanches aparecem grandes no site (ocupam meia tela na seção
# de especiais), mas no PDF têm menos de 350 px. Ampliar no navegador borra:
# o Lanczos com uma máscara de nitidez em cima segura bem melhor a borda do
# pão e o brilho do queijo. Não inventa detalhe que não existe — só evita que
# a ampliação vire mingau.
ALTURA_ALVO = 760      # px; nenhum recorte é ampliado além de MAX_FATOR
MAX_FATOR = 2.8

# xref no PDF -> (nome do arquivo, qualidade webp, ampliar?)
IMAGENS = {
    270: ("burger-classico", 86, True),
    272: ("burger-hothoney", 86, True),
    273: ("burger-queijos", 86, True),
    271: ("burger-texas", 86, True),
    275: ("burger-romeu", 86, True),
    274: ("burger-big", 86, True),
    276: ("burger-hero", 88, True),
    277: ("logo-mana", 92, False),
    268: ("textura-madeira", 76, False),
    322: ("chama", 70, False),
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


def amplia(im):
    """Amplia com Lanczos e devolve a nitidez que a interpolação come."""
    fator = min(ALTURA_ALVO / im.height, MAX_FATOR)
    if fator <= 1.02:
        return im
    novo = (round(im.width * fator), round(im.height * fator))
    im = im.resize(novo, Image.LANCZOS)
    # só o canal de cor leva a máscara; mexer no alfa serrilharia o recorte
    rgb, alfa = im.convert("RGB"), im.split()[-1]
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=1.6, percent=110, threshold=3))
    rgb.putalpha(alfa)
    return rgb


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
    for xref, (nome, q, ampliar) in IMAGENS.items():
        im = recorta(rgba(doc, xref, mascaras[xref]))
        if ampliar:
            im = amplia(im)
        destino = os.path.join(OUT, nome + ".webp")
        im.save(destino, "WEBP", quality=q, method=6)
        print("%-18s %4dx%-5d %5d KB" % (nome, im.width, im.height,
                                         os.path.getsize(destino) // 1024))


if __name__ == "__main__":
    main()
