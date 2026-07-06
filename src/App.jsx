import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Settings,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  Check,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import "./styles.css";

const STORAGE_KEY = "rollo:tasks:v011";
const TAGS_KEY = "rollo:tags:v011";
const SETTINGS_KEY = "rollo:settings:v011";

const DEFAULT_TAGS = [
  { id: "work", name: "工作", color: "blue" },
  { id: "life", name: "生活", color: "green" },
  { id: "important", name: "重要", color: "red" },
  { id: "waiting", name: "等待中", color: "yellow" },
];

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayKey() {
  const d = new Date();
  return dateKey(d);
}

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDate(date, time = "00:00") {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh = 0, mm = 0] = (time || "00:00").split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

function formatDate(date) {
  if (!date) return "--";
  const [, m, d] = date.split("-").map(Number);
  return `${m}/${d}`;
}

function formatTime(time) {
  return time || "--";
}

function formatDateTime(iso) {
  if (!iso) return { date: "--", time: "--" };
  const d = new Date(iso);
  return {
    date: `${d.getMonth() + 1}/${d.getDate()}`,
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

function getUrgency(task) {
  if (!task.dueDate) return { level: "green", text: "" };

  const due = parseLocalDate(task.dueDate, task.dueTime || "23:59");
  const now = new Date();
  const diffMs = due - now;
  const diffDays = Math.ceil(diffMs / 86400000);

  if (diffMs < 0) return { level: "red", text: "已逾期" };
  if (diffDays <= 0) return { level: "red", text: "今日截止" };
  if (diffDays <= 3) return { level: "orange", text: `還有 ${diffDays} 天` };
  if (diffDays <= 7) return { level: "yellow", text: "" };
  return { level: "green", text: "" };
}

function isCheckedToday(task) {
  if (!task.checkedAt) return false;
  return dateKey(new Date(task.checkedAt)) === todayKey();
}

function normalizeTasks(tasks) {
  return tasks.map((task) => {
    if (task.isCompleted) return task;
    if (task.checkedAt && !isCheckedToday(task)) {
      return {
        ...task,
        isCompleted: true,
        completedAt: task.completedAt || task.checkedAt,
      };
    }
    return task;
  });
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default function App() {
  const [tasks, setTasks] = useState(() => normalizeTasks(load(STORAGE_KEY, [])));
  const [tags, setTags] = useState(() => load(TAGS_KEY, DEFAULT_TAGS));
  const [theme, setTheme] = useState(() => load(SETTINGS_KEY, { theme: "light" }).theme || "light");

  const [tab, setTab] = useState("todo");
  const [taskModal, setTaskModal] = useState(null); // null | { mode, task }
  const [detailTask, setDetailTask] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    save(STORAGE_KEY, tasks);
  }, [tasks]);

  useEffect(() => {
    save(TAGS_KEY, tags);
  }, [tags]);

  useEffect(() => {
    save(SETTINGS_KEY, { theme });
  }, [theme]);

  const tagMap = useMemo(() => {
    return Object.fromEntries(tags.map((t) => [t.id, t]));
  }, [tags]);

  const todoTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.isCompleted)
      .sort((a, b) => {
        const aChecked = isCheckedToday(a) ? 1 : 0;
        const bChecked = isCheckedToday(b) ? 1 : 0;
        if (aChecked !== bChecked) return aChecked - bChecked;

        const order = { red: 0, orange: 1, yellow: 2, green: 3 };
        return order[getUrgency(a).level] - order[getUrgency(b).level];
      });
  }, [tasks]);

  const doneTasks = useMemo(() => {
    return tasks
      .filter((t) => t.isCompleted)
      .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));
  }, [tasks]);

  function upsertTask(data) {
    const now = new Date().toISOString();

    if (data.id) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === data.id
            ? {
                ...task,
                ...data,
                updatedAt: now,
              }
            : task
        )
      );
    } else {
      setTasks((prev) => [
        ...prev,
        {
          id: uid(),
          title: data.title,
          tagId: data.tagId || "",
          dueDate: data.dueDate || "",
          dueTime: data.dueTime || "",
          note: data.note || "",
          checkedAt: null,
          completedAt: null,
          isCompleted: false,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    setTaskModal(null);
  }

  function checkTask(task) {
    if (isCheckedToday(task)) return;

    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              checkedAt: now,
              updatedAt: now,
            }
          : t
      )
    );
  }

  function restoreTask(task) {
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              isCompleted: false,
              checkedAt: null,
              completedAt: null,
              updatedAt: now,
            }
          : t
      )
    );
    setDetailTask(null);
  }

  function deleteTask(task) {
    setConfirm({
      title: "刪除事項",
      message: `確定要刪除「${task.title}」嗎？這個動作不能復原。`,
      confirmText: "刪除",
      danger: true,
      onConfirm: () => {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        setDetailTask(null);
        setConfirm(null);
      },
    });
  }

  function addTag(name) {
    const clean = name.trim();
    if (!clean) return;
    setTags((prev) => [...prev, { id: uid(), name: clean, color: "blue" }]);
  }

  function logoutPlaceholder() {
    setToast("目前是本機版本，還沒有登入系統");
    setTimeout(() => setToast(""), 1800);
  }

  return (
    <div className={`app theme-${theme}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-ball" />
          <div>
            <h1>滾滾</h1>
            <p>Rollo</p>
          </div>
        </div>

        <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="設定">
          <Settings size={20} />
        </button>
      </header>

      <main className="content">
        {tab === "todo" ? (
          <TodoPage
            tasks={todoTasks}
            tagMap={tagMap}
            onCheck={checkTask}
            onEdit={(task) => setTaskModal({ mode: "edit", task })}
            onDelete={deleteTask}
          />
        ) : (
          <DonePage
            tasks={doneTasks}
            tagMap={tagMap}
            onOpen={setDetailTask}
            onRestore={restoreTask}
            onDelete={deleteTask}
          />
        )}
      </main>

      {tab === "todo" && (
        <button className="fab" onClick={() => setTaskModal({ mode: "add", task: null })}>
          <Plus size={28} />
        </button>
      )}

      <nav className="tabs">
        <button className={tab === "todo" ? "active" : ""} onClick={() => setTab("todo")}>
          待辦
        </button>
        <button className={tab === "done" ? "active" : ""} onClick={() => setTab("done")}>
          已完成
        </button>
      </nav>

      {taskModal && (
        <TaskModal
          mode={taskModal.mode}
          task={taskModal.task}
          tags={tags}
          onClose={() => setTaskModal(null)}
          onSave={upsertTask}
          onDelete={taskModal.task ? () => deleteTask(taskModal.task) : null}
        />
      )}

      {detailTask && (
        <DoneDetailModal
          task={detailTask}
          tag={tagMap[detailTask.tagId]}
          onClose={() => setDetailTask(null)}
          onRestore={() => restoreTask(detailTask)}
          onDelete={() => deleteTask(detailTask)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          theme={theme}
          setTheme={setTheme}
          tags={tags}
          setTags={setTags}
          onAddTag={addTag}
          onLogout={logoutPlaceholder}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          {...confirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function TodoPage({ tasks, tagMap, onCheck, onEdit, onDelete }) {
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

function DonePage({ tasks, tagMap, onOpen, onRestore, onDelete }) {
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

function TodoCard({ task, tag, onCheck, onEdit, onDelete }) {
  const urgency = getUrgency(task);
  const checked = isCheckedToday(task);

  return (
    <SwipeCard
      leftAction={{
        label: "編輯",
        icon: <Pencil size={18} />,
        onClick: () => onEdit(task),
      }}
      rightAction={{
        label: "刪除",
        icon: <Trash2 size={18} />,
        onClick: () => onDelete(task),
        danger: true,
      }}
    >
      <article
        className={`task-card todo-card ${checked ? "checked" : ""}`}
        onClick={() => onCheck(task)}
      >
        <div className="task-main">
          <div className="task-line">
            <h2 className={`task-title urgency-${urgency.level}`}>{task.title}</h2>
            {tag ? <span className={`tag tag-${tag.color}`}>{tag.name}</span> : null}
          </div>

          <p className="task-note">{task.note || " "}</p>
        </div>

        <div className="task-side">
          <div className={`urgency-text urgency-${urgency.level}`}>
            {urgency.text}
          </div>

          <div className={`check-circle ${checked ? "checked" : ""}`}>
            {checked ? <Check size={17} strokeWidth={3} /> : null}
          </div>
        </div>
      </article>
    </SwipeCard>
  );
}

function DoneCard({ task, tag, onOpen, onRestore, onDelete }) {
  return (
    <SwipeCard
      leftAction={{
        label: "復原",
        icon: <RotateCcw size={18} />,
        onClick: () => onRestore(task),
      }}
      rightAction={{
        label: "刪除",
        icon: <Trash2 size={18} />,
        onClick: () => onDelete(task),
        danger: true,
      }}
    >
      <article className="task-card done-card" onClick={() => onOpen(task)}>
        <div className="task-main">
          <div className="task-line">
            <h2 className="task-title done-title">{task.title}</h2>
            {tag ? <span className={`tag tag-${tag.color}`}>{tag.name}</span> : null}
          </div>
        </div>

        <div className="done-check">
          <Check size={17} strokeWidth={3} />
        </div>
      </article>
    </SwipeCard>
  );
}

function SwipeCard({ children, leftAction, rightAction }) {
  const [open, setOpen] = useState(false);

  let startX = 0;

  function onTouchStart(e) {
    startX = e.touches[0].clientX;
  }

  function onTouchEnd(e) {
    const endX = e.changedTouches[0].clientX;
    if (startX - endX > 40) setOpen(true);
    if (endX - startX > 40) setOpen(false);
  }

  return (
    <div className={`swipe-wrap ${open ? "open" : ""}`}>
      <div className="swipe-actions">
        <button
          className="swipe-btn edit"
          onClick={(e) => {
            e.stopPropagation();
            leftAction.onClick();
            setOpen(false);
          }}
        >
          {leftAction.icon}
        </button>

        <button
          className={`swipe-btn ${rightAction.danger ? "delete" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            rightAction.onClick();
            setOpen(false);
          }}
        >
          {rightAction.icon}
        </button>
      </div>

      <div
        className="swipe-content"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onDoubleClick={() => setOpen((v) => !v)}
      >
        {children}
      </div>
    </div>
  );
}

function TaskModal({ mode, task, tags, onClose, onSave, onDelete }) {
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
        <button className="icon-btn" onClick={onClose}>
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

function DoneDetailModal({ task, tag, onClose, onRestore, onDelete }) {
  const completed = formatDateTime(task.completedAt || task.checkedAt);

  return (
    <CenterModal onClose={onClose}>
      <div className="modal-head">
        <h2>完成詳情</h2>
        <button className="icon-btn" onClick={onClose}>
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
          <span>實際完成日期</span>
          <strong>{completed.date}</strong>
        </div>

        <div>
          <span>實際完成時間</span>
          <strong>{completed.time}</strong>
        </div>
      </div>

      <div className="detail-note">
        <span>備註</span>
        <p>{task.note || "--"}</p>
      </div>

      <div className="modal-actions two">
        <button className="secondary-btn" onClick={onRestore}>
          復原
        </button>
        <button className="danger-btn" onClick={onDelete}>
          刪除
        </button>
      </div>
    </CenterModal>
  );
}

function SettingsModal({ theme, setTheme, tags, setTags, onAddTag, onLogout, onClose }) {
  const [newTag, setNewTag] = useState("");

  function removeTag(id) {
    setTags((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <CenterModal onClose={onClose}>
      <div className="modal-head">
        <h2>設定</h2>
        <button className="icon-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <section className="setting-section">
        <h3>外觀</h3>
        <div className="theme-row">
          <button
            className={theme === "light" ? "active" : ""}
            onClick={() => setTheme("light")}
          >
            <Sun size={16} /> 淺色
          </button>
          <button
            className={theme === "dark" ? "active" : ""}
            onClick={() => setTheme("dark")}
          >
            <Moon size={16} /> 深色
          </button>
        </div>
      </section>

      <section className="setting-section">
        <h3>標籤</h3>

        <div className="tag-list">
          {tags.map((tag) => (
            <div className="tag-edit-row" key={tag.id}>
              <input
                value={tag.name}
                onChange={(e) =>
                  setTags((prev) =>
                    prev.map((t) =>
                      t.id === tag.id ? { ...t, name: e.target.value } : t
                    )
                  )
                }
              />

              <select
                value={tag.color}
                onChange={(e) =>
                  setTags((prev) =>
                    prev.map((t) =>
                      t.id === tag.id ? { ...t, color: e.target.value } : t
                    )
                  )
                }
              >
                <option value="blue">藍</option>
                <option value="green">綠</option>
                <option value="yellow">黃</option>
                <option value="red">紅</option>
              </select>

              <button onClick={() => removeTag(tag.id)}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="add-tag-row">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="新增標籤"
          />
          <button
            onClick={() => {
              onAddTag(newTag);
              setNewTag("");
            }}
          >
            新增
          </button>
        </div>
      </section>

      <button className="logout-btn" onClick={onLogout}>
        <LogOut size={17} />
        登出
      </button>
    </CenterModal>
  );
}

function ConfirmDialog({ title, message, confirmText, danger, onConfirm, onCancel }) {
  return (
    <CenterModal onClose={onCancel} small>
      <h2 className="confirm-title">{title}</h2>
      <p className="confirm-message">{message}</p>

      <div className="modal-actions two">
        <button className="secondary-btn" onClick={onCancel}>
          取消
        </button>
        <button className={danger ? "danger-btn" : "primary-btn"} onClick={onConfirm}>
          {confirmText || "確定"}
        </button>
      </div>
    </CenterModal>
  );
}

function CenterModal({ children, onClose, small = false }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`center-modal ${small ? "small" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function EmptyState({ title, subtitle }) {
  return (
    <div className="empty">
      <div className="empty-ball" />
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}
