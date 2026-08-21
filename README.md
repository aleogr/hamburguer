# Hamburgueria Maná — site

Single Page Application estática para a Hamburgueria Maná, no estilo dos sites
de referência (Charrd Grill, Bleecker, La Birra Bar, Popl): mídia de tela cheia
e transições conforme o usuário desce a página.

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
python3 tools/build-standalone.py   # gera dist/mana-standalone.html
```

Empacota CSS, JavaScript, fontes e imagens dentro de um único HTML, que abre
com dois cliques em qualquer lugar. Bom para mandar para alguém aprovar o
layout. Para publicar de verdade, use os arquivos separados: carregam em
paralelo e cada um fica em cache por conta própria.

## ⚠️ O que é real e o que ainda é placeholder

**Veio do cardápio em PDF e está conferido** — 36 itens, com nome, descrição,
ingredientes e preço. A conferência foi feita parenado nome e preço pelas
coordenadas de cada elemento no PDF, não pela ordem do texto (que vinha
embaralhada). Também saíram do PDF as seis fotos dos especiais, o logo, a
textura de madeira e a chama.

**Ainda é inventado — troque antes de publicar.** Está tudo marcado com
`TODO` no `index.html`:

| Onde | O quê |
|---|---|
| Seção "Peça agora" | Endereço, horário, telefone e WhatsApp |
| Rodapé e menu mobile | Instagram, WhatsApp, telefone |
| Seção "A casa" | O texto sobre a hamburgueria |
| Seção "Como fazemos" | Os três passos do preparo |

Os textos de "A casa" e "Como fazemos" foram escritos a partir do que o próprio
cardápio diz (brasa, 180 g, brioche, maionese artesanal). Confira se batem com
a cozinha de verdade.

## Estrutura

```
index.html                  a página inteira (todas as seções)
assets/css/style.css        estilos, organizados por seção com índice no topo
assets/css/fonts.css        declarações @font-face (gerado, não edite à mão)
assets/js/main.js           interações de scroll, também com índice no topo
assets/img/                 fotos do cardápio (.webp) e placeholders (.svg)
assets/fonts/               Anton e Inter em woff2, servidas do próprio site
assets/video/               vazia — instruções em assets/video/README.md
tools/extract-cardapio.py   extrai as imagens do PDF do cardápio
tools/gen-placeholders.py   regera os SVGs de placeholder
tools/fetch-fonts.sh        rebaixa as fontes e regera o fonts.css
tools/build-standalone.py   empacota tudo num HTML só (dist/, fora do git)
```

## As seções

| # | Seção | O que acontece |
|---|---|---|
| 1 | Hero | Vídeo em tela cheia, título subindo linha por linha, lanche em parallax |
| 2 | Ticker | Faixa laranja em movimento contínuo |
| 3 | A Maná | Texto acende palavra por palavra + contadores |
| 4 | Especiais | Palco de tela cheia: o lanche fica ao fundo e troca conforme o painel de texto passa pelo meio |
| 5 | Break | Madeira em parallax e chama, com a frase do X-Meio Quilo |
| 6 | Tradicionais | Grade de sete cartões |
| 7 | Combos | Grade de nove combos + porções |
| 8 | Bebidas | Lista de preços em duas colunas |
| 9 | Como fazemos | A página trava e os passos deslizam na horizontal |
| 10 | A casa | Texto e foto em parallax |
| 11 | Peça agora | Vídeo de fundo, contatos e captura de e-mail |

Outros detalhes: preloader com contador, cursor que cresce sobre os itens, menu
de tela cheia no mobile, header que some ao descer e volta ao subir, e o fundo
da página alternando entre o marrom escuro e o creme conforme a seção.

## Trocando as imagens

**As fotos vieram do PDF em baixa resolução** — o maior recorte tem 341 px, e
na seção de especiais elas aparecem ocupando meia tela. Para aguentar esse
tamanho, `tools/extract-cardapio.py` já as amplia com Lanczos e uma máscara de
nitidez, o que evita a ampliação borrada que o navegador faria. Isso não cria
detalhe que não existe: **se você tiver os arquivos originais das fotos,
prefira eles** — é só substituir em `assets/img/` mantendo os nomes, e aí dá
para soltar os limites de tamanho no CSS.

Para reextrair tudo do PDF (se o cardápio mudar):

```bash
pip install pymupdf pillow
python3 tools/extract-cardapio.py caminho/para/cardapio.pdf
```

Ainda são placeholders em SVG, gerados por `tools/gen-placeholders.py`:
`processo-01/02/03`, `sobre-equipe`, `casa-salao`, `casa-balcao` e
`hero-poster`.

**Vídeos.** Veja `assets/video/README.md` — tem os comandos de `ffmpeg`
prontos. Enquanto não houver vídeo, o hero mostra uma brasa animada em canvas.

## Como funciona o palco dos especiais

O lanche ao fundo não é um `background-image`: é um bloco `position: sticky` de
uma tela de altura, e o texto passa por cima dele. O truque é o `.stage__flow`
ter `margin-top: -100svh`, sobrepondo exatamente a altura do palco.

Cada lanche tem um painel de uma tela (`.panel`), então só um aparece por vez.
Um `IntersectionObserver` com faixa estreita no meio da tela (`rootMargin`
de -45% em cima e embaixo) decide qual foto acende. Mexer nesses dois números
— a altura do painel e a largura da faixa — é o que ajusta o ritmo da troca.

## Paleta

Amostrada direto do PDF e definida em tokens no topo do `style.css`:

- `--ink` `#210A09` — o marrom quase preto do fundo
- `--cream` `#F4E9DF` — o texto claro e o fundo das seções claras
- `--ember` `#FF951B` — o laranja das pílulas de preço
- `--ember-text` — o mesmo laranja no escuro, e um laranja queimado
  (`#A8480A`) no claro, onde o original só teria 1,9:1 de contraste

Trocar esses valores muda o site inteiro.

## Acessibilidade e performance

- Tudo que se mexe respeita `prefers-reduced-motion`: com a opção ligada no
  sistema, as animações somem, o scroll horizontal vira empilhamento vertical
  e o texto aparece inteiro.
- Navegação por teclado com link "pular para o conteúdo" e foco visível — a
  primeira tabulação cai nele.
- Botões e pílulas de preço usam texto escuro sobre o laranja (9:1), como no
  cardápio impresso; branco sobre laranja não passaria.
- Os vídeos pausam quando saem da tela e quando a aba fica em segundo plano;
  os efeitos de scroll rodam num único `requestAnimationFrame`.
