import { tagColorKey } from "../utils/tagColor";

export default function TagFilter({ tags, activeId, onChange, locked, onLocked }) {
  if (!tags.length) return null;

  function handleClick(nextId) {
    if (locked) {
      onLocked?.();
      return;
    }
    onChange(nextId);
  }

  return (
    <div className={`tag-filter ${locked ? "locked" : ""}`}>
      <button
        className={`tag-filter-chip ${activeId === null ? "active" : ""}`}
        onClick={() => handleClick(null)}
      >
        全部
      </button>

      {tags.map((tag) => (
        <button
          key={tag.id}
          className={`tag-filter-chip tag-${tagColorKey(tag.id)} ${
            activeId === tag.id ? "active" : ""
          }`}
          onClick={() => handleClick(activeId === tag.id ? null : tag.id)}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
