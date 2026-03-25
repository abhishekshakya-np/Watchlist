export default function DetailRow({ label, value }) {
  return value != null && value !== '' ? (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  ) : null;
}
