import EmptyState from "./EmptyState";
import TodoCard from "./TodoCard";

export default function TodoPage({ tasks, tagMap, onCheck, onEdit, onDelete }) {
  if (!tasks.length) {
    return (
      <EmptyState
        title="待辦清單空空的"
        subtitle="新增一件事，讓它開始每天滾動吧"
      />
    );
  }

  return (
    <div className="list">
      {tasks.map((task) => (
        <TodoCard
          key={task.id}
          task={task}
          tag={tagMap[task.tagId]}
          onCheck={onCheck}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
