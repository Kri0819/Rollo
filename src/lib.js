import { createClient } from "@supabase/supabase-js";

/* ============================== constants ============================== */

export const STORAGE_KEYS = {
  tasks: "rollo:tasks",
  tags: "rollo:tags",
  settings: "rollo:settings",
  account: "rollo:account",
};

export const LEGACY_STORAGE_KEYS = {
  tasks: [
    "rollo:tasks:v011",
    "rollo:tasks:v014",
    "rollo:tasks:v015",
    "rollo:tasks:v016",
    "rollo:tasks:v017",
    "rollo:tasks:v018",
    "rollo:tasks:v019",
  ],
  tags: [
    "rollo:tags:v011",
    "rollo:tags:v014",
    "rollo:tags:v015",
    "rollo:tags:v016",
    "rollo:tags:v017",
    "rollo:tags:v018",
    "rollo:tags:v019",
  ],
  settings: [
    "rollo:settings:v011",
    "rollo:settings:v014",
    "rollo:settings:v015",
    "rollo:settings:v016",
    "rollo:settings:v017",
    "rollo:settings:v018",
    "rollo:settings:v019",
  ],
};

export const DEFAULT_TAGS = [
  { id: "work", name: "工作" },
  { id: "life", name: "生活" },
  { id: "important", name: "重要" },
  { id: "waiting", name: "等待中" },
];

export const MAX_TAGS = 5;

// Bump this on every release - it's the single source of truth,
// shown in Settings › 關於 and the Settings footer.
export const APP_VERSION = "0.1.29";

/* ================================ dates ================================= */

export function todayKey() {
  return dateKey(new Date());
}

export function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDate(dateString) {
  if (!dateString) return "--";

  const [, month, day] = dateString.split("-").map(Number);
  return `${month}/${day}`;
}

export function formatTime(timeString) {
  return timeString || "--";
}

export function formatDateTime(isoString) {
  if (!isoString) return { date: "--", time: "--" };

  const d = new Date(isoString);

  return {
    date: `${d.getMonth() + 1}/${d.getDate()}`,
    time: `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`,
  };
}

export function getUrgency(task) {
  if (!task.dueDate) return { level: "green", text: "" };

  const due = new Date(`${task.dueDate}T${task.dueTime || "23:59"}`);
  const now = new Date();
  const diffMs = due - now;
  const diffDays = Math.ceil(diffMs / 86400000);

  if (diffMs < 0) return { level: "red", text: "已逾期" };
  if (diffDays <= 0) return { level: "red", text: "今日截止" };
  if (diffDays <= 3) return { level: "orange", text: `還有 ${diffDays} 天` };
  if (diffDays <= 7) return { level: "yellow", text: "" };

  return { level: "green", text: "" };
}

export function isCheckedToday(task) {
  if (!task.checkedAt) return false;
  return dateKey(new Date(task.checkedAt)) === todayKey();
}

/* ============================ local storage ============================= */

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function loadWithLegacy(key, legacyKeys = [], fallback) {
  const current = load(key, null);
  if (current !== null) return current;

  for (const legacyKey of legacyKeys) {
    const legacyValue = load(legacyKey, null);
    if (legacyValue !== null) {
      save(key, legacyValue);
      return legacyValue;
    }
  }

  return fallback;
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("localStorage save failed", error);
  }
}

export function exportRolloData({ tasks, tags, settings }) {
  return {
    app: "Rollo",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    tasks,
    tags,
    settings,
  };
}

export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export function tasksToCSV(tasks, tagMap) {
  const header = [
    "title",
    "tag",
    "dueDate",
    "dueTime",
    "note",
    "isCompleted",
    "completedAt",
    "createdAt",
  ];

  const rows = tasks.map((task) => [
    task.title || "",
    tagMap[task.tagId]?.name || "",
    task.dueDate || "",
    task.dueTime || "",
    (task.note || "").replace(/\r?\n/g, " "),
    task.isCompleted ? "1" : "0",
    task.completedAt || "",
    task.createdAt || "",
  ]);

  const escape = (value) => `"${String(value).replace(/"/g, '""')}"`;

  return [header, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
}

export function downloadCSV(filename, csvString) {
  // UTF-8 BOM so Excel renders Chinese characters correctly
  const blob = new Blob(["\uFEFF" + csvString], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/* ================================ tags =================================== */

const TAG_PALETTE = ["blue", "sage", "gold", "coral"];

// Deterministic: same tagId always maps to the same color, without needing
// to store a color field on the tag or know its position in the list.
export function tagColorKey(tagId) {
  if (!tagId) return "blue";

  let hash = 0;
  for (let i = 0; i < tagId.length; i++) {
    hash = (hash * 31 + tagId.charCodeAt(i)) >>> 0;
  }

  return TAG_PALETTE[hash % TAG_PALETTE.length];
}

/* ============================= supabase client ============================ */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabaseReady = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseReady ? createClient(supabaseUrl, supabaseAnonKey) : null;

/* ========================= cloud data (Supabase CRUD) ===================== */

function fromDbTask(row) {
  return {
    id: row.id,
    title: row.title,
    tagId: row.tag_id || "",
    dueDate: row.due_date || "",
    dueTime: row.due_time || "",
    note: row.note || "",
    checkedAt: row.checked_at,
    isCompleted: row.is_completed,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbTask(task) {
  const row = {};

  if (task.title !== undefined) row.title = task.title;
  if (task.tagId !== undefined) row.tag_id = task.tagId || null;
  if (task.dueDate !== undefined) row.due_date = task.dueDate || null;
  if (task.dueTime !== undefined) row.due_time = task.dueTime || null;
  if (task.note !== undefined) row.note = task.note || null;
  if (task.checkedAt !== undefined) row.checked_at = task.checkedAt || null;
  if (task.isCompleted !== undefined) row.is_completed = !!task.isCompleted;
  if (task.completedAt !== undefined) row.completed_at = task.completedAt || null;
  row.updated_at = new Date().toISOString();

  return row;
}

// Table names are prefixed rollo_ because this Supabase project is shared
// with other apps.
export async function fetchCloudTags() {
  const { data, error } = await supabase
    .from("rollo_tags")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data.map((row) => ({ id: row.id, name: row.name }));
}

export async function fetchCloudTasks() {
  const { data, error } = await supabase
    .from("rollo_tasks")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data.map(fromDbTask);
}

export async function insertCloudTask(task) {
  const { data, error } = await supabase
    .from("rollo_tasks")
    .insert({ ...toDbTask(task), created_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return fromDbTask(data);
}

export async function updateCloudTask(id, patch) {
  const { error } = await supabase.from("rollo_tasks").update(toDbTask(patch)).eq("id", id);
  if (error) throw error;
}

export async function deleteCloudTask(id) {
  const { error } = await supabase.from("rollo_tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function insertCloudTag(name) {
  const { data, error } = await supabase
    .from("rollo_tags")
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return { id: data.id, name: data.name };
}

export async function renameCloudTag(id, name) {
  const { error } = await supabase.from("rollo_tags").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteCloudTag(id) {
  const { error } = await supabase.from("rollo_tags").delete().eq("id", id);
  if (error) throw error;
}

// Runs once, right after someone's very first login, if the cloud account
// has no data yet but this device has local (pre-login) tasks/tags.
export async function migrateLocalDataToCloud(localTags, localTasks) {
  const idMap = {};

  for (const tag of localTags) {
    const created = await insertCloudTag(tag.name);
    idMap[tag.id] = created.id;
  }

  for (const task of localTasks) {
    await insertCloudTask({
      ...task,
      tagId: task.tagId ? idMap[task.tagId] || null : null,
    });
  }
}
