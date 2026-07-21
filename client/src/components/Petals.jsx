// 벚꽃 테마 전용 꽃잎 흩날림
export default function Petals() {
  const petals = Array.from({ length: 18 }, (_, i) => ({
    left: `${(i * 5.5 + Math.random() * 4) % 100}%`,
    dur: `${6 + Math.random() * 6}s`,
    delay: `${-Math.random() * 8}s`,
    size: `${14 + Math.random() * 12}px`,
    ch: Math.random() > 0.5 ? '🌸' : '🌷',
  }));
  return (
    <div className="petals" aria-hidden>
      {petals.map((p, i) => (
        <span key={i} className="petal"
          style={{ left: p.left, animationDuration: p.dur, animationDelay: p.delay, fontSize: p.size }}>
          {p.ch}
        </span>
      ))}
    </div>
  );
}
