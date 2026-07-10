import { supabase } from "./supabaseClient";

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

export async function fetchCloudTags() {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data.map((row) => ({ id: row.id, name: row.name }));
}

export async function fetchCloudTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data.map(fromDbTask);
}

export async function insertCloudTask(task) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...toDbTask(task), created_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return fromDbTask(data);
}

export async function updateCloudTask(id, patch) {
  const { error } = await supabase.from("tasks").update(toDbTask(patch)).eq("id", id);
  if (error) throw error;
}

export async function deleteCloudTask(id) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function insertCloudTag(name) {
  const { data, error } = await supabase
    .from("tags")
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return { id: data.id, name: data.name };
}

export async function renameCloudTag(id, name) {
  const { error } = await supabase.from("tags").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteCloudTag(id) {
  const { error } = await supabase.from("tags").delete().eq("id", id);
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
