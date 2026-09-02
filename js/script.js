// Meneghel Creative — script mínimo, sem animações complexas

document.addEventListener("DOMContentLoaded", () => {
  // Ano dinâmico no rodapé
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Animação de entrada da onda (surge da esquerda, mantém sempre a forma da onda)
  // Só dispara depois que a imagem realmente carregou, senão a transição
  // roda "no vazio" enquanto a imagem baixa e o efeito parece cortado.
  const waveSvg = document.querySelector(".hero-wave-svg");
  if (waveSvg) {
    const revealWave = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          waveSvg.classList.add("is-in-view");
        });
      });
    };
    if (waveSvg.complete && waveSvg.naturalWidth > 0) {
      revealWave();
    } else {
      waveSvg.addEventListener("load", revealWave, { once: true });
    }
  }

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

  // Cursor customizado: ponto branco no centro, halo rosa ao redor
  if (window.matchMedia("(pointer: fine)").matches) {
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    document.body.appendChild(glow);

    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    document.body.appendChild(dot);

    document.addEventListener("mousemove", (e) => {
      const pos = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      glow.style.transform = pos;
      dot.style.transform = pos;
      glow.classList.add("is-active");
      dot.classList.add("is-active");
    });
    document.addEventListener("mouseleave", () => {
      glow.classList.remove("is-active");
      dot.classList.remove("is-active");
    });
  }
});
