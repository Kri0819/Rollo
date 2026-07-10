import Rollo from "./Rollo";

export default function EmptyState({ title, subtitle }) {
  return (
    <div className="empty">
      <div className="empty-ball-wrap">
        <Rollo size={64} mood="sleepy" trail />
      </div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}
