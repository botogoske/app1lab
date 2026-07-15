import { NextResponse } from "next/server";

import { createTask, listTasks } from "@/lib/tasks-db";
import { taskSchema } from "@/lib/task-schema";

export const runtime = "nodejs";

export async function GET() {
  const tasks = await listTasks();
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = taskSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dados inválidos.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const task = await createTask(parsed.data);
  return NextResponse.json({ task }, { status: 201 });
}
