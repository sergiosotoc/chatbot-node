/* public/theme.js */
(function () {
  function forceHttpOnLocalhost() {
    const isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
    if (isLocalhost && location.protocol === "https:") {
      const target = "http://" + location.host + location.pathname + location.search + location.hash;
      window.location.replace(target);
      return true;
    }
    return false;
  }

  function initTheme() {
    if (forceHttpOnLocalhost()) return;

    const body = document.body;
    if (!body) return;

    body.classList.add("neo-theme");

    if (!document.querySelector(".neo-floating-elements")) {
      const fx = document.createElement("div");
      fx.className = "neo-floating-elements";
      fx.innerHTML = [
        '<div class="neo-floating-circle c1"></div>',
        '<div class="neo-floating-circle c2"></div>',
        '<div class="neo-floating-circle c3"></div>'
      ].join("");
      body.prepend(fx);
    }

    const circles = Array.from(document.querySelectorAll(".neo-floating-circle"));
    if (!circles.length) return;

    let rafId = null;
    window.addEventListener("mousemove", (event) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const dx = (event.clientX / window.innerWidth - 0.5) * 8;
        const dy = (event.clientY / window.innerHeight - 0.5) * 8;
        circles.forEach((circle, idx) => {
          const factor = (idx + 1) * 0.35;
          circle.style.transform = "translate(" + (dx * factor) + "px," + (dy * factor) + "px)";
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTheme);
  } else {
    initTheme();
  }
})();
