/* DetailFlow v1 — auto detailing theme
   Steel/teal glow + headlight streaks (always on, unless disabled)
*/
(() => {
  try {
    // Allow either flag to disable (keeps compatibility with your nails/hair sites)
    if (window.SITE_DISABLE_BG || window.HD_DISABLE_BG) return;

    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    // Tunables for the "detailing" vibe
    const CONFIG = {
      intensity: 1.35,          // overall energy
      blobCount: 5,             // glowing “steel/teal” pools
      blobAlpha: 0.52,          // transparency for glow
      coolBias: 0.7,            // more steel/teal than grey
      streaks: true,            // headlight streaks
      respectReduceMotion: false
    };

    const prefersReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let running = CONFIG.respectReduceMotion ? !prefersReduce : true;

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = innerWidth, h = innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    addEventListener('resize', resize);

    // Color palette (steel/cyan + asphalt + warm amber for “headlights”)
    const HUE_STEEL = 210; // steel blue
    const HUE_CYAN  = 195; // cool cyan
    const HUE_AMBER = 40;  // headlight amber

    // Create glow blobs
    const blobs = Array.from({ length: CONFIG.blobCount }, () => {
      const biasPick = Math.random() < CONFIG.coolBias;
      const hue = biasPick
        ? HUE_CYAN + Math.random() * (HUE_STEEL - HUE_CYAN)   // cool band
        : HUE_STEEL - 10 + Math.random() * 12;               // steel-ish
      return {
        r: Math.min(innerWidth, innerHeight) * (0.30 + Math.random() * 0.20),
        hue,
        speedX: (0.10 + Math.random() * 0.16) * CONFIG.intensity,
        speedY: (0.08 + Math.random() * 0.14) * CONFIG.intensity,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2
      };
    });

    // Headlight-like streak particles
    const streaks = (() => {
      if (!CONFIG.streaks) return [];
      const N = Math.round(120 * CONFIG.intensity);
      return Array.from({ length: N }, () => ({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        v: (0.9 + Math.random() * 1.4) * CONFIG.intensity,
        w: 0.8 + Math.random() * 2.0,
        life: 80 + Math.random() * 120,
        warm: Math.random() < 0.22, // some warm ambers mixed in
        hue: Math.random() < 0.22 ? HUE_AMBER : (HUE_CYAN + Math.random() * (HUE_STEEL - HUE_CYAN))
      }));
    })();

    // Vector field for motion
    let t = 0, last = performance.now();
    function field(x, y) {
      const s = 0.00125; // smoother, sleeker
      return Math.sin((x + y) * s + t * 0.7) + Math.cos((x - y) * s * 1.1 - t * 0.35);
    }

    function draw(now) {
      if (!running) return;
      const dt = Math.min(50, now - last); last = now; t += dt / (6500 / CONFIG.intensity);

      // Gentle fade to simulate a polished surface
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(0, 0, innerWidth, innerHeight);

      // Glow pools (steel/cyan)
      ctx.globalCompositeOperation = 'screen';
      for (const b of blobs) {
        const time = t * 7.5;
        const cx = innerWidth * 0.5 + Math.cos(time * b.speedX + b.phaseX) * (innerWidth * 0.27);
        const cy = innerHeight * 0.5 + Math.sin(time * b.speedY + b.phaseY) * (innerHeight * 0.27);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r);
        g.addColorStop(0, `hsla(${b.hue}, 85%, 60%, ${CONFIG.blobAlpha})`);
        g.addColorStop(1, `hsla(${b.hue}, 85%, 60%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, b.r, 0, Math.PI * 2); ctx.fill();
      }

      // Headlight streaks
      if (streaks.length) {
        ctx.globalCompositeOperation = 'lighter';
        for (const s of streaks) {
          const a = field(s.x, s.y), vx = Math.cos(a) * s.v, vy = Math.sin(a) * s.v;
          const alpha = s.warm ? 0.22 : 0.18;
          ctx.strokeStyle = `hsla(${s.hue}, ${s.warm ? 95 : 85}%, ${s.warm ? 58 : 62}%, ${alpha})`;
          ctx.lineWidth = s.w;
          ctx.beginPath(); ctx.moveTo(s.x, s.y);
          s.x += vx * dt * 0.09; s.y += vy * dt * 0.09;
          ctx.lineTo(s.x, s.y); ctx.stroke();

          // cycle hue a touch for subtle color breathing
          if (!s.warm) {
            s.hue += 0.15;
            if (s.hue > HUE_STEEL) s.hue = HUE_CYAN;
          }

          if (--s.life < 0 || s.x < -160 || s.x > innerWidth + 160 || s.y < -160 || s.y > innerHeight + 160) {
            s.x = Math.random() * innerWidth;
            s.y = Math.random() * innerHeight;
            s.life = 80 + Math.random() * 120;
            s.warm = Math.random() < 0.22;
            s.hue = s.warm ? HUE_AMBER : (HUE_CYAN + Math.random() * (HUE_STEEL - HUE_CYAN));
          }
        }
      }

      requestAnimationFrame(draw);
    }

    document.addEventListener('visibilitychange', () => {
      running = !document.hidden || !CONFIG.respectReduceMotion;
      if (running) { last = performance.now(); requestAnimationFrame(draw); }
    });

    if (running) requestAnimationFrame(draw);
  } catch (e) {
    console.warn('DetailFlow background disabled:', e);
  }
})();
