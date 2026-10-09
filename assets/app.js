/* TOCE Lab · 8º período — site estático: Resumos, Treino (OSCE), Questões, Simulado e Desempenho. */
"use strict";

const estado = {
  sessoes: [], resumos: {}, questoes: [], estacoes: [], casos: [], casoAberto: {}, casoEtapa: {}, osceFiltro: "todas",
  timer: null,
  osce: { modo: "treino", fase: "pronto", resta: 0, leitura: 0 },
  sim: null, // { temas, n, pool, idx, respostas, fim, inicio, fimEm }
  simConfig: { temas: [], n: 10 },
};
const conteudo = document.getElementById("conteudo");

/* ---------- utilitários ---------- */
const esc = (texto) => String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dataBR = (iso) => { const [, m, d] = iso.split("-"); return `${d}/${m}`; };
const dataCompleta = (iso) => { const [a, m, d] = iso.split("-"); return `${d}/${m}/${a}`; };
const rotuloSessao = (s) => (s.numero === "Revisão" ? "Revisão" : `Sessão ${s.numero}`);
const sessaoPorId = (id) => estado.sessoes.find((s) => s.id === id);
const temaDaSessao = (s) => (s.teoria.startsWith("Sem aula") ? `${s.pratica} (só prática)` : s.teoria);
const tituloTema = (id) => estado.resumos[id]?.titulo ?? id;
const mmss = (seg) => `${String(Math.floor(Math.max(seg, 0) / 60)).padStart(2, "0")}:${String(Math.max(seg, 0) % 60).padStart(2, "0")}`;
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const embaralhar = (lista) => { const a = [...lista]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function guardar(chave, valor) { try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* armazenamento indisponível */ } }
function ler(chave, padrao) { try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch { return padrao; } }

function proximaSessao() {
  const hoje = new Date();
  const chave = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  return estado.sessoes.find((s) => s.dataA >= chave) ?? null;
}

function botoesResumo(id, compacto = false) {
  const r = estado.resumos[id];
  if (!r) return `<span class="selo">em preparação</span>`;
  return `<span class="acoes">
    <a class="botao" href="${esc(r.apostila)}" target="_blank" rel="noopener">${compacto ? "Apostila" : `Ler a apostila · ${r.paginasApostila} p.`}</a>
    <a class="botao claro" href="${esc(r.flash)}" target="_blank" rel="noopener">${compacto ? "Flash" : `Revisão Flash · ${r.paginasFlash} p.`}</a>
  </span>`;
}

const abertura = (rotulo, titulo, texto) => `
  <section class="abertura"><span class="rotulo">${rotulo}</span><h1>${titulo}</h1>${texto ? `<p>${texto}</p>` : ""}<div class="filete"></div></section>`;

/* ---------- início ---------- */
function telaInicio() {
  const p = proximaSessao();
  const proxima = p ? `
    <section class="proxima caixa">
      <div>
        <span class="rotulo">Próxima aula · Turma B ${dataBR(p.dataB)} · Turma A ${dataBR(p.dataA)}</span>
        <h2>${esc(rotuloSessao(p))}: ${esc(temaDaSessao(p))}</h2>
        <p>Prática: ${esc(p.pratica)}</p>
      </div>
      ${p.resumo ? botoesResumo(p.resumo) : `<span class="selo">apostila em preparação</span>`}
    </section>` : "";
  return `
    ${abertura("Habilidades Cirúrgicas · TOCE", "Monitoria do 8º período", "Apostilas de estudo, revisões flash, treino de procedimentos e questões comentadas, sessão por sessão.")}
    ${proxima}
    <section class="portas">
      <a class="porta" href="#/resumos"><span class="num">${Object.keys(estado.resumos).length}</span><h3>Resumos</h3><p>Apostila de Estudo e Revisão Flash de cada sessão, para ler ou baixar.</p></a>
      <a class="porta" href="#/osce"><span class="num">${estado.estacoes.length + estado.casos.length}</span><h3>OSCE</h3><p>Estações práticas com checklist e estações escritas com caso em etapas e exames de imagem. Sorteie uma e treine com o cronômetro.</p></a>
      <a class="porta" href="#/questoes"><span class="num">${estado.questoes.length}</span><h3>Questões</h3><p>Estudo com correção na hora ou simulado montado por você, com nota no final.</p></a>
    </section>
    <p style="text-align:center;margin-top:22px"><a href="#/desempenho">Ver meu desempenho →</a></p>`;
}

/* ---------- resumos ---------- */
function telaResumos() {
  const cards = Object.entries(estado.resumos).map(([id, r]) => {
    const quando = r.sessoes.map((sid) => sessaoPorId(sid)).filter(Boolean).map(rotuloSessao).join(" · ");
    return `
    <article class="resumo-card">
      <a href="${esc(r.apostila)}" target="_blank" rel="noopener"><img src="${esc(r.capa)}" alt="Capa: ${esc(r.titulo)}" loading="lazy"></a>
      <div>
        <span class="rotulo">${esc(quando)}</span>
        <h2>${esc(r.titulo)}</h2>
        <p class="sub">${esc(r.subtitulo)}</p>
        ${botoesResumo(id)}
        <span class="acoes" style="margin-top:8px"><a href="#/questoes/${esc(id)}">Questões deste tema →</a></span>
        <small>Atualizado em ${dataCompleta(r.atualizado)}</small>
      </div>
    </article>`;
  }).join("");
  const sessoes = estado.sessoes.map((s) => `
    <li class="sessao">
      <span class="n">${esc(s.numero === "Revisão" ? "Rev." : `S${s.numero.padStart(2, "0")}`)}</span>
      <div><h3>${esc(temaDaSessao(s))}</h3><p>${dataBR(s.dataB)} e ${dataBR(s.dataA)} · prática: ${esc(s.pratica)}</p></div>
      ${s.resumo ? botoesResumo(s.resumo, true) : `<span class="selo">em preparação</span>`}
    </li>`).join("");
  return `
    ${abertura("Resumos", "Apostilas e revisões", "Cada tema tem uma Apostila de Estudo completa e uma Revisão Flash de uma página.")}
    ${cards}
    <section style="margin-top:34px"><span class="rotulo">Cronograma 2026.2</span><ul class="sessoes">${sessoes}</ul></section>`;
}

/* ---------- questões: modo estudo ---------- */
function abasQuestoes(ativa) {
  return `<div class="abas"><a class="${ativa === "estudo" ? "ativo" : ""}" href="#/questoes">Modo estudo</a><a class="${ativa === "simulado" ? "ativo" : ""}" href="#/simulado">Simulado</a></div>`;
}

function blocoQuestao(q, i, escolha, mostrar, prefixo) {
  const alts = q.alternativas.map((a, j) => {
    let classe = "";
    if (mostrar && j === q.correta) classe = "certa";
    else if (mostrar && j === escolha) classe = "errada";
    else if (!mostrar && j === escolha) classe = "marcada";
    return `<li><button data-${prefixo}="${esc(q.id)}" data-alt="${j}" class="${classe}" ${mostrar ? "disabled" : ""}><b>${"ABCD"[j]})</b><span>${esc(a)}</span></button></li>`;
  }).join("");
  const comentario = mostrar ? `
    <div class="comentario caixa ${escolha === q.correta ? "acerto" : "erro"}">
      <span class="rotulo">${escolha === q.correta ? "Correto" : escolha === undefined ? `Não respondida · gabarito ${"ABCD"[q.correta]}` : `Resposta: ${"ABCD"[q.correta]}`}</span>
      <div>${esc(q.comentario)}</div><small>Fonte: ${esc(q.fonte)}</small>
    </div>` : "";
  const sessao = sessaoPorId(q.sessao);
  return `<article class="questao"><span class="rotulo">Questão ${i + 1} · ${esc(tituloTema(q.resumo))}${sessao ? ` · ${rotuloSessao(sessao)}` : ""}</span>
    <p class="enunciado">${esc(q.enunciado)}</p><ul class="alternativas">${alts}</ul>${comentario}</article>`;
}

function telaQuestoes(filtro) {
  const lista = filtro ? estado.questoes.filter((q) => q.resumo === filtro) : estado.questoes;
  const respostas = ler("toce-respostas", {});
  const feitas = lista.filter((q) => q.id in respostas);
  const acertos = feitas.filter((q) => respostas[q.id] === q.correta).length;
  const filtros = [`<button class="${filtro ? "" : "ativo"}" data-filtro="">Todas</button>`]
    .concat(Object.entries(estado.resumos).map(([id, r]) => `<button class="${filtro === id ? "ativo" : ""}" data-filtro="${esc(id)}">${esc(r.titulo)}</button>`)).join("");
  const itens = lista.map((q, i) => blocoQuestao(q, i, respostas[q.id], q.id in respostas, "q")).join("");
  return `
    ${abertura("Questões", "Questões comentadas", "No modo estudo, a correção e a fonte aparecem assim que você responde. Suas respostas ficam só neste aparelho.")}
    ${abasQuestoes("estudo")}
    <div class="filtros">${filtros}</div>
    <p class="placar">${feitas.length} de ${lista.length} respondidas · ${acertos} acerto${acertos === 1 ? "" : "s"}${feitas.length ? ` · <a href="#" data-zerar="1">recomeçar</a>` : ""}</p>
    ${itens || `<p class="fraco" style="text-align:center">Ainda não há questões deste tema.</p>`}`;
}

/* ---------- simulado ---------- */
function telaSimuladoConfig() {
  const cfg = estado.simConfig;
  const temas = Object.entries(estado.resumos).map(([id, r]) => {
    const n = estado.questoes.filter((q) => q.resumo === id).length;
    const marcado = cfg.temas.includes(id);
    return `<label class="opcao ${marcado ? "ativo" : ""}"><input type="checkbox" data-tema="${esc(id)}" ${marcado ? "checked" : ""}><span><b>${esc(r.titulo)}</b><small>${n} questões</small></span></label>`;
  }).join("");
  const disponiveis = estado.questoes.filter((q) => cfg.temas.includes(q.resumo)).length;
  const n = Math.min(cfg.n, disponiveis);
  const historico = ler("toce-simulados", []).slice(-5).reverse().map((h) => `
    <li><span>${dataCompleta(h.data)}</span><span>${h.acertos}/${h.n} · <b>${pct(h.acertos, h.n)}%</b></span><span class="fraco">${esc(h.temas.map(tituloTema).join(", "))}</span></li>`).join("");
  return `
    ${abertura("Questões", "Monte seu simulado", "Você escolhe os temas e a quantidade. Sem gabarito durante a prova: a correção comentada aparece só no final.")}
    ${abasQuestoes("simulado")}
    <div class="acoes" style="justify-content:center;margin:-4px 0 22px">
      <button class="botao claro" data-mini="10">Mini prova rápida · 10 questões de todos os temas</button>
      <button class="botao claro" data-mini="30">Prova completa · 30 questões</button>
    </div>
    <section class="simulado-grade">
      <div>
        <div class="passo-titulo"><span>1</span><h2>Temas</h2><button class="link" data-todos="1">${cfg.temas.length === Object.keys(estado.resumos).length ? "Limpar" : "Selecionar todos"}</button></div>
        <div class="opcoes">${temas}</div>
      </div>
      <aside class="caixa">
        <div class="passo-titulo"><span>2</span><h2>Quantidade</h2></div>
        <div class="contagem">${[5, 10, 20, 30, 40].map((v) => `<button class="${cfg.n === v ? "ativo" : ""}" data-n="${v}">${v}</button>`).join("")}</div>
        <p class="fraco" style="margin:10px 0">${cfg.temas.length ? `${disponiveis} questões disponíveis nos temas escolhidos.` : "Escolha pelo menos um tema."}</p>
        <button class="botao" data-iniciar-sim="1" ${n ? "" : "disabled"}>Iniciar simulado · ${n} questões</button>
      </aside>
    </section>
    ${historico ? `<section style="margin-top:30px"><span class="rotulo">Seus últimos simulados</span><ul class="historico">${historico}</ul></section>` : ""}`;
}

function telaSimuladoProva() {
  const sim = estado.sim;
  if (!sim) { location.hash = "#/simulado"; return ""; }
  if (sim.fim) return telaSimuladoResultado();
  const q = sim.pool[sim.idx];
  const decorrido = Math.floor((Date.now() - sim.inicio) / 1000);
  const mapa = sim.pool.map((item, i) => `<button class="${i === sim.idx ? "atual" : ""} ${item.id in sim.respostas ? "feita" : ""}" data-ir="${i}">${i + 1}</button>`).join("");
  return `
    <div class="prova-topo"><span class="rotulo">Simulado · questão ${sim.idx + 1} de ${sim.pool.length}</span><span class="relogio-mini" id="decorrido">${mmss(decorrido)}</span></div>
    <div class="barra"><span style="width:${pct(Object.keys(sim.respostas).length, sim.pool.length)}%"></span></div>
    ${blocoQuestao(q, sim.idx, sim.respostas[q.id], false, "sim")}
    <div class="acoes" style="justify-content:space-between;margin:16px 0">
      <button class="botao claro" data-ir="${sim.idx - 1}" ${sim.idx === 0 ? "disabled" : ""}>← Anterior</button>
      ${sim.idx + 1 < sim.pool.length ? `<button class="botao" data-ir="${sim.idx + 1}">Próxima →</button>` : `<button class="botao" data-finalizar="1">Finalizar e corrigir</button>`}
    </div>
    <div class="mapa">${mapa}</div>
    <p class="fraco" style="text-align:center;font-size:15px">${Object.keys(sim.respostas).length} de ${sim.pool.length} respondidas · você pode finalizar a qualquer momento</p>`;
}

function telaSimuladoResultado() {
  const sim = estado.sim;
  const acertos = sim.pool.filter((q) => sim.respostas[q.id] === q.correta).length;
  const porTema = {};
  for (const q of sim.pool) { porTema[q.resumo] ??= { a: 0, n: 0 }; porTema[q.resumo].n++; if (sim.respostas[q.id] === q.correta) porTema[q.resumo].a++; }
  const linhas = Object.entries(porTema).map(([id, v]) => `<tr><td>${esc(tituloTema(id))}</td><td class="num">${v.a}/${v.n}</td><td class="num">${pct(v.a, v.n)}%</td><td>${pct(v.a, v.n) < 60 ? `<a href="${esc(estado.resumos[id]?.apostila ?? "#/resumos")}" target="_blank" rel="noopener">revisar a apostila</a>` : "—"}</td></tr>`).join("");
  const tempo = Math.floor(((sim.fimEm ?? Date.now()) - sim.inicio) / 1000);
  const correcao = sim.pool.map((q, i) => blocoQuestao(q, i, sim.respostas[q.id], true, "sim")).join("");
  return `
    ${abertura("Simulado concluído", `${pct(acertos, sim.pool.length)}%`, `${acertos} de ${sim.pool.length} questões · tempo ${mmss(tempo)}. Resultado de estudo, não é nota acadêmica.`)}
    <table class="tabela"><thead><tr><th>Tema</th><th class="num">Acertos</th><th class="num">%</th><th></th></tr></thead><tbody>${linhas}</tbody></table>
    <div class="acoes" style="justify-content:center;margin:18px 0 6px"><button class="botao" data-novo-sim="1">Montar outro simulado</button><button class="botao claro" data-refazer-sim="1">Refazer este</button></div>
    <section style="margin-top:22px"><span class="rotulo">Correção comentada</span>${correcao}</section>`;
}

/** Copia a questão com as alternativas em nova ordem e o gabarito ajustado, para a prova não virar decoreba. */
function embaralharAlternativas(q) {
  const ordem = embaralhar(q.alternativas.map((_, i) => i));
  return { ...q, alternativas: ordem.map((i) => q.alternativas[i]), correta: ordem.indexOf(q.correta) };
}

function iniciarSimulado(pool) {
  pool = pool.map(embaralharAlternativas);
  estado.sim = { pool, idx: 0, respostas: {}, fim: false, inicio: Date.now() };
  location.hash = "#/simulado/prova";
}

function finalizarSimulado() {
  const sim = estado.sim;
  sim.fim = true; sim.fimEm = Date.now();
  const hist = ler("toce-simulados", []);
  const porTema = {};
  for (const q of sim.pool) { porTema[q.resumo] ??= { a: 0, n: 0 }; porTema[q.resumo].n++; if (sim.respostas[q.id] === q.correta) porTema[q.resumo].a++; }
  hist.push({ data: new Date().toISOString().slice(0, 10), n: sim.pool.length, acertos: sim.pool.filter((q) => sim.respostas[q.id] === q.correta).length, temas: Object.keys(porTema), porTema });
  guardar("toce-simulados", hist.slice(-30));
  render(); window.scrollTo(0, 0);
}

/* ---------- treino (OSCE) ---------- */
function telaOsce() {
  const resultados = ler("toce-osce", {});
  const notas = ler("toce-casos", {});
  const filtro = estado.osceFiltro;
  const praticas = estado.estacoes.map((e) => ({ ...e, tipo: "pratica" }));
  const escritas = estado.casos.map((c) => ({ ...c, tipo: "escrita" }));
  const todas = [...praticas, ...escritas].filter((e) => filtro === "todas" || e.tipo === filtro)
    .sort((a, b) => estado.sessoes.findIndex((x) => x.id === a.sessao) - estado.sessoes.findIndex((x) => x.id === b.sessao));
  const cards = todas.map((e) => {
    const s = sessaoPorId(e.sessao);
    const ult = e.tipo === "pratica" ? (resultados[e.id] ?? []).at(-1) : undefined;
    const nota = e.tipo === "escrita" ? (notas[e.id] ?? []).at(-1) : undefined;
    return `<a class="estacao-card caso-card ${e.tipo}" href="#/osce/${esc(e.id)}">
      <div><span class="rotulo">${e.tipo === "pratica" ? "Prática · checklist" : `Escrita · ${(e.etapas ?? []).length} etapas`} · ${e.minutos} min${s ? ` · ${esc(rotuloSessao(s))}` : ""}</span>
      <h3>${esc(e.titulo)}</h3>
      ${e.local ? `<small class="local">${esc(e.local)}</small>` : ""}
      ${ult ? `<small class="fraco">Último treino: ${ult.pct}% do checklist</small>` : ""}${nota !== undefined ? `<small class="fraco">Última correção: ${nota}% dos pontos-chave</small>` : ""}</div></a>`;
  }).join("");
  return `
    ${abertura("OSCE", "Estações de OSCE", "Estações práticas, com checklist e cronômetro, e estações escritas, com caso em etapas e exames de imagem. Sorteie uma ou escolha.")}
    <div class="acoes" style="justify-content:center;margin-bottom:14px">
      <button class="botao" data-sortear="todas">⤨ Sortear qualquer estação</button>
      <button class="botao claro" data-sortear="pratica">Sortear prática</button>
      <button class="botao claro" data-sortear="escrita">Sortear escrita</button>
    </div>
    <div class="abas">${[["todas", "Todas"], ["pratica", "Práticas"], ["escrita", "Escritas"]].map(([k, n]) => `<button class="${filtro === k ? "ativo" : ""}" data-osce-filtro="${k}">${n}</button>`).join("")}</div>
    <section class="casos-lista">${cards}</section>
    <p class="fraco" style="text-align:center;margin-top:22px;font-style:italic">Material da monitoria a partir das apostilas e de fontes primárias. Não substitui a rubrica oficial do OSCE.</p>`;
}

function blocoRelogio(e) {
  const o = estado.osce;
  const visor = o.fase === "leitura" ? `Leitura ${mmss(o.leitura)}` : o.fase === "fim" ? "Encerrada" : mmss(o.resta || e.minutos * 60);
  const principal = o.fase === "pronto" ? "Começar (1 min de leitura)" : o.fase === "fim" ? "Recomeçar" : estado.timer ? "Pausar" : "Continuar";
  return `<div style="margin:18px 0 6px">
      <div class="relogio ${o.fase === "fim" ? "fim" : ""}" id="relogio">${visor}</div>
      <div class="acoes" style="justify-content:center">
        <button class="botao" data-osce="principal">${principal}</button>
        ${o.fase !== "pronto" && o.fase !== "fim" ? `<button class="botao claro" data-osce="encerrar">Encerrar estação</button>` : ""}
        ${o.fase !== "pronto" ? `<button class="botao claro" data-osce="zerar">Zerar</button>` : ""}
      </div></div>`;
}

const MODOS = {
  treino: { nome: "Treino aberto", ajuda: "Checklist visível o tempo todo, para aprender a sequência. Cronômetro opcional." },
  individual: { nome: "OSCE individual", ajuda: "1 minuto de leitura da porta, depois o tempo da estação. O checklist fica oculto e é liberado ao final para você se autoavaliar." },
  dupla: { nome: "OSCE em dupla", ajuda: "Um faz a estação; o colega lê o checklist e marca o que foi feito. 1 minuto de leitura, depois o tempo da estação." },
};

function telaEstacao(id) {
  const e = estado.estacoes.find((x) => x.id === id);
  if (!e) return telaOsce();
  const o = estado.osce;
  const oculto = o.modo === "individual" && o.fase !== "fim";
  const passos = e.passos.map((p, i) => `<li><label><input type="checkbox" data-passo="${i}"><span>${esc(p)}</span></label></li>`).join("");
  const visor = o.fase === "leitura" ? `Leitura ${mmss(o.leitura)}` : o.fase === "fim" ? "Encerrada" : mmss(o.resta || e.minutos * 60);
  const botaoPrincipal = o.fase === "pronto" ? (o.modo === "treino" ? "Iniciar cronômetro" : "Começar (1 min de leitura)")
    : o.fase === "fim" ? "Recomeçar" : estado.timer ? "Pausar" : "Continuar";
  return `
    <a class="voltar" href="#/osce">← Todas as estações</a>
    ${abertura(`Estação · ${e.minutos} minutos`, esc(e.titulo), "")}
    <div class="abas">${Object.entries(MODOS).map(([k, m]) => `<button class="${o.modo === k ? "ativo" : ""}" data-modo="${k}">${m.nome}</button>`).join("")}</div>
    <p class="fraco" style="text-align:center;font-style:italic;margin:-6px 0 16px">${MODOS[o.modo].ajuda}</p>
    <div class="caixa"><span class="rotulo">Instrução de porta</span><p style="margin:4px 0 0">${esc(e.cenario)}</p></div>
    ${e.caso ? `<p style="text-align:center;margin:12px 0 0"><a href="#/osce/${esc(e.caso)}">Antes da prática: faça o caso clínico desta estação (decisão, material e técnica) →</a></p>` : ""}
    <div style="margin:22px 0 6px">
      <div class="relogio ${o.fase === "fim" ? "fim" : ""}" id="relogio">${visor}</div>
      <div class="acoes" style="justify-content:center">
        <button class="botao" data-osce="principal">${botaoPrincipal}</button>
        ${o.fase !== "pronto" && o.fase !== "fim" ? `<button class="botao claro" data-osce="encerrar">Encerrar estação</button>` : ""}
        ${o.fase !== "pronto" ? `<button class="botao claro" data-osce="zerar">Zerar</button>` : ""}
      </div>
    </div>
    ${oculto ? `<div class="caixa oculto"><span class="rotulo">Checklist oculto durante a tentativa</span><p>Ele será liberado quando você encerrar a estação, para a autoavaliação.</p></div>`
      : `<p class="rotulo" style="text-align:center;margin-top:18px">${o.modo === "dupla" ? "Área do colega avaliador" : o.modo === "individual" ? "Autoavaliação" : "Checklist"}</p>
         <ol class="checklist">${passos}</ol>
         <p class="placar" id="progresso">0 de ${e.passos.length} itens</p>
         ${o.modo !== "treino" ? `<div class="acoes" style="justify-content:center;margin-bottom:14px"><button class="botao" data-osce="salvar">Salvar resultado</button></div>` : ""}`}
    <div class="acoes" style="justify-content:center">${botoesResumo(e.resumo)}</div>`;
}

function pararRelogio() { if (estado.timer) { clearInterval(estado.timer); estado.timer = null; } }

function tickOsce(e) {
  const o = estado.osce;
  const visor = document.getElementById("relogio");
  if (o.fase === "leitura") {
    o.leitura -= 1;
    if (o.leitura <= 0) { o.fase = "estacao"; o.resta = e.minutos * 60; }
  } else if (o.fase === "estacao") {
    o.resta -= 1;
    if (o.resta <= 0) { pararRelogio(); o.fase = "fim"; render(); return; }
  }
  if (visor) visor.textContent = o.fase === "leitura" ? `Leitura ${mmss(o.leitura)}` : mmss(o.resta);
}

/* ---------- estação escrita (caso em etapas) ---------- */
// etapa de decisão: "unica" vira escolha única; senão, marque tudo o que usaria
function blocoOpcoes(p, chave, aberto, textos) {
  const sel = JSON.parse(textos[`${chave}:sel`] ?? "[]");
  // ordem embaralhada, mas fixa por pergunta (semente = chave), para a certa não ficar sempre em primeiro
  let s = [...chave].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 2654435761) >>> 0, 2166136261);
  const sorteio = () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const ordem = p.opcoes.map((_, j) => j);
  for (let k = ordem.length - 1; k > 0; k--) { const r = Math.floor(sorteio() * (k + 1)); [ordem[k], ordem[r]] = [ordem[r], ordem[k]]; }
  const itens = ordem.map((j) => [p.opcoes[j], j]).map(([o, j]) => {
    const marcou = sel.includes(j);
    if (!aberto) return `<li><label><input type="${p.unica ? "radio" : "checkbox"}" name="${esc(chave)}" data-opcao="${esc(chave)}" value="${j}" ${marcou ? "checked" : ""}><span>${esc(o.texto)}</span></label></li>`;
    const acerto = marcou === !!o.certo;
    const sinal = marcou ? (o.certo ? "✓ escolheu, correto" : "✗ escolheu, mas não deveria") : (o.certo ? "○ deixou de escolher" : "");
    return `<li class="opcao ${acerto ? "acerto" : "erro"} ${o.certo ? "certa" : ""}" data-acerto="${acerto ? 1 : 0}">
      <span class="texto-opcao">${esc(o.texto)}</span>${sinal ? ` <span class="sinal">${sinal}</span>` : ""}
      ${o.porque ? `<small>${esc(o.porque)}</small>` : ""}</li>`;
  }).join("");
  return `<span class="rotulo">${p.unica ? "Escolha uma" : "Marque tudo o que você usaria"}</span><ul class="pontos opcoes">${itens}</ul>`;
}

function telaCaso(id) {
  const c = estado.casos.find((x) => x.id === id);
  if (!c) return telaOsce();
  const textos = ler("toce-casos-texto", {});
  const aberto = estado.casoAberto[id];
  const visiveis = aberto ? c.etapas.length : (estado.casoEtapa[id] ?? 0) + 1;
  const etapas = c.etapas.slice(0, visiveis).map((p, i) => {
    const chave = `${id}:${i}`;
    const pontos = (p.pontos ?? []).map((pt, j) => `<li><label><input type="checkbox" data-ponto="${i}-${j}"><span>${esc(pt)}</span></label></li>`).join("");
    return `<section class="pergunta-caso">
      <span class="rotulo">Etapa ${i + 1} de ${c.etapas.length}</span>
      ${p.dado ? `<div class="caixa dado"><span class="rotulo">Evolução</span><p style="margin:2px 0 0">${esc(p.dado)}</p></div>` : ""}
      ${p.imagem ? `<figure class="imagem-caso"><img src="${esc(p.imagem)}" alt="Exame da etapa ${i + 1}"><figcaption>${esc(p.credito ?? "")}</figcaption></figure>` : ""}
      <p class="enunciado">${esc(p.pergunta)}</p>
      ${p.opcoes ? blocoOpcoes(p, chave, aberto, textos) : ""}
      ${p.pontos ? `<textarea data-texto="${esc(chave)}" rows="4" placeholder="${p.opcoes ? "Justifique a sua escolha…" : "Escreva sua resposta…"}">${esc(textos[chave] ?? "")}</textarea>` : ""}
      ${aberto && (p.pontos || p.resposta || p.imagemGabarito) ? `<div class="caixa gabarito">${p.pontos ? `<span class="rotulo">Pontos-chave · marque os que você escreveu</span><ul class="pontos">${pontos}</ul>` : ""}
        ${p.resposta ? `<span class="rotulo" style="display:block;margin-top:10px">Resposta esperada</span><p style="margin:2px 0 0">${esc(p.resposta)}</p>` : ""}
        ${p.imagemGabarito ? `<figure class="imagem-caso"><img src="${esc(p.imagemGabarito)}" alt="Figura da correção"><figcaption>${esc(p.creditoGabarito ?? "")}</figcaption></figure>` : ""}</div>` : ""}
    </section>`;
  }).join("");
  const ultima = visiveis >= c.etapas.length;
  const botoes = aberto
    ? `<button class="botao" data-nota-caso="${esc(id)}">Salvar minha correção</button><span class="placar" id="nota-caso" style="margin:0"></span>`
    : ultima ? `<button class="botao" data-abrir-caso="${esc(id)}">Encerrar e ver a correção</button>`
      : `<button class="botao" data-proxima-etapa="${esc(id)}">Próxima etapa →</button>`;
  return `
    <a class="voltar" href="#/osce">← Todas as estações</a>
    ${abertura(`${c.local ? `${esc(c.local)} · ` : ""}${c.minutos} minutos · ${c.etapas.length} etapas`, esc(c.titulo), "")}
    <div class="caixa"><span class="rotulo">Instrução de porta</span><p style="margin:4px 0 0">${esc(c.enunciado)}</p></div>
    ${blocoRelogio(c)}
    ${c.historia ? `<section class="prontuario"><h2>Caso clínico</h2>${c.historia.map((h) => `<p><span class="campo">${esc(h.rotulo)}.</span> ${esc(h.texto)}</p>`).join("")}</section>
    <h2 class="titulo-perguntas">Perguntas</h2>` : ""}
    ${etapas}
    <div class="acoes" style="justify-content:center;margin:18px 0">${botoes}</div>
    <p class="fraco" style="text-align:center;font-size:15px">Fonte: ${esc(c.fonte)}</p>
    ${c.resumo ? `<div class="acoes" style="justify-content:center">${botoesResumo(c.resumo)}</div>` : ""}`;
}

/* ---------- desempenho ---------- */
function sinal(p) {
  if (p === null) return ["iniciar", "Comece por aqui"];
  if (p < 60) return ["revisar", "Revisar"];
  if (p < 80) return ["evolucao", "Em evolução"];
  return ["forte", "Ponto forte"];
}

function telaDesempenho() {
  const respostas = ler("toce-respostas", {});
  const sims = ler("toce-simulados", []);
  const osce = ler("toce-osce", {});
  const casos = ler("toce-casos", {});
  const linhas = Object.entries(estado.resumos).map(([id, r]) => {
    const qs = estado.questoes.filter((q) => q.resumo === id);
    let a = 0, n = 0;
    for (const q of qs) if (q.id in respostas) { n++; if (respostas[q.id] === q.correta) a++; }
    for (const s of sims) if (s.porTema?.[id]) { a += s.porTema[id].a; n += s.porTema[id].n; }
    const est = estado.estacoes.filter((e) => e.resumo === id).map((e) => (osce[e.id] ?? []).at(-1)).filter(Boolean);
    const notasCasos = estado.casos.filter((c) => c.resumo === id).map((c) => (casos[c.id] ?? []).at(-1)).filter((x) => x !== undefined);
    const p = n ? pct(a, n) : null;
    const [cls, txt] = sinal(p);
    return `<tr><td>${esc(r.titulo)}</td><td class="num">${n ? `${a}/${n} · ${p}%` : "—"}</td><td class="num">${est.length ? est.map((x) => `${x.pct}%`).join(", ") : "—"}</td><td class="num">${notasCasos.length ? `${Math.round(notasCasos.reduce((a, b) => a + b, 0) / notasCasos.length)}%` : "—"}</td>
      <td><span class="sinal ${cls}">${txt}</span>${cls === "revisar" ? ` · <a href="${esc(r.apostila)}" target="_blank" rel="noopener">apostila</a>` : ""}</td></tr>`;
  }).join("");
  return `
    ${abertura("Desempenho", "Seu mapa de estudo", "Junta o modo estudo, os simulados e os treinos de OSCE feitos neste aparelho. É uma ferramenta de estudo, não uma nota.")}
    <table class="tabela"><thead><tr><th>Tema</th><th class="num">Questões</th><th class="num">OSCE</th><th class="num">Casos</th><th>Sinal</th></tr></thead><tbody>${linhas}</tbody></table>
    <p class="fraco" style="text-align:center;font-size:15px;margin-top:14px">Abaixo de 60% de acerto o tema aparece como "Revisar"; de 60% a 79%, "Em evolução"; 80% ou mais, "Ponto forte".</p>
    <div class="acoes" style="justify-content:center;margin-top:10px"><button class="botao claro" data-apagar-tudo="1">Apagar meus dados deste aparelho</button></div>`;
}

/* ---------- interação ---------- */
conteudo.addEventListener("click", (ev) => {
  const t = (sel) => ev.target.closest(sel);
  let el;

  if ((el = t("[data-q][data-alt]"))) {
    const respostas = ler("toce-respostas", {});
    respostas[el.dataset.q] = Number(el.dataset.alt);
    guardar("toce-respostas", respostas);
    const y = window.scrollY; render(); window.scrollTo(0, y); return;
  }
  if ((el = t("[data-sim][data-alt]"))) { estado.sim.respostas[el.dataset.sim] = Number(el.dataset.alt); const y = window.scrollY; render(); window.scrollTo(0, y); return; }
  if ((el = t("[data-filtro]"))) { location.hash = el.dataset.filtro ? `#/questoes/${el.dataset.filtro}` : "#/questoes"; return; }
  if ((el = t("[data-zerar]"))) {
    ev.preventDefault();
    const respostas = ler("toce-respostas", {});
    const alvo = location.hash.split("/")[2];
    for (const q of estado.questoes) if (!alvo || q.resumo === alvo) delete respostas[q.id];
    guardar("toce-respostas", respostas); render(); return;
  }

  /* simulado */
  if ((el = t("[data-todos]"))) { const todos = Object.keys(estado.resumos); estado.simConfig.temas = estado.simConfig.temas.length === todos.length ? [] : todos; render(); return; }
  if ((el = t("[data-n]"))) { estado.simConfig.n = Number(el.dataset.n); render(); return; }
  if ((el = t("[data-mini]"))) {
    estado.simConfig.temas = Object.keys(estado.resumos);
    iniciarSimulado(embaralhar(estado.questoes).slice(0, Number(el.dataset.mini))); return;
  }
  if ((el = t("[data-iniciar-sim]"))) {
    const pool = embaralhar(estado.questoes.filter((q) => estado.simConfig.temas.includes(q.resumo))).slice(0, estado.simConfig.n);
    iniciarSimulado(pool); return;
  }
  if ((el = t("[data-ir]"))) { estado.sim.idx = Number(el.dataset.ir); render(); window.scrollTo(0, 0); return; }
  if ((el = t("[data-finalizar]"))) {
    const faltam = estado.sim.pool.length - Object.keys(estado.sim.respostas).length;
    if (faltam > 0 && !el.dataset.confirmado) { el.dataset.confirmado = "1"; el.textContent = `Faltam ${faltam}. Clique de novo para finalizar`; return; }
    finalizarSimulado(); return;
  }
  if ((el = t("[data-novo-sim]"))) { estado.sim = null; location.hash = "#/simulado"; return; }
  if ((el = t("[data-refazer-sim]"))) { iniciarSimulado(embaralhar(estado.sim.pool)); return; }

  /* treino */
  if ((el = t("[data-sortear]"))) {
    const tipo = el.dataset.sortear;
    const pool = [...(tipo !== "escrita" ? estado.estacoes : []), ...(tipo !== "pratica" ? estado.casos : [])];
    const e = pool[Math.floor(Math.random() * pool.length)]; location.hash = `#/osce/${e.id}`; return;
  }
  if ((el = t("[data-osce-filtro]"))) { estado.osceFiltro = el.dataset.osceFiltro; render(); return; }
  if ((el = t("[data-proxima-etapa]"))) { const id = el.dataset.proximaEtapa; estado.casoEtapa[id] = (estado.casoEtapa[id] ?? 0) + 1; const y = window.scrollY; render(); window.scrollTo(0, y); return; }
  if ((el = t("[data-modo]"))) { pararRelogio(); estado.osce = { modo: el.dataset.modo, fase: "pronto", resta: 0, leitura: 0 }; render(); return; }
  if ((el = t("[data-osce]"))) {
    const id = location.hash.split("/")[2];
    const e = estado.estacoes.find((x) => x.id === id) ?? estado.casos.find((x) => x.id === id);
    const o = estado.osce;
    const acao = el.dataset.osce;
    if (acao === "zerar") { pararRelogio(); estado.osce = { modo: o.modo, fase: "pronto", resta: 0, leitura: 0 }; render(); return; }
    if (acao === "encerrar") { pararRelogio(); o.fase = "fim"; render(); return; }
    if (acao === "salvar") {
      const todos = conteudo.querySelectorAll("[data-passo]");
      const marcados = [...todos].filter((c) => c.checked).length;
      const res = ler("toce-osce", {});
      (res[id] ??= []).push({ data: new Date().toISOString().slice(0, 10), modo: MODOS[o.modo].nome, pct: pct(marcados, todos.length) });
      guardar("toce-osce", res);
      el.textContent = `Salvo: ${pct(marcados, todos.length)}% do checklist`; el.disabled = true; return;
    }
    // principal
    if (o.fase === "fim") { estado.osce = { modo: o.modo, fase: "pronto", resta: 0, leitura: 0 }; render(); return; }
    if (estado.timer) { pararRelogio(); el.textContent = "Continuar"; return; }
    if (o.fase === "pronto") {
      if (o.modo === "treino" && !e.etapas) { o.fase = "estacao"; o.resta = e.minutos * 60; }
      else { o.fase = "leitura"; o.leitura = 60; }
      render();
    }
    estado.timer = setInterval(() => tickOsce(e), 1000);
    const botao = conteudo.querySelector('[data-osce="principal"]'); if (botao) botao.textContent = "Pausar";
    return;
  }

  if ((el = t("[data-abrir-caso]"))) { estado.casoAberto[el.dataset.abrirCaso] = true; const y = window.scrollY; render(); window.scrollTo(0, y); return; }
  if ((el = t("[data-nota-caso]"))) {
    const pts = [...conteudo.querySelectorAll("[data-ponto]")]; const ops = [...conteudo.querySelectorAll("[data-acerto]")];
    const todos = { length: pts.length + ops.length };
    const marcados = pts.filter((c) => c.checked).length + ops.filter((o) => o.dataset.acerto === "1").length;
    const nota = pct(marcados, todos.length); const notas = ler("toce-casos", {});
    (notas[el.dataset.notaCaso] ??= []).push(nota); guardar("toce-casos", notas);
    document.getElementById("nota-caso").textContent = `${marcados} de ${todos.length} itens corretos · ${nota}% · salvo`; return;
  }
  if ((el = t("[data-apagar-tudo]"))) {
    if (!el.dataset.confirmado) { el.dataset.confirmado = "1"; el.textContent = "Clique de novo para confirmar"; return; }
    ["toce-respostas", "toce-simulados", "toce-osce", "toce-casos", "toce-casos-texto"].forEach((k) => { try { localStorage.removeItem(k); } catch { /* sem armazenamento */ } });
    render(); return;
  }
});

conteudo.addEventListener("input", (ev) => {
  if (!ev.target.matches("[data-texto]")) return;
  const textos = ler("toce-casos-texto", {}); textos[ev.target.dataset.texto] = ev.target.value; guardar("toce-casos-texto", textos);
});

conteudo.addEventListener("change", (ev) => {
  if (ev.target.matches("[data-opcao]")) {
    const chave = ev.target.dataset.opcao; const textos = ler("toce-casos-texto", {});
    textos[`${chave}:sel`] = JSON.stringify([...conteudo.querySelectorAll(`[data-opcao="${CSS.escape(chave)}"]`)].filter((x) => x.checked).map((x) => Number(x.value)));
    guardar("toce-casos-texto", textos); return;
  }
  if (ev.target.matches("[data-tema]")) {
    const id = ev.target.dataset.tema; const temas = estado.simConfig.temas;
    estado.simConfig.temas = temas.includes(id) ? temas.filter((x) => x !== id) : [...temas, id];
    render(); return;
  }
  if (ev.target.matches("[data-passo]")) {
    const todos = conteudo.querySelectorAll("[data-passo]");
    const marcados = [...todos].filter((c) => c.checked).length;
    const prog = document.getElementById("progresso"); if (prog) prog.textContent = `${marcados} de ${todos.length} itens`;
  }
});

setInterval(() => { const d = document.getElementById("decorrido"); if (d && estado.sim && !estado.sim.fim) d.textContent = mmss(Math.floor((Date.now() - estado.sim.inicio) / 1000)); }, 1000);

/* ---------- rotas ---------- */
let rotaAnterior = "";
function render() {
  const hash = location.hash.replace(/^#/, "");
  let [, rota = "", parametro] = hash.split("/");
  if (rota === "treino" || rota === "casos") { location.replace(`#/osce${parametro && parametro !== "tema" ? `/${parametro}` : ""}`); return; }
  if (hash !== rotaAnterior && rota === "osce") { pararRelogio(); estado.osce = { modo: estado.osce.modo, fase: "pronto", resta: 0, leitura: 0 }; }
  if (rota !== "osce") pararRelogio();
  rotaAnterior = hash;
  let html;
  if (rota === "resumos") html = telaResumos();
  else if (rota === "questoes") html = telaQuestoes(parametro);
  else if (rota === "simulado") html = parametro === "prova" ? telaSimuladoProva() : telaSimuladoConfig();
  else if (rota === "osce") html = !parametro ? telaOsce() : estado.estacoes.some((x) => x.id === parametro) ? telaEstacao(parametro) : telaCaso(parametro);
  else if (rota === "desempenho") html = telaDesempenho();
  else html = telaInicio();
  conteudo.innerHTML = html;
  const ativa = rota === "simulado" ? "questoes" : rota || "inicio";
  document.querySelectorAll(".menu a").forEach((a) => a.classList.toggle("ativo", a.dataset.rota === ativa));
}

window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });

Promise.all(["sessoes", "resumos", "questoes", "treino", "casos"].map((n) => fetch(`dados/${n}.json`).then((r) => r.json())))
  .then(([s, r, q, t, c]) => {
    estado.sessoes = s.sessoes; estado.resumos = r; estado.questoes = q.questoes; estado.estacoes = t.estacoes; estado.casos = c.casos;
    estado.simConfig.temas = Object.keys(r);
    render();
  })
  .catch(() => { conteudo.innerHTML = `<p class="carregando">Não foi possível carregar o conteúdo. Abra o site por um servidor (não direto do arquivo).</p>`; });
