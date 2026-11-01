CREATE TABLE IF NOT EXISTS tarefas (
  id         SERIAL PRIMARY KEY,
  titulo     VARCHAR(80) NOT NULL,
  disciplina VARCHAR(30) NOT NULL DEFAULT '',
  prazo      DATE,
  status     VARCHAR(10) NOT NULL DEFAULT 'a_fazer',
  criado_em  TIMESTAMP DEFAULT NOW()
);
