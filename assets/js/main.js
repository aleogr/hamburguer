/* ==========================================================================
   Hamburgueria Maná — interações da página
   Vanilla JS, sem dependências. Tudo respeita prefers-reduced-motion.

   Índice:
   1.  Utilitários
   2.  Loader
   3.  Cursor customizado
   4.  Navegação (esconder/mostrar, estado sólido, link ativo)
   5.  Menu overlay (mobile)
   6.  Troca de tema por seção
   7.  Revelações no scroll
   8.  Texto que acende palavra a palavra
   9.  Contadores
   10. Especiais: troca o lanche do palco
   11. Especiais: um lanche por rolada
   12. Parallax
   13. Processo: scroll horizontal travado
   14. Vídeos de fundo (+ fallback animado no canvas)
   15. Carrinho e pedido pelo WhatsApp
   16. Formulário e miudezas
   17. Loop de scroll (rAF)
   ========================================================================== */
(function () {
  "use strict";

  /* ── 1. Utilitários ───────────────────────────────────────────────────── */
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp  = function (a, b, t) { return a + (b - a) * t; };

  var scrollTasks = [];   // funções chamadas a cada frame de scroll
  var onScroll = function (fn) { scrollTasks.push(fn); fn(); };

  /* ── 2. Loader ────────────────────────────────────────────────────────── */
  (function loader() {
    var el = $("#loader"), count = $("#loaderCount"), bar = $("#loaderBar");
    if (!el) return;

    var done = function () {
      el.classList.add("is-done");
      document.body.classList.add("is-ready");
      window.setTimeout(function () { el.remove(); }, 900);
    };

    if (reduced) { done(); return; }

    var p = 0;
    var tick = window.setInterval(function () {
      p = Math.min(100, p + Math.random() * 14 + 4);
      count.textContent = Math.round(p);
      bar.style.width = p + "%";
      if (p >= 100) {
        window.clearInterval(tick);
        window.setTimeout(done, 380);
      }
    }, 110);

    // rede lenta não pode travar a página
    window.setTimeout(function () { window.clearInterval(tick); done(); }, 4200);
  })();

  /* ── 3. Cursor customizado ────────────────────────────────────────────── */
  (function cursor() {
    var el = $("#cursor"), label = $("#cursorLabel");
    if (!el || reduced || window.matchMedia("(pointer: coarse)").matches) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, on = false;

    document.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!on) { cx = tx; cy = ty; on = true; el.classList.add("is-on"); }
    });
    document.addEventListener("mouseleave", function () { el.classList.remove("is-on"); });

    document.addEventListener("mouseover", function (e) {
      var t = e.target.closest("[data-cursor]");
      if (t) { el.classList.add("is-big"); label.textContent = t.getAttribute("data-cursor"); }
      else { el.classList.remove("is-big"); label.textContent = ""; }
    });

    (function frame() {
      cx = lerp(cx, tx, 0.18);
      cy = lerp(cy, ty, 0.18);
      el.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      window.requestAnimationFrame(frame);
    })();
  })();

  /* ── 4. Navegação ─────────────────────────────────────────────────────── */
  (function nav() {
    var el = $("#nav");
    if (!el) return;
    var last = 0;

    onScroll(function (y) {
      y = y || window.scrollY;
      el.classList.toggle("is-solid", y > window.innerHeight * 0.85);
      var down = y > last && y > 300;
      el.classList.toggle("is-hidden", down && !el.classList.contains("is-open"));
      last = y;
    });

    // link ativo conforme a seção visível
    var links = $$(".nav__links a");
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = { link: a, sec: sec };
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var m = map[en.target.id];
        if (m) m.link.classList.toggle("is-active", en.isIntersecting);
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    Object.keys(map).forEach(function (k) { io.observe(map[k].sec); });
  })();

  /* ── 5. Menu overlay ──────────────────────────────────────────────────── */
  (function overlay() {
    var burger = $("#burger"), ov = $("#overlay"), nav = $("#nav");
    if (!burger || !ov) return;

    var links = $$(".overlay__nav a", ov);
    links.forEach(function (a, i) { a.style.setProperty("--d", (120 + i * 70) + "ms"); });

    var open = false;
    var set = function (state) {
      open = state;
      burger.setAttribute("aria-expanded", String(state));
      burger.setAttribute("aria-label", state ? "Fechar menu" : "Abrir menu");
      nav.classList.toggle("is-open", state);
      document.body.classList.toggle("is-locked", state);
      if (state) {
        ov.hidden = false;
        window.requestAnimationFrame(function () { ov.classList.add("is-open"); });
      } else {
        ov.classList.remove("is-open");
        window.setTimeout(function () { if (!open) ov.hidden = true; }, 800);
      }
    };

    burger.addEventListener("click", function () { set(!open); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) set(false); });
    window.__closeOverlay = function () { if (open) set(false); };
  })();

  // rolagem suave dos âncoras (e fecha o overlay antes)
  $$("[data-nav]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (!id || id.charAt(0) !== "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (window.__closeOverlay) window.__closeOverlay();
      window.setTimeout(function () {
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }, 120);
    });
  });

  /* ── 6. Troca de tema por seção ───────────────────────────────────────── */
  (function theme() {
    var secs = $$("[data-theme]");
    if (!secs.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          document.body.setAttribute("data-theme", en.target.getAttribute("data-theme"));
        }
      });
    }, { rootMargin: "-50% 0px -49% 0px" });
    secs.forEach(function (s) { io.observe(s); });
  })();

  /* ── 7. Revelações no scroll ──────────────────────────────────────────── */
  (function reveals() {
    var els = $$(".reveal");
    if (!els.length) return;
    if (reduced) { els.forEach(function (e) { e.classList.add("is-in"); }); return; }

    // escalona irmãos para o conteúdo entrar em cascata.
    // Map, não objeto: um nó do DOM como chave de objeto vira sempre a mesma
    // string, e aí a página inteira caía num grupo só (todo mundo com o
    // atraso máximo, o que fazia as últimas seções demorarem a aparecer).
    var groups = new Map();
    els.forEach(function (el) {
      var siblings = groups.get(el.parentNode) || [];
      el.style.setProperty("--d", Math.min(siblings.length, 5) * 80 + "ms");
      siblings.push(el);
      groups.set(el.parentNode, siblings);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });

    els.forEach(function (el) { io.observe(el); });
  })();

  /* ── 8. Texto que acende palavra a palavra ────────────────────────────── */
  (function fillText() {
    var blocks = $$("[data-fill]");
    if (!blocks.length || reduced) return;

    blocks.forEach(function (block) {
      var words = block.textContent.trim().split(/\s+/);
      block.textContent = "";
      words.forEach(function (w, i) {
        var s = document.createElement("span");
        s.className = "w";
        s.textContent = w;
        block.appendChild(s);
        if (i < words.length - 1) block.appendChild(document.createTextNode(" "));
      });
      block.__words = $$(".w", block);
    });

    onScroll(function () {
      var vh = window.innerHeight;
      blocks.forEach(function (block) {
        var r = block.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        // 0 quando o bloco entra pela base, 1 quando passa da metade da tela
        var p = clamp((vh * 0.85 - r.top) / (vh * 0.55 + r.height * 0.5), 0, 1);
        var n = Math.round(p * block.__words.length);
        block.__words.forEach(function (w, i) { w.classList.toggle("on", i < n); });
      });
    });
  })();

  /* ── 9. Contadores ────────────────────────────────────────────────────── */
  (function counters() {
    var els = $$("[data-count]");
    if (!els.length) return;
    if (reduced) {
      els.forEach(function (e) { e.textContent = e.getAttribute("data-count"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, to = parseInt(el.getAttribute("data-count"), 10) || 0, t0 = null;
        (function step(ts) {
          if (t0 === null) t0 = ts;
          var p = clamp((ts - t0) / 1400, 0, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) window.requestAnimationFrame(step);
        })(0 || performance.now());
      });
    }, { threshold: 0.6 });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* ── 10. Especiais: troca o lanche do palco conforme o painel passa ───── */
  (function palco() {
    var paineis = $$("[data-menu-item]");
    var fotos   = $$("[data-menu-img]");
    var pontos  = $$("[data-dot]");
    var nome    = $("#stageName");
    if (!paineis.length || !fotos.length) return;

    var mostra = function (chave, titulo) {
      fotos.forEach(function (f) {
        f.classList.toggle("is-on", f.getAttribute("data-menu-img") === chave);
      });
      pontos.forEach(function (d) {
        d.classList.toggle("is-on", d.getAttribute("data-dot") === chave);
      });
      if (nome && titulo) nome.textContent = titulo;
    };

    // a faixa estreita no meio da tela garante que só um painel mande por vez
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        paineis.forEach(function (p) { p.classList.toggle("is-active", p === en.target); });
        mostra(en.target.getAttribute("data-menu-item"), $("h3", en.target).textContent);
      });
    }, { rootMargin: "-45% 0px -45% 0px" });

    paineis.forEach(function (p) { io.observe(p); });
    paineis[0].classList.add("is-active");
  })();

  /* ── 11. Especiais: um lanche por rolada ──────────────────────────────── */
  (function passoAPasso() {
    var sec = $("#especiais");
    if (!sec) return;
    var paineis = $$(".panel", sec);
    if (!paineis.length) return;

    // Com movimento reduzido não tomamos conta da rolagem: tirar o controle do
    // scroll de quem pediu menos movimento seria o oposto do combinado.
    if (reduced) return;
    // No toque quem faz o trabalho é o scroll-snap do CSS — ele respeita o
    // impulso do dedo melhor do que qualquer coisa que a gente escreva aqui.
    if (window.matchMedia("(pointer: coarse)").matches) return;

    var TOLERANCIA = 8;    // px; o painel onde já estamos não conta como próximo
    var DURACAO = 560;     // ms do salto
    var SILENCIO = 320;    // ms sem eventos para destravar

    var travado = false, timerSilencio = null, raf = null;

    var topoDoPainel = function (p) {
      return Math.round(window.scrollY + p.getBoundingClientRect().top);
    };

    // Y do próximo ponto de parada naquele sentido, ou null se acabaram — e aí
    // a rolagem volta a ser do navegador e a página sai da seção normalmente.
    var proximoAlvo = function (dir) {
      var y = window.scrollY, melhor = null;
      paineis.forEach(function (p) {
        var t = topoDoPainel(p);
        if (dir > 0 && t > y + TOLERANCIA) {
          if (melhor === null || t < melhor) melhor = t;
        } else if (dir < 0 && t < y - TOLERANCIA) {
          if (melhor === null || t > melhor) melhor = t;
        }
      });
      return melhor;
    };

    // só mandamos na rolagem enquanto a seção ocupa a tela inteira
    var noComando = function () {
      var r = sec.getBoundingClientRect();
      return r.top <= 2 && r.bottom >= window.innerHeight - 2;
    };

    // Um gesto de trackpad dispara dezenas de eventos, e ainda por cima eles
    // continuam chegando depois que o dedo sai. Só destravamos depois de um
    // intervalo sem nenhum evento E com a animação já terminada — sem essa
    // segunda condição, um gesto que para cedo destravava no meio do salto e
    // o evento seguinte pulava um segundo lanche.
    var destravaNoSilencio = function () {
      window.clearTimeout(timerSilencio);
      timerSilencio = window.setTimeout(function () {
        if (raf) { destravaNoSilencio(); return; }
        travado = false;
      }, SILENCIO);
    };

    var salta = function (destino) {
      travado = true;
      var inicio = window.scrollY, dist = destino - inicio, t0 = null;
      // o scroll-behavior:smooth do CSS brigaria com a nossa própria animação
      document.documentElement.classList.add("no-smooth");
      if (raf) window.cancelAnimationFrame(raf);

      var passo = function (ts) {
        if (t0 === null) t0 = ts;
        var p = clamp((ts - t0) / DURACAO, 0, 1);
        var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        window.scrollTo(0, inicio + dist * e);
        if (p < 1) {
          raf = window.requestAnimationFrame(passo);
        } else {
          raf = null;
          document.documentElement.classList.remove("no-smooth");
          destravaNoSilencio();
        }
      };
      raf = window.requestAnimationFrame(passo);
    };

    var tenta = function (dir, e) {
      // com o pedido ou o menu abertos, a rolagem não é nossa
      if (document.body.classList.contains("is-locked")) return;
      if (!noComando()) return;
      if (travado) { e.preventDefault(); destravaNoSilencio(); return; }
      var destino = proximoAlvo(dir);
      if (destino === null) return;   // acabaram os lanches: deixa sair daqui
      e.preventDefault();
      salta(destino);
    };

    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey) return;                       // ctrl+roda é zoom
      if (Math.abs(e.deltaY) < 2) return;          // rolagem lateral
      tenta(e.deltaY > 0 ? 1 : -1, e);
    }, { passive: false });

    var TECLAS = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 };
    window.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var alvo = e.target;
      if (alvo && (alvo.closest("input, textarea, select") || alvo.isContentEditable)) return;
      var dir = TECLAS[e.key];
      if (e.key === " " || e.key === "Spacebar") dir = e.shiftKey ? -1 : 1;
      if (!dir) return;
      tenta(dir, e);
    });
  })();

  /* ── 12. Parallax ─────────────────────────────────────────────────────── */
  (function parallax() {
    var els = $$("[data-parallax]");
    if (!els.length || reduced) return;
    onScroll(function () {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;
        var center = r.top + r.height / 2 - vh / 2;
        el.style.transform = "translate3d(0," + (-center * speed).toFixed(2) + "px,0)";
      });
    });
  })();

  /* ── 13. Processo: tira horizontal travada ────────────────────────────── */
  (function processScroll() {
    var sec = $("#processo"), track = $("#processTrack"), bar = $("#processBar");
    if (!sec || !track) return;
    if (reduced) { sec.style.height = "auto"; return; }

    // Quanto de rolagem vertical custa a tira inteira. Em 1:1 quatro painéis
    // de tela cheia exigiriam quase cinco telas de scroll; em 0.6 a tira anda
    // um pouco mais rápido do que o dedo, sem ficar brusca.
    var RITMO = 0.6;

    var distance = 0;
    var quadros = $$(".frame", track);
    var enquadrado = -1;   // índice do painel que está no lugar agora

    // avisa o CSS que a tira está no ar: só a partir daqui o texto dos painéis
    // fora de quadro pode sumir
    sec.classList.add("tira-ativa");

    var measure = function () {
      // mede pelo último painel em vez de scrollWidth: alguns navegadores
      // ignoram o padding-right do container ao calcular scrollWidth.
      var last = track.lastElementChild;
      var padRight = parseFloat(window.getComputedStyle(track).paddingRight) || 0;
      var contentRight = last ? last.offsetLeft + last.offsetWidth + padRight : 0;
      distance = Math.max(0, contentRight - window.innerWidth);
      // a seção fica alta o bastante para "segurar" a tira
      sec.style.height = (window.innerHeight + distance * RITMO) + "px";
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    // as medidas mudam quando as fontes entram
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    onScroll(function () {
      var r = sec.getBoundingClientRect();
      var total = sec.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      var p = clamp(-r.top / total, 0, 1);
      track.style.transform = "translate3d(" + (-p * distance).toFixed(2) + "px,0,0)";
      if (bar) bar.style.width = (p * 100).toFixed(1) + "%";

      // nada a fazer se a seção nem está na tela
      if (r.bottom < 0 || r.top > window.innerHeight) return;

      // Qual painel está enquadrado agora, por conta e não por medição: o
      // deslocamento da tira já diz tudo, e assim não há leitura de layout no
      // meio do quadro. Só trocamos classe quando o painel de fato muda —
      // escrever estilo em todo quadro dentro da tira invalidaria a camada
      // inteira, que é justamente o que fazia a passagem engasgar.
      var largura = track.firstElementChild ? track.firstElementChild.offsetWidth : 1;
      var atual = clamp(Math.round((p * distance) / largura), 0, quadros.length - 1);
      if (atual !== enquadrado) {
        enquadrado = atual;
        quadros.forEach(function (q, i) { q.classList.toggle("is-on", i === atual); });
      }
    });
  })();

  /* ── 14. Vídeos de fundo ──────────────────────────────────────────────── */
  (function backgroundVideo() {
    // toca o vídeo só quando a seção está visível (economiza bateria)
    $$("video").forEach(function (v) {
      if (!v.querySelector("source")) return;   // ainda sem arquivo: fica no poster
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            var play = v.play();
            if (play && play.catch) play.catch(function () { /* autoplay bloqueado */ });
          } else if (!v.paused) {
            v.pause();
          }
        });
      }, { threshold: 0.1 });
      io.observe(v);
    });

    // Enquanto não existir assets/video/hero.mp4, o <canvas> abaixo faz as
    // vezes do vídeo: brasa em movimento, bem escura, pouco custo de CPU.
    var video = $("#heroVideo"), canvas = $("#heroCanvas");
    if (!canvas) return;

    var missing = true;
    if (video) {
      // sem nenhum <source> ativo não há o que carregar: já entrega o canvas
      if (!video.querySelector("source")) {
        video.classList.add("is-missing");
      } else {
        video.addEventListener("error", function () { video.classList.add("is-missing"); }, true);
        video.addEventListener("loadeddata", function () {
          missing = false;
          video.classList.remove("is-missing");
          stop();
        });
        window.setTimeout(function () {
          if (video.readyState < 2) video.classList.add("is-missing");
        }, 2500);
      }
    }

    var ctx = canvas.getContext("2d");
    // As brasas se mexem devagar; desenhar a 30fps em vez de 60 é
    // imperceptível e devolve metade do custo do hero para o scroll.
    var INTERVALO = 33;
    var W = 240, H = 135, raf = null, t = 0, visible = true, ultimoDesenho = 0;
    canvas.width = W; canvas.height = H;

    var blobs = [];
    for (var i = 0; i < 9; i++) {
      blobs.push({
        x: Math.random(), y: Math.random(),
        r: 0.18 + Math.random() * 0.35,
        sx: (Math.random() - 0.5) * 0.00035,
        sy: -0.00012 - Math.random() * 0.0003,
        h: 8 + Math.random() * 28,
        ph: Math.random() * Math.PI * 2
      });
    }

    var draw = function (ts) {
      if (visible && missing) raf = window.requestAnimationFrame(draw);
      ts = ts || 0;
      if (ts && ts - ultimoDesenho < INTERVALO) return;
      ultimoDesenho = ts;
      t += 1;
      ctx.fillStyle = "#0b0a09";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      blobs.forEach(function (b) {
        b.x += b.sx; b.y += b.sy;
        if (b.y < -0.4) { b.y = 1.4; b.x = Math.random(); }
        if (b.x < -0.4) b.x = 1.4;
        if (b.x > 1.4) b.x = -0.4;

        var flick = 0.55 + Math.sin(t * 0.02 + b.ph) * 0.25;
        var cx = b.x * W, cy = b.y * H, r = b.r * W;
        var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, "hsla(" + b.h + ",92%,55%," + (0.34 * flick).toFixed(3) + ")");
        g.addColorStop(0.55, "hsla(" + (b.h - 6) + ",88%,44%," + (0.12 * flick).toFixed(3) + ")");
        g.addColorStop(1, "hsla(20,80%,30%,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalCompositeOperation = "source-over";
    };

    var stop = function () { if (raf) { window.cancelAnimationFrame(raf); raf = null; } };
    var start = function () { if (!raf && visible && missing && !reduced) draw(); };

    if (reduced) { draw(); }  // um quadro estático já basta
    else {
      var io = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0.01 });
      io.observe(canvas);
      start();
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });
  })();

  /* ── 15. Carrinho e pedido pelo WhatsApp ──────────────────────────────── */
  /* Sem servidor: o pedido vira uma mensagem de texto e o wa.me abre o
     WhatsApp já com ela escrita. O preço de cada item é lido do próprio
     cardápio na tela — assim não existe uma segunda lista de preços para
     desencontrar da primeira. */
  (function carrinho() {
    var fab = $("#cartFab"), gaveta = $("#cart"), lista = $("#cartLista");
    var form = $("#cartForm");
    if (!fab || !gaveta || !lista || !form) return;

    var CHAVE = "mana:pedido";
    var TELEFONE = document.body.getAttribute("data-whatsapp") || "";
    var PLACEHOLDER = "5500000000000";

    var moeda = function (centavos) {
      try {
        return (centavos / 100).toLocaleString("pt-BR",
          { style: "currency", currency: "BRL" });
      } catch (e) {
        return "R$ " + (centavos / 100).toFixed(2).replace(".", ",");
      }
    };

    var emCentavos = function (texto) {
      var n = String(texto).replace(/[^\d,]/g, "").replace(",", ".");
      return Math.round(parseFloat(n) * 100) || 0;
    };

    var apelido = function (nome) {
      return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    };

    // ── catálogo, montado a partir do que está escrito na página ─────────
    var catalogo = {};
    $$("[data-produto]").forEach(function (el) {
      var titulo = $("h3", el), rotulo = $("span", el);
      var nome, extra;
      if (titulo) {
        nome = titulo.textContent.trim();
      } else {
        extra = $("i", rotulo) ? $("i", rotulo).textContent.trim() : "";
        nome = rotulo.textContent.replace(extra, "").trim();
        if (extra) nome += " (" + extra + ")";
      }
      var etiqueta = $(".panel__price, .price, b", el);
      if (!nome || !etiqueta) return;

      var id = apelido(nome);
      catalogo[id] = { nome: nome, preco: emCentavos(etiqueta.textContent) };

      var botao = $("[data-add]", el);
      if (!botao) return;
      botao.setAttribute("aria-label", "Adicionar " + nome + " ao pedido");
      var rotuloOriginal = botao.textContent;
      botao.addEventListener("click", function () {
        soma(id, 1);
        botao.classList.add("is-feito");
        if (rotuloOriginal.length > 2) botao.textContent = "Adicionado";
        window.setTimeout(function () {
          botao.classList.remove("is-feito");
          botao.textContent = rotuloOriginal;
        }, 1200);
      });
    });

    // ── estado ───────────────────────────────────────────────────────────
    var pedido = {};
    try {
      var salvo = JSON.parse(window.localStorage.getItem(CHAVE) || "{}");
      Object.keys(salvo).forEach(function (id) {
        // um item que saiu do cardápio não pode voltar pelo armazenamento
        if (catalogo[id] && salvo[id] > 0) pedido[id] = Math.min(salvo[id], 99);
      });
    } catch (e) { /* modo privado, cota cheia: segue sem histórico */ }

    var guarda = function () {
      try { window.localStorage.setItem(CHAVE, JSON.stringify(pedido)); }
      catch (e) { /* idem */ }
    };

    var itens = function () {
      return Object.keys(pedido).map(function (id) {
        return { id: id, qtd: pedido[id], nome: catalogo[id].nome,
                 preco: catalogo[id].preco };
      });
    };
    var total = function () {
      return itens().reduce(function (a, i) { return a + i.preco * i.qtd; }, 0);
    };
    var quantos = function () {
      return itens().reduce(function (a, i) { return a + i.qtd; }, 0);
    };

    var soma = function (id, delta) {
      if (!catalogo[id]) return;
      pedido[id] = Math.max(0, Math.min(99, (pedido[id] || 0) + delta));
      if (!pedido[id]) delete pedido[id];
      guarda();
      desenha();
      if (delta > 0 && !aberto) {
        fab.classList.add("is-pulsando");
        window.setTimeout(function () { fab.classList.remove("is-pulsando"); }, 500);
      }
    };

    // ── desenho ──────────────────────────────────────────────────────────
    var vazio = $("#cartVazio"), esvaziar = $("#cartEsvaziar");
    var desenha = function () {
      var linhas = itens(), n = quantos();

      $("#cartCount").textContent = n;
      fab.hidden = n === 0;
      fab.setAttribute("aria-label", n === 1 ? "Meu pedido, 1 item"
                                             : "Meu pedido, " + n + " itens");
      vazio.hidden = n > 0;
      esvaziar.hidden = n === 0;
      form.hidden = n === 0;
      $("#cartTotal").textContent = moeda(total());

      lista.textContent = "";
      linhas.forEach(function (i) {
        var li = document.createElement("li");

        var nome = document.createElement("span");
        nome.className = "cart__nome";
        nome.textContent = i.nome;

        var unit = document.createElement("span");
        unit.className = "cart__unit";
        unit.textContent = i.qtd + " × " + moeda(i.preco) + " = " + moeda(i.preco * i.qtd);

        var ctrl = document.createElement("div");
        ctrl.className = "cart__qtd";
        var passo = function (rotulo, delta, descricao) {
          var b = document.createElement("button");
          b.type = "button";
          b.textContent = rotulo;
          b.setAttribute("aria-label", descricao + " " + i.nome);
          b.addEventListener("click", function () { soma(i.id, delta); });
          return b;
        };
        var qtd = document.createElement("b");
        qtd.textContent = i.qtd;
        ctrl.appendChild(passo("\u2212", -1, "Tirar um"));
        ctrl.appendChild(qtd);
        ctrl.appendChild(passo("+", 1, "Somar um"));

        li.appendChild(nome);
        li.appendChild(unit);
        li.appendChild(ctrl);
        lista.appendChild(li);
      });
    };

    esvaziar.addEventListener("click", function () {
      pedido = {}; guarda(); desenha();
    });

    // ── abre e fecha ─────────────────────────────────────────────────────
    var aberto = false, focoAnterior = null;
    var abre = function (estado) {
      aberto = estado;
      fab.setAttribute("aria-expanded", String(estado));
      document.body.classList.toggle("is-locked", estado);
      if (estado) {
        focoAnterior = document.activeElement;
        gaveta.hidden = false;
        window.requestAnimationFrame(function () {
          gaveta.classList.add("is-open");
          $(".cart__x", gaveta).focus();
        });
      } else {
        gaveta.classList.remove("is-open");
        window.setTimeout(function () { if (!aberto) gaveta.hidden = true; }, 500);
        if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
      }
    };

    fab.addEventListener("click", function () { abre(true); });
    $$("[data-cart-fechar]").forEach(function (b) {
      b.addEventListener("click", function () { abre(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (!aberto) return;
      if (e.key === "Escape") { abre(false); return; }
      if (e.key !== "Tab") return;
      // prende o Tab dentro da gaveta enquanto ela está aberta
      var focaveis = $$("button, input, select, textarea, a[href]", gaveta)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!focaveis.length) return;
      var primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault(); ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault(); primeiro.focus();
      }
    });
    // outras partes da página consultam isto antes de mexer na rolagem
    window.__pedidoAberto = function () { return aberto; };

    // ── campos que dependem de outros ────────────────────────────────────
    var campoEndereco = $("#campoEndereco"), campoTroco = $("#campoTroco");
    var pagamento = $("#cliPagamento");
    var atualizaCampos = function () {
      var entrega = $("input[name=entrega]:checked", form).value !== "Retirada no balcão";
      campoEndereco.hidden = !entrega;
      campoTroco.hidden = pagamento.value !== "Dinheiro";
    };
    $$("input[name=entrega]", form).forEach(function (r) {
      r.addEventListener("change", atualizaCampos);
    });
    pagamento.addEventListener("change", atualizaCampos);
    atualizaCampos();

    // ── a mensagem ───────────────────────────────────────────────────────
    var montaMensagem = function (dados) {
      var l = ["*Pedido — Hamburgueria Maná*", ""];
      itens().forEach(function (i) {
        l.push(i.qtd + "x " + i.nome + " — " + moeda(i.preco * i.qtd));
      });
      l.push("", "*Total: " + moeda(total()) + "*", "");
      l.push("*Nome:* " + dados.nome);
      l.push("*Retirada/entrega:* " + dados.entrega);
      if (dados.endereco) l.push("*Endereço:* " + dados.endereco);
      l.push("*Pagamento:* " + dados.pagamento);
      if (dados.troco) l.push("*Troco para:* " + dados.troco);
      if (dados.obs) l.push("*Observações:* " + dados.obs);
      return l.join("\n");
    };

    var erro = $("#cartErro");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      erro.textContent = "";

      if (!quantos()) { erro.textContent = "Escolha pelo menos um item."; return; }

      var dados = {
        nome: $("#cliNome").value.trim(),
        entrega: $("input[name=entrega]:checked", form).value,
        endereco: campoEndereco.hidden ? "" : $("#cliEndereco").value.trim(),
        pagamento: pagamento.value,
        troco: campoTroco.hidden ? "" : $("#cliTroco").value.trim(),
        obs: $("#cliObs").value.trim()
      };

      if (!dados.nome) {
        erro.textContent = "Falta o seu nome.";
        $("#cliNome").focus(); return;
      }
      if (!campoEndereco.hidden && !dados.endereco) {
        erro.textContent = "Falta o endereço da entrega.";
        $("#cliEndereco").focus(); return;
      }
      if (!TELEFONE || TELEFONE === PLACEHOLDER) {
        erro.textContent = "O número de WhatsApp ainda não foi configurado neste site.";
        return;
      }

      // wa.me carrega o texto na própria URL; um pedido do cardápio inteiro dá
      // cerca de 1,5 mil caracteres, bem dentro do que os navegadores aceitam
      var url = "https://wa.me/" + TELEFONE + "?text=" +
                encodeURIComponent(montaMensagem(dados));
      var janela = window.open(url, "_blank", "noopener");
      if (!janela) window.location.href = url;   // bloqueador de pop-up
    });

    desenha();
  })();

  /* ── 16. Formulário e miudezas ────────────────────────────────────────── */
  (function form() {
    var f = $("#orderForm"), msg = $("#orderMsg");
    if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("#email", f);
      // TODO: trocar por um POST para o serviço de newsletter de verdade
      if (!input.value || !input.checkValidity()) {
        msg.textContent = "Confere o e-mail aí — parece que faltou alguma coisa.";
        input.focus();
        return;
      }
      msg.textContent = "Pronto. A gente avisa quando sair edição nova.";
      f.reset();
    });
  })();

  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ── 17. Loop de scroll ───────────────────────────────────────────────── */
  (function loop() {
    var pending = false;
    var run = function () {
      var y = window.scrollY;
      scrollTasks.forEach(function (fn) { fn(y); });
      pending = false;
    };
    var request = function () {
      if (!pending) { pending = true; window.requestAnimationFrame(run); }
    };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    run();
  })();
})();
