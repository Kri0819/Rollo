import DoneCard from "./DoneCard";
import EmptyState from "./EmptyState";

export default function DonePage({ tasks, tagMap, hasFilter, onOpen, onRestore, onDelete }) {
  if (!tasks.length) {
    return hasFilter ? (
      <EmptyState
        title="這個標籤還沒有完成的事項"
        subtitle="換個標籤看看，或先去待辦頁打勾吧"
      />
    ) : (
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
