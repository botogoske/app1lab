import { NextResponse } from "next/server";

import { deleteTask, updateTask } from "@/lib/tasks-db";
import { taskSchema } from "@/lib/task-schema";

export const runtime = "nodejs";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const payload = await request.json();
  const parsed = taskSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dados inválidos.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const task = await updateTask(params.id, parsed.data);

  if (!task) {
    return NextResponse.json({ message: "Tarefa não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ task });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const removed = await deleteTask(params.id);

  if (!removed) {
    return NextResponse.json({ message: "Tarefa não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
