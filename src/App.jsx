import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

import { DEFAULT_TAGS, MAX_TAGS, STORAGE_KEYS } from "./constants/defaults";
import { todayKey, dateKey } from "./utils/date";
import { load, save } from "./utils/storage";

import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import TodoPage from "./components/TodoPage";
import DonePage from "./components/DonePage";
import TaskModal from "./components/TaskModal";
import DoneDetailModal from "./components/DoneDetailModal";
import SettingsSheet from "./components/SettingsSheet";
import ConfirmDialog from "./components/ConfirmDialog";

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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

export default function App() {
  const [tasks, setTasks] = useState(() =>
    normalizeTasks(load(STORAGE_KEYS.tasks, []))
  );

  const [tags, setTags] = useState(() => {
    const saved = load(STORAGE_KEYS.tags, DEFAULT_TAGS);
    return saved.map((tag) => ({ id: tag.id, name: tag.name }));
  });

  const [theme, setTheme] = useState(() => {
    return load(STORAGE_KEYS.settings, { theme: "light" }).theme || "light";
  });

  const [tab, setTab] = useState("todo");
  const [taskModal, setTaskModal] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    save(STORAGE_KEYS.tasks, tasks);
  }, [tasks]);

  useEffect(() => {
    save(STORAGE_KEYS.tags, tags);
  }, [tags]);

  useEffect(() => {
    save(STORAGE_KEYS.settings, { theme });
  }, [theme]);

  const tagMap = useMemo(() => {
    return Object.fromEntries(tags.map((tag) => [tag.id, tag]));
  }, [tags]);

  const todoTasks = useMemo(() => {
    return tasks
      .filter((task) => !task.isCompleted)
      .sort((a, b) => {
        const aChecked = isCheckedToday(a) ? 1 : 0;
        const bChecked = isCheckedToday(b) ? 1 : 0;

        if (aChecked !== bChecked) return aChecked - bChecked;

        const order = { red: 0, orange: 1, yellow: 2, green: 3 };
        return order[getUrgencyLevel(a)] - order[getUrgencyLevel(b)];
      });
  }, [tasks]);

  const doneTasks = useMemo(() => {
    return tasks
      .filter((task) => task.isCompleted)
      .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));
  }, [tasks]);

  function getUrgencyLevel(task) {
    if (!task.dueDate) return "green";

    const due = new Date(`${task.dueDate}T${task.dueTime || "23:59"}`);
    const now = new Date();
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / 86400000);

    if (diffMs < 0) return "red";
    if (diffDays <= 0) return "red";
    if (diffDays <= 3) return "orange";
    if (diffDays <= 7) return "yellow";
    return "green";
  }

  function upsertTask(data) {
    const now = new Date().toISOString();

    if (data.id) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === data.id
            ? {
                ...task,
                ...data,
                dueTime: data.dueDate ? data.dueTime : "",
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
          dueTime: data.dueDate ? data.dueTime || "" : "",
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
    const now = new Date().toISOString();
    const checked = isCheckedToday(task);

    setTasks((prev) =>
      prev.map((item) =>
        item.id === task.id
          ? {
              ...item,
              checkedAt: checked ? null : now,
              updatedAt: now,
            }
          : item
      )
    );
  }

  function restoreTask(task) {
    const now = new Date().toISOString();

    setTasks((prev) =>
      prev.map((item) =>
        item.id === task.id
          ? {
              ...item,
              isCompleted: false,
              checkedAt: null,
              completedAt: null,
              updatedAt: now,
            }
          : item
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
        setTasks((prev) => prev.filter((item) => item.id !== task.id));
        setDetailTask(null);
        setConfirm(null);
      },
    });
  }

  function addTag(name) {
    const clean = name.trim();
    if (!clean) return false;
    if (tags.length >= MAX_TAGS) return false;
    if (tags.some((tag) => tag.name === clean)) return false;

    setTags((prev) => [...prev, { id: uid(), name: clean }]);
    return true;
  }

  function logoutPlaceholder() {
    setToast("目前是本機版本，尚未啟用登入");
    setTimeout(() => setToast(""), 1800);
  }

  return (
    <div className={`app theme-${theme}`}>
      <Header onOpenSettings={() => setSettingsOpen(true)} />

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
        <button
          className="fab"
          onClick={() => setTaskModal({ mode: "add", task: null })}
          aria-label="新增事項"
        >
          +
        </button>
      )}

      <BottomNav activeTab={tab} onChangeTab={setTab} />

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
        <SettingsSheet
          theme={theme}
          setTheme={setTheme}
          tags={tags}
          setTags={setTags}
          onAddTag={addTag}
          onLogout={logoutPlaceholder}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
