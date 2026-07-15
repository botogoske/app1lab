import fs from "node:fs/promises";
import path from "node:path";

import prisma from "@/lib/prisma";

import type { Task, TaskFormValues } from "@/lib/task-schema";
import { seedTasks } from "@/lib/task-seed";

type StoredTask = {
  id: string;
  title: string;
  description: string;
  status: TaskFormValues["status"];
  dueDate: string;
  createdAt: string;
  updatedAt: string;
};

const dataDirectory = path.join(process.cwd(), "data");
const localTasksPath = path.join(dataDirectory, "tasks.json");
const usePrisma = Boolean(process.env.DATABASE_URL);

function mapTask(task: {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  createdAt: string | Date;
}) {
  const createdAt = task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status as TaskFormValues["status"],
    dueDate: task.dueDate,
    createdAt,
  } satisfies Task;
}

function toStoredTask(task: Task, updatedAt = task.createdAt): StoredTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    dueDate: task.dueDate ?? "",
    createdAt: task.createdAt,
    updatedAt,
  };
}

function mapStoredTask(task: StoredTask): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
  };
}

async function readLocalTasks() {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    const fileContents = await fs.readFile(localTasksPath, "utf8");
    const tasks = JSON.parse(fileContents) as StoredTask[];
    return Array.isArray(tasks) ? tasks : [];
  } catch {
    const tasks = seedTasks.map((task) => toStoredTask(task));
    await fs.writeFile(localTasksPath, JSON.stringify(tasks, null, 2), "utf8");
    return tasks;
  }
}

async function writeLocalTasks(tasks: StoredTask[]) {
  await fs.mkdir(dataDirectory, { recursive: true });
  await fs.writeFile(localTasksPath, JSON.stringify(tasks, null, 2), "utf8");
}

let seedPromise: Promise<void> | null = null;

async function ensurePrismaSeedData() {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    const taskCount = await prisma.task.count();

    if (taskCount === 0) {
      await prisma.task.createMany({
        data: seedTasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description ?? "",
          status: task.status,
          dueDate: task.dueDate ?? "",
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.createdAt),
        })),
      });
    }
  })();

  return seedPromise;
}

export async function listTasks() {
  if (!usePrisma) {
    const tasks = await readLocalTasks();
    return tasks
      .map((task) => mapTask(task))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  await ensurePrismaSeedData();

  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
  });

  return tasks.map((task) => mapTask(task));
}

export async function createTask(values: TaskFormValues) {
  if (!usePrisma) {
    const tasks = await readLocalTasks();
    const now = new Date().toISOString();
    const task: Task = {
      id: globalThis.crypto.randomUUID(),
      title: values.title,
      description: values.description ?? "",
      status: values.status,
      dueDate: values.dueDate ?? "",
      createdAt: now,
    };

    tasks.unshift(toStoredTask(task, now));
    await writeLocalTasks(tasks);
    return task;
  }

  await ensurePrismaSeedData();

  const now = new Date();
  const task = await prisma.task.create({
    data: {
      id: globalThis.crypto.randomUUID(),
      title: values.title,
      description: values.description ?? "",
      status: values.status,
      dueDate: values.dueDate ?? "",
      createdAt: now,
    },
  });

  return mapTask(task);
}

export async function updateTask(taskId: string, values: TaskFormValues) {
  if (!usePrisma) {
    const tasks = await readLocalTasks();
    const taskIndex = tasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      return null;
    }

    const existingTask = tasks[taskIndex];
    const updatedTask: StoredTask = {
      ...existingTask,
      title: values.title,
      description: values.description ?? "",
      status: values.status,
      dueDate: values.dueDate ?? "",
      updatedAt: new Date().toISOString(),
    };

    tasks[taskIndex] = updatedTask;
    await writeLocalTasks(tasks);
    return mapStoredTask(updatedTask);
  }

  await ensurePrismaSeedData();

  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: values.title,
        description: values.description ?? "",
        status: values.status,
        dueDate: values.dueDate ?? "",
      },
    });

    return mapTask(task);
  } catch {
    return null;
  }
}

export async function deleteTask(taskId: string) {
  if (!usePrisma) {
    const tasks = await readLocalTasks();
    const nextTasks = tasks.filter((task) => task.id !== taskId);

    if (nextTasks.length === tasks.length) {
      return false;
    }

    await writeLocalTasks(nextTasks);
    return true;
  }

  await ensurePrismaSeedData();

  try {
    await prisma.task.delete({
      where: { id: taskId },
    });

    return true;
  } catch {
    return false;
  }
}
