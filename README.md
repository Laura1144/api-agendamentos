# API Agendamentos

API REST para **agendamento de serviços** (salões, barbearias, clínicas, estúdios etc.). Ela gerencia **clientes**, **profissionais**, **serviços** e os **agendamentos** que ligam os três.

**Problema que resolve:** controlar a agenda manualmente (caderno, planilha, mensagens) leva a horários duplicados, agendamentos em datas que já passaram, valores cobrados errados e perda do histórico. A API centraliza esses dados e aplica as regras automaticamente. Por exemplo, um profissional nunca fica com dois clientes no mesmo horário, e o valor do agendamento sempre vem do serviço escolhido.

**Objetivo:** oferecer uma API REST organizada em camadas, persistente, testada e documentada, que sirva de base para um sistema de agendamento (front-end web, app ou integração com outros sistemas).

> Projeto da Avaliação Final da disciplina **Desenvolvimento Back-End**: continuação e evolução da API iniciada no 1º bimestre.

---

## Integrantes

| Nome |
| ---- |
| Laura Rosa |

---

## Tecnologias utilizadas

| Tecnologia | Uso |
| --- | --- |
| [Node.js](https://nodejs.org/) 20+ | Ambiente de execução |
| [TypeScript](https://www.typescriptlang.org/) | Linguagem (tipagem estática) |
| [Express 5](https://expressjs.com/) | Servidor HTTP e rotas |
| [Prisma ORM 7](https://www.prisma.io/) + `@prisma/adapter-mariadb` | Acesso ao banco e migrations |
| [MySQL 8.4](https://www.mysql.com/) (via Docker) | Banco de dados relacional (alternativa ao Supabase/PostgreSQL autorizada pelo professor) |
| [Vitest](https://vitest.dev/) + `@vitest/coverage-v8` | Testes unitários, de integração e cobertura |
| [Supertest](https://github.com/ladjs/supertest) | Requisições HTTP nos testes de integração |
| [Swagger UI](https://swagger.io/tools/swagger-ui/) (`swagger-ui-express`) + OpenAPI 3 | Documentação interativa |
| [Postman](https://www.postman.com/) | Coleção de requisições para testes manuais |
| [tsx](https://tsx.is/) | Execução do TypeScript em desenvolvimento |
| Git / GitHub | Versionamento |

---

## Entidades e relacionamentos

```
Cliente 1 ───< N Agenda N >─── 1 Profissional
                    │
                    N
                    │
                    1
                 Servico
```

- Um **cliente** pode ter vários agendamentos.
- Um **profissional** pode ter vários agendamentos.
- Um **serviço** pode estar em vários agendamentos.
- Cada **agendamento** pertence a exatamente **um** cliente, **um** profissional e **um** serviço (chaves estrangeiras).

| Entidade | Atributos principais |
| --- | --- |
| **Cliente** | `id` (UUID), `nome`, `email` (único), `telefone` |
| **Profissional** | `id` (UUID), `nome`, `email` (único) |
| **Servico** | `id` (UUID), `nome` (único), `descricao`, `valor` (decimal) |
| **Agenda** (agendamento) | `id` (UUID), `data` (data e hora), `status` (`agendado`, `concluido` ou `cancelado`), `valor` (decimal), `clienteId`, `profissionalId`, `servicoId` |

---

## Regras de negócio

| # | Regra | Onde está | Resposta se falhar |
| --- | --- | --- | --- |
| 1 | Todo id (de rota ou chave estrangeira) precisa ser um UUID válido | `models/Validacao.ts` | 400 |
| 2 | Nome, e-mail e telefone do cliente são obrigatórios. O e-mail precisa ter formato válido e é salvo em minúsculas. O telefone precisa ter 10 ou 11 dígitos com DDD | `models/Pessoa.ts`, `models/Cliente.ts` | 400 |
| 3 | Nome e e-mail do profissional são obrigatórios e o e-mail precisa ter formato válido | `models/Pessoa.ts`, `models/Profissional.ts` | 400 |
| 4 | O e-mail não pode se repetir entre clientes nem entre profissionais (na criação e na atualização) | `ClienteService`, `ProfissionalService` | 409 |
| 5 | O valor do serviço precisa ser um número **maior que zero**. É arredondado para 2 casas | `models/Servico.ts` | 400 |
| 6 | Não pode haver dois serviços com o mesmo nome | `ServicoService` | 409 |
| 7 | O agendamento exige data, cliente, profissional e serviço | `AgendaService.criar` | 400 |
| 8 | A data do agendamento precisa ser válida (ISO 8601) e **estar no futuro** | `models/Agendamento.ts` | 400 |
| 9 | Cliente, profissional e serviço do agendamento precisam existir | `AgendaService` | 404 |
| 10 | O profissional **não pode ter dois agendamentos ativos no mesmo horário** (vale ao criar, remarcar ou trocar de profissional). Horários de agendamentos cancelados ou concluídos ficam livres | `AgendaService`, `AgendaRepository.buscarHorarios` | 409 |
| 11 | O **valor do agendamento é copiado do serviço**. O valor enviado pelo cliente da API é ignorado. Ao trocar o serviço, o valor acompanha o novo serviço | `AgendaService` | — |
| 12 | Todo agendamento começa com status `agendado`, mesmo que outro status seja enviado | `AgendaService.criar` | — |
| 13 | O status só aceita `agendado`, `concluido` ou `cancelado` | `models/Agendamento.ts` | 400 |
| 14 | Agendamento **concluído ou cancelado não pode mais ser alterado** | `AgendaService.atualizar` | 409 |
| 15 | Não é possível excluir cliente, profissional ou serviço que tenha agendamentos (exclua os agendamentos antes) | `ClienteService`, `ProfissionalService`, `ServicoService` | 409 |
| 16 | Na atualização (PUT), só os campos enviados mudam, e é preciso enviar ao menos um | Services | 400 |
| 17 | Mudar o valor de um serviço **não altera** agendamentos já criados, que guardam o valor da época | `ServicoService.atualizar` | — |

> **Limitação conhecida:** a regra 10 compara a data e hora **exatas**. Um agendamento às 14:30 não conflita com outro às 14:00, porque o serviço ainda não tem duração cadastrada.

---

## Arquitetura e estrutura do projeto

Cada requisição percorre as camadas nesta ordem:

```
Requisição → Route → Controller → Service → Repository → Prisma → MySQL
                                     │
                                  Models (validação e regras da entidade)
Erro em qualquer camada → middleware errorHandler → resposta JSON { message }
```

- **Controller:** recebe a requisição, chama o Service e devolve o status HTTP de sucesso. Não tem regra nem acesso ao banco.
- **Service:** aplica as **regras de negócio** e lança erros (`DadoInvalidoError`, `NaoEncontradoError`, `ConflitoError`). Recebe os Repositories pelo construtor (**injeção de dependência**), o que permite trocar o banco por versões falsas (mocks) em testes.
- **Repository:** só lê e grava no banco com o Prisma.
- **Models:** classes que validam os próprios dados. `Cliente` e `Profissional` **herdam** da classe abstrata `Pessoa`. Os atributos são `readonly`, e os métodos auxiliares são `private` (**encapsulamento**).
- **Errors:** `AppError` guarda a mensagem e o status HTTP, e as classes filhas definem 400, 404 e 409 (**herança**).

```
api-agendamentos/
├── docker/
│   └── init.sql                   # Cria o banco de testes na 1ª inicialização do container
├── docker-compose.yml             # Container do MySQL (lê as variáveis do .env)
├── postman/
│   └── api-agendamentos.postman_collection.json
├── prisma/
│   ├── schema.prisma              # Modelos, tipos, PK, FK e índices
│   └── migrations/
│       └── 20261124000000_init/
│           └── migration.sql      # Script SQL que cria todas as tabelas
├── prisma.config.ts               # Configuração da CLI do Prisma (lê DATABASE_URL)
├── vitest.config.ts               # Configuração dos testes e da cobertura
├── vitest.global-setup.ts         # Prepara o banco de testes antes de rodar
├── tsconfig.json                  # TypeScript (inclui testes, usado no typecheck)
├── tsconfig.build.json            # TypeScript do build (sem os testes)
├── .env.example                   # Modelo das variáveis de ambiente
├── .env.test.example              # Modelo das variáveis do banco de testes
└── src/
    ├── app.ts                     # Express: middlewares, Swagger, registro das rotas e tratamento de erros
    ├── server.ts                  # Sobe o servidor (porta da variável PORT)
    ├── swagger.json               # Documento OpenAPI 3 (documentação Swagger)
    ├── controllers/               # Recebem a requisição e respondem
    ├── errors/                    # AppError, DadoInvalido (400), NaoEncontrado (404), Conflito (409)
    ├── generated/prisma/          # Cliente Prisma gerado (ignorado pelo Git)
    ├── lib/
    │   └── prisma.ts              # Instância do PrismaClient
    ├── middlewares/
    │   ├── errorHandler.ts        # Converte erros em respostas HTTP
    │   └── rotaNaoEncontrada.ts   # 404 para rotas inexistentes
    ├── models/                    # Pessoa, Cliente, Profissional, Servico, Agendamento e Validacao
    ├── repositories/              # Acesso ao banco (um por entidade)
    ├── routes/                    # Rotas de cada entidade (registradas no app.ts)
    ├── services/                  # Regras de negócio (um por entidade)
    └── tests/                     # Um arquivo por entidade: testes unitários + de integração
```

---

## Configuração e execução

### Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou superior
- [Docker Desktop](https://www.docker.com/) (para o MySQL)

### 1. Clonar o repositório e instalar as dependências

```bash
git clone https://github.com/Laura1144/api-agendamentos.git
cd api-agendamentos
npm install
```

### 2. Configurar as variáveis de ambiente

```bash
# Linux / macOS / Git Bash
cp .env.example .env
cp .env.test.example .env.test
```

```powershell
# Windows (PowerShell)
Copy-Item .env.example .env
Copy-Item .env.test.example .env.test
```

Troque `sua_senha` e `senha_root` pelas senhas que quiser usar. O `docker-compose.yml` lê esses valores para criar o banco.

### 3. Subir o banco de dados

```bash
docker compose up -d
docker ps        # aguarde o container "mysql" aparecer como (healthy)
```

O MySQL fica disponível em `localhost:3308`, com o banco `api-agendamentos`. Na primeira inicialização, o `docker/init.sql` cria também o banco de testes `api-agendamentos_test`.

> Usamos a porta **3308** para não conflitar com um MySQL que já esteja instalado no computador na porta 3306. Para usar outra porta, altere `DB_PORT` e a `DATABASE_URL` no `.env`.

### 4. Criar as tabelas e gerar o Prisma Client

```bash
npm run db:migrate        # aplica prisma/migrations no banco (prisma migrate deploy)
npx prisma generate       # gera o cliente em src/generated/prisma
```

### 5. Iniciar a API

```bash
npm run dev
```

- API: **http://localhost:3005**
- Documentação Swagger: **http://localhost:3005/api-docs**

### Resumo rápido

```bash
npm install
cp .env.example .env && cp .env.test.example .env.test   # edite as senhas
docker compose up -d
npm run db:migrate
npx prisma generate
npm run dev
```

### Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Roda a API em modo desenvolvimento (reinicia ao salvar) |
| `npm run build` | Gera o Prisma Client e compila para `dist/` |
| `npm start` | Roda a versão compilada (`dist/server.js`) |
| `npm run typecheck` | Verifica os tipos de todo o projeto, inclusive os testes |
| `npm run db:migrate` | Aplica as migrations no banco do `.env` |
| `npm test` | Roda todos os testes (unitários e de integração) |
| `npm run test:unit` | Roda só os testes unitários |
| `npm run test:integration` | Roda só os testes de integração |
| `npm run test:coverage` | Roda todos os testes e gera o relatório de cobertura |
| `npm run test:watch` | Roda os testes em modo observação |

---

## Variáveis de ambiente

As credenciais ficam **somente** no `.env` e no `.env.test`, que estão no `.gitignore`. O repositório contém apenas os modelos `.env.example` e `.env.test.example`, com valores de exemplo.

| Variável | Uso | Exemplo |
| --- | --- | --- |
| `PORT` | Porta da API | `3005` |
| `DATABASE_URL` | Conexão usada pela CLI do Prisma (migrations). Caracteres especiais da senha precisam de URL encoding (`@` → `%40`) | `mysql://mysql:sua_senha@localhost:3308/api-agendamentos` |
| `DB_HOST` | Host do banco usado pela aplicação | `localhost` |
| `DB_PORT` | Porta do banco | `3308` |
| `DB_USER` | Usuário do banco | `mysql` |
| `DB_PASSWORD` | Senha do banco | `sua_senha` |
| `DB_NAME` | Nome do banco | `api-agendamentos` |
| `DB_SSL` | `true` para bancos na nuvem que exigem SSL (deploy) | `false` |
| `DB_ROOT_PASSWORD` | Senha de root, usada só pelo `docker-compose` | `senha_root` |

O `.env.test` tem as mesmas variáveis, apontando para o banco **`api-agendamentos_test`**.

---

## Banco de dados

O script SQL completo está em [`prisma/migrations/20261124000000_init/migration.sql`](prisma/migrations/20261124000000_init/migration.sql). Ele pode ser aplicado com `npm run db:migrate` ou executado direto no MySQL.

### Tabela `Cliente`

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `id` | `CHAR(36)` | **PK**, UUID gerado pelo Prisma |
| `nome` | `VARCHAR(100)` | NOT NULL |
| `email` | `VARCHAR(150)` | NOT NULL, **UNIQUE** |
| `telefone` | `VARCHAR(20)` | NOT NULL |

### Tabela `Profissional`

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `id` | `CHAR(36)` | **PK**, UUID |
| `nome` | `VARCHAR(100)` | NOT NULL |
| `email` | `VARCHAR(150)` | NOT NULL, **UNIQUE** |

### Tabela `Servico`

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `id` | `CHAR(36)` | **PK**, UUID |
| `nome` | `VARCHAR(100)` | NOT NULL, **UNIQUE** |
| `descricao` | `VARCHAR(255)` | NOT NULL |
| `valor` | `DECIMAL(10,2)` | NOT NULL |

### Tabela `Agenda`

| Coluna | Tipo | Restrições |
| --- | --- | --- |
| `id` | `CHAR(36)` | **PK**, UUID |
| `data` | `DATETIME(3)` | NOT NULL |
| `status` | `VARCHAR(20)` | NOT NULL, padrão `'agendado'` |
| `valor` | `DECIMAL(10,2)` | NOT NULL |
| `clienteId` | `CHAR(36)` | NOT NULL, **FK → Cliente.id** (ON DELETE RESTRICT) |
| `profissionalId` | `CHAR(36)` | NOT NULL, **FK → Profissional.id** (ON DELETE RESTRICT) |
| `servicoId` | `CHAR(36)` | NOT NULL, **FK → Servico.id** (ON DELETE RESTRICT) |

Índice: `(profissionalId, data)`, que acelera a verificação de horário ocupado.

O `ON DELETE RESTRICT` garante no banco a mesma regra do Service: não é possível apagar um cliente, profissional ou serviço que ainda esteja em algum agendamento.

---

## Endpoints da API

URL base local: `http://localhost:3005`. Todos os corpos são JSON (`Content-Type: application/json`).

### Geral

| Método | Endpoint | Descrição |
| --- | --- | --- |
| GET | `/` | Nome e versão da API |
| GET | `/api-docs` | Documentação interativa (Swagger UI) |
| GET | `/api-docs.json` | Documento OpenAPI em JSON |

### Clientes

| Método | Endpoint | Descrição | Sucesso |
| --- | --- | --- | --- |
| GET | `/clientes` | Lista todos os clientes | 200 |
| GET | `/clientes/:id` | Consulta um cliente | 200 |
| POST | `/clientes` | Cadastra um cliente | 201 |
| PUT | `/clientes/:id` | Atualiza um cliente | 200 |
| DELETE | `/clientes/:id` | Remove um cliente | 200 |

### Profissionais

| Método | Endpoint | Descrição | Sucesso |
| --- | --- | --- | --- |
| GET | `/profissionais` | Lista todos os profissionais | 200 |
| GET | `/profissionais/:id` | Consulta um profissional | 200 |
| POST | `/profissionais` | Cadastra um profissional | 201 |
| PUT | `/profissionais/:id` | Atualiza um profissional | 200 |
| DELETE | `/profissionais/:id` | Remove um profissional | 200 |

### Serviços

| Método | Endpoint | Descrição | Sucesso |
| --- | --- | --- | --- |
| GET | `/servicos` | Lista todos os serviços | 200 |
| GET | `/servicos/:id` | Consulta um serviço | 200 |
| POST | `/servicos` | Cadastra um serviço | 201 |
| PUT | `/servicos/:id` | Atualiza um serviço | 200 |
| DELETE | `/servicos/:id` | Remove um serviço | 200 |

### Agendamentos

| Método | Endpoint | Descrição | Sucesso |
| --- | --- | --- | --- |
| GET | `/agendamentos` | Lista todos os agendamentos (ordenados por data, com cliente, profissional e serviço) | 200 |
| GET | `/agendamentos/:id` | Consulta um agendamento | 200 |
| POST | `/agendamentos` | Cria um agendamento | 201 |
| PUT | `/agendamentos/:id` | Atualiza, remarca, conclui ou cancela um agendamento | 200 |
| DELETE | `/agendamentos/:id` | Remove um agendamento | 200 |

### Códigos de erro

Todo erro responde com `{ "message": "..." }`:

| Status | Quando |
| --- | --- |
| 400 | Dado inválido: campo obrigatório ausente, formato errado, id que não é UUID, JSON mal formatado, data no passado |
| 404 | Registro ou rota não encontrada |
| 409 | Conflito com regra de negócio: e-mail ou nome duplicado, horário ocupado, agendamento finalizado, exclusão com vínculos |
| 500 | Erro interno inesperado (os detalhes ficam só no log do servidor) |

---

## Exemplos de requisições

### Cliente

`POST /clientes`

```json
{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "telefone": "(11) 99999-9999"
}
```

Resposta `201`:

```json
{
  "id": "5e2265cd-d24d-43de-b680-cac38cc53a58",
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "telefone": "(11) 99999-9999"
}
```

`PUT /clientes/:id`: envie só o que muda.

```json
{ "telefone": "(11) 98888-7777" }
```

### Profissional

`POST /profissionais`

```json
{
  "nome": "João Souza",
  "email": "joao@email.com"
}
```

`PUT /profissionais/:id`

```json
{ "nome": "João Souza Lima" }
```

### Serviço

`POST /servicos`

```json
{
  "nome": "Corte de cabelo",
  "descricao": "Corte masculino tradicional",
  "valor": 50
}
```

`PUT /servicos/:id`

```json
{ "valor": 60 }
```

> O `valor` é retornado como texto (ex.: `"50"`), porque o banco usa `DECIMAL`. Assim não há perda de precisão em valores em dinheiro.

### Agendamento

`POST /agendamentos` (`status` e `valor` são definidos pela API)

```json
{
  "data": "2026-12-15T14:30:00.000Z",
  "clienteId": "5e2265cd-d24d-43de-b680-cac38cc53a58",
  "profissionalId": "89190f65-e449-409f-9c1b-1f2e3d4c5b6a",
  "servicoId": "3af501a9-0596-4d49-9fe0-77abd55924ae"
}
```

Resposta `201`:

```json
{
  "id": "34db271a-9f95-47ad-91f3-1bb21d198249",
  "data": "2026-12-15T14:30:00.000Z",
  "status": "agendado",
  "valor": "50",
  "clienteId": "5e2265cd-d24d-43de-b680-cac38cc53a58",
  "profissionalId": "89190f65-e449-409f-9c1b-1f2e3d4c5b6a",
  "servicoId": "3af501a9-0596-4d49-9fe0-77abd55924ae",
  "cliente": { "id": "5e2265cd-...", "nome": "Maria Silva", "email": "maria@email.com", "telefone": "(11) 99999-9999" },
  "profissional": { "id": "89190f65-...", "nome": "João Souza", "email": "joao@email.com" },
  "servico": { "id": "3af501a9-...", "nome": "Corte de cabelo", "descricao": "Corte masculino tradicional", "valor": "50" }
}
```

`PUT /agendamentos/:id`: remarcar, trocar o profissional ou o serviço, concluir ou cancelar.

```json
{ "data": "2026-12-16T10:00:00.000Z" }
```

```json
{ "status": "cancelado" }
```

Exemplo de erro (`409`, horário ocupado):

```json
{ "message": "Profissional já possui agendamento neste horário." }
```

---

## Testes automatizados e cobertura

### Ferramentas

- **Vitest 5**: executor dos testes (`describe`, `it`, `expect`) e cobertura.
- **@vitest/coverage-v8**: geração do relatório de cobertura.
- **Supertest**: faz as requisições HTTP direto no `app` do Express, sem subir o servidor.

### Organização

Um arquivo por entidade. Cada arquivo tem dois blocos: **Testes unitários** e **Testes de integração**.

```
src/tests/
├── cliente.test.ts        # 4 unitários + 10 de integração
├── profissional.test.ts   # 4 unitários + 7 de integração
├── servico.test.ts        # 6 unitários + 8 de integração
└── agenda.test.ts         # 5 unitários + 11 de integração
```

- **Unitários (19):** testam as regras de negócio das classes de **Model** (`Cliente`, `Profissional`, `Servico`, `Agendamento`) sem banco. Criam o objeto com `new` e verificam os valores (`toBe`) ou o erro lançado (`toThrow`). Exemplos: nome obrigatório, e-mail válido, valor maior que zero, data no futuro, status permitido.
- **Integração (36):** usam o **Supertest** para chamar os endpoints de **cada uma das 4 entidades** (criar, listar, consultar por id, atualizar e excluir), conferindo o **status HTTP** e os **dados retornados**. Também cobrem as regras que dependem do banco: e-mail ou nome duplicado (409), horário ocupado (409), agendamento concluído não pode ser alterado (409), cliente com agendamento não pode ser excluído (409) e registro inexistente (404).

### Como executar

```bash
docker compose up -d          # o banco precisa estar rodando para os testes de integração

npm run test:unit             # só os blocos "Testes unitários"
npm run test:integration      # só os blocos "Testes de integração"
npm test                      # todos
npm run test:coverage         # todos + relatório de cobertura
```

O relatório de cobertura sai no terminal e em HTML na pasta `coverage/`. Abra `coverage/index.html` no navegador para ver linha por linha.

### Cobertura alcançada

Resultado de `npm run test:coverage` (55 testes: 19 unitários e 36 de integração, todos passando):

| Métrica | Cobertura | Mínimo exigido |
| --- | --- | --- |
| Instruções (statements) | **92,17%** (318/345) | 60% |
| Ramificações (branches) | **76,57%** (134/175) | 60% |
| Funções (functions) | **97,22%** (105/108) | 60% |
| Linhas (lines) | **92,15%** (317/344) | 60% |

A medição inclui todo o código em `src/`. Ficam de fora apenas os próprios testes (`src/tests/`), o código gerado pelo Prisma (`src/generated/`) e o `src/server.ts`, que só chama `app.listen`. O `vitest.config.ts` tem `thresholds` de 60% nas quatro métricas, então o comando falha se a cobertura cair abaixo do mínimo.

### Cuidados com o banco de testes

- Os testes de integração usam **somente** o banco configurado no `.env.test` (`api-agendamentos_test`), **nunca** o de desenvolvimento.
- Antes de rodar, o `vitest.global-setup.ts` confere que o nome do banco termina em `_test` e aplica as migrations (`prisma migrate deploy`).
- Antes de **cada** teste de integração, as tabelas usadas são esvaziadas (`limparBanco`), e no fim de cada arquivo os dados também são apagados. Assim os testes podem rodar várias vezes sem que um interfira no outro.
- Os arquivos rodam **um de cada vez** (`fileParallelism: false`), porque compartilham o mesmo banco.
- Se o banco de testes não existir (por exemplo, num container criado antes do `init.sql`), crie com:

```bash
docker exec -i mysql mysql -uroot -p<DB_ROOT_PASSWORD> < docker/init.sql
```

---

## Documentação Swagger

Com a API rodando, acesse **http://localhost:3005/api-docs**.

1. Os endpoints estão agrupados por entidade: **Clientes**, **Profissionais**, **Serviços** e **Agendamentos**.
2. Clique em um endpoint para ver a finalidade, os parâmetros, o formato do corpo, um exemplo de requisição e todas as respostas possíveis (200/201, 400, 404, 409, 500).
3. Clique em **Try it out**, ajuste o exemplo e clique em **Execute** para chamar a API direto do navegador.
4. Ordem sugerida para testar: crie um cliente, um profissional e um serviço, copie os `id` retornados e use-os em `POST /agendamentos`.

O documento OpenAPI fica em `src/swagger.json` e também é servido em JSON em `/api-docs.json`.

---

## Postman

A coleção [`postman/api-agendamentos.postman_collection.json`](postman/api-agendamentos.postman_collection.json) tem **33 requisições**, cada uma com testes automáticos:

1. No Postman, clique em **Import** e selecione o arquivo da coleção.
2. Se a API não estiver em `http://localhost:3005`, altere a variável `baseUrl` (aba **Variables** da coleção).
3. Clique com o botão direito na coleção → **Run collection** → **Run**.

A coleção cria cliente, profissional, serviço e agendamento, guarda os ids em variáveis, testa as principais regras de negócio (horário ocupado, data passada, e-mail duplicado, valor negativo, agendamento concluído etc.) e, no final, apaga tudo o que criou.

---

## Deploy na Vercel

A Vercel roda a API como função serverless, então ela **não acessa o MySQL do seu computador**. É preciso um banco MySQL na nuvem. O projeto já está preparado: `src/app.ts` exporta o app (`export default app`), o script `vercel-build` gera o Prisma Client, o Swagger carrega os arquivos por CDN e a variável `DB_SSL` liga o SSL na conexão.

1. **Crie um banco MySQL na nuvem** em um provedor como [Aiven](https://aiven.io/mysql), [TiDB Cloud](https://tidbcloud.com/) ou [Railway](https://railway.com/). Anote o host, a porta, o usuário, a senha e o nome do banco.
2. **Crie as tabelas nesse banco:** no seu computador, rode as migrations apontando para ele.

   ```bash
   # PowerShell
   $env:DATABASE_URL="mysql://USUARIO:SENHA@HOST:PORTA/BANCO?sslaccept=strict"; npx prisma migrate deploy
   ```

3. **Envie o código para o GitHub** (`git push`).
4. Na [Vercel](https://vercel.com/new), clique em **Add New → Project** e importe o repositório `api-agendamentos`. O preset **Express** é detectado automaticamente.
5. Em **Environment Variables**, cadastre `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (com os dados do banco na nuvem) e `DB_SSL=true`.
6. Clique em **Deploy**. Depois, acesse `https://SEU-PROJETO.vercel.app/api-docs`.
7. Para testar com o Postman, troque a variável `baseUrl` da coleção pela URL da Vercel.

---

## Comandos úteis do Docker

```bash
docker compose up -d        # sobe o banco em segundo plano
docker compose ps           # status do container
docker compose logs -f      # logs do MySQL
docker compose down         # para e remove o container (os dados continuam no volume)
docker compose down -v      # para, remove o container E apaga os dados do banco
npx prisma studio           # interface visual do banco
```
