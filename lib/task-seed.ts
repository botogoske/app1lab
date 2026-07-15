import type { Task } from "@/lib/task-schema";

export const seedTasks: Task[] = [
  {
    id: "task-1",
    title: "Planejar sprint da semana",
    description: "Definir prioridades, alinhar bloqueios e revisar o backlog com o time.",
    status: "in-progress",
    dueDate: "2026-07-17",
    createdAt: "2026-07-15T08:00:00.000Z",
  },
  {
    id: "task-2",
    title: "Revisar acessibilidade da página",
    description: "Validar contraste, foco visível e navegação por teclado no formulário.",
    status: "backlog",
    dueDate: "",
    createdAt: "2026-07-14T15:30:00.000Z",
  },
  {
    id: "task-3",
    title: "Publicar versão final",
    description: "Preparar a entrega e comunicar a atualização para o restante do time.",
    status: "done",
    dueDate: "2026-07-18",
    createdAt: "2026-07-13T10:45:00.000Z",
  },
];
