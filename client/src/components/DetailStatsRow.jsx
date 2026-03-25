export default function DetailStatsRow({ title }) {
  const ts = title.type_specific || {};
  const score = title.average_score != null ? Number(title.average_score).toFixed(1) : '—';
  const date = title.release_date ? title.release_date.slice(0, 10) : '—';
  const status = (title.release_status || '').replace(/_/g, ' ');
  let typeStat = '—';
  if (title.media_type === 'series') typeStat = ts.episodes ? `${ts.episodes} ep` : '—';
  else if (title.media_type === 'movie') typeStat = ts.runtime ? `${ts.runtime} min` : '—';
  else if (title.media_type === 'book') typeStat = ts.pages ? `${ts.pages} pp` : '—';
  else if (title.media_type === 'game') typeStat = ts.playtime || (Array.isArray(ts.platforms) ? ts.platforms.join(', ') : '') || '—';
  return (
    <div className="detail-stats-row">
      <span>{date}</span>
      <span>{status}</span>
      <span>{typeStat}</span>
      <span>{score} avg</span>
      <span>{title.popularity ?? 0} users</span>
    </div>
  );
}
