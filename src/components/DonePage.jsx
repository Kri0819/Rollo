import DoneCard from "./DoneCard";
import EmptyState from "./EmptyState";

export default function DonePage({ tasks, tagMap, onOpen, onRestore, onDelete }) {
  if (!tasks.length) {
    return (
      <EmptyState
        title="還沒有完成的事項"
        subtitle="今天打勾的事情，明天會滾到這裡"
      />
    );
  }

  return (
    <div className="list">
      {tasks.map((task) => (
        <DoneCard
          key={task.id}
          task={task}
          tag={tagMap[task.tagId]}
          onOpen={onOpen}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
