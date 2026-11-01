const $ = (id) => document.getElementById(id);
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const ERRO_API = 'Não foi possível falar com a API. Confira se os containers estão rodando.';

const COLUNAS = [
  { id: 'a_fazer', nome: 'A fazer', cor: '#FFE45E', vazio: 'Nada por aqui. Adicione uma tarefa acima.' },
  { id: 'fazendo', nome: 'Estudando', cor: '#FFB3C7', vazio: 'Arraste uma tarefa para cá.' },
  { id: 'revisar', nome: 'Revisar', cor: '#A8D8FF', vazio: 'Arraste uma tarefa para cá.' },
  { id: 'feito', nome: 'Concluído', cor: '#A6E8B5', vazio: 'Arraste uma tarefa para cá.' },
];

let tarefas = [];

async function api(url, opcoes) {
  const resposta = await fetch(url, opcoes);
  if (!resposta.ok) throw new Error(resposta.status);
  return resposta.status === 204 ? null : resposta.json();
}

function avisar(texto) {
  $('aviso').textContent = texto;
  $('aviso').hidden = !texto;
}

const formatarData = (iso) => iso.split('-').reverse().slice(0, 2).join('/');

async function mover(id, status) {
  const tarefa = tarefas.find((t) => t.id === id);
  if (!tarefa || tarefa.status === status) return;
  try {
    Object.assign(tarefa, await api(`/api/tarefas/${id}`, {
      method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify({ status }),
    }));
    avisar('');
    render();
  } catch { avisar(ERRO_API); }
}

async function excluir(id) {
  try {
    await api(`/api/tarefas/${id}`, { method: 'DELETE' });
    tarefas = tarefas.filter((t) => t.id !== id);
    avisar('');
    render();
  } catch { avisar(ERRO_API); }
}

function botao(texto, rotulo, aoClicar, classe) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = texto;
  b.setAttribute('aria-label', rotulo);
  if (classe) b.className = classe;
  b.addEventListener('click', aoClicar);
  return b;
}

function criarCartao(t, indiceColuna) {
  const hoje = new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD no fuso local
  const li = document.createElement('li');
  li.className = 'cartao';
  li.draggable = true;
  li.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', t.id); li.classList.add('arrastando'); });
  li.addEventListener('dragend', () => li.classList.remove('arrastando'));

  const titulo = document.createElement('p');
  titulo.className = 'titulo';
  titulo.textContent = t.titulo;

  const meta = document.createElement('div');
  meta.className = 'meta';
  if (t.disciplina) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = t.disciplina;
    meta.append(chip);
  }
  if (t.prazo) {
    const atrasada = t.prazo < hoje && t.status !== 'feito';
    const prazo = document.createElement('span');
    prazo.className = atrasada ? 'atrasada' : '';
    prazo.textContent = `${atrasada ? 'Atrasada desde' : 'Até'} ${formatarData(t.prazo)}`;
    meta.append(prazo);
  }

  const acoes = document.createElement('div');
  acoes.className = 'acoes';
  if (indiceColuna > 0) {
    const destino = COLUNAS[indiceColuna - 1];
    acoes.append(botao('←', `Mover para ${destino.nome}`, () => mover(t.id, destino.id)));
  }
  if (indiceColuna < COLUNAS.length - 1) {
    const destino = COLUNAS[indiceColuna + 1];
    acoes.append(botao('→', `Mover para ${destino.nome}`, () => mover(t.id, destino.id)));
  }
  acoes.append(botao('Excluir', `Excluir a tarefa ${t.titulo}`, () => excluir(t.id), 'excluir'));

  li.append(titulo, meta, acoes);
  return li;
}

function criarColuna(coluna, indice) {
  const itens = tarefas.filter((t) => t.status === coluna.id);
  const secao = document.createElement('section');
  secao.className = 'coluna';
  secao.style.setProperty('--c', coluna.cor);

  const titulo = document.createElement('h2');
  const nome = document.createElement('span');
  nome.className = 'nome';
  nome.textContent = coluna.nome;
  const total = document.createElement('span');
  total.className = 'total';
  total.textContent = itens.length;
  titulo.append(nome, total);

  const lista = document.createElement('ul');
  if (itens.length) {
    lista.append(...itens.map((t) => criarCartao(t, indice)));
  } else {
    const vazio = document.createElement('li');
    vazio.className = 'vazio';
    vazio.textContent = coluna.vazio;
    lista.append(vazio);
  }

  secao.addEventListener('dragover', (e) => { e.preventDefault(); secao.classList.add('alvo'); });
  secao.addEventListener('dragleave', (e) => { if (!secao.contains(e.relatedTarget)) secao.classList.remove('alvo'); });
  secao.addEventListener('drop', (e) => {
    e.preventDefault();
    secao.classList.remove('alvo');
    mover(Number(e.dataTransfer.getData('text/plain')), coluna.id);
  });

  secao.append(titulo, lista);
  return secao;
}

function render() {
  $('quadro').replaceChildren(...COLUNAS.map(criarColuna));
  const feitas = tarefas.filter((t) => t.status === 'feito').length;
  $('resumo').textContent = `${feitas} de ${tarefas.length} ${tarefas.length === 1 ? 'tarefa concluída' : 'tarefas concluídas'}`;
  $('barra').value = tarefas.length ? Math.round((feitas / tarefas.length) * 100) : 0;
}

$('form-nova').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const nova = await api('/api/tarefas', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ titulo: $('titulo').value, disciplina: $('disciplina').value, prazo: $('prazo').value || null }),
    });
    tarefas.push(nova);
    e.target.reset();
    avisar('');
    render();
    $('titulo').focus();
  } catch { avisar(ERRO_API); }
});

(async () => {
  try {
    tarefas = await api('/api/tarefas');
  } catch { avisar(ERRO_API); }
  render();
})();
