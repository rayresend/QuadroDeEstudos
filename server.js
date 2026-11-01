const express = require('express');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
app.use(express.json());

const STATUS = ['a_fazer', 'fazendo', 'revisar', 'feito'];
// constante fixa (nunca vem do usuário), por isso pode entrar direto no SQL
const CAMPOS = "id, titulo, disciplina, to_char(prazo, 'YYYY-MM-DD') AS prazo, status";

// trata erros em um lugar só
const rota = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro interno da API' });
  }
};

const idValido = (req) => {
  const id = Number.parseInt(req.params.id, 10);
  return Number.isInteger(id) ? id : null;
};

// Listar todas as tarefas
app.get('/api/tarefas', rota(async (_req, res) => {
  const { rows } = await pool.query(`SELECT ${CAMPOS} FROM tarefas ORDER BY criado_em, id`);
  res.json(rows);
}));

// Criar uma tarefa (consultas parametrizadas protegem contra SQL injection)
app.post('/api/tarefas', rota(async (req, res) => {
  const titulo = String(req.body.titulo || '').trim().slice(0, 80);
  const disciplina = String(req.body.disciplina || '').trim().slice(0, 30);
  const prazo = req.body.prazo || null;
  const prazoOk = !prazo || (/^\d{4}-\d{2}-\d{2}$/.test(prazo) && !Number.isNaN(Date.parse(prazo)));
  if (!titulo || !prazoOk) return res.status(400).json({ erro: 'Dados inválidos' });

  const { rows } = await pool.query(
    `INSERT INTO tarefas (titulo, disciplina, prazo) VALUES ($1, $2, $3) RETURNING ${CAMPOS}`,
    [titulo, disciplina, prazo]
  );
  res.status(201).json(rows[0]);
}));

// Mover uma tarefa de coluna
app.patch('/api/tarefas/:id', rota(async (req, res) => {
  const id = idValido(req);
  const { status } = req.body;
  if (id === null || !STATUS.includes(status)) return res.status(400).json({ erro: 'Dados inválidos' });

  const { rows } = await pool.query(
    `UPDATE tarefas SET status = $1 WHERE id = $2 RETURNING ${CAMPOS}`,
    [status, id]
  );
  if (!rows.length) return res.status(404).json({ erro: 'Tarefa não encontrada' });
  res.json(rows[0]);
}));

// Excluir uma tarefa
app.delete('/api/tarefas/:id', rota(async (req, res) => {
  const id = idValido(req);
  if (id === null) return res.status(400).json({ erro: 'Dados inválidos' });
  const { rowCount } = await pool.query('DELETE FROM tarefas WHERE id = $1', [id]);
  res.sendStatus(rowCount ? 204 : 404);
}));

app.listen(3000, () => console.log('API rodando na porta 3000'));
