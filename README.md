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
| 4 | Especiais | Palco de tela cheia: cada rolada do mouse (ou seta do teclado) pula para o próximo lanche |
| 5 | Break | Madeira em parallax e chama, com a frase do X-Meio Quilo |
| 6 | Tradicionais | Grade de sete cartões |
| 7 | Combos | Grade de nove combos + porções |
| 8 | Bebidas | Lista de preços em duas colunas |
| 9 | Como fazemos | Tira horizontal: cada passo ocupa uma tela, com a foto de fundo, e desliza para o lado conforme a página desce |
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
`hero-poster`. Os que ficam atrás de texto levam a legenda no canto superior
direito, porque no site o texto sempre mora embaixo e à esquerda.

Os três de `processo-*` aparecem em tela cheia e são os que mais pedem foto
real: uma da carne sendo moldada, uma da brasa e uma da montagem, em paisagem
16:9, com o assunto no centro ou à direita (a esquerda fica coberta pelo
texto).

**Vídeos.** Veja `assets/video/README.md` — tem os comandos de `ffmpeg`
prontos. Enquanto não houver vídeo, o hero mostra uma brasa animada em canvas.

## Como funciona o palco dos especiais

O lanche ao fundo não é um `background-image`: é um bloco `position: sticky` de
uma tela de altura, e o texto passa por cima dele. O truque é o `.stage__flow`
ter `margin-top: -100svh`, sobrepondo exatamente a altura do palco.

Cada lanche tem um painel de uma tela (`.panel`), então só um aparece por vez.
Um `IntersectionObserver` com faixa estreita no meio da tela (`rootMargin`
de -45% em cima e embaixo) decide qual foto acende.

### Uma rolada, um lanche

Dentro dessa seção o site assume a rolagem: cada gesto de mouse ou tecla de
seta pula direto para o próximo lanche, em vez de rolar continuamente. Isso
mora no módulo `passoAPasso` do `main.js`, e são três constantes no topo dele:

| Constante | Para quê |
|---|---|
| `DURACAO` | quanto dura o salto, em ms |
| `SILENCIO` | quanto tempo sem eventos até aceitar o próximo gesto |
| `TOLERANCIA` | folga em px para o painel atual não contar como "próximo" |

Dois detalhes que fazem a diferença:

- **Trackpad dispara dezenas de eventos por gesto**, e eles continuam chegando
  depois que o dedo sai. Por isso o destravamento só acontece após `SILENCIO`
  sem nenhum evento **e** com a animação já terminada — sem essa segunda
  condição, um gesto que para cedo destrava no meio do salto e o evento
  seguinte pula dois lanches de uma vez.
- **A seção devolve o controle nas pontas.** No último lanche, rolar para
  baixo não encontra próximo destino e o navegador volta a rolar sozinho; no
  primeiro, o mesmo para cima. Ninguém fica preso.

Quem não recebe esse tratamento:

- **Toque.** Aí quem dá o passo é o `scroll-snap` do navegador (só os painéis
  têm ponto de parada), que respeita o impulso do dedo melhor do que qualquer
  coisa em JS.
- **`prefers-reduced-motion`.** Tirar o controle da rolagem de quem pediu menos
  movimento seria o oposto do combinado: ali a seção rola normalmente.
- **Campos de formulário.** Com o foco num input, as setas seguem movendo o
  cursor.

## Como funciona a tira do "como fazemos"

Mesma ideia do palco, no eixo X: o bloco fica `sticky` e uma tira de painéis de
tela cheia (`.frame`, cada um com `flex: 0 0 100vw`) desliza no eixo horizontal
conforme a página desce. A altura da seção é calculada no JS a partir da
largura total da tira — é ela que "segura" o scroll.

Duas constantes no módulo `processScroll` do `main.js`:

| Constante | Para quê |
|---|---|
| `RITMO` | quanto de rolagem vertical custa a tira inteira. Em `1` os quatro painéis exigiriam quase cinco telas de scroll; em `0.6` a tira anda um pouco mais rápido que o dedo, sem ficar brusca |
| `FOLGA` | o quanto a foto se desloca dentro do painel. Ela é 112% da largura, e andar menos que o painel é o que dá a profundidade |

O texto de cada painel acende e apaga conforme ele entra e sai do
enquadramento. Sem isso, no meio da passagem apareciam dois textos cortados ao
mesmo tempo — no celular, onde o painel é estreito, ficava ilegível.

Com `prefers-reduced-motion` não há tira nem travamento: os quatro passos
viram uma pilha vertical comum.

## Paleta

Amostrada direto do PDF e definida em tokens no topo do `style.css`:

- `--ink` `#210A09` — o marrom quase preto do fundo
- `--cream` `#F4E9DF` — o texto claro e o fundo das seções claras
- `--ember` `#FF951B` — o laranja das pílulas de preço
- `--ember-text` — o mesmo laranja no escuro, e um laranja queimado
  (`#A8480A`) no claro, onde o original só teria 1,9:1 de contraste

Trocar esses valores muda o site inteiro.

## O que custa caro num site assim

A primeira versão engasgava na tira do "como fazemos". Medindo o intervalo
entre quadros (16,7 ms = 60 fps) seção por seção, com o scroll acionado num
laço de `requestAnimationFrame`, deu para separar quem era culpado de quem só
estava por perto:

| Seção | Antes | Depois |
|---|---|---|
| Hero | 64,7 ms | 16,7 ms |
| Especiais | 42,9 ms | 16,9 ms |
| Como fazemos | 20,5 ms | 16,9 ms |
| Resto da página | 16,7 ms | 16,7 ms |

Quatro causas, em ordem de tamanho:

1. **`filter: drop-shadow` em elemento que se move.** Sozinho respondia por
   quase todo o custo do hero (44 → 17 ms). O filtro é recalculado a cada
   quadro em que o elemento muda de posição, e tanto o lanche do hero quanto as
   fotos dos especiais têm parallax e transição. A sombra virou um degradê
   radial no fundo, que é pintado uma vez só — visualmente é o mesmo.
2. **`mix-blend-mode` no grão.** A textura ficava num elemento de quatro vezes
   a área da tela, composta em modo `overlay` e ainda animada. Custava ~24 ms
   por quadro no hero e nos especiais. Agora é estática, sem blend e numa área
   justa.
3. **Dois retângulos de tela cheia empilhados.** No "como fazemos", o
   escurecido cobria o painel inteiro por cima da foto. Passou a cobrir só a
   metade de baixo, onde mora o texto, mais uma faixa curta no topo.
4. **Escrever estilo em todo quadro dentro de uma camada transformada.** O
   texto dos painéis tinha `opacity` e `transform` recalculados a cada quadro,
   o que invalidava a camada da tira inteira. Virou uma classe trocada só na
   passagem, com a transição por conta do CSS.

Duas lições que valem para as próximas mudanças: **filtro em elemento que se
mexe é caro**, e **quanto menos coisa mudar dentro de um elemento
transformado, melhor** — o ideal é que a tira seja a única coisa que se move.

Uma armadilha que também apareceu no caminho: cheguei a rasterizar os
placeholders SVG para WebP achando que o custo era re-rasterizar vetor. Não
era — e o rasterizador do MuPDF não desenha gradiente nenhum, devolvendo
retângulos pretos sem reclamar. Ficou registrado no cabeçalho do
`gen-placeholders.py` para ninguém tentar de novo.

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
- Os painéis do "como fazemos" usam `content-visibility: auto`: painel fora da
  tela não é desenhado.
- A brasa animada em canvas desenha a 30 fps, não a 60 — as brasas se mexem
  devagar e a diferença não aparece. Ela some de vez quando houver vídeo.
- O texto dos painéis só some depois que o JS assume a tira. Sem script, os
  quatro passos aparecem empilhados e legíveis.
