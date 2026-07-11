import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

import { DEFAULT_TAGS, LEGACY_STORAGE_KEYS, MAX_TAGS, STORAGE_KEYS } from "./constants/defaults";
import { todayKey, dateKey } from "./utils/date";
import { downloadCSV, downloadJSON, exportRolloData, loadWithLegacy, save, tasksToCSV } from "./utils/storage";
import { supabase, supabaseReady } from "./utils/supabaseClient";
import {
  deleteCloudTag,
  deleteCloudTask,
  fetchCloudTags,
  fetchCloudTasks,
  insertCloudTag,
  insertCloudTask,
  migrateLocalDataToCloud,
  renameCloudTag,
  updateCloudTask,
} from "./utils/cloudData";

import Header from "./components/Header";
import TopSwitch from "./components/TopSwitch";
import TagFilter from "./components/TagFilter";
import TodoPage from "./components/TodoPage";
import DonePage from "./components/DonePage";
import TaskModal from "./components/TaskModal";
import DoneDetailModal from "./components/DoneDetailModal";
import SettingsSheet from "./components/SettingsSheet";
import LoginSheet from "./components/LoginSheet";
import ConfirmDialog from "./components/ConfirmDialog";
import Rollo from "./components/Rollo";

const POST_LOGIN_KEY = "rollo:post-login";

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

function accountFromSession(session) {
  if (!session?.user) return null;

  const user = session.user;
  const meta = user.user_metadata || {};

  return {
    id: user.id,
    name: meta.full_name || meta.name || user.email || "",
    email: user.email || "",
    picture: meta.avatar_url || meta.picture || "",
  };
}

export default function App() {
  const [tasks, setTasks] = useState(() =>
    normalizeTasks(loadWithLegacy(STORAGE_KEYS.tasks, LEGACY_STORAGE_KEYS.tasks, []))
  );

  const [tags, setTags] = useState(() => {
    const saved = loadWithLegacy(STORAGE_KEYS.tags, LEGACY_STORAGE_KEYS.tags, DEFAULT_TAGS);
    return saved.map((tag) => ({ id: tag.id, name: tag.name }));
  });

  const [theme, setTheme] = useState(() => {
    return loadWithLegacy(STORAGE_KEYS.settings, LEGACY_STORAGE_KEYS.settings, { theme: "light" }).theme || "light";
  });

  const [account, setAccount] = useState(null);
  const [authLoading, setAuthLoading] = useState(supabaseReady);
  const [cloudLoading, setCloudLoading] = useState(false);

  const [tab, setTab] = useState("todo");
  const [filterTagId, setFilterTagId] = useState(null);
  const [taskModal, setTaskModal] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState("");

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 1800);
  }

  // --- auth: keep `account` in sync with the Supabase session ---
  useEffect(() => {
    if (!supabaseReady) return;

    supabase.auth.getSession().then(({ data }) => {
      setAccount(accountFromSession(data.session));
      setAuthLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccount((prev) => {
        const next = accountFromSession(session);
        if (prev && next && prev.id === next.id) return prev;
        return next;
      });
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // --- cloud sync: on login, load (and if needed migrate) this device's
  // local data into the cloud; the cloud copy becomes the source of truth ---
  useEffect(() => {
    if (!account) return;

    let cancelled = false;

    (async () => {
      setCloudLoading(true);

      try {
        let cloudTags = await fetchCloudTags();
        let cloudTasks = await fetchCloudTasks();

        if (cloudTags.length === 0 && cloudTasks.length === 0 && (tags.length || tasks.length)) {
          await migrateLocalDataToCloud(tags, tasks);
          cloudTags = await fetchCloudTags();
          cloudTasks = await fetchCloudTasks();
        }

        if (!cancelled) {
          setTags(cloudTags.length ? cloudTags : DEFAULT_TAGS);
          setTasks(normalizeTasks(cloudTasks));
        }
      } catch (err) {
        if (!cancelled) showToast("雲端資料讀取失敗，請檢查網路連線");
      } finally {
        if (!cancelled) setCloudLoading(false);
      }

      if (sessionStorage.getItem(POST_LOGIN_KEY)) {
        sessionStorage.removeItem(POST_LOGIN_KEY);
        setSettingsOpen(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id]);

  useEffect(() => {
    if (filterTagId && !tags.some((tag) => tag.id === filterTagId)) {
      setFilterTagId(null);
    }
  }, [tags, filterTagId]);

  useEffect(() => {
    save(STORAGE_KEYS.tasks, tasks);
  }, [tasks]);

  useEffect(() => {
    save(STORAGE_KEYS.tags, tags);
  }, [tags]);

  useEffect(() => {
    save(STORAGE_KEYS.settings, { theme });
    document.body.classList.toggle("theme-dark", theme === "dark");
    document.body.classList.toggle("theme-light", theme === "light");

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#201b14" : "#F7F3E8");
  }, [theme]);

  const tagMap = useMemo(() => {
    return Object.fromEntries(tags.map((tag) => [tag.id, tag]));
  }, [tags]);

  const todoTasks = useMemo(() => {
    return tasks
      .filter((task) => !task.isCompleted)
      .filter((task) => !filterTagId || task.tagId === filterTagId)
      .sort((a, b) => {
        const aChecked = isCheckedToday(a) ? 1 : 0;
        const bChecked = isCheckedToday(b) ? 1 : 0;

        if (aChecked !== bChecked) return aChecked - bChecked;

        const order = { red: 0, orange: 1, yellow: 2, green: 3 };
        return order[getUrgencyLevel(a)] - order[getUrgencyLevel(b)];
      });
  }, [tasks, filterTagId]);

  const doneTasks = useMemo(() => {
    return tasks
      .filter((task) => task.isCompleted)
      .filter((task) => !filterTagId || task.tagId === filterTagId)
      .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));
  }, [tasks, filterTagId]);

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

  async function upsertTask(data) {
    const now = new Date().toISOString();

    if (data.id) {
      const patch = {
        ...data,
        dueTime: data.dueDate ? data.dueTime : "",
        updatedAt: now,
      };

      setTasks((prev) =>
        prev.map((task) => (task.id === data.id ? { ...task, ...patch } : task))
      );

      if (account) {
        updateCloudTask(data.id, patch).catch(() => showToast("雲端同步失敗"));
      }
    } else {
      const localTask = {
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
      };

      if (account) {
        try {
          const created = await insertCloudTask(localTask);
          setTasks((prev) => [...prev, created]);
        } catch {
          showToast("新增失敗，請檢查網路連線");
        }
      } else {
        setTasks((prev) => [...prev, localTask]);
      }
    }

    setTaskModal(null);
  }

  function checkTask(task) {
    const now = new Date().toISOString();
    const checked = isCheckedToday(task);
    const patch = { checkedAt: checked ? null : now, updatedAt: now };

    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? { ...item, ...patch } : item))
    );

    if (account) {
      updateCloudTask(task.id, patch).catch(() => showToast("雲端同步失敗"));
    }
  }

  function uncheckTask(task) {
    const now = new Date().toISOString();
    const patch = { checkedAt: null, updatedAt: now };

    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? { ...item, ...patch } : item))
    );

    if (account) {
      updateCloudTask(task.id, patch).catch(() => showToast("雲端同步失敗"));
    }
  }

  function restoreTask(task) {
    const now = new Date().toISOString();
    const patch = { isCompleted: false, checkedAt: null, completedAt: null, updatedAt: now };

    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? { ...item, ...patch } : item))
    );

    setDetailTask(null);

    if (account) {
      updateCloudTask(task.id, patch).catch(() => showToast("雲端同步失敗"));
    }
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

        if (account) {
          deleteCloudTask(task.id).catch(() => showToast("刪除失敗，請檢查網路連線"));
        }
      },
    });
  }

  async function addTag(name) {
    const clean = name.trim();
    if (!clean) return false;
    if (tags.length >= MAX_TAGS) return false;
    if (tags.some((tag) => tag.name === clean)) return false;

    if (account) {
      try {
        const created = await insertCloudTag(clean);
        setTags((prev) => [...prev, created]);
        return true;
      } catch {
        showToast("新增標籤失敗");
        return false;
      }
    }

    setTags((prev) => [...prev, { id: uid(), name: clean }]);
    return true;
  }

  function renameTag(id, name) {
    setTags((prev) => prev.map((tag) => (tag.id === id ? { ...tag, name } : tag)));

    if (account) {
      renameCloudTag(id, name).catch(() => showToast("標籤更新失敗"));
    }
  }

  function deleteTagHandler(id) {
    setTags((prev) => prev.filter((tag) => tag.id !== id));

    if (account) {
      deleteCloudTag(id).catch(() => showToast("標籤刪除失敗"));
    }
  }

  function exportLocalData() {
    const data = exportRolloData({
      tasks,
      tags,
      settings: { theme },
    });

    downloadJSON(`rollo-backup-${todayKey()}.json`, data);
    showToast("已匯出 JSON 備份");
  }

  function exportCSVData() {
    const csv = tasksToCSV(tasks, tagMap);
    downloadCSV(`rollo-tasks-${todayKey()}.csv`, csv);
    showToast("已匯出 CSV");
  }

  function openSettings() {
    if (account) {
      setSettingsOpen(true);
    } else {
      setAuthOpen(true);
    }
  }

  async function handleLogout() {
    if (supabaseReady) {
      await supabase.auth.signOut();
    } else {
      setAccount(null);
    }

    setSettingsOpen(false);
    showToast("已登出");
  }

  function tagsLockedNotice() {
    showToast("登入後才能使用標籤");
  }

  if (authLoading) {
    return (
      <div className={`app theme-${theme}`}>
        <div className="boot-loading">
          <Rollo size={56} mood="happy" />
        </div>
      </div>
    );
  }

  return (
    <div className={`app theme-${theme}`}>
      <Header onOpenSettings={openSettings} />
      <TopSwitch activeTab={tab} onChangeTab={setTab} />
      <TagFilter
        tags={tags}
        activeId={filterTagId}
        onChange={setFilterTagId}
        locked={!account}
        onLocked={tagsLockedNotice}
      />

      <main className="content">
        {account && cloudLoading ? (
          <div className="boot-loading">
            <Rollo size={48} mood="happy" />
            <p>同步雲端資料中…</p>
          </div>
        ) : tab === "todo" ? (
          <TodoPage
            tasks={todoTasks}
            tagMap={tagMap}
            hasFilter={!!filterTagId}
            onCheck={checkTask}
            onUncheck={uncheckTask}
            onEdit={(task) => setTaskModal({ mode: "edit", task })}
            onDelete={deleteTask}
          />
        ) : (
          <DonePage
            tasks={doneTasks}
            tagMap={tagMap}
            hasFilter={!!filterTagId}
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

      {taskModal && (
        <TaskModal
          mode={taskModal.mode}
          task={taskModal.task}
          tags={tags}
          tagsLocked={!account}
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
          mode="done"
        />
      )}

      {authOpen && <LoginSheet onClose={() => setAuthOpen(false)} />}

      {settingsOpen && (
        <SettingsSheet
          account={account}
          theme={theme}
          setTheme={setTheme}
          tags={tags}
          onAddTag={addTag}
          onRenameTag={renameTag}
          onDeleteTag={deleteTagHandler}
          onLogout={handleLogout}
          onExportJSON={exportLocalData}
          onExportCSV={exportCSVData}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
