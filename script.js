(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Starfield that reacts to the mouse ---------- */
  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d");
  let w, h, dpr, stars = [];
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    const count = Math.min(160, Math.floor((innerWidth * innerHeight) / 9000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25 * dpr, vy: (Math.random() - 0.5) * 0.25 * dpr,
      r: (Math.random() * 1.4 + 0.4) * dpr,
      t: Math.random() * Math.PI * 2,
    }));
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    const link = 120 * dpr;
    for (const s of stars) {
      s.x += s.vx; s.y += s.vy; s.t += 0.03;
      if (s.x < 0) s.x = w; if (s.x > w) s.x = 0;
      if (s.y < 0) s.y = h; if (s.y > h) s.y = 0;
      const dx = s.x - mouse.x * dpr, dy = s.y - mouse.y * dpr;
      const d = Math.hypot(dx, dy);
      if (d < 140 * dpr) { s.x += (dx / d) * 1.2; s.y += (dy / d) * 1.2; }
      ctx.globalAlpha = 0.5 + Math.sin(s.t) * 0.4;
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      if (d < link * 1.6) {
        ctx.globalAlpha = (1 - d / (link * 1.6)) * 0.5;
        ctx.strokeStyle = "#ff7ac6";
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(mouse.x * dpr, mouse.y * dpr); ctx.stroke();
      }
    }
    if (!reduce) requestAnimationFrame(frame);
  }
  addEventListener("resize", resize);
  resize(); frame();

  /* ---------- Custom cursor ---------- */
  const cursor = document.querySelector(".cursor");
  let cx = 0, cy = 0, tx = 0, ty = 0;
  addEventListener("pointermove", (e) => { mouse.x = tx = e.clientX; mouse.y = ty = e.clientY; });
  (function follow() {
    cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
    cursor.style.transform = `translate(${cx - cursor.offsetWidth / 2}px, ${cy - cursor.offsetHeight / 2}px)`;
    requestAnimationFrame(follow);
  })();
  document.querySelectorAll("a, button, input").forEach((el) => {
    el.addEventListener("pointerenter", () => cursor.classList.add("big"));
    el.addEventListener("pointerleave", () => cursor.classList.remove("big"));
  });

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.setProperty("--d", `${(i % 5) * 0.08}s`);
    io.observe(el);
  });

  /* ---------- Lab controls ---------- */
  const blob = document.getElementById("blob");
  const morph = document.getElementById("morph");
  const speed = document.getElementById("speed");
  const hue = document.getElementById("hue");

  function apply() {
    blob.style.setProperty("--m", morph.value);
    blob.style.setProperty("--s", (speed.value / 100) * 9 + 0.5); // 0.5..9.5 -> shorter duration = faster
    root.style.setProperty("--hue", hue.value);
  }
  [morph, speed, hue].forEach((i) => i.addEventListener("input", apply));
  document.getElementById("shuffle").addEventListener("click", () => {
    morph.value = Math.random() * 100;
    speed.value = 10 + Math.random() * 80;
    hue.value = Math.random() * 360;
    apply();
  });
  apply();

  // The blob follows the pointer slightly inside the stage
  const stage = document.getElementById("stage");
  stage.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    blob.parentElement.style.perspective = "800px";
    blob.style.translate = `${x * 60}px ${y * 60}px`;
  });
  stage.addEventListener("pointerleave", () => { blob.style.translate = "0 0"; });

  /* ---------- Copy colors ---------- */
  const toast = document.getElementById("toast");
  let timer;
  document.querySelectorAll(".sw").forEach((b) => b.addEventListener("click", async () => {
    const c = b.dataset.c;
    try { await navigator.clipboard.writeText(c); } catch (_) { /* clipboard may be blocked */ }
    toast.textContent = `${c} copiado`;
    toast.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove("show"), 1800);
  }));

  document.getElementById("year").textContent = new Date().getFullYear();
})();
