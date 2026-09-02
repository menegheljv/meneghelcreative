// Meneghel Creative — script mínimo, sem animações complexas

document.addEventListener("DOMContentLoaded", () => {
  // Ano dinâmico no rodapé
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Animação de entrada da logo: onda sonora → onda de luz → calçadão de
  // Copacabana → símbolo da marca. Roda uma vez só e entrega a imagem real
  // no final (troca por crossfade, pra garantir fidelidade ao arquivo oficial).
  initHeroWaveAnim();

  // Menu mobile
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Fecha o menu ao clicar em um link
    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Caixas (cards, blocos de texto) surgem conforme entram na tela
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // Sombra branca que acompanha o cursor pelo site inteiro
  if (window.matchMedia("(pointer: fine)").matches) {
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    document.body.appendChild(glow);

    document.addEventListener("mousemove", (e) => {
      glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      glow.classList.add("is-active");
    });
    document.addEventListener("mouseleave", () => glow.classList.remove("is-active"));
  }
});

// ---------- Animação da logo: som → luz → calçadão → símbolo ----------
function initHeroWaveAnim() {
  const canvas = document.getElementById("heroWaveCanvas");
  const finalImg = document.querySelector(".hero-wave-svg");
  if (!canvas || !finalImg) return;

  const showFinal = () => {
    canvas.classList.add("is-done");
    finalImg.classList.add("is-in-view");
  };

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !canvas.getContext) {
    showFinal();
    return;
  }

  const ctx = canvas.getContext("2d");
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * DPR;
    canvas.height = rect.height * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  // cada estado é uma função que devolve a altura da onda (-1..1) num ponto u (0..1)
  const waveforms = {
    som: (u, t) => {
      const f1 = Math.sin(u * Math.PI * 10 + t * 3);
      const f2 = Math.sin(u * Math.PI * 23 + t * 5) * 0.4;
      const f3 = Math.sin(u * Math.PI * 4.5 - t * 2) * 0.6;
      const env = Math.sin(u * Math.PI);
      return (f1 + f2 + f3) * 0.4 * env;
    },
    luz: (u, t) => Math.sin(u * Math.PI * 3 + t * 1.4) * 0.85,
    calcadao: (u) => Math.sin(u * Math.PI * 2) * 0.72,
    simbolo: (u) => {
      const x = u * 4;
      const seg = Math.max(0, Math.min(3, Math.floor(x)));
      const hx = x % 2;
      const val = -(hx * hx) + 2 * hx;
      return (val * 2 - 1) * 0.92;
    },
  };

  const pink = [255, 103, 138];
  const white = [245, 245, 245];
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpColor = (c1, c2, t) =>
    "rgb(" +
    Math.round(lerp(c1[0], c2[0], t)) +
    "," +
    Math.round(lerp(c1[1], c2[1], t)) +
    "," +
    Math.round(lerp(c1[2], c2[2], t)) +
    ")";

  // sequência: [nome, cor, duração de permanência em ms]
  const sequence = [
    { name: "som", color: pink, hold: 550 },
    { name: "luz", color: white, hold: 550 },
    { name: "calcadao", color: white, hold: 600, striped: true },
    { name: "simbolo", color: white, hold: 450 },
  ];
  const transDur = 620;

  // monta os checkpoints de tempo (hold, trans, hold, trans...)
  const checkpoints = [];
  let acc = 0;
  sequence.forEach((s, i) => {
    checkpoints.push({ type: "hold", idx: i, start: acc, end: acc + s.hold });
    acc += s.hold;
    if (i < sequence.length - 1) {
      checkpoints.push({ type: "trans", from: i, to: i + 1, start: acc, end: acc + transDur });
      acc += transDur;
    }
  });
  const totalDur = acc;

  let start = null;

  function draw(idx, nextIdx, mixT, elapsedSec) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    const midY = h / 2;
    const amp = h * 0.34;
    const N = 140;
    const st = mixT * mixT * (3 - 2 * mixT);

    const stateA = sequence[idx];
    const stateB = sequence[nextIdx];
    const fnA = waveforms[stateA.name];
    const fnB = waveforms[stateB.name];
    const isStriped = st < 0.5 ? stateA.striped : stateB.striped;
    const col = lerpColor(stateA.color, stateB.color, st);

    const pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const vA = fnA(u, elapsedSec);
      const vB = fnB(u, elapsedSec);
      const v = lerp(vA, vB, st);
      pts.push({ x: u * w, y: midY - v * amp });
    }

    if (isStriped) {
      // calçadão: faixa grossa com trechos alternando branco e preto
      const stepPx = Math.max(8, w * 0.028);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = h * 0.16;
      for (let i = 0; i < pts.length - 1; i++) {
        const bucket = Math.floor(pts[i].x / stepPx);
        ctx.strokeStyle = bucket % 2 === 0 ? "#f5f5f5" : "#0a0a0a";
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.strokeStyle = col;
      ctx.lineWidth = 5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = col;
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  function frame(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;

    if (elapsed >= totalDur) {
      draw(sequence.length - 1, sequence.length - 1, 0, elapsed / 1000);
      setTimeout(showFinal, 200);
      return;
    }

    const cp = checkpoints.find((c) => elapsed >= c.start && elapsed < c.end) || checkpoints[checkpoints.length - 1];
    const elapsedSec = elapsed / 1000;
    if (cp.type === "hold") {
      draw(cp.idx, cp.idx, 0, elapsedSec);
    } else {
      const mixT = (elapsed - cp.start) / (cp.end - cp.start);
      draw(cp.from, cp.to, mixT, elapsedSec);
    }
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
