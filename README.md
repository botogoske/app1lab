# Agendador de Tarefas

Agendador de Tarefas é um aplicativo simples para gerenciar e organizar suas tarefas diárias. Com ele, você pode adicionar, editar e remover tarefas, além de definir prazos e prioridades.

## Banco de dados

O projeto usa Prisma com PostgreSQL. Configure a variável `DATABASE_URL` com a connection string do Prisma Postgres na Vercel antes de fazer o deploy.

No Vercel, conecte a integração do Prisma Postgres ao projeto e confirme que `DATABASE_URL` está disponível no ambiente de produção. O build executa `prisma migrate deploy` automaticamente quando essa variável existe.

Se `DATABASE_URL` não estiver configurado no ambiente local, o app grava os dados em `data/tasks.json` para manter a persistência durante o desenvolvimento.