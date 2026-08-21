# Vídeos de fundo

Esta pasta está vazia de propósito. O site já está preparado para dois vídeos
de background — enquanto os arquivos não existirem, o hero mostra um fundo
animado desenhado em `<canvas>` e a seção "Peça agora" usa o poster estático.

Coloque os arquivos aqui com exatamente estes nomes:

| Arquivo        | Onde aparece                     | Sugestão de conteúdo                          |
|----------------|----------------------------------|-----------------------------------------------|
| `hero.mp4`     | Topo da página (tela cheia)      | Chapa, carne prensando, fumaça. 8–15s em loop |
| `hero.webm`    | idem (versão leve p/ Chrome/FF)  | mesmo corte                                   |
| `cozinha.mp4`  | Seção "Peça agora"               | Movimento da cozinha, montagem do lanche      |
| `cozinha.webm` | idem                             | mesmo corte                                   |

## Como preparar o arquivo

Vídeo de fundo é decoração: não tem áudio, roda em loop e precisa ser leve.
Mire em **menos de 3 MB** para o hero — acima disso o primeiro carregamento
começa a doer no celular.

```bash
# MP4 (H.264) — compatível com todo mundo, inclusive iOS
ffmpeg -i original.mov -an -vf "scale=1920:-2,fps=25" \
       -c:v libx264 -crf 28 -preset slow -movflags +faststart hero.mp4

# WebM (VP9) — costuma ficar ~30% menor onde é suportado
ffmpeg -i original.mov -an -vf "scale=1920:-2,fps=25" \
       -c:v libvpx-vp9 -crf 36 -b:v 0 hero.webm

# Poster: um quadro parado do próprio vídeo, mostrado antes de carregar
ffmpeg -i hero.mp4 -ss 00:00:02 -frames:v 1 ../img/hero-poster.jpg
```

Se trocar o poster por um `.jpg`, atualize o atributo `poster` do `<video>`
em `index.html` (hoje aponta para `assets/img/hero-poster.svg`).

## Detalhes que importam

- O `<video>` já vai com `muted`, `loop`, `playsinline` e `autoplay` — sem
  `muted` + `playsinline` o iOS recusa o autoplay.
- Os vídeos só tocam quando a seção está visível na tela; fora dela ficam
  pausados para não gastar bateria.
- Enquadre o assunto no centro: o vídeo é cortado com `object-fit: cover`,
  então as bordas somem em telas estreitas.
- Um degradê escuro cobre o vídeo para o texto continuar legível. Se o seu
  material for muito claro, ajuste `.hero__scrim` em `assets/css/style.css`.
