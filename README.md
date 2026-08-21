# BRASA — site de hamburgueria

Single Page Application estática para uma hamburgueria, no estilo dos sites de
referência (Charrd Grill, Bleecker, La Birra Bar, Popl): vídeo em background,
imagens de tela cheia e transições conforme o usuário desce a página.

**Sem build, sem dependências.** É HTML, CSS e JavaScript puro — abre direto no
navegador e sobe em qualquer hospedagem estática (GitHub Pages, Netlify,
Vercel, S3, ou uma pasta no seu servidor).

## Rodando localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Abrir o `index.html` com dois cliques também funciona, mas prefira o servidor:
alguns navegadores bloqueiam vídeo e fontes via `file://`.

## Um arquivo só, para mandar por aí

```bash
python3 tools/build-standalone.py   # gera dist/brasa-standalone.html
```

Isso empacota CSS, JavaScript, fontes e imagens dentro de um único HTML de
~800 KB, que abre com dois cliques em qualquer lugar — sem servidor, sem
pasta de assets junto. Bom para mandar para alguém aprovar o layout.

Para publicar de verdade, use os arquivos normais: separados, eles carregam
em paralelo e cada um fica em cache por conta própria. E lembre que o vídeo
de fundo não entra no arquivo único (o hero fica com a brasa em canvas).

## Estrutura

```
index.html                  a página inteira (todas as seções)
assets/css/style.css        estilos, organizados por seção com índice no topo
assets/css/fonts.css        declarações @font-face (gerado, não edite à mão)
assets/js/main.js           interações de scroll, também com índice no topo
assets/img/                 placeholders em SVG (troque pelas fotos reais)
assets/fonts/               Anton e Inter em woff2, servidas do próprio site
assets/video/               vazia — instruções em assets/video/README.md
tools/gen-placeholders.py   regera os SVGs de placeholder
tools/fetch-fonts.sh        rebaixa as fontes e regera o fonts.css
tools/build-standalone.py   empacota tudo num HTML só (dist/, fora do git)
```

As fontes são hospedadas aqui em vez de puxadas do Google: uma requisição a
menos para terceiros, sem cookies de fora, e o texto aparece mais rápido. São
188 KB no total (subsets `latin` e `latin-ext`, o bastante para português).

## As seções

| # | Seção      | O que acontece                                                       |
|---|------------|----------------------------------------------------------------------|
| 1 | Hero       | Vídeo em tela cheia, título subindo linha por linha                  |
| 2 | Ticker     | Faixa laranja em movimento contínuo                                  |
| 3 | Manifesto  | Texto que acende palavra por palavra conforme você desce + contadores |
| 4 | Menu       | Imagem fixa à esquerda troca sozinha conforme o item entra na tela   |
| 5 | Break      | Foto em parallax com uma citação por cima                            |
| 6 | Processo   | A página trava e os passos deslizam na horizontal                    |
| 7 | A casa     | Texto e foto em parallax, lista de fatos                             |
| 8 | Unidades   | As três casas, com endereço e horário                                |
| 9 | Peça agora | Vídeo de fundo, botões de contato e captura de e-mail                |

Outros detalhes: preloader com contador, cursor que cresce em cima dos itens,
menu de tela cheia no mobile, header que some ao descer e volta ao subir, e o
fundo da página alternando entre preto e creme conforme a seção.

## Trocando os placeholders

**Imagens.** Todo `assets/img/*.svg` é placeholder. Substitua pelos arquivos
reais mantendo o nome (`menu-classico.jpg` etc.) e ajuste a extensão no
`index.html`. As proporções usadas hoje:

- `menu-*` — retrato 4:5
- `processo-*` — paisagem 7:5
- `casa-*` — paisagem 4:3
- `break-fogo`, `hero-poster` — paisagem larga, assunto no centro
- `sobre-equipe` — retrato 5:6

Exporte em no máximo 1920px de largura e passe num compressor (Squoosh,
ImageOptim). WebP é bem-vindo.

**Vídeos.** Veja `assets/video/README.md` — tem os comandos de `ffmpeg`
prontos. Enquanto não houver vídeo, o hero mostra um fundo animado em canvas.

**Textos.** Nomes de lanches, preços, endereços e telefones estão todos no
`index.html`, em português, prontos para trocar. Os links de WhatsApp,
Instagram e Google Maps estão com placeholders.

## Coisas que ficaram pendentes

- O formulário de e-mail só valida e mostra uma mensagem; falta plugar num
  serviço de verdade (o `TODO` está em `assets/js/main.js`).
- Os telefones, endereços e redes sociais são fictícios.
- Não há integração com plataforma de pedido/delivery.

## Acessibilidade e performance

- Tudo que se mexe respeita `prefers-reduced-motion`: com a opção ligada no
  sistema, as animações somem, o scroll horizontal vira empilhamento vertical
  e o texto aparece inteiro.
- Navegação por teclado com link "pular para o conteúdo" e foco visível — a
  primeira tabulação cai nele.
- Os vídeos pausam quando saem da tela e quando a aba fica em segundo plano;
  os efeitos de scroll rodam num único `requestAnimationFrame`.
