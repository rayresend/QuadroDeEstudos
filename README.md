# Quadro de Estudos

Kanban para organizar tarefas de estudo, com quatro colunas (A fazer, Estudando, Revisar, Concluído). Arraste os cartões ou use os botões ← e →.

| Serviço | Tecnologia | Papel |
|---|---|---|
| `web` | HTML, CSS, JavaScript + nginx | O quadro e o proxy para a API |
| `api` | Node.js + Express | CRUD de tarefas |
| `db`  | PostgreSQL | Guarda as tarefas (volume `dados`) |

## Como rodar

```bash
docker compose up --build
```

Abra http://localhost:8081.

## Rotas da API

| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/tarefas` | Lista as tarefas |
| POST | `/api/tarefas` | Cria uma tarefa (`titulo`, `disciplina`, `prazo`) |
| PATCH | `/api/tarefas/:id` | Muda a coluna (`status`) |
| DELETE | `/api/tarefas/:id` | Exclui a tarefa |

## Comandos úteis

```bash
docker compose logs -f api   # logs da API
docker compose down          # parar (as tarefas continuam salvas)
docker compose down -v       # parar e apagar o banco
```

## Próximos passos

- Editar o título de uma tarefa.
- Login para cada pessoa ter o seu quadro.
- Usuário e senha do banco em um arquivo `.env`, em vez de no `docker-compose.yml`.
