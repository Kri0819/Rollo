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
