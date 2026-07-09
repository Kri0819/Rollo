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
