# API Agendamentos

API REST para gerenciamento de agendamentos de serviços, com cadastro de **clientes**, **profissionais**, **serviços** e **agendamentos**.

## Tecnologias

- [Node.js](https://nodejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- [Express 5](https://expressjs.com/)
- [Prisma ORM 7](https://www.prisma.io/) com o adapter `@prisma/adapter-mariadb`
- [MySQL 8.4](https://www.mysql.com/) (via Docker)
- [tsx](https://tsx.is/) para rodar o TypeScript em desenvolvimento

## Estrutura do projeto

```
api-agendamentos/
├── app.ts                    # Instância do Express e definição das rotas
├── docker-compose.yml        # Container do MySQL para desenvolvimento
├── .env.example              # Modelo das variáveis de ambiente
├── prisma.config.ts          # Configuração do Prisma (lê DATABASE_URL)
├── prisma/
│   └── schema.prisma         # Modelos do banco de dados
└── src/
    ├── server.ts             # Sobe o servidor na porta 3005
    ├── lib/
    │   └── prisma.ts         # Instância do PrismaClient (usa DB_* do .env)
    ├── generated/prisma/     # Cliente Prisma gerado (ignorado pelo git)
    └── Controllers/
        ├── ClienteController.ts
        ├── ProfissionalController.ts
        ├── ServicoController.ts
        └── AgendaController.ts
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou superior
- [Docker](https://www.docker.com/) e Docker Compose

## Como rodar em desenvolvimento

### 1. Instalar as dependências

```bash
npm install
```

### 2. Criar o arquivo `.env`

Copie o `.env.example` para `.env`:

```bash
# Linux / macOS / Git Bash
cp .env.example .env
```

```powershell
# Windows (PowerShell)
Copy-Item .env.example .env
```

Os valores do `.env.example` já batem com as credenciais do `docker-compose.yml`, então não é preciso alterar nada para desenvolvimento local.

### 3. Subir o banco de dados

```bash
docker-compose up -d
```

Isso sobe um container MySQL 8.4 (nome `mysql`) na porta `3306`, com o banco `api-agendamentos` já criado. Os dados ficam salvos no volume `mysql_data`.

Aguarde o container ficar saudável antes de seguir (leva alguns segundos):

```bash
docker ps
```

A coluna `STATUS` deve mostrar `(healthy)`.

### 4. Criar as tabelas e gerar o Prisma Client

```bash
npx prisma db push
npx prisma generate
```

- `db push` cria as tabelas no banco a partir do `prisma/schema.prisma`.
- `generate` gera o cliente em `src/generated/prisma`, que é importado pela aplicação.

> Rode esses dois comandos novamente sempre que alterar o `schema.prisma`.

### 5. Iniciar a API

```bash
npm run dev
```

A API fica disponível em **http://localhost:3005**.

### Resumo rápido

```bash
npm install
cp .env.example .env
docker-compose up -d
npx prisma db push
npx prisma generate
npm run dev
```

## Variáveis de ambiente

| Variável       | Uso                                                     | Valor padrão (`.env.example`)                                         |
| -------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL` | Usada pela CLI do Prisma (`db push`, `generate` etc.)   | `mysql://mysql:%40Laura1101@localhost:3306/api-agendamentos`          |
| `DB_HOST`      | Host do banco usado pela aplicação                      | `localhost`                                                           |
| `DB_PORT`      | Porta do banco                                          | `3306`                                                                |
| `DB_USER`      | Usuário do banco                                        | `mysql`                                                               |
| `DB_PASSWORD`  | Senha do banco                                          | `@Laura1101`                                                          |
| `DB_NAME`      | Nome do banco                                           | `api-agendamentos`                                                    |

> Na `DATABASE_URL`, o `@` da senha precisa ser escrito como `%40` (URL encoding). Em `DB_PASSWORD` ele fica normal.

## Scripts disponíveis

| Comando         | Descrição                                           |
| --------------- | --------------------------------------------------- |
| `npm run dev`   | Roda a API em modo desenvolvimento com `tsx`        |
| `npm run build` | Compila o TypeScript com `tsc`                      |
| `npm start`     | Roda a versão compilada (`dist/server.js`)          |

## Modelo de dados

```
Cliente ──┐
          │
Profissional ──┼──< Agenda
          │
Servico ──┘
```

Cada **Agenda** pertence a um cliente, um profissional e um serviço.

| Modelo           | Campos                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| **Cliente**      | `id` (int, auto), `nome`, `email` (único), `telefone`                                                          |
| **Profissional** | `id` (int, auto), `nome`, `email` (único)                                                                      |
| **Servico**      | `id` (int, auto), `nome`, `descricao`, `valor` (string)                                                        |
| **Agenda**       | `id` (int, auto), `data` (DateTime), `status` (padrão `"agendado"`), `valor` (string), `servicoId`, `profissionalId`, `clienteId` |

## Endpoints

URL base: `http://localhost:3005`

### Status

| Método | Rota | Descrição                          |
| ------ | ---- | ---------------------------------- |
| GET    | `/`  | Retorna o nome e a versão da API   |

### Clientes

| Método | Rota           | Descrição                  |
| ------ | -------------- | -------------------------- |
| POST   | `/cliente`     | Cadastra um cliente        |
| GET    | `/cliente`     | Lista todos os clientes    |
| PUT    | `/cliente/:id` | Atualiza um cliente        |
| DELETE | `/cliente/:id` | Remove um cliente          |

```json
{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "telefone": "(11) 99999-9999"
}
```

### Profissionais

| Método | Rota                | Descrição                      |
| ------ | ------------------- | ------------------------------ |
| POST   | `/profissional`     | Cadastra um profissional       |
| GET    | `/profissional`     | Lista todos os profissionais   |
| PUT    | `/profissional/:id` | Atualiza um profissional       |
| DELETE | `/profissional/:id` | Remove um profissional         |

```json
{
  "nome": "João Souza",
  "email": "joao@email.com"
}
```

### Serviços

| Método | Rota           | Descrição                 |
| ------ | -------------- | ------------------------- |
| POST   | `/servico`     | Cadastra um serviço       |
| GET    | `/servico`     | Lista todos os serviços   |
| PUT    | `/servico/:id` | Atualiza um serviço       |
| DELETE | `/servico/:id` | Remove um serviço         |

```json
{
  "nome": "Corte de cabelo",
  "descricao": "Corte masculino tradicional",
  "valor": "50.00"
}
```

### Agendamentos

| Método | Rota               | Descrição                      |
| ------ | ------------------ | ------------------------------ |
| POST   | `/agendamento`     | Cria um agendamento            |
| GET    | `/agendamento`     | Lista todos os agendamentos    |
| PUT    | `/agendamento/:id` | Atualiza um agendamento        |
| DELETE | `/agendamento/:id` | Remove um agendamento          |

```json
{
  "data": "2026-10-15T14:30:00.000Z",
  "status": "agendado",
  "valor": "50.00",
  "servicoId": 1,
  "profissionalId": 1,
  "clienteId": 1
}
```

- `data` deve estar no formato ISO 8601.
- `servicoId`, `profissionalId` e `clienteId` devem ser **números** e existir no banco.
- `status` é opcional na criação (padrão `"agendado"`).

### Observações gerais

- Nas rotas `PUT`, todos os campos são opcionais: só os campos enviados são atualizados.
- Envie o corpo das requisições com o header `Content-Type: application/json`.
- Em caso de erro, a API responde com status `500` e um JSON no formato `{ "message": "..." }`. O detalhe do erro aparece no console do servidor.

## Comandos úteis do Docker

```bash
docker-compose up -d        # sobe o banco em segundo plano
docker-compose ps           # mostra o status do container
docker-compose logs -f      # acompanha os logs do MySQL
docker-compose down         # para e remove o container (os dados continuam no volume)
docker-compose down -v      # para, remove o container E apaga os dados do banco
```

Para abrir uma interface visual do banco:

```bash
npx prisma studio
```
