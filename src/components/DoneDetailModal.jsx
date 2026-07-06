import { X } from "lucide-react";
import { formatDate, formatDateTime, formatTime } from "../utils/date";
import { CenterModal } from "./Modal";

export default function DoneDetailModal({
  task,
  tag,
  onClose,
  onRestore,
  onDelete,
  mode = "done",
}) {
  const completed = formatDateTime(task.completedAt || task.checkedAt);

  return (
    <CenterModal onClose={onClose}>
      <div className="modal-head">
        <h2>{mode === "checked" ? "今日已完成" : "完成詳情"}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="關閉">
          <X size={20} />
        </button>
      </div>

      <div className="detail-grid title-row">
        <div>
          <span>名稱</span>
          <strong>{task.title}</strong>
        </div>

        <div>
          <span>標籤</span>
          <strong>{tag?.name || "--"}</strong>
        </div>
      </div>

      <div className="detail-grid half">
        <div>
          <span>原定完成日期</span>
          <strong>{formatDate(task.dueDate)}</strong>
        </div>

        <div>
          <span>原定完成時間</span>
          <strong>{formatTime(task.dueTime)}</strong>
        </div>
      </div>

      <div className="detail-grid half">
        <div>
          <span>{mode === "checked" ? "今日完成日期" : "實際完成日期"}</span>
          <strong>{completed.date}</strong>
        </div>

        <div>
          <span>{mode === "checked" ? "今日完成時間" : "實際完成時間"}</span>
          <strong>{completed.time}</strong>
        </div>
      </div>

      <div className="detail-note">
        <span>備註</span>
        <p>{task.note || "--"}</p>
      </div>

      <div className="modal-actions two">
        <button className="secondary-btn" onClick={onRestore}>
          {mode === "checked" ? "取消勾選" : "復原"}
        </button>

        <button className="danger-btn" onClick={onDelete}>
          刪除
        </button>
      </div>
    </CenterModal>
  );
}
