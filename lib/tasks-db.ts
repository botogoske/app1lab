import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import type { Task, TaskFormValues } from "@/lib/task-schema";
import { seedTasks } from "@/lib/task-seed";

const dataDirectory = path.join(process.cwd(), "data");
const databasePath = path.join(dataDirectory, "tasks.sqlite");

let databaseInstance: Database.Database | null = null;

function getDatabase() {
  if (databaseInstance) {
    return databaseInstance;
  }

  fs.mkdirSync(dataDirectory, { recursive: true });

  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('backlog', 'in-progress', 'done')),
      due_date TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const taskCount = database.prepare("SELECT COUNT(*) as count FROM tasks").get() as { count: number };

  if (taskCount.count === 0) {
    const insertTask = database.prepare(
      "INSERT INTO tasks (id, title, description, status, due_date, created_at, updated_at) VALUES (@id, @title, @description, @status, @dueDate, @createdAt, @updatedAt)",
    );
    const seedTransaction = database.transaction((tasks: Task[]) => {
      for (const task of tasks) {
        insertTask.run({
          id: task.id,
          title: task.title,
          description: task.description ?? "",
          status: task.status,
          dueDate: task.dueDate ?? "",
          createdAt: task.createdAt,
          updatedAt: task.createdAt,
        });
      }
    });

    seedTransaction(seedTasks);
  }

  databaseInstance = database;
  return databaseInstance;
}

function mapRowToTask(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? "",
    status: row.status as TaskFormValues["status"],
    dueDate: (row.due_date as string) ?? "",
    createdAt: row.created_at as string,
  } satisfies Task;
}

export function listTasks() {
  const database = getDatabase();
  const rows = database.prepare("SELECT id, title, description, status, due_date, created_at FROM tasks ORDER BY created_at DESC").all();

  return rows.map((row) => mapRowToTask(row as Record<string, unknown>));
}

export function createTask(values: TaskFormValues) {
  const database = getDatabase();
  const now = new Date().toISOString();
  const task: Task = {
    id: globalThis.crypto.randomUUID(),
    title: values.title,
    description: values.description ?? "",
    status: values.status,
    dueDate: values.dueDate ?? "",
    createdAt: now,
  };

  database
    .prepare("INSERT INTO tasks (id, title, description, status, due_date, created_at, updated_at) VALUES (@id, @title, @description, @status, @dueDate, @createdAt, @updatedAt)")
    .run({
      ...task,
      updatedAt: now,
    });

  return task;
}

export function updateTask(taskId: string, values: TaskFormValues) {
  const database = getDatabase();
  const now = new Date().toISOString();

  const result = database
    .prepare(
      "UPDATE tasks SET title = @title, description = @description, status = @status, due_date = @dueDate, updated_at = @updatedAt WHERE id = @id",
    )
    .run({
      id: taskId,
      title: values.title,
      description: values.description ?? "",
      status: values.status,
      dueDate: values.dueDate ?? "",
      updatedAt: now,
    });

  if (result.changes === 0) {
    return null;
  }

  const row = database
    .prepare("SELECT id, title, description, status, due_date, created_at FROM tasks WHERE id = ?")
    .get(taskId);

  return row ? mapRowToTask(row as Record<string, unknown>) : null;
}

export function deleteTask(taskId: string) {
  const database = getDatabase();
  const result = database.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
  return result.changes > 0;
}
