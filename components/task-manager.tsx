"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarDays, ListTodo, PencilLine, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { emptyTaskValues, taskSchema, type Task, type TaskFormValues } from "@/lib/task-schema";

const statusMeta: Record<TaskFormValues["status"], { label: string; badge: "secondary" | "warning" | "success" }> = {
  backlog: { label: "Backlog", badge: "secondary" },
  "in-progress": { label: "Em andamento", badge: "warning" },
  done: { label: "Concluída", badge: "success" },
};

function formatDate(value?: string) {
  if (!value) {
    return "Sem prazo";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEditing = editingTaskId !== null;

  const currentTask = useMemo(
    () => tasks.find((task) => task.id === editingTaskId) ?? null,
    [editingTaskId, tasks],
  );

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: emptyTaskValues,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const taskTotals = useMemo(
    () => ({
      total: tasks.length,
      active: tasks.filter((task) => task.status !== "done").length,
      completed: tasks.filter((task) => task.status === "done").length,
    }),
    [tasks],
  );

  useEffect(() => {
    async function loadTasks() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch("/api/tasks", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Falha ao carregar as tarefas.");
        }

        const data = (await response.json()) as { tasks: Task[] };
        setTasks(data.tasks);
      } catch {
        setErrorMessage("Não foi possível carregar as tarefas.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadTasks();
  }, []);

  function beginCreateMode() {
    setEditingTaskId(null);
    reset(emptyTaskValues);
  }

  function beginEditMode(task: Task) {
    setEditingTaskId(task.id);
    reset({
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      dueDate: task.dueDate ?? "",
    });
  }

  function removeTask(taskId: string) {
    void (async () => {
      const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });

      if (!response.ok) {
        setErrorMessage("Não foi possível excluir a tarefa.");
        return;
      }

      setTasks((current) => current.filter((task) => task.id !== taskId));

      if (editingTaskId === taskId) {
        beginCreateMode();
      }
    })();
  }

  async function onSubmit(values: TaskFormValues) {
    setErrorMessage(null);

    try {
      if (isEditing && currentTask) {
        const response = await fetch(`/api/tasks/${currentTask.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          throw new Error("Falha ao atualizar a tarefa.");
        }

        const data = (await response.json()) as { task: Task };
        setTasks((current) => current.map((task) => (task.id === data.task.id ? data.task : task)));
        beginCreateMode();
        return;
      }

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Falha ao criar a tarefa.");
      }

      const data = (await response.json()) as { task: Task };
      setTasks((current) => [data.task, ...current]);
      beginCreateMode();
    } catch {
      setErrorMessage(isEditing ? "Não foi possível salvar a tarefa." : "Não foi possível criar a tarefa.");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-sky-100 via-white to-transparent" />
      <div className="absolute left-[-8rem] top-24 -z-10 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="absolute right-[-7rem] top-20 -z-10 h-80 w-80 rounded-full bg-slate-900/5 blur-3xl" />

      <div className="container py-10 sm:py-14 lg:py-16">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <Badge variant="outline" className="gap-2 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-slate-500">
              <Sparkles className="h-3.5 w-3.5" />
              Organização de tarefas
            </Badge>
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Lista de tarefas
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Use o formulário para adicionar novas tarefas, ajuste detalhes quando necessário e acompanhe o andamento de tudo em um painel único.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
            <Card className="border-slate-200/80 bg-white/85">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-2xl bg-slate-900 p-3 text-white">
                  <ListTodo className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total</p>
                  <p className="text-2xl font-semibold text-slate-950">{taskTotals.total}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 bg-white/85">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-2xl bg-amber-100 p-3 text-amber-800">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Abertas</p>
                  <p className="text-2xl font-semibold text-slate-950">{taskTotals.active}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 bg-white/85">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <PencilLine className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Concluídas</p>
                  <p className="text-2xl font-semibold text-slate-950">{taskTotals.completed}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-4">
            {isLoading ? (
              <Card className="border-slate-200/80 bg-white/90">
                <CardContent className="p-6 text-sm text-slate-500">Carregando tarefas...</CardContent>
              </Card>
            ) : tasks.length === 0 ? (
              <Card className="border-dashed border-slate-300 bg-white/80">
                <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="rounded-full bg-slate-100 p-4 text-slate-500">
                    <ListTodo className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-slate-950">Nenhuma tarefa cadastrada</h2>
                    <p className="max-w-md text-sm leading-6 text-slate-500">
                      Crie a primeira tarefa usando o formulário ao lado para começar a organizar o fluxo de trabalho.
                    </p>
                  </div>
                  <Button onClick={beginCreateMode} variant="outline">
                    <Plus className="h-4 w-4" />
                    Nova tarefa
                  </Button>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task) => {
                const meta = statusMeta[task.status];

                return (
                  <Card key={task.id} className="group border-slate-200/80 bg-white/90 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl">
                    <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={meta.badge}>{meta.label}</Badge>
                            {task.dueDate ? <Badge variant="outline">Prazo: {formatDate(task.dueDate)}</Badge> : <Badge variant="outline">Sem prazo definido</Badge>}
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xl font-semibold text-slate-950">{task.title}</h3>
                            <p className="max-w-2xl text-sm leading-6 text-slate-600">{task.description || "Sem descrição adicional."}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 self-start sm:self-auto">
                          <Button variant="outline" size="sm" onClick={() => beginEditMode(task)}>
                            <PencilLine className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => removeTask(task.id)}>
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
                        <span>Criada em {formatDate(task.createdAt.slice(0, 10))}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">ID {task.id}</span>
                      </div>
                    </CardContent>
                  </Card>
                );

                {errorMessage ? (
                  <Card className="border-rose-200 bg-rose-50/80">
                    <CardContent className="p-4 text-sm text-rose-700">{errorMessage}</CardContent>
                  </Card>
                ) : null}
              })
            )}
          </section>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Card className="border-slate-200/80 bg-white/95 shadow-glow">
              <CardHeader className="space-y-2 border-b border-slate-100 bg-slate-50/80">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-slate-950">
                    {isEditing ? <PencilLine className="h-5 w-5 text-slate-600" /> : <Plus className="h-5 w-5 text-slate-600" />}
                    {isEditing ? "Editar tarefa" : "Criar tarefa"}
                  </CardTitle>
                  {isEditing ? (
                    <Button variant="ghost" size="sm" onClick={beginCreateMode}>
                      <ArrowLeft className="h-4 w-4" />
                      Cancelar
                    </Button>
                  ) : null}
                </div>
                <CardDescription>
                  {isEditing
                    ? "Atualize os dados e salve para refletir as mudanças na lista."
                    : "Preencha os campos abaixo para adicionar uma nova tarefa."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 p-6">
                <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input id="title" placeholder="Ex.: revisar relatório trimestral" {...register("title")} />
                    {errors.title ? <p className="text-sm text-rose-600">{errors.title.message}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" placeholder="Explique rapidamente o que precisa ser feito" {...register("description")} />
                    {errors.description ? <p className="text-sm text-rose-600">{errors.description.message}</p> : <p className="text-xs text-slate-500">Opcional. Ajuda a contextualizar a tarefa.</p>}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...register("status")}
                      >
                        <option value="backlog">Backlog</option>
                        <option value="in-progress">Em andamento</option>
                        <option value="done">Concluída</option>
                      </select>
                      {errors.status ? <p className="text-sm text-rose-600">{errors.status.message}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Prazo</Label>
                      <Input id="dueDate" type="date" {...register("dueDate")} />
                      {errors.dueDate ? <p className="text-sm text-rose-600">{errors.dueDate.message}</p> : <p className="text-xs text-slate-500">Opcional. Use para destacar entregas importantes.</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-2">
                    <Button type="submit" className="min-w-36" disabled={isSubmitting}>
                      {isEditing ? <PencilLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {isEditing ? "Salvar alterações" : "Criar tarefa"}
                    </Button>

                    <Button type="button" variant="outline" onClick={beginCreateMode}>
                      Limpar formulário
                    </Button>
                  </div>
                </form>

                {isEditing && currentTask ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Editando</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{currentTask.title}</p>
                    <p className="mt-1 text-xs text-slate-500">As mudanças são aplicadas na lista ao salvar.</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}