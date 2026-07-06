import { useState } from "react";
import { X } from "lucide-react";
import { CenterModal } from "./Modal";

export default function TaskModal({ mode, task, tags, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(task?.title || "");
  const [tagId, setTagId] = useState(task?.tagId || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [dueTime, setDueTime] = useState(task?.dueTime || "");
  const [note, setNote] = useState(task?.note || "");

  function submit() {
    if (!title.trim()) return;

    onSave({
      id: task?.id,
      title: title.trim(),
      tagId,
      dueDate,
      dueTime: dueDate ? dueTime : "",
      note: note.trim(),
    });
  }

  return (
    <CenterModal onClose={onClose}>
      <div className="modal-head">
        <h2>{mode === "edit" ? "編輯事項" : "新增事項"}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="關閉">
          <X size={20} />
        </button>
      </div>

      <div className="form-grid title-row">
        <label>
          <span>事件名稱</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="活動報名表"
            autoFocus
          />
        </label>

        <label>
          <span>標籤</span>
          <select value={tagId} onChange={(e) => setTagId(e.target.value)}>
            <option value="">--</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-grid half">
        <label>
          <span>截止日期</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>

        <label>
          <span>截止時間</span>
          <input
            type="time"
            value={dueTime}
            disabled={!dueDate}
            onChange={(e) => setDueTime(e.target.value)}
          />
        </label>
      </div>

      <label className="full-field">
        <span>備註</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="補充細節"
          rows={3}
        />
      </label>

      <button className="primary-btn" onClick={submit}>
        {mode === "edit" ? "儲存" : "新增"}
      </button>

      {onDelete && (
        <button className="danger-text-btn" onClick={onDelete}>
          刪除事項
        </button>
      )}
    </CenterModal>
  );
}
