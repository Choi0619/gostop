import { useEffect, useRef } from 'react';

// 승리 축하 색종이 (canvas, 가벼움)
export default function Confetti({ duration = 2500 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#ffd60a', '#e5383b', '#2d6a4f', '#f77f00', '#9d4edd', '#fff'];
    const pieces = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 10,
      c: colors[(Math.random() * colors.length) | 0],
      vy: 2 + Math.random() * 3.5,
      vx: -1.5 + Math.random() * 3,
      rot: Math.random() * Math.PI,
      vr: -0.15 + Math.random() * 0.3,
    }));
    let raf, start = performance.now();
    const tick = (t) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        p.y += p.vy; p.x += p.vx; p.rot += p.vr;
        if (p.y > canvas.height + 20) p.y = -20;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (t - start < duration) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  return <canvas ref={ref} className="confetti-canvas" />;
}
