// =====================================================
//  FORMIGUEIRO - lógica do jogo
// =====================================================


// ---------- Elementos da página ----------
const areaJogo   = document.getElementById('areaJogo');
const aviso      = document.getElementById('aviso');
const listaLoja  = document.getElementById('listaLoja');

const cenas = {
  campo:       document.getElementById('cenaCampo'),
  loja:        document.getElementById('cenaLoja'),
  formigueiro: document.getElementById('cenaFormigueiro')
};


// ---------- Configurações (mexa aqui para ajustar o jogo) ----------
const MAXIMO_FORMIGAS_NA_TELA = 100;
const INTERVALO_APARICAO_MS   = 100;   // tempo entre uma formiga e outra aparecer no campo
const INTERVALO_PRODUCAO_MS   = 1800;   // tempo entre cada ganho automático de formigas (era 1000)


// ---------- Estado do jogo ----------
let pontos = 0;                  // formigas que o jogador tem agora
let formigasPorSegundo = 0;      // produção automática vinda das compras da loja
let nivel = 1;                   // nível do formigueiro
let totalColetadoNoClique = 0;   // formigas coletadas manualmente (clicando)
let cenaAtual = 'campo';

// Melhorias vendidas na loja
const melhorias = [
  { nome: 'Olhar no chão',        producao: 1,   custoBase: 10,   quantidade: 0 },
  { nome: 'Jogar açúcar',         producao: 3,   custoBase: 35,   quantidade: 0 },
  { nome: 'Piquenique',           producao: 5,   custoBase: 100,  quantidade: 0 },
  { nome: 'Expandir formigueiro', producao: 15,  custoBase: 250,  quantidade: 0 },
  { nome: 'Fantasia de formiga',  producao: 30,  custoBase: 600,  quantidade: 0 },
  { nome: 'Aspirar formigas',     producao: 60,  custoBase: 1000, quantidade: 0 },
  { nome: 'Curso para formigas',  producao: 150, custoBase: 1800, quantidade: 0 }
];

// O título muda conforme o nível do formigueiro
const titulosDeNivel = [
  'Formiga Curiosa', 'Formiga Recruta', 'Formiga Operária', 'Formiga Exploradora', 'Formiga Coletora',
  'Formiga Soldado', 'Capitã da Trilha', 'Engenheira de Túneis', 'Guardiã do Formigueiro',
  'Comandante da Colônia', 'Mestre dos Túneis', 'Rainha Suprema'
];


// ---------- Funções de cálculo ----------
function tituloDoNivel(numeroDoNivel) {
  if (numeroDoNivel > titulosDeNivel.length) return 'Lenda do Formigueiro';
  return titulosDeNivel[numeroDoNivel - 1];
}

function custoDoNivel(numeroDoNivel) {
  return Math.floor(30* Math.pow(1.15, numeroDoNivel - 1));
}

// O nível só aumenta quantas formigas cada clique rende
function formigasPorClique() {
  return nivel;
}

function custoDaMelhoria(melhoria) {
  return Math.floor(melhoria.custoBase * Math.pow(1.15, melhoria.quantidade));
}

// Deixa o número bonito (1.000, 25.000...)
function formatarNumero(numero) {
  return Math.floor(numero).toLocaleString('pt-BR');
}


// =====================================================
//  CONQUISTAS
// =====================================================
const conquistasPossiveis = [];
const conquistasDesbloqueadas = [];   // guarda os ids, na ordem em que foram conquistadas

// Uma conquista para cada melhoria comprada pela primeira vez
melhorias.forEach(melhoria => {
  conquistasPossiveis.push({
    id: 'melhoria-' + melhoria.nome,
    texto: `Desbloqueou “${melhoria.nome}”`,
    conquistada: () => melhoria.quantidade >= 1
  });
});

// Conquistas de nível
[3, 5, 10, 15, 20].forEach(nivelAlvo => {
  conquistasPossiveis.push({
    id: 'nivel-' + nivelAlvo,
    texto: `Chegou ao nível ${nivelAlvo}`,
    conquistada: () => nivel >= nivelAlvo
  });
});

// Conquistas de formigas coletadas clicando
[1, 10, 50, 100, 500].forEach(quantidadeAlvo => {
  conquistasPossiveis.push({
    id: 'coleta-' + quantidadeAlvo,
    texto: quantidadeAlvo === 1 ? 'Coletou a primeira formiga' : `Coletou ${quantidadeAlvo} formigas`,
    conquistada: () => totalColetadoNoClique >= quantidadeAlvo
  });
});

// Conquistas de produção por segundo
[10, 100, 1000].forEach(taxaAlvo => {
  conquistasPossiveis.push({
    id: 'taxa-' + taxaAlvo,
    texto: `Chegou a ${taxaAlvo} formigas por segundo`,
    conquistada: () => formigasPorSegundo >= taxaAlvo
  });
});

function verificarConquistas() {
  conquistasPossiveis.forEach(conquista => {
    const jaTinha = conquistasDesbloqueadas.includes(conquista.id);

    if (!jaTinha && conquista.conquistada()) {
      conquistasDesbloqueadas.push(conquista.id);
      mostrarAviso('🏆 ' + conquista.texto);
    }
  });

  desenharConquistas();
}

function desenharConquistas() {
  const lista = document.getElementById('listaConquistas');
  lista.innerHTML = '';

  if (conquistasDesbloqueadas.length === 0) {
    const item = document.createElement('li');
    item.className = 'vazia';
    item.textContent = 'Nenhum achievement ainda.';
    lista.appendChild(item);
    return;
  }

  conquistasDesbloqueadas.forEach(id => {
    const conquista = conquistasPossiveis.find(c => c.id === id);
    const item = document.createElement('li');
    item.textContent = conquista.texto;
    lista.appendChild(item);
  });

  lista.scrollTop = lista.scrollHeight;   // rola até a conquista mais nova
}


// =====================================================
//  PLACAR
// =====================================================
function atualizarPlacar() {
  document.querySelectorAll('.valor-placar').forEach(el => el.textContent = formatarNumero(pontos));
  document.querySelectorAll('.valor-taxa').forEach(el => el.textContent = formatarNumero(formigasPorSegundo));

  atualizarTelaDoFormigueiro();

  if (cenaAtual === 'loja') atualizarBotoesDaLoja();
}


// =====================================================
//  AVISO (balãozinho que aparece nas conquistas)
// =====================================================
function mostrarAviso(texto) {
  aviso.textContent = texto;
  aviso.classList.remove('mostrar');
  void aviso.offsetWidth;   // força o navegador a reiniciar a animação
  aviso.classList.add('mostrar');
}


// =====================================================
//  CAMPO (formigas que aparecem para o jogador clicar)
// =====================================================
const emojiFormiga = `<span class="emoji-formiga" aria-hidden="true">🐜</span>`;

function contarFormigasNaTela() {
  return areaJogo.querySelectorAll('.formiga:not(.capturada)').length;
}

function criarFormiga() {
  if (contarFormigasNaTela() >= MAXIMO_FORMIGAS_NA_TELA) return;

  const formiga = document.createElement('button');
  formiga.className = 'formiga';
  formiga.type = 'button';
  formiga.setAttribute('aria-label', 'Capturar formiga');
  formiga.innerHTML = emojiFormiga;

  // Sorteia uma posição dentro da área de jogo.
  // Usa porcentagem (e não pixels) porque o campo fica escondido (tamanho 0)
  // quando o jogador está na loja ou no formigueiro.
  formiga.style.left = `calc(20px + (100% - 50px) * ${Math.random()})`;
  formiga.style.top  = `calc(20px + (100% - 50px) * ${Math.random()})`;

  formiga.addEventListener('pointerdown', evento => {
    evento.preventDefault();
    if (formiga.classList.contains('capturada')) return;

    formiga.classList.add('capturada');

    const ganho = formigasPorClique();
    pontos += ganho;
    totalColetadoNoClique += ganho;
    atualizarPlacar();
    verificarConquistas();

    setTimeout(() => formiga.remove(), 170);   // espera a animação de sumir
  });

  areaJogo.appendChild(formiga);
}

// Chamada de tempos em tempos. As formigas continuam aparecendo no campo
// mesmo que o jogador esteja na loja ou no formigueiro (o limite de
// MAXIMO_FORMIGAS_NA_TELA evita que elas se acumulem sem fim).
function tentarCriarFormiga() {
  criarFormiga();
}


// =====================================================
//  LOJA
// =====================================================
const iconeCarrinho = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 3h3l2.2 11h11l2-8H6.2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="19" r="1.7" fill="#fff"/><circle cx="17" cy="19" r="1.7" fill="#fff"/></svg>`;

function desenharLoja() {
  listaLoja.innerHTML = '';

  melhorias.forEach(melhoria => {
    const linha = document.createElement('article');
    linha.className = 'item-loja';

    const nome = document.createElement('div');
    nome.className = 'nome-item';
    nome.textContent = melhoria.nome;

    const descricao = document.createElement('div');
    descricao.className = 'descricao-item';
    descricao.textContent = `+${formatarNumero(melhoria.producao)} 🐜 por segundo`;

    const custo = document.createElement('div');
    custo.className = 'custo-item';

    const botaoComprar = document.createElement('button');
    botaoComprar.className = 'botao-comprar';
    botaoComprar.type = 'button';
    botaoComprar.innerHTML = `${iconeCarrinho}<span>Comprar</span>`;

    // Guardamos no botão a melhoria e o texto do custo, para atualizar depois
    botaoComprar._melhoria = melhoria;
    botaoComprar._textoCusto = custo;

    botaoComprar.addEventListener('click', () => comprarMelhoria(melhoria));

    linha.append(nome, botaoComprar, descricao, custo);
    listaLoja.appendChild(linha);
  });

  atualizarBotoesDaLoja();
}

function comprarMelhoria(melhoria) {
  const custo = custoDaMelhoria(melhoria);
  if (pontos < custo) return;

  pontos -= custo;
  melhoria.quantidade++;
  formigasPorSegundo += melhoria.producao;

  atualizarPlacar();
  verificarConquistas();
}

// Habilita/desabilita cada botão conforme o jogador tem formigas suficientes
function atualizarBotoesDaLoja() {
  listaLoja.querySelectorAll('.botao-comprar').forEach(botao => {
    const custo = custoDaMelhoria(botao._melhoria);
    botao.disabled = pontos < custo;
    botao._textoCusto.textContent = `Custo: ${formatarNumero(custo)} 🐜`;
  });
}


// =====================================================
//  FORMIGUEIRO (nível)
// =====================================================
function atualizarTelaDoFormigueiro() {
  const custo = custoDoNivel(nivel);

  document.getElementById('nomeNivel').textContent   = `Nível do formigueiro - ${nivel}`;
  document.getElementById('tituloNivel').textContent = `Título: ${tituloDoNivel(nivel)}`;
  document.getElementById('custoNivel').textContent  = `Custo: ${formatarNumero(custo)} 🐜`;
  document.getElementById('bonusNivel').textContent  =
    `Bônus: ${formatarNumero(formigasPorClique())} 🐜 por clique (próximo nível: ${formatarNumero(formigasPorClique() + 2)})`;

  document.getElementById('botaoMelhorar').disabled = pontos < custo;

  // O formigueiro cresce a cada nível, até o nível 21 (depois disso fica no tamanho máximo).
  // Na vertical ele cresce mais do que na horizontal, ficando mais alto, mas o
  // tamanho máximo para um pouco abaixo do painel do topo (placar e botões).
  const progresso = Math.min(1, (nivel - 1) / 20);   // 0 no nível 1, 1 no nível 21+
  const monte = document.getElementById('monte');
  monte.style.setProperty('--escala-x', 0.25 + 0.35 * progresso);
  monte.style.setProperty('--escala-y', 0.25 + 0.35 * progresso);
}

document.getElementById('botaoMelhorar').addEventListener('click', () => {
  const custo = custoDoNivel(nivel);
  if (pontos < custo) return;

  pontos -= custo;
  nivel++;
  nivel++

  // Reinicia a animação de brilho do formigueiro
  const monte = document.getElementById('monte');
  monte.classList.remove('pulsar');
  void monte.getBoundingClientRect();
  monte.classList.add('pulsar');

  mostrarAviso(`⬆ Nível ${nivel}: ${tituloDoNivel(nivel)}`);
  atualizarPlacar();
  verificarConquistas();
});


// =====================================================
//  NAVEGAÇÃO ENTRE AS PÁGINAS
// =====================================================
// A ordem aqui é a ordem dos botões na tela: Grama (campo), Loja, Formigueiro
const botoesDeNavegacao = [
  { destino: 'campo',       imagem: 'Imagems/Group 22.png', nome: 'Coletor de formigas' },
  { destino: 'loja',        imagem: 'Imagems/Group 20.png', nome: 'Loja' },
  { destino: 'formigueiro', imagem: 'Imagems/Group 1.png',  nome: 'Formigueiro' }
];

function irPara(nomeDaCena) {
  cenaAtual = nomeDaCena;

  Object.entries(cenas).forEach(([nome, elemento]) => {
    elemento.classList.toggle('ativa', nome === nomeDaCena);
  });

  if (nomeDaCena === 'loja') desenharLoja();
  atualizarPlacar();
}

// Cria os botões de navegação dentro de cada página
document.querySelectorAll('[data-navegacao]').forEach(navegacao => {
  const cenaDestaNavegacao = Object.keys(cenas).find(nome => cenas[nome].contains(navegacao));

  botoesDeNavegacao.forEach(botaoInfo => {
    const botao = document.createElement('button');
    botao.className = 'botao-icone' + (botaoInfo.destino === cenaDestaNavegacao ? ' atual' : '');
    botao.type = 'button';
    botao.setAttribute('aria-label', botaoInfo.nome);
    botao.innerHTML = `<img src="${botaoInfo.imagem}" alt="${botaoInfo.nome}">`;
    botao.addEventListener('click', () => irPara(botaoInfo.destino));
    navegacao.appendChild(botao);
  });
});


// =====================================================
//  PRODUÇÃO AUTOMÁTICA E INÍCIO DO JOGO
// =====================================================
function produzirFormigas() {
  if (formigasPorSegundo <= 0) return;

  pontos += formigasPorSegundo;
  atualizarPlacar();
}

function iniciarJogo() {
  criarFormiga();                                          // a primeira já aparece na hora
  setInterval(tentarCriarFormiga, INTERVALO_APARICAO_MS);  // depois, uma de tempos em tempos
  setInterval(produzirFormigas, INTERVALO_PRODUCAO_MS);
}

desenharConquistas();
atualizarPlacar();
iniciarJogo();
