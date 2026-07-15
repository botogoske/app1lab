# Agendador de Tarefas

Agendador de Tarefas é um aplicativo simples para gerenciar e organizar suas tarefas diárias. Com ele, você pode adicionar, editar e remover tarefas, além de definir prazos e prioridades.

## Banco de dados

O projeto usa Prisma com PostgreSQL. Configure a variável `DATABASE_URL` com a connection string do Prisma Postgres na Vercel antes de fazer o deploy.

No Vercel, conecte a integração do Prisma Postgres ao projeto e confirme que `DATABASE_URL` está disponível no ambiente de produção. O build executa `prisma migrate deploy` automaticamente quando essa variável existe.

Se `DATABASE_URL` não estiver configurado no ambiente local, o app grava os dados em `data/tasks.json` para manter a persistência durante o desenvolvimento.

# Tecnologias

O projeto foi desenvolvido com as seguintes tecnologias:

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [React](https://reactjs.org/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [React Query](https://tanstack.com/query/v4)
- [React Icons](https://react-icons.github.io/react-icons/)

