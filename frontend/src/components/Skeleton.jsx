export function SkeletonRows({ count = 5, cols = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="skeleton-row">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j}><span className="skeleton-bar" style={{ width: `${50 + (j * 17) % 40}%` }} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div className="exception-card skeleton-card" key={i}>
          <div className="skeleton-bar" style={{ width: '30%', marginBottom: 8 }} />
          <div className="skeleton-bar" style={{ width: '85%' }} />
        </div>
      ))}
    </>
  );
}
