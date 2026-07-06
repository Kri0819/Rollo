export default function EmptyState({ title, subtitle }) {
  return (
    <div className="empty">
      <div className="empty-ball" />
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}
