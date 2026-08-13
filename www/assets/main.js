/* Manava — interactie en animatie. Geen dependencies. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- navigatie ---------- */
  var nav = document.querySelector(".site-nav");
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle("scrolled", y > 40);
    // verberg bij naar beneden scrollen, toon bij omhoog
    if (y > 320 && y > lastY + 6) nav.classList.add("hidden");
    else if (y < lastY - 6 || y < 320) nav.classList.remove("hidden");
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- reveal bij scrollen ---------- */
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.05, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { observer.observe(el); });

  /* ---------- 3D-tilt op kaarten ---------- */
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      var raf = null;
      card.addEventListener("mousemove", function (ev) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var r = card.getBoundingClientRect();
          var px = (ev.clientX - r.left) / r.width - 0.5;
          var py = (ev.clientY - r.top) / r.height - 0.5;
          card.style.transform =
            "perspective(900px) rotateY(" + (px * 7).toFixed(2) + "deg)" +
            " rotateX(" + (-py * 7).toFixed(2) + "deg) translateY(-4px)";
          raf = null;
        });
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---------- hero: 3D-partikelveld ----------
     Een bol van punten ("mens") die overvloeit in een datagolf
     ("technologie"), geprojecteerd met perspectief en verbonden
     met dunne lijnen. Reageert subtiel op de muis.            */
  var canvas = document.getElementById("hero-canvas");
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var W, H, DPR, points = [], t = 0;
    var mouseX = 0, mouseY = 0, targetMX = 0, targetMY = 0;
    var N = 340;               // aantal punten
    var FOV = 640;             // perspectief
    var running = true;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    window.addEventListener("resize", resize);
    resize();

    // punten: helft op een bol, helft in een vlakke golf eronder/erachter
    for (var i = 0; i < N; i++) {
      if (i < N * 0.55) {
        // fibonacci-bol
        var k = i + 0.5;
        var phi = Math.acos(1 - 2 * k / (N * 0.55));
        var theta = Math.PI * (1 + Math.sqrt(5)) * k;
        points.push({
          kind: "sphere",
          r: 190,
          phi: phi, theta: theta,
          jitter: Math.random() * 2 * Math.PI
        });
      } else {
        points.push({
          kind: "wave",
          x: (Math.random() - 0.5) * 900,
          z: Math.random() * 700 - 100,
          jitter: Math.random() * 2 * Math.PI
        });
      }
    }

    window.addEventListener("mousemove", function (e) {
      targetMX = (e.clientX / window.innerWidth - 0.5);
      targetMY = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });

    // pauzeer als de hero uit beeld is
    new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
      if (running) requestAnimationFrame(frame);
    }, { threshold: 0 }).observe(canvas);

    function project(x, y, z) {
      var s = FOV / (FOV + z);
      return { x: W * 0.68 + x * s, y: H * 0.5 + y * s, s: s };
    }

    function frame() {
      if (!running) return;
      t += 0.004;
      mouseX += (targetMX - mouseX) * 0.04;
      mouseY += (targetMY - mouseY) * 0.04;

      ctx.clearRect(0, 0, W, H);
      var rotY = t * 0.9 + mouseX * 0.9;
      var rotX = 0.32 + mouseY * 0.5;
      var cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      var cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      var projected = [];

      for (var i = 0; i < points.length; i++) {
        var p = points[i], x, y, z;
        if (p.kind === "sphere") {
          var r = p.r + Math.sin(t * 3 + p.jitter) * 7; // ademend
          x = r * Math.sin(p.phi) * Math.cos(p.theta);
          y = r * Math.cos(p.phi);
          z = r * Math.sin(p.phi) * Math.sin(p.theta);
        } else {
          x = p.x;
          z = p.z;
          y = 240 + Math.sin(x * 0.012 + t * 2.4 + p.jitter) * 26
                  + Math.cos(z * 0.014 + t * 1.7) * 22;
        }
        // rotatie om Y en X
        var x1 = x * cosY - z * sinY;
        var z1 = x * sinY + z * cosY;
        var y1 = y * cosX - z1 * sinX;
        var z2 = y * sinX + z1 * cosX;
        var pr = project(x1, y1, z2);
        if (pr.s > 0.2) projected.push({ x: pr.x, y: pr.y, s: pr.s, kind: p.kind });
      }

      // verbindingslijnen (alleen dichtbij elkaar; goedkoop via grid zou kunnen,
      // maar met deze aantallen is brute force op elke 3e punt voldoende)
      ctx.lineWidth = 1;
      for (var a = 0; a < projected.length; a += 2) {
        for (var b = a + 2; b < Math.min(a + 26, projected.length); b += 2) {
          var dx = projected[a].x - projected[b].x;
          var dy = projected[a].y - projected[b].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 3600) {
            var alpha = (1 - d2 / 3600) * 0.22 * Math.min(projected[a].s, 1);
            ctx.strokeStyle = "rgba(201,168,106," + alpha.toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(projected[a].x, projected[a].y);
            ctx.lineTo(projected[b].x, projected[b].y);
            ctx.stroke();
          }
        }
      }

      // punten
      for (var j = 0; j < projected.length; j++) {
        var q = projected[j];
        var size = (q.kind === "sphere" ? 2.1 : 1.6) * q.s;
        var al = Math.min(0.85, 0.25 + q.s * 0.5);
        ctx.fillStyle = q.kind === "sphere"
          ? "rgba(244,239,227," + al.toFixed(3) + ")"
          : "rgba(184,131,74,"  + (al * 0.9).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(q.x, q.y, size, 0, 6.2832);
        ctx.fill();
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- huidig jaar in de footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
