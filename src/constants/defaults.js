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
