import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(3, "O título precisa ter pelo menos 3 caracteres").max(80, "O título ficou muito longo"),
  description: z.string().max(240, "A descrição precisa ter no máximo 240 caracteres").optional(),
  status: z.enum(["backlog", "in-progress", "done"]),
  dueDate: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

export type Task = TaskFormValues & {
  id: string;
  createdAt: string;
};

export const emptyTaskValues: TaskFormValues = {
  title: "",
  description: "",
  status: "backlog",
  dueDate: "",
};
