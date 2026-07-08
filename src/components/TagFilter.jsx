import { tagColorKey } from "../utils/tagColor";

export default function TagFilter({ tags, activeId, onChange }) {
  if (!tags.length) return null;

  return (
    <div className="tag-filter">
      <button
        className={`tag-filter-chip ${activeId === null ? "active" : ""}`}
        onClick={() => onChange(null)}
      >
        全部
      </button>

      {tags.map((tag) => (
        <button
          key={tag.id}
          className={`tag-filter-chip tag-${tagColorKey(tag.id)} ${
            activeId === tag.id ? "active" : ""
          }`}
          onClick={() => onChange(activeId === tag.id ? null : tag.id)}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
