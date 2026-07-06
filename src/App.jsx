import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Plus, X, Check, Trash2, Pencil, RotateCcw, Settings as SettingsIcon,
  Sun, Moon, ChevronRight, ArrowLeft, ChevronDown, Circle, CheckCircle2,
} from "lucide-react";

/* ---------------------------------------------------------------
   滾滾 GunGun — a to-do list that rolls itself into tomorrow.
   v0.1.0 — core loop only: add once, it stays on 待辦 until done.
----------------------------------------------------------------*/

const STORAGE_KEYS = {
  tasks: "gungun:tasks",
  tags: "gungun:tags",
  settings: "gungun:settings",
};

const TAG_PALETTE = ["blue", "sage", "gold", "coral", "blue", "sage", "gold", "coral"];

const DEFAULT_TAGS = [
  { id: "tag-work", name: "工作", color: "blue" },
  { id: "tag-life", name: "生活", color: "sage" },
  { id: "tag-important", name: "重要", color: "coral" },
  { id: "tag-waiting", name: "等待中", color: "gold" },
];

const MAX_TAGS = 10;

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateOnly(str) {
  // str: 'YYYY-MM-DD' -> local midnight Date
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function diffDays(dueStr) {
  const due = parseDateOnly(dueStr);
  const now = parseDateOnly(todayStr());
  return Math.round((due - now) / 86400000);
}

function formatDue(str) {
  const [, m, d] = str.split("-").map(Number);
  return `${m}/${d}`;
}

function getStatus(dueStr) {
  const diff = diffDays(dueStr);
  if (diff < 0) return { kind: "overdue", days: -diff };
  if (diff === 0) return { kind: "today", days: 0 };
  if (diff <= 3) return { kind: "soon", days: diff };
  return { kind: "normal", days: diff };
}

function statusLabel(status) {
  switch (status.kind) {
    case "overdue":
      return `已逾期 ${status.days} 天`;
    case "today":
      return "今日截止";
    case "soon":
      return `還有 ${status.days} 天`;
    default:
      return "";
  }
}

function statusOrder(status) {
  return { overdue: 0, today: 1, soon: 2, normal: 3 }[status.kind];
}

/* ------------------------------- storage helpers ------------------------------- */

async function loadJSON(key, fallback) {
  try {
    const res = await window.storage.get(key, false);
    if (!res) return fallback;
    return JSON.parse(res.value);
  } catch (e) {
    return fallback;
  }
}

async function saveJSON(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), false);
  } catch (e) {
    // best-effort; ignore storage failure
  }
}

/* ------------------------------------- App ------------------------------------- */

export default function GunGunApp() {
  const [loaded, setLoaded] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [theme, setTheme] = useState("light");

  const [view, setView] = useState("todo"); // 'todo' | 'done'

  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsScreen, setSettingsScreen] = useState("main"); // main | tags | data | about

  const [confirmState, setConfirmState] = useState(null); // {message, danger, onConfirm}

  const [rollingIds, setRollingIds] = useState(() => new Set());
  const [fadingIds, setFadingIds] = useState(() => new Set());

  const skipSaveRef = useRef(true);

  /* ---- initial load ---- */
  useEffect(() => {
    (async () => {
      const [t, g, s] = await Promise.all([
        loadJSON(STORAGE_KEYS.tasks, []),
        loadJSON(STORAGE_KEYS.tags, DEFAULT_TAGS),
        loadJSON(STORAGE_KEYS.settings, { theme: "light" }),
      ]);
      setTasks(t);
      setTags(g && g.length ? g : DEFAULT_TAGS);
      setTheme(s?.theme === "dark" ? "dark" : "light");
      setLoaded(true);
      requestAnimationFrame(() => {
        skipSaveRef.current = false;
      });
    })();
  }, []);

  useEffect(() => {
    if (skipSaveRef.current) return;
    saveJSON(STORAGE_KEYS.tasks, tasks);
  }, [tasks]);

  useEffect(() => {
    if (skipSaveRef.current) return;
    saveJSON(STORAGE_KEYS.tags, tags);
  }, [tags]);

  useEffect(() => {
    if (skipSaveRef.current) return;
    saveJSON(STORAGE_KEYS.settings, { theme });
  }, [theme]);

  const tagById = useMemo(() => {
    const map = {};
    tags.forEach((t) => (map[t.id] = t));
    return map;
  }, [tags]);

  const todoTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.isCompleted)
      .slice()
      .sort((a, b) => {
        const sa = getStatus(a.dueDate);
        const sb = getStatus(b.dueDate);
        const oa = statusOrder(sa);
        const ob = statusOrder(sb);
        if (oa !== ob) return oa - ob;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [tasks]);

  const doneTasks = useMemo(() => {
    return tasks
      .filter((t) => t.isCompleted)
      .slice()
      .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));
  }, [tasks]);

  /* ---------------------------- task actions ---------------------------- */

  const openAdd = () => {
    setEditingId(null);
    setAddOpen(true);
  };

  const openEdit = (id) => {
    setEditingId(id);
    setAddOpen(true);
  };

  const saveTask = (form) => {
    const now = new Date().toISOString();
    if (editingId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? { ...t, ...form, updatedAt: now }
            : t
        )
      );
    } else {
      const newTask = {
        id: uid("task"),
        title: form.title,
        dueDate: form.dueDate,
        note: form.note,
        tagId: form.tagId,
        isRolling: form.isRolling,
        isCompleted: false,
        createdAt: now,
        completedAt: null,
        updatedAt: now,
      };
      setTasks((prev) => [...prev, newTask]);
    }
    setAddOpen(false);
    setEditingId(null);
  };

  const completeTask = (id) => {
    setRollingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      const now = new Date().toISOString();
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, isCompleted: true, completedAt: now, updatedAt: now } : t
        )
      );
      setRollingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 460);
  };

  const restoreTask = (id) => {
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, isCompleted: false, completedAt: null, updatedAt: now } : t
      )
    );
  };

  const requestDeleteTask = (task) => {
    setConfirmState({
      message: `確定要刪除「${task.title}」嗎？此動作無法還原。`,
      danger: true,
      onConfirm: () => {
        setFadingIds((prev) => new Set(prev).add(task.id));
        setTimeout(() => {
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
          setFadingIds((prev) => {
            const next = new Set(prev);
            next.delete(task.id);
            return next;
          });
        }, 220);
      },
    });
  };

  /* ---------------------------- tag actions ---------------------------- */

  const addTag = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (tags.some((t) => t.name === trimmed)) return;
    if (tags.length >= MAX_TAGS) return;
    const color = TAG_PALETTE[tags.length % TAG_PALETTE.length];
    setTags((prev) => [...prev, { id: uid("tag"), name: trimmed, color }]);
  };

  const renameTag = (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, name: trimmed } : t)));
  };

  const requestDeleteTag = (tag) => {
    const usedCount = tasks.filter((t) => t.tagId === tag.id).length;
    setConfirmState({
      message:
        usedCount > 0
          ? `「${tag.name}」目前有 ${usedCount} 個事項使用中，刪除後這些事項會變成無標籤。確定刪除？`
          : `確定要刪除標籤「${tag.name}」嗎？`,
      danger: true,
      onConfirm: () => {
        setTags((prev) => prev.filter((t) => t.id !== tag.id));
        setTasks((prev) =>
          prev.map((t) => (t.tagId === tag.id ? { ...t, tagId: null } : t))
        );
      },
    });
  };

  /* ---------------------------- data management ---------------------------- */

  const clearCompleted = () => {
    setConfirmState({
      message: "確定要清除所有已完成事項嗎？此動作無法還原。",
      danger: true,
      onConfirm: () => setTasks((prev) => prev.filter((t) => !t.isCompleted)),
    });
  };

  const resetAllData = () => {
    setConfirmState({
      message: "確定要重置滾滾嗎？所有事項與自訂標籤都會被清除，此動作無法還原。",
      danger: true,
      onConfirm: () => {
        setTasks([]);
        setTags(DEFAULT_TAGS);
      },
    });
  };

  if (!loaded) {
    return (
      <div className={`gg-root theme-${theme}`}>
        <GlobalStyle />
        <div className="gg-loading">
          <BallMark size={40} />
        </div>
      </div>
    );
  }

  const editingTask = editingId ? tasks.find((t) => t.id === editingId) : null;

  return (
    <div className={`gg-root theme-${theme}`}>
      <GlobalStyle />

      <header className="gg-header">
        <div className="gg-brand">
          <BallMark size={26} />
          <span className="gg-brand-name">滾滾</span>
        </div>
        <button
          className="gg-icon-btn"
          aria-label="設定"
          onClick={() => {
            setSettingsScreen("main");
            setSettingsOpen(true);
          }}
        >
          <SettingsIcon size={20} strokeWidth={2} />
        </button>
      </header>

      <main className="gg-main">
        {view === "todo" ? (
          <TodoList
            tasks={todoTasks}
            tagById={tagById}
            rollingIds={rollingIds}
            fadingIds={fadingIds}
            onComplete={completeTask}
            onEdit={openEdit}
            onDelete={requestDeleteTask}
          />
        ) : (
          <DoneList
            tasks={doneTasks}
            tagById={tagById}
            fadingIds={fadingIds}
            onRestore={restoreTask}
            onDelete={requestDeleteTask}
          />
        )}
      </main>

      {view === "todo" && (
        <button className="gg-fab" onClick={openAdd} aria-label="新增事項">
          <Plus size={26} strokeWidth={2.4} />
        </button>
      )}

      <nav className="gg-tabbar">
        <button
          className={`gg-tab ${view === "todo" ? "active" : ""}`}
          onClick={() => setView("todo")}
        >
          <Circle size={18} strokeWidth={2.4} />
          <span>待辦</span>
          {todoTasks.length > 0 && <span className="gg-tab-count">{todoTasks.length}</span>}
        </button>
        <button
          className={`gg-tab ${view === "done" ? "active" : ""}`}
          onClick={() => setView("done")}
        >
          <CheckCircle2 size={18} strokeWidth={2.4} />
          <span>已完成</span>
        </button>
      </nav>

      {addOpen && (
        <TaskFormSheet
          tags={tags}
          initial={editingTask}
          onClose={() => {
            setAddOpen(false);
            setEditingId(null);
          }}
          onSubmit={saveTask}
        />
      )}

      {settingsOpen && (
        <SettingsSheet
          screen={settingsScreen}
          setScreen={setSettingsScreen}
          onClose={() => setSettingsOpen(false)}
          theme={theme}
          setTheme={setTheme}
          tags={tags}
          onAddTag={addTag}
          onRenameTag={renameTag}
          onDeleteTag={requestDeleteTag}
          onClearCompleted={clearCompleted}
          onResetAll={resetAllData}
          doneCount={doneTasks.length}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          danger={confirmState.danger}
          onCancel={() => setConfirmState(null)}
          onConfirm={() => {
            confirmState.onConfirm();
            setConfirmState(null);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------- Brand mark ------------------------------------- */

function BallMark({ size = 24 }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" fill="none" className="gg-mark">
      <path
        d="M4 26 C 10 30, 14 22, 20 24"
        stroke="var(--coral)"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="27" cy="21" r="10.5" fill="url(#gg-ball-grad)" />
      <circle cx="23.5" cy="17.5" r="3" fill="rgba(255,255,255,0.55)" />
      <defs>
        <radialGradient id="gg-ball-grad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="var(--accent-strong)" />
          <stop offset="100%" stopColor="var(--coral)" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ------------------------------------- Todo list ------------------------------------- */

function TodoList({ tasks, tagById, rollingIds, fadingIds, onComplete, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        title="待辦清單空空的"
        subtitle={"新增一件事，讓它開始每天滾動吧"}
      />
    );
  }
  return (
    <ul className="gg-list">
      {tasks.map((task) => {
        const status = getStatus(task.dueDate);
        const tag = task.tagId ? tagById[task.tagId] : null;
        const rolling = rollingIds.has(task.id);
        const fading = fadingIds.has(task.id);
        return (
          <li
            key={task.id}
            className={`gg-card ${rolling ? "gg-card--rolling" : ""} ${
              fading ? "gg-card--fading" : ""
            }`}
          >
            <button
              className="gg-checkbox"
              aria-label="完成"
              onClick={() => onComplete(task.id)}
            >
              {rolling && <Check size={14} strokeWidth={3} />}
            </button>

            <div className="gg-card-body">
              <div className="gg-card-top">
                <h3 className="gg-card-title">{task.title}</h3>
                <span className={`gg-status gg-status--${status.kind}`}>
                  {status.kind === "normal" ? formatDue(task.dueDate) : statusLabel(status)}
                </span>
              </div>

              <div className="gg-card-meta">
                <span className="gg-due">{formatDue(task.dueDate)} 截止</span>
                {tag && (
                  <span className={`gg-tag-chip gg-tag--${tag.color}`}>{tag.name}</span>
                )}
              </div>

              {task.note && <p className="gg-note">{task.note}</p>}
            </div>

            <div className="gg-card-actions">
              <button className="gg-icon-btn small" onClick={() => onEdit(task.id)} aria-label="編輯">
                <Pencil size={15} />
              </button>
              <button
                className="gg-icon-btn small danger"
                onClick={() => onDelete(task)}
                aria-label="刪除"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------- Done list ------------------------------------- */

function DoneList({ tasks, tagById, fadingIds, onRestore, onDelete }) {
  if (tasks.length === 0) {
    return <EmptyState title="還沒有完成的事項" subtitle="完成的事情會滾到這裡休息" />;
  }
  return (
    <ul className="gg-list">
      {tasks.map((task) => {
        const tag = task.tagId ? tagById[task.tagId] : null;
        const fading = fadingIds.has(task.id);
        const completedDate = task.completedAt ? new Date(task.completedAt) : null;
        return (
          <li key={task.id} className={`gg-card gg-card--done ${fading ? "gg-card--fading" : ""}`}>
            <div className="gg-checkbox gg-checkbox--done">
              <Check size={14} strokeWidth={3} />
            </div>

            <div className="gg-card-body">
              <div className="gg-card-top">
                <h3 className="gg-card-title gg-card-title--done">{task.title}</h3>
              </div>
              <div className="gg-card-meta">
                <span className="gg-due">原截止 {formatDue(task.dueDate)}</span>
                {completedDate && (
                  <span className="gg-due">
                    完成於 {completedDate.getMonth() + 1}/{completedDate.getDate()}
                  </span>
                )}
                {tag && <span className={`gg-tag-chip gg-tag--${tag.color}`}>{tag.name}</span>}
              </div>
              {task.note && <p className="gg-note">{task.note}</p>}
            </div>

            <div className="gg-card-actions">
              <button className="gg-icon-btn small" onClick={() => onRestore(task.id)} aria-label="還原">
                <RotateCcw size={15} />
              </button>
              <button
                className="gg-icon-btn small danger"
                onClick={() => onDelete(task)}
                aria-label="刪除"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function EmptyState({ title, subtitle }) {
  return (
    <div className="gg-empty">
      <svg width="120" height="70" viewBox="0 0 120 70" fill="none">
        <path
          d="M6 50 C 30 58, 55 40, 82 46"
          stroke="var(--border)"
          strokeWidth="2"
          strokeDasharray="1 9"
          strokeLinecap="round"
        />
        <circle cx="94" cy="38" r="16" fill="url(#gg-empty-grad)" />
        <circle cx="88" cy="32" r="4.5" fill="rgba(255,255,255,0.5)" />
        <defs>
          <radialGradient id="gg-empty-grad" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="var(--accent-strong)" />
            <stop offset="100%" stopColor="var(--coral)" />
          </radialGradient>
        </defs>
      </svg>
      <p className="gg-empty-title">{title}</p>
      <p className="gg-empty-sub">{subtitle}</p>
    </div>
  );
}

/* ------------------------------------- Add / Edit sheet ------------------------------------- */

function TaskFormSheet({ tags, initial, onClose, onSubmit }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [dueDate, setDueDate] = useState(initial?.dueDate || todayStr());
  const [tagId, setTagId] = useState(initial?.tagId ?? null);
  const [note, setNote] = useState(initial?.note || "");
  const [isRolling, setIsRolling] = useState(initial ? initial.isRolling : true);
  const [errors, setErrors] = useState({});

  const isEdit = !!initial;

  const handleSubmit = () => {
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = "請輸入事項名稱";
    if (!dueDate) nextErrors.dueDate = "請選擇截止日";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    onSubmit({ title: title.trim(), dueDate, tagId, note: note.trim(), isRolling });
  };

  return (
    <Sheet onClose={onClose} title={isEdit ? "編輯事項" : "新增事項"}>
      <div className="gg-form">
        <label className="gg-field">
          <span className="gg-label">
            事項名稱<em>必填</em>
          </span>
          <input
            className="gg-input"
            value={title}
            placeholder="例如：繳交季報表"
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
            }}
            maxLength={60}
            autoFocus
          />
          {errors.title && <span className="gg-error">{errors.title}</span>}
        </label>

        <label className="gg-field">
          <span className="gg-label">
            截止日<em>必填</em>
          </span>
          <input
            className="gg-input"
            type="date"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              if (errors.dueDate) setErrors((p) => ({ ...p, dueDate: undefined }));
            }}
          />
          {errors.dueDate && <span className="gg-error">{errors.dueDate}</span>}
        </label>

        <div className="gg-field">
          <span className="gg-label">標籤</span>
          <div className="gg-chip-row">
            <button
              type="button"
              className={`gg-chip-pick ${tagId === null ? "active" : ""}`}
              onClick={() => setTagId(null)}
            >
              無標籤
            </button>
            {tags.map((t) => (
              <button
                type="button"
                key={t.id}
                className={`gg-chip-pick gg-tag--${t.color} ${tagId === t.id ? "active" : ""}`}
                onClick={() => setTagId(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <label className="gg-field">
          <span className="gg-label">備註</span>
          <textarea
            className="gg-textarea"
            value={note}
            placeholder="選填，補充一些細節"
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            rows={2}
          />
        </label>

        <div className="gg-field gg-field--row">
          <div>
            <span className="gg-label" style={{ marginBottom: 2 }}>
              每日自動滾動
            </span>
            <p className="gg-sub-hint">開啟後，未完成前每天都會留在待辦頁</p>
          </div>
          <button
            type="button"
            className={`gg-switch ${isRolling ? "on" : ""}`}
            onClick={() => setIsRolling((v) => !v)}
            aria-pressed={isRolling}
          >
            <span className="gg-switch-knob" />
          </button>
        </div>

        <button className="gg-primary-btn" onClick={handleSubmit}>
          {isEdit ? "儲存變更" : "新增事項"}
        </button>
      </div>
    </Sheet>
  );
}

/* ------------------------------------- Settings sheet ------------------------------------- */

function SettingsSheet({
  screen,
  setScreen,
  onClose,
  theme,
  setTheme,
  tags,
  onAddTag,
  onRenameTag,
  onDeleteTag,
  onClearCompleted,
  onResetAll,
  doneCount,
}) {
  const title =
    screen === "main"
      ? "設定"
      : screen === "tags"
      ? "標籤管理"
      : screen === "data"
      ? "資料管理"
      : "關於滾滾";

  return (
    <Sheet onClose={onClose} title={title}>
      {screen !== "main" && (
        <button className="gg-back-link" onClick={() => setScreen("main")}>
          <ArrowLeft size={16} /> 返回設定
        </button>
      )}

      {screen === "main" && (
        <div className="gg-settings-list">
          <div className="gg-settings-row gg-settings-row--static">
            <span className="gg-settings-row-label">外觀</span>
            <div className="gg-theme-toggle">
              <button
                className={theme === "light" ? "active" : ""}
                onClick={() => setTheme("light")}
              >
                <Sun size={15} /> 淺色
              </button>
              <button
                className={theme === "dark" ? "active" : ""}
                onClick={() => setTheme("dark")}
              >
                <Moon size={15} /> 深色
              </button>
            </div>
          </div>

          <button className="gg-settings-row" onClick={() => setScreen("tags")}>
            <span className="gg-settings-row-label">標籤管理</span>
            <span className="gg-settings-row-right">
              {tags.length} 個 <ChevronRight size={16} />
            </span>
          </button>

          <button className="gg-settings-row" onClick={() => setScreen("data")}>
            <span className="gg-settings-row-label">資料管理</span>
            <ChevronRight size={16} />
          </button>

          <button className="gg-settings-row" onClick={() => setScreen("about")}>
            <span className="gg-settings-row-label">關於滾滾</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {screen === "tags" && (
        <TagsScreen
          tags={tags}
          onAddTag={onAddTag}
          onRenameTag={onRenameTag}
          onDeleteTag={onDeleteTag}
        />
      )}

      {screen === "data" && (
        <div className="gg-settings-list">
          <button className="gg-settings-row" onClick={onClearCompleted}>
            <span className="gg-settings-row-label">清除所有已完成事項</span>
            <span className="gg-settings-row-right">{doneCount} 筆</span>
          </button>
          <button className="gg-settings-row danger" onClick={onResetAll}>
            <span className="gg-settings-row-label">重置所有資料</span>
          </button>
        </div>
      )}

      {screen === "about" && (
        <div className="gg-about">
          <BallMark size={40} />
          <h3>滾滾</h3>
          <p className="gg-about-tagline">會自己滾到明天的待辦清單</p>
          <p className="gg-about-body">
            輸入一次待辦與截止日，還沒做完的事情會每天自動留在待辦頁，不用每天重新複製貼上。
            快到期、今日截止、已逾期都會自動變色提醒。
          </p>
          <p className="gg-about-version">v0.1.0</p>
        </div>
      )}
    </Sheet>
  );
}

function TagsScreen({ tags, onAddTag, onRenameTag, onDeleteTag }) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const startEdit = (tag) => {
    setEditingId(tag.id);
    setEditingValue(tag.name);
  };

  const commitEdit = () => {
    if (editingId) onRenameTag(editingId, editingValue);
    setEditingId(null);
    setEditingValue("");
  };

  const canAdd = newName.trim().length > 0 && tags.length < 10;

  return (
    <div>
      <p className="gg-sub-hint" style={{ marginBottom: 10 }}>
        目前的標籤（{tags.length}/{MAX_TAGS}）
      </p>
      <ul className="gg-tag-manage-list">
        {tags.map((tag) => (
          <li key={tag.id} className="gg-tag-manage-row">
            {editingId === tag.id ? (
              <input
                className="gg-input gg-input--inline"
                value={editingValue}
                autoFocus
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                onBlur={commitEdit}
                maxLength={12}
              />
            ) : (
              <span className="gg-tag-manage-name">
                <span className={`gg-dot gg-tag--${tag.color}`} />
                {tag.name}
              </span>
            )}
            <span className="gg-tag-manage-actions">
              <button className="gg-icon-btn small" onClick={() => startEdit(tag)} aria-label="編輯標籤">
                <Pencil size={15} />
              </button>
              <button
                className="gg-icon-btn small danger"
                onClick={() => onDeleteTag(tag)}
                aria-label="刪除標籤"
              >
                <Trash2 size={15} />
              </button>
            </span>
          </li>
        ))}
      </ul>

      <p className="gg-label" style={{ marginTop: 18, marginBottom: 8 }}>
        新增標籤
      </p>
      <div className="gg-add-tag-row">
        <input
          className="gg-input"
          placeholder="標籤名稱"
          value={newName}
          maxLength={12}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canAdd) {
              onAddTag(newName);
              setNewName("");
            }
          }}
        />
        <button
          className="gg-primary-btn gg-primary-btn--compact"
          disabled={!canAdd}
          onClick={() => {
            onAddTag(newName);
            setNewName("");
          }}
        >
          新增
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------- Shared bits ------------------------------------- */

function Sheet({ title, onClose, children }) {
  return (
    <div className="gg-overlay" onClick={onClose}>
      <div className="gg-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="gg-sheet-handle" />
        <div className="gg-sheet-header">
          <h2>{title}</h2>
          <button className="gg-icon-btn" onClick={onClose} aria-label="關閉">
            <X size={20} />
          </button>
        </div>
        <div className="gg-sheet-body">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ message, danger, onCancel, onConfirm }) {
  return (
    <div className="gg-overlay gg-overlay--center" onClick={onCancel}>
      <div className="gg-confirm" onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <div className="gg-confirm-actions">
          <button className="gg-ghost-btn" onClick={onCancel}>
            取消
          </button>
          <button className={`gg-primary-btn gg-primary-btn--compact ${danger ? "danger" : ""}`} onClick={onConfirm}>
            確定
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------- Styles ------------------------------------- */

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

      .gg-root {
        --radius-lg: 22px;
        --radius-md: 16px;
        --radius-sm: 10px;
        font-family: 'Inter', 'Nunito', -apple-system, BlinkMacSystemFont, 'PingFang TC', 'Noto Sans TC', sans-serif;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: var(--bg);
        color: var(--ink);
        position: relative;
        max-width: 480px;
        margin: 0 auto;
        box-sizing: border-box;
      }
      .gg-root * { box-sizing: border-box; }
      .gg-root button { font-family: inherit; cursor: pointer; }

      .theme-light {
        --bg: #F7F3E8;
        --surface: #FFFFFF;
        --surface-tint: #FBF8EF;
        --border: #E6DEC8;
        --ink: #342E22;
        --ink-soft: #7A7160;
        --ink-faint: #ABA08A;
        --accent: #E8A23D;
        --accent-strong: #D68F28;
        --accent-ink: #2B1E08;
        --sage: #7FA579;
        --coral: #E2735A;
        --warn: #DD8A2E;
        --danger: #D1503D;
        --shadow: rgba(52, 46, 34, 0.10);
        --tag-blue-bg: #E7EEF6; --tag-blue-fg: #4E6E96;
        --tag-sage-bg: #E8F1E5; --tag-sage-fg: #4C7748;
        --tag-gold-bg: #FBEED2; --tag-gold-fg: #97701C;
        --tag-coral-bg: #FBE6E0; --tag-coral-fg: #B05339;
      }
      .theme-dark {
        --bg: #201B14;
        --surface: #2B241B;
        --surface-tint: #332B20;
        --border: #453A29;
        --ink: #F3ECDD;
        --ink-soft: #BFB49E;
        --ink-faint: #8A806B;
        --accent: #F0B052;
        --accent-strong: #F6BE68;
        --accent-ink: #211500;
        --sage: #93BE8B;
        --coral: #EA8064;
        --warn: #F0A25A;
        --danger: #F08171;
        --shadow: rgba(0,0,0,0.4);
        --tag-blue-bg: #2D3A48; --tag-blue-fg: #9CC0E8;
        --tag-sage-bg: #2A3A28; --tag-sage-fg: #A7D6A0;
        --tag-gold-bg: #3D3115; --tag-gold-fg: #F0C878;
        --tag-coral-bg: #3D2721; --tag-coral-fg: #EFA391;
      }

      .gg-loading { flex: 1; display: flex; align-items: center; justify-content: center; }

      .gg-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 16px 18px 10px;
      }
      .gg-brand { display: flex; align-items: center; gap: 8px; }
      .gg-brand-name {
        font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 20px; letter-spacing: 0.5px;
      }

      .gg-icon-btn {
        background: transparent; border: none; color: var(--ink-soft);
        width: 36px; height: 36px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.15s ease;
      }
      .gg-icon-btn:hover { background: var(--surface-tint); }
      .gg-icon-btn.small { width: 30px; height: 30px; }
      .gg-icon-btn.danger:hover { color: var(--danger); }

      .gg-main { flex: 1; padding: 4px 14px 100px; overflow-y: auto; }

      .gg-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }

      .gg-card {
        display: flex; gap: 10px; align-items: flex-start;
        background: var(--surface); border: 1px solid var(--border);
        border-radius: var(--radius-md); padding: 14px;
        box-shadow: 0 2px 8px var(--shadow);
        transition: transform 0.42s cubic-bezier(.4,0,.2,1), opacity 0.42s ease;
      }
      .gg-card--rolling {
        transform: translateX(140%) rotate(50deg);
        opacity: 0;
      }
      .gg-card--fading {
        transform: scale(0.94);
        opacity: 0;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }
      .gg-card--done { opacity: 0.82; }

      .gg-checkbox {
        flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%;
        border: 2px solid var(--border); background: var(--surface);
        display: flex; align-items: center; justify-content: center;
        color: #fff; margin-top: 2px;
        transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
      }
      .gg-checkbox:hover { border-color: var(--accent); transform: scale(1.06); }
      .gg-card--rolling .gg-checkbox { background: var(--sage); border-color: var(--sage); }
      .gg-checkbox--done {
        background: var(--sage); border-color: var(--sage); cursor: default;
      }

      .gg-card-body { flex: 1; min-width: 0; }
      .gg-card-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
      .gg-card-title { font-size: 15px; font-weight: 600; margin: 0; line-height: 1.4; word-break: break-word; }
      .gg-card-title--done { text-decoration: line-through; color: var(--ink-faint); }

      .gg-status { font-size: 12.5px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
      .gg-status--normal { color: var(--ink-faint); font-weight: 500; }
      .gg-status--soon { color: var(--warn); }
      .gg-status--today { color: var(--danger); }
      .gg-status--overdue { color: var(--danger); }

      .gg-card-meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 5px; }
      .gg-due { font-size: 12.5px; color: var(--ink-soft); }

      .gg-tag-chip {
        font-size: 11.5px; font-weight: 600; padding: 2px 9px; border-radius: 999px;
      }
      .gg-tag--blue { background: var(--tag-blue-bg); color: var(--tag-blue-fg); }
      .gg-tag--sage { background: var(--tag-sage-bg); color: var(--tag-sage-fg); }
      .gg-tag--gold { background: var(--tag-gold-bg); color: var(--tag-gold-fg); }
      .gg-tag--coral { background: var(--tag-coral-bg); color: var(--tag-coral-fg); }

      .gg-note { font-size: 12.5px; color: var(--ink-soft); margin: 6px 0 0; line-height: 1.5; }

      .gg-card-actions { display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }

      .gg-fab {
        position: fixed; right: max(20px, calc(50vw - 220px)); bottom: 86px;
        width: 56px; height: 56px; border-radius: 50%; border: none;
        background: linear-gradient(145deg, var(--accent-strong), var(--coral));
        color: #fff; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 8px 18px var(--shadow);
        animation: gg-fab-bob 3.4s ease-in-out infinite;
        z-index: 20;
      }
      @media (prefers-reduced-motion: reduce) { .gg-fab { animation: none; } }
      @keyframes gg-fab-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

      .gg-tabbar {
        position: sticky; bottom: 0; display: flex; border-top: 1px solid var(--border);
        background: var(--surface); padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
        gap: 6px;
      }
      .gg-tab {
        flex: 1; border: none; background: transparent; border-radius: var(--radius-sm);
        display: flex; flex-direction: column; align-items: center; gap: 2px;
        padding: 6px 0; color: var(--ink-faint); font-size: 11.5px; font-weight: 600;
        position: relative;
      }
      .gg-tab.active { color: var(--accent-strong); background: var(--surface-tint); }
      .gg-tab-count {
        position: absolute; top: 2px; right: calc(50% - 26px);
        background: var(--coral); color: #fff; font-size: 10px; font-weight: 700;
        border-radius: 999px; min-width: 16px; height: 16px; padding: 0 4px;
        display: flex; align-items: center; justify-content: center;
      }

      .gg-empty {
        display: flex; flex-direction: column; align-items: center; text-align: center;
        padding: 60px 20px; color: var(--ink-soft);
      }
      .gg-empty-title { font-weight: 700; font-size: 15px; margin: 14px 0 4px; color: var(--ink); }
      .gg-empty-sub { font-size: 13px; margin: 0; color: var(--ink-faint); }

      /* ---- overlay / sheet ---- */
      .gg-overlay {
        position: fixed; inset: 0; background: rgba(20, 16, 8, 0.42);
        display: flex; align-items: flex-end; justify-content: center; z-index: 50;
      }
      .gg-overlay--center { align-items: center; }
      .gg-sheet {
        width: 100%; max-width: 480px; max-height: 88vh; overflow-y: auto;
        background: var(--bg); border-radius: 24px 24px 0 0;
        padding: 10px 20px calc(24px + env(safe-area-inset-bottom));
        animation: gg-sheet-up 0.28s cubic-bezier(.2,.9,.3,1);
      }
      @keyframes gg-sheet-up { from { transform: translateY(30px); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }
      .gg-sheet-handle { width: 40px; height: 4px; border-radius: 999px; background: var(--border); margin: 0 auto 8px; }
      .gg-sheet-header { display: flex; align-items: center; justify-content: space-between; padding: 4px 0 12px; }
      .gg-sheet-header h2 { font-family: 'Nunito', sans-serif; font-size: 18px; font-weight: 800; margin: 0; }
      .gg-sheet-body { padding-bottom: 6px; }

      .gg-back-link {
        display: flex; align-items: center; gap: 6px; background: none; border: none;
        color: var(--ink-soft); font-size: 13.5px; font-weight: 600; padding: 4px 0 14px;
      }

      .gg-form { display: flex; flex-direction: column; gap: 16px; }
      .gg-field { display: flex; flex-direction: column; gap: 6px; }
      .gg-field--row { flex-direction: row; align-items: center; justify-content: space-between; }
      .gg-label { font-size: 12.5px; font-weight: 700; color: var(--ink-soft); display: flex; gap: 6px; }
      .gg-label em { font-style: normal; color: var(--coral); font-weight: 700; }
      .gg-sub-hint { font-size: 12px; color: var(--ink-faint); margin: 0; }

      .gg-input, .gg-textarea {
        background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm);
        padding: 11px 13px; font-size: 14.5px; color: var(--ink); width: 100%; font-family: inherit;
      }
      .gg-input:focus, .gg-textarea:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
      .gg-input--inline { padding: 6px 10px; font-size: 14px; }
      .gg-textarea { resize: vertical; min-height: 44px; }
      .gg-error { font-size: 12px; color: var(--danger); }

      .gg-chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
      .gg-chip-pick {
        border: 1.5px solid var(--border); background: var(--surface); color: var(--ink-soft);
        font-size: 13px; font-weight: 600; padding: 6px 13px; border-radius: 999px;
      }
      .gg-chip-pick.active { border-color: transparent; color: #fff; background: var(--accent-strong); }
      .gg-chip-pick.gg-tag--blue.active { background: var(--tag-blue-fg); }
      .gg-chip-pick.gg-tag--sage.active { background: var(--tag-sage-fg); }
      .gg-chip-pick.gg-tag--gold.active { background: var(--tag-gold-fg); }
      .gg-chip-pick.gg-tag--coral.active { background: var(--tag-coral-fg); }

      .gg-switch {
        width: 44px; height: 26px; border-radius: 999px; border: none; background: var(--border);
        position: relative; flex-shrink: 0; transition: background 0.2s ease;
      }
      .gg-switch.on { background: var(--sage); }
      .gg-switch-knob {
        position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%;
        background: #fff; transition: transform 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.25);
      }
      .gg-switch.on .gg-switch-knob { transform: translateX(18px); }

      .gg-primary-btn {
        background: linear-gradient(145deg, var(--accent-strong), var(--coral));
        color: #fff; border: none; border-radius: var(--radius-sm);
        font-size: 15px; font-weight: 700; padding: 13px; width: 100%;
        box-shadow: 0 4px 12px var(--shadow);
      }
      .gg-primary-btn:disabled { opacity: 0.45; box-shadow: none; }
      .gg-primary-btn--compact { width: auto; padding: 10px 18px; font-size: 13.5px; }
      .gg-primary-btn.danger { background: var(--danger); }

      .gg-ghost-btn {
        background: transparent; border: 1.5px solid var(--border); color: var(--ink-soft);
        border-radius: var(--radius-sm); padding: 10px 18px; font-size: 13.5px; font-weight: 600;
      }

      .gg-settings-list { display: flex; flex-direction: column; gap: 8px; }
      .gg-settings-row {
        display: flex; align-items: center; justify-content: space-between; width: 100%;
        background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md);
        padding: 14px 16px; font-size: 14.5px; font-weight: 600; color: var(--ink);
      }
      .gg-settings-row--static { cursor: default; }
      .gg-settings-row.danger { color: var(--danger); }
      .gg-settings-row-right { display: flex; align-items: center; gap: 4px; color: var(--ink-faint); font-weight: 500; font-size: 13px; }

      .gg-theme-toggle { display: flex; background: var(--surface-tint); border-radius: 999px; padding: 3px; gap: 2px; }
      .gg-theme-toggle button {
        border: none; background: transparent; padding: 6px 12px; border-radius: 999px;
        font-size: 12.5px; font-weight: 700; color: var(--ink-faint); display: flex; align-items: center; gap: 5px;
      }
      .gg-theme-toggle button.active { background: var(--surface); color: var(--ink); box-shadow: 0 1px 4px var(--shadow); }

      .gg-tag-manage-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
      .gg-tag-manage-row {
        display: flex; align-items: center; justify-content: space-between;
        background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm);
        padding: 10px 12px;
      }
      .gg-tag-manage-name { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; }
      .gg-tag-manage-actions { display: flex; gap: 2px; }
      .gg-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
      .gg-dot.gg-tag--blue { background: var(--tag-blue-fg); }
      .gg-dot.gg-tag--sage { background: var(--tag-sage-fg); }
      .gg-dot.gg-tag--gold { background: var(--tag-gold-fg); }
      .gg-dot.gg-tag--coral { background: var(--tag-coral-fg); }

      .gg-add-tag-row { display: flex; gap: 8px; }
      .gg-add-tag-row .gg-input { flex: 1; }

      .gg-about { text-align: center; padding: 8px 6px 14px; }
      .gg-about h3 { font-family: 'Nunito', sans-serif; font-size: 20px; font-weight: 800; margin: 10px 0 2px; }
      .gg-about-tagline { font-size: 13.5px; color: var(--ink-soft); margin: 0 0 14px; }
      .gg-about-body { font-size: 13.5px; color: var(--ink-soft); line-height: 1.7; margin: 0 0 16px; text-align: left; }
      .gg-about-version { font-size: 12px; color: var(--ink-faint); margin: 0; }

      .gg-confirm {
        width: 90%; max-width: 340px; background: var(--surface); border-radius: var(--radius-md);
        padding: 20px; box-shadow: 0 12px 30px var(--shadow);
      }
      .gg-confirm p { font-size: 14px; color: var(--ink); line-height: 1.6; margin: 0 0 16px; }
      .gg-confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }
    `}</style>
  );
}
