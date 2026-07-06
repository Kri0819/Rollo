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
