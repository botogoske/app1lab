import prisma from "@/lib/prisma";

import type { Task, TaskFormValues } from "@/lib/task-schema";
import { seedTasks } from "@/lib/task-seed";

function mapTask(task: {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  createdAt: Date;
}) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status as TaskFormValues["status"],
    dueDate: task.dueDate,
    createdAt: task.createdAt.toISOString(),
  } satisfies Task;
}

let seedPromise: Promise<void> | null = null;

async function ensureSeedData() {
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
  await ensureSeedData();

  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
  });

  return tasks.map((task) => mapTask(task));
}

export async function createTask(values: TaskFormValues) {
  await ensureSeedData();

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
  await ensureSeedData();

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
  await ensureSeedData();

  try {
    await prisma.task.delete({
      where: { id: taskId },
    });

    return true;
  } catch {
    return false;
  }
}
