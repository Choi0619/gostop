// 큰 멘트 연출 (뻑!/GO! 등)
export default function Callout({ data }) {
  if (!data) return null;
  return (
    <div className={`callout callout-${data.variant}`} key={data.label + data._k}>
      <div className="callout-label">{data.label}</div>
      {data.sub && <div className="callout-sub">{data.sub}</div>}
    </div>
  );
}
