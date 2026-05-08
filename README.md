# Pitang Challenge

Sistema de gerenciamento de reembolsos com autenticação JWT, controle de permissões por perfil (EMPLOYEE, MANAGER, FINANCE, ADMIN) e upload de anexos.

## Stack

- **Runtime:** [Bun](https://bun.sh) 1.3+
- **Backend:** Express 5 + Prisma + PostgreSQL + Redis
- **Frontend:** React 19 + TanStack Router + SWR + Vite
- **Testes:** Bun Test (backend) + Vitest (frontend)

## Pré-requisitos

- **Bun** — [Instalar](https://bun.sh/docs/installation)
- **PostgreSQL** — running (ex: via Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=123456 postgres`)
- **Redis** — running (ex: via Docker: `docker run -d -p 6379:6379 redis`)

## Setup

```bash
# Clonar o repositório
git clone <url>
cd pitang-challenge

# Instalar dependências (monorepo)
bun install
```

## Backend

```bash
cd packages/pitang-backend

# Configurar variáveis de ambiente
cp .env.example .env

# Criar diretórios necessários
mkdir -p logs uploads
```

Edite `.env` com suas credenciais:

```env
DATABASE_URL=postgres://postgres:123456@localhost:5432/pitang
JWT_SECRET=sua_chave_secreta_aqui
HTTP_PORT=3333
REDIS_URL=redis://localhost:6379
```

```bash
# Gerar Prisma Client
bun run prisma:generate

# Sincronizar schema com o banco (cria as tabelas)
bunx prisma db push

# Popular com dados de exemplo
bun run prisma:seed

# Iniciar servidor de desenvolvimento
bun run dev
```

Backend disponível em `http://localhost:3333`.

### Usuários do seed

| Nome | Email | Senha | Perfil |
|------|-------|-------|--------|
| Admin User | admin@pitang.com | 123456 | ADMIN |
| Manager User | manager@pitang.com | 123456 | MANAGER |
| Finance User | finance@pitang.com | 123456 | FINANCE |
| Employee User | employee@pitang.com | 123456 | EMPLOYEE |

### Rotas principais

| Método | Rota                              | Descrição           | Permissão                                |
| ------ | --------------------------------- | ------------------- | ---------------------------------------- |
| POST   | `/auth/login`                     | Login               | Pública                                  |
| POST   | `/users`                          | Registrar           | Pública                                  |
| GET    | `/auth/me`                        | Usuário logado      | Autenticado                              |
| GET    | `/users`                          | Listar usuários     | ADMIN                                    |
| GET    | `/users/:id`                      | Detalhes do usuário | ADMIN                                    |
| PATCH  | `/users/:id`                      | Editar usuário      | Dono ou ADMIN                            |
| DELETE | `/users/:id`                      | Deletar usuário     | Dono ou ADMIN                            |
| GET    | `/categories`                     | Listar categorias   | Autenticado                              |
| POST   | `/categories`                     | Criar categoria     | ADMIN                                    |
| PATCH  | `/categories/:id`                 | Editar categoria    | ADMIN                                    |
| DELETE | `/categories/:id`                 | Deletar categoria   | ADMIN                                    |
| GET    | `/reimbursements`                 | Listar requests     | Autenticado (EMPLOYEE vê só as próprias) |
| GET    | `/reimbursements/:id`             | Detalhes da request | Dono, MANAGER, FINANCE, ADMIN            |
| POST   | `/reimbursements`                 | Criar request       | EMPLOYEE                                 |
| PUT    | `/reimbursements/:id`             | Editar request      | Dono ou ADMIN                            |
| POST   | `/reimbursements/:id/submit`      | Submeter request    | Dono                                     |
| POST   | `/reimbursements/:id/cancel`      | Cancelar request    | Dono                                     |
| POST   | `/reimbursements/:id/approve`     | Aprovar             | MANAGER, ADMIN                           |
| POST   | `/reimbursements/:id/reject`      | Rejeitar            | MANAGER, ADMIN                           |
| POST   | `/reimbursements/:id/pay`         | Pagar               | FINANCE, ADMIN                           |
| GET    | `/reimbursements/:id/history`     | Histórico           | Dono, MANAGER, FINANCE, ADMIN            |
| GET    | `/reimbursements/:id/attachments` | Anexos              | Dono, MANAGER, FINANCE, ADMIN            |
| POST   | `/reimbursements/:id/attachments` | Upload anexo        | Dono (DRAFT)                             |
| DELETE | `/reimbursements/attachments/:id` | Deletar anexo       | Dono ou ADMIN (DRAFT)                    |

### Testes

```bash
# Resetar banco de testes
bun run test:pretest

# Rodar testes
bun test
```

## Frontend

```bash
cd packages/pitang-frontend

# Iniciar servidor de desenvolvimento
bun run dev
```

Frontend disponível em `http://localhost:3000`.

### Testes

```bash
bun test
```

## Comandos úteis

```bash
# Rodar backend e frontend simultaneamente (da raiz)
bun run dev

# Backend - resetar banco + seed
bun run prisma:reset

# Backend - Prisma Studio (visualizar dados)
bun run prisma:studio

# Backend - compilar TypeScript
bun run compile

```
