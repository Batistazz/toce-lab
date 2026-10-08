/* TOCE Lab · 8º período — site estático: Resumos, Treino e Questões. */
"use strict";

const estado = { sessoes: [], resumos: {}, questoes: [], estacoes: [], timer: null };
const conteudo = document.getElementById("conteudo");

const esc = (texto) => String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dataBR = (iso) => { const [, m, d] = iso.split("-"); return `${d}/${m}`; };
const dataCompleta = (iso) => { const [a, m, d] = iso.split("-"); return `${d}/${m}/${a}`; };
const rotuloSessao = (s) => (s.numero === "Revisão" ? "Revisão" : `Sessão ${s.numero}`);
const sessaoPorId = (id) => estado.sessoes.find((s) => s.id === id);
const temaDaSessao = (s) => (s.teoria.startsWith("Sem aula") ? `${s.pratica} (só prática)` : s.teoria);

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

/* ---------- telas ---------- */

function telaInicio() {
  const p = proximaSessao();
  const nResumos = Object.keys(estado.resumos).length;
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
    <section class="abertura">
      <span class="rotulo">Habilidades Cirúrgicas · TOCE</span>
      <h1>Monitoria do 8º período</h1>
      <p>Apostilas de estudo, revisões flash, treino de procedimentos e questões comentadas, sessão por sessão.</p>
      <div class="filete"></div>
    </section>
    ${proxima}
    <section class="portas">
      <a class="porta" href="#/resumos"><span class="num">${nResumos}</span><h3>Resumos</h3><p>Apostila de Estudo e Revisão Flash de cada sessão, para ler ou baixar.</p></a>
      <a class="porta" href="#/treino"><span class="num">${estado.estacoes.length}</span><h3>Treino</h3><p>Estações com cenário, checklist passo a passo e cronômetro, no formato do OSCE.</p></a>
      <a class="porta" href="#/questoes"><span class="num">${estado.questoes.length}</span><h3>Questões</h3><p>Questões de múltipla escolha com correção na hora e comentário com a fonte.</p></a>
    </section>`;
}

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
    <section class="abertura"><span class="rotulo">Resumos</span><h1>Apostilas e revisões</h1>
      <p>Cada tema tem uma Apostila de Estudo completa e uma Revisão Flash de uma página.</p><div class="filete"></div></section>
    ${cards}
    <section style="margin-top:34px">
      <span class="rotulo">Cronograma 2026.2</span>
      <ul class="sessoes">${sessoes}</ul>
    </section>`;
}

function telaQuestoes(filtro) {
  const temas = Object.entries(estado.resumos);
  const lista = filtro ? estado.questoes.filter((q) => q.resumo === filtro) : estado.questoes;
  const respostas = ler("toce-respostas", {});
  const feitas = lista.filter((q) => q.id in respostas);
  const acertos = feitas.filter((q) => respostas[q.id] === q.correta).length;
  const botoesFiltro = [`<button class="${filtro ? "" : "ativo"}" data-filtro="">Todas</button>`]
    .concat(temas.map(([id, r]) => `<button class="${filtro === id ? "ativo" : ""}" data-filtro="${esc(id)}">${esc(r.titulo)}</button>`)).join("");
  const itens = lista.map((q, i) => {
    const resp = respostas[q.id];
    const respondida = resp !== undefined;
    const alts = q.alternativas.map((a, j) => {
      let classe = "";
      if (respondida && j === q.correta) classe = "certa";
      else if (respondida && j === resp) classe = "errada";
      return `<li><button data-q="${esc(q.id)}" data-alt="${j}" class="${classe}" ${respondida ? "disabled" : ""}><b>${"ABCD"[j]})</b><span>${esc(a)}</span></button></li>`;
    }).join("");
    const comentario = respondida ? `
      <div class="comentario caixa ${resp === q.correta ? "acerto" : "erro"}">
        <span class="rotulo">${resp === q.correta ? "Correto" : `Resposta: ${"ABCD"[q.correta]}`}</span>
        <div>${esc(q.comentario)}</div><small>Fonte: ${esc(q.fonte)}</small>
      </div>` : "";
    const sessao = sessaoPorId(q.sessao);
    return `<article class="questao"><span class="rotulo">Questão ${i + 1} · ${esc(estado.resumos[q.resumo]?.titulo ?? "")}${sessao ? ` · ${rotuloSessao(sessao)}` : ""}</span>
      <p class="enunciado">${esc(q.enunciado)}</p><ul class="alternativas">${alts}</ul>${comentario}</article>`;
  }).join("");
  return `
    <section class="abertura"><span class="rotulo">Questões</span><h1>Questões comentadas</h1>
      <p>Responda e veja na hora a correção e a fonte. Suas respostas ficam só neste aparelho.</p><div class="filete"></div></section>
    <div class="filtros">${botoesFiltro}</div>
    <p class="placar">${feitas.length} de ${lista.length} respondidas · ${acertos} acerto${acertos === 1 ? "" : "s"}
      ${feitas.length ? ` · <a href="#" data-zerar="1">recomeçar</a>` : ""}</p>
    ${itens || `<p class="fraco" style="text-align:center">Ainda não há questões deste tema.</p>`}`;
}

function telaTreino() {
  const cards = estado.estacoes.map((e) => {
    const s = sessaoPorId(e.sessao);
    return `<a class="estacao-card" href="#/treino/${esc(e.id)}"><span class="rotulo">${s ? esc(rotuloSessao(s)) : ""} · ${e.minutos} min</span>
      <h3>${esc(e.titulo)}</h3><p>${esc(e.cenario)}</p></a>`;
  }).join("");
  return `
    <section class="abertura"><span class="rotulo">Treino</span><h1>Estações de procedimento</h1>
      <p>Leia o cenário, ligue o cronômetro e siga o checklist como numa estação de OSCE.</p><div class="filete"></div></section>
    <section class="estacoes">${cards}</section>
    <p class="fraco" style="text-align:center;margin-top:22px;font-style:italic">Checklists da monitoria a partir das apostilas. Não substituem a rubrica oficial do OSCE.</p>`;
}

function telaEstacao(id) {
  const e = estado.estacoes.find((x) => x.id === id);
  if (!e) return telaTreino();
  const passos = e.passos.map((p, i) => `<li><label><input type="checkbox" data-passo="${i}"><span>${esc(p)}</span></label></li>`).join("");
  return `
    <a class="voltar" href="#/treino">← Todas as estações</a>
    <section class="abertura"><span class="rotulo">Estação · ${e.minutos} minutos</span><h1>${esc(e.titulo)}</h1><div class="filete"></div></section>
    <div class="caixa"><span class="rotulo">Cenário</span><p style="margin:4px 0 0">${esc(e.cenario)}</p></div>
    <div style="margin:22px 0 6px">
      <div class="relogio" id="relogio" data-total="${e.minutos * 60}">${String(e.minutos).padStart(2, "0")}:00</div>
      <div class="acoes" style="justify-content:center">
        <button class="botao" data-relogio="iniciar">Iniciar</button>
        <button class="botao claro" data-relogio="zerar">Zerar</button>
      </div>
    </div>
    <ol class="checklist">${passos}</ol>
    <p class="placar" id="progresso">0 de ${e.passos.length} itens</p>
    <div class="acoes" style="justify-content:center">${botoesResumo(e.resumo)}</div>`;
}

/* ---------- interação ---------- */

function pararRelogio() { if (estado.timer) { clearInterval(estado.timer); estado.timer = null; } }

conteudo.addEventListener("click", (ev) => {
  const alt = ev.target.closest("[data-alt]");
  if (alt) {
    const respostas = ler("toce-respostas", {});
    respostas[alt.dataset.q] = Number(alt.dataset.alt);
    guardar("toce-respostas", respostas);
    const y = window.scrollY; render(); window.scrollTo(0, y);
    return;
  }
  const filtro = ev.target.closest("[data-filtro]");
  if (filtro) { location.hash = filtro.dataset.filtro ? `#/questoes/${filtro.dataset.filtro}` : "#/questoes"; return; }
  const zerar = ev.target.closest("[data-zerar]");
  if (zerar) {
    ev.preventDefault();
    const respostas = ler("toce-respostas", {});
    const alvo = location.hash.split("/")[2];
    for (const q of estado.questoes) if (!alvo || q.resumo === alvo) delete respostas[q.id];
    guardar("toce-respostas", respostas); render(); return;
  }
  const relogio = ev.target.closest("[data-relogio]");
  if (relogio) {
    const visor = document.getElementById("relogio");
    const total = Number(visor.dataset.total);
    if (relogio.dataset.relogio === "zerar") { pararRelogio(); visor.textContent = `${String(total / 60).padStart(2, "0")}:00`; visor.classList.remove("fim"); return; }
    if (estado.timer) { pararRelogio(); relogio.textContent = "Continuar"; return; }
    const [m, s] = visor.textContent.split(":").map(Number);
    let resta = m * 60 + s;
    relogio.textContent = "Pausar";
    estado.timer = setInterval(() => {
      resta -= 1;
      visor.textContent = `${String(Math.floor(Math.max(resta, 0) / 60)).padStart(2, "0")}:${String(Math.max(resta, 0) % 60).padStart(2, "0")}`;
      if (resta <= 0) { pararRelogio(); visor.classList.add("fim"); visor.textContent = "Tempo!"; relogio.textContent = "Iniciar"; }
    }, 1000);
  }
});

conteudo.addEventListener("change", (ev) => {
  if (!ev.target.matches("[data-passo]")) return;
  const todos = conteudo.querySelectorAll("[data-passo]");
  const marcados = [...todos].filter((c) => c.checked).length;
  document.getElementById("progresso").textContent = `${marcados} de ${todos.length} itens`;
});

/* ---------- rotas ---------- */

function render() {
  const [, rota = "", parametro] = location.hash.replace(/^#/, "").split("/");
  pararRelogio();
  let html;
  if (rota === "resumos") html = telaResumos();
  else if (rota === "questoes") html = telaQuestoes(parametro);
  else if (rota === "treino") html = parametro ? telaEstacao(parametro) : telaTreino();
  else html = telaInicio();
  conteudo.innerHTML = html;
  const ativa = rota || "inicio";
  document.querySelectorAll(".menu a").forEach((a) => a.classList.toggle("ativo", a.dataset.rota === ativa));
}

window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });

Promise.all(["sessoes", "resumos", "questoes", "treino"].map((n) => fetch(`dados/${n}.json`).then((r) => r.json())))
  .then(([s, r, q, t]) => {
    estado.sessoes = s.sessoes; estado.resumos = r; estado.questoes = q.questoes; estado.estacoes = t.estacoes;
    render();
  })
  .catch(() => { conteudo.innerHTML = `<p class="carregando">Não foi possível carregar o conteúdo. Abra o site por um servidor (não direto do arquivo).</p>`; });
