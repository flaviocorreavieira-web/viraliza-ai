/* ============================================================
   Viraliza.AI — Main app (router + pages)
   ============================================================ */
(function () {
  'use strict';

  const { Store, ViralizaEngine, UI } = window;
  const PLATFORMS = ViralizaEngine.PLATFORMS;

  const app = document.getElementById('app');
  const footer = document.getElementById('footer');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuToggle = document.getElementById('menuToggle');
  const navUser = document.getElementById('navUser');
  const navGuest = document.getElementById('navGuest');
  const navAvatar = document.getElementById('navAvatar');
  const btnLogout = document.getElementById('btnLogout');
  const yearEl = document.getElementById('year');

  let currentAnalysis = null; // análise mais recente (para "Gerar novamente" / histórico)

  /* ============================================================
     Router helpers
     ============================================================ */
  function parseHash() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const qIndex = raw.indexOf('?');
    let path = raw;
    const params = {};
    if (qIndex >= 0) {
      path = raw.slice(0, qIndex);
      new URLSearchParams(raw.slice(qIndex + 1)).forEach((v, k) => params[k] = v);
    }
    if (!path.startsWith('/')) path = '/' + path;
    return { path, params };
  }

  function currentPath() { return parseHash().path; }

  const routes = {
    '/': pageHome,
    '/analisar': pageAnalyze,
    '/result': pageResult,
    '/dashboard': pageDashboard,
    '/entrar': () => pageAuth('login'),
    '/criar-conta': () => pageAuth('signup'),
    '/recuperar': () => pageAuth('reset'),
    '/como-funciona': () => pageStatic('como-funciona'),
    '/recursos': () => pageStatic('recursos'),
    '/faq': pageFaq
  };

  function navigate() {
    const { path } = parseHash();
    renderNav();
    const handler = routes[path];
    if (!handler) { location.replace('#/'); return; }
    const maybePromise = handler();
    Promise.resolve(maybePromise).then(() => {
      footer.hidden = false;
      UI.revealOnScroll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     Nav
     ============================================================ */
  function renderNav() {
    const user = Store.currentUser();
    const logged = !!user;
    navUser.hidden = !logged;
    navGuest.hidden = logged;
    if (logged && navAvatar) navAvatar.textContent = (user.name || 'U').charAt(0).toUpperCase();

    const path = currentPath();
    const links = [
      ['#/', 'Início'], ['#/analisar', 'Analisar conteúdo'], ['#/como-funciona', 'Como funciona'],
      ['#/recursos', 'Recursos'], ['#/faq', 'FAQ']
    ];
    document.querySelectorAll('#navLinks a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + path);
    });

    mobileMenu.innerHTML = links.map(([h, t]) =>
      `<a href="${h}" data-nav="${h}" class="${h === '#' + path ? 'active' : ''}">${t}</a>`).join('') +
      (logged
        ? `<a href="planos.html">💎 Assinar / Planos</a>
           <a href="#/dashboard" data-nav="#/dashboard" class="${path === '/dashboard' ? 'active' : ''}">Dashboard</a>
           <a href="#" data-act="logout">👋 ${UI.esc(user.name.split(' ')[0])} — Sair</a>`
        : `<a href="planos.html">💎 Assinar / Planos</a>
           <a href="#/criar-conta" data-nav="#/criar-conta">Criar conta</a>
           <a href="#/entrar" data-nav="#/entrar">Entrar</a>`);
  }

  function closeMenu() { mobileMenu.classList.remove('open'); menuToggle.classList.remove('open'); }
  function openMenu() { mobileMenu.classList.add('open'); menuToggle.classList.add('open'); }

  function doLogout() {
    Store.logout().then(() => {
      UI.toast('Você saiu da sua conta.', 'info');
      location.hash = '#/';
    });
  }

  function requireAuth() {
    if (!Store.isLoggedIn()) {
      UI.toast('Entre na sua conta para continuar.', 'info');
      location.hash = '#/entrar';
      return false;
    }
    return true;
  }

  /* ============================================================
     Home
     ============================================================ */
  function pageHome() {
    app.innerHTML = `
      <section class="hero">
        <div class="container">
          <span class="hero-badge"><span class="dot"></span> IA para criadores de conteúdo</span>
          <h1>Transforme suas ideias em <span class="hl">conteúdo com potencial de viralizar.</span></h1>
          <p class="hero-sub">Use inteligência artificial para descobrir os melhores ganchos, títulos, legendas, hashtags e ideias para os seus vídeos.</p>
          <div class="hero-cta">
            <a href="#/analisar" data-route class="btn btn-primary btn-lgx">🚀 Analisar meu conteúdo</a>
            <a href="#/como-funciona" data-route class="btn btn-outline btn-lgx">Ver como funciona</a>
          </div>
          <div class="hero-demo" id="heroDemo"></div>
        </div>
      </section>
      ${sectionPlatforms()}
      ${sectionHowItWorks()}
      ${sectionFeatures()}
      ${sectionCta()}`;
    renderHeroDemo();
  }

  function renderHeroDemo() {
    const demo = document.getElementById('heroDemo');
    if (!demo) return;
    demo.innerHTML = `
      <div class="card analysis-demo floaty">
        <h3 style="display:flex;gap:10px;align-items:center;margin-bottom:20px;font-size:16px;">✨ Exemplo de análise gerada pela IA</h3>
        <div style="display:flex;gap:28px;align-items:center;flex-wrap:wrap;">
          <div>
            <div class="score-circle" data-score="87" style="--p:0;width:150px;height:150px;">
              <span class="score-val" style="color:var(--green)">87</span><span class="score-of">/100</span>
            </div>
            <div class="score-label">Potencial de viralização</div>
          </div>
          <div style="flex:1;min-width:220px;text-align:left;">
            <p style="margin-bottom:8px;font-size:14px;"><strong style="color:var(--text)">🎯 Gancho:</strong> <span style="color:var(--text-2)">"Você não vai acreditar no que aconteceu no 3º segundo..."</span></p>
            <p style="margin-bottom:8px;font-size:14px;"><strong style="color:var(--text)">📝 Título:</strong> <span style="color:var(--text-2)">O segredo que ninguém te contou sobre isso</span></p>
            <p style="font-size:14px;margin-bottom:6px;"><strong style="color:var(--text)">#️⃣ Hashtags:</strong></p>
            <div class="hashtags" style="justify-content:flex-start;">
              ${['#viraliza','#conteudo','#tiktok','#fyp'].map(h => `<span class="hash">${h}</span>`).join('')}
            </div>
          </div>
        </div>
        <div class="score-bar-track"><div class="score-bar" data-score="87"></div></div>
        <div class="score-scale"><span>0</span><span>50</span><span>100</span></div>
      </div>`;
    UI.animateBar();
  }

  /* ============================================================
     Analyze
     ============================================================ */
  let selectedPlatform = 'tiktok';
  let selectedFile = null;

  function pageAnalyze() {
    if (!requireAuth()) return;
    app.innerHTML = `
      <section class="section">
        <div class="container" style="max-width:760px;">
          <div class="fade-in" style="text-align:center;">
            <span class="sec-tag">Análise</span>
            <h1 class="sec-title" style="margin-bottom:10px;">Analisar conteúdo</h1>
            <p class="sec-sub">Envie seu vídeo ou descreva sua ideia. A IA analisa e devolve sugestões em segundos.</p>
          </div>

          <div class="card mt-4">
            <div class="field">
              <label>Upload de vídeo ou imagem</label>
              <div class="upload-zone" id="uploadZone">
                <div class="up-icon">📤</div>
                <p class="up-title">Arraste um arquivo aqui ou <strong style="color:var(--purple)">clique para selecionar</strong></p>
                <p class="up-hint">MP4, MOV, JPG, PNG — ou continue descrevendo manualmente abaixo.</p>
                <div class="file-chip">
                  <span style="font-size:20px;">📄</span>
                  <div><div class="fc-name" id="fcName"></div><div class="fc-size" id="fcSize"></div></div>
                  <button type="button" id="fcRemove" title="Remover arquivo">✕</button>
                </div>
                <input type="file" id="fileInput" accept="video/*,image/*" hidden />
              </div>
            </div>

            <div class="field">
              <label for="videoDesc">Sobre o que é seu vídeo?</label>
              <textarea class="textarea" id="videoDesc" rows="4"
                placeholder="Ex: Fiz um vídeo mostrando minha reação ao novo jogo, e quero saber o melhor gancho para prender a atenção do público..."></textarea>
              <div class="input-hint" id="descCount">0 caracteres — quanto mais detalhes, melhor a análise.</div>
            </div>

            <div class="field">
              <label>Selecione a plataforma</label>
              <div class="platforms" id="platformPicker"></div>
            </div>

            <button class="btn btn-primary btn-lg btn-block mt-2" id="btnAnalyze">🚀 Analisar conteúdo</button>
            <p class="input-hint center mt-1">A pontuação é uma estimativa baseada em características do conteúdo — não é garantia de viralização.</p>
          </div>
        </div>
      </section>`;

    setupUpload();
    setupPlatformPicker();
    setupAnalyzeSubmit();
  }

  function setupUpload() {
    const zone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
      e.preventDefault(); zone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => { if (fileInput.files[0]) setFile(fileInput.files[0]); });
    document.getElementById('fcRemove').addEventListener('click', (e) => { e.stopPropagation(); clearFile(); });

    function setFile(f) {
      selectedFile = f;
      document.getElementById('fcName').textContent = f.name;
      document.getElementById('fcSize').textContent = formatBytes(f.size);
      zone.classList.add('has-file');
      UI.toast('Arquivo anexado. Complete a descrição ou analise.', 'info');
    }
    function clearFile() {
      selectedFile = null;
      fileInput.value = '';
      zone.classList.remove('has-file');
    }
  }

  function setupPlatformPicker() {
    const picker = document.getElementById('platformPicker');
    picker.innerHTML = PLATFORMS.map(p =>
      `<div class="platform-opt ${p.id === selectedPlatform ? 'selected' : ''}" data-plat="${p.id}">
         <div class="p-icon">${p.icon}</div>
         <div class="p-name">${p.name}</div>
         <div class="p-handle">${p.handle}</div>
       </div>`).join('');
    picker.querySelectorAll('.platform-opt').forEach(el => {
      el.addEventListener('click', () => {
        picker.querySelectorAll('.platform-opt').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        selectedPlatform = el.dataset.plat;
      });
    });
  }

  function setupAnalyzeSubmit() {
    const descEl = document.getElementById('videoDesc');
    const counter = document.getElementById('descCount');
    descEl.addEventListener('input', () => {
      counter.textContent = descEl.value.length + ' caracteres' + (descEl.value.length === 0 ? ' — quanto mais detalhes, melhor a análise.' : '');
    });
    document.getElementById('btnAnalyze').addEventListener('click', () => {
      const desc = descEl.value.trim();
      if (!desc) {
        UI.toast('Descreva o que é o seu vídeo para a IA analisar.', 'error');
        descEl.focus();
        return;
      }
      const description = desc;
      const platformObj = ViralizaEngine.PLATFORMS.find(p => p.id === selectedPlatform);
      goAnalyze(description, selectedPlatform, platformObj ? platformObj.name : selectedPlatform);
    });
  }

  function goAnalyze(description, platform, platformName) {
    // salva o pedido para a tela de resultado
    currentRequest = { description, platform, platformName };
    location.hash = '#/result?loading=1';
  }

  let currentRequest = null;

  /* ============================================================
     Result (with loading)
     ============================================================ */
  function pageResult() {
    const { params } = parseHash();

    // Loading state pedido pela análise
    if (params.loading === '1') {
      renderLoading();
      const req = currentRequest || { description: 'Conteúdo genérico', platform: 'tiktok' };
      setTimeout(async () => {
        const an = await ViralizaEngine.generate({ description: req.description, platform: req.platform, platformName: req.platformName });
        currentAnalysis = an;
        if (Store.isLoggedIn()) Store.addAnalysis(an);
        currentRequest = null;
        renderResult(an);
      }, 2800);
      return;
    }

    // Render análise já existente
    if (currentAnalysis) { renderResult(currentAnalysis); return; }

    // Sem dados
    location.replace('#/analisar');
  }

  function renderLoading() {
    const steps = ['Recebendo seu conteúdo...', 'Analisando gancho e estrutura...', 'Gerando títulos e legendas...', 'Montando recomendações de viralização...'];
    app.innerHTML = `
      <section class="section">
        <div class="container">
          <div class="analyzing fade-in">
            <div class="loader-ring"></div>
            <h2>Analisando seu conteúdo</h2>
            <p>Nossa IA está trabalhando. Isso leva poucos segundos.</p>
            <div class="analyze-steps">
              ${steps.map((s, i) => `<div class="astep" data-i="${i}"><span class="a-state">${i === 0 ? '●' : ''}</span><span>${s}</span></div>`).join('')}
            </div>
          </div>
        </div>
      </section>`;
    // progress through steps
    let i = 0;
    const els = app.querySelectorAll('.astep');
    const tick = setInterval(() => {
      if (!app.querySelector('.analyze-steps')) { clearInterval(tick); return; }
      if (i < els.length) {
        if (i > 0) els[i - 1].classList.replace('active', 'done');
        els[i].classList.remove('active');
        els[i].classList.add('active');
        els[i].querySelector('.a-state').innerHTML = '✓';
        i++;
      } else {
        clearInterval(tick);
      }
    }, 560);
  }

  function renderResult(a) {
    const color = UI.scoreColor(a.score);
    const scoreClass = UI.scoreClass(a.score);
    const pl = a.platform;

    app.innerHTML = `
      <section class="section">
        <div class="container result-wrap">
          <div class="result-top fade-in">
            <span class="sec-tag">Resultado da análise</span>
            <h2>${UI.esc(a.subject)}</h2>
            <div class="result-meta">${pl.icon} ${pl.name} &nbsp;•&nbsp; ${formatDate(a.date)}</div>

            <div class="score-circle mt-3" data-score="${a.score}" style="--p:0;width:160px;height:160px;margin:24px auto 8px;">
              <span class="score-val" style="color:${color}">${a.score}</span>
              <span class="score-of">/100</span>
            </div>
            <div class="score-label">Potencial de viralização</div>
            <div class="score-bar-track" style="max-width:420px;margin:0 auto;">
              <div class="score-bar" data-score="${a.score}"></div>
            </div>
            <div class="score-scale" style="max-width:420px;margin:0 auto;"><span>0</span><span>50</span><span>100</span></div>
            <p style="color:${color};font-weight:700;margin-top:12px;">${UI.esc(a.verdict)}</p>
          </div>

          <div class="result-grid">
            ${cardHook(a)}
            ${cardTitles(a)}
            ${cardCaption(a)}
            ${cardHashtags(a)}
            ${cardStructure(a)}
            ${cardImprovements(a)}
          </div>

          <div class="mt-4">
            ${cardIdeas(a)}
          </div>

          <div class="result-actions">
            <button class="btn btn-primary btn-lg" id="btnRegen">🔄 Gerar novamente</button>
            <a href="#/analisar" data-route class="btn btn-ghost btn-lg">＋ Analisar outro conteúdo</a>
            ${Store.isLoggedIn() ? '<a href="#/dashboard" data-route class="btn btn-outline btn-lg">📊 Meu Dashboard</a>' : ''}
          </div>
        </div>
      </section>`;

    UI.animateBar();
    bindCopy();
    document.getElementById('btnRegen').addEventListener('click', () => {
      UI.toast('Gerando uma nova análise...', 'info');
      setTimeout(async () => {
        const an = await ViralizaEngine.generate({ description: a.subject, platform: a.platform.id, platformName: a.platform.name });
        currentAnalysis = an;
        if (Store.isLoggedIn()) Store.addAnalysis(an);
        renderResult(an);
        UI.toast('Nova análise gerada!', 'success');
      }, 1100);
    });
  }

  function bindCopy() {
    app.querySelectorAll('[data-copy]').forEach(el => {
      el.addEventListener('click', () => UI.copy(el.dataset.copy, 'Copiado para a área de transferência!'));
    });
  }

  function cardHook(a) {
    return `
      <div class="result-card">
        <h3><span class="rc-emoji">🎯</span> Gancho</h3>
        <div class="rc-body">
          <p style="margin-bottom:10px;">Sugestão de frase para os primeiros segundos:</p>
          <div class="caption-box" style="margin-bottom:14px;">${UI.esc(a.hook)}</div>
        </div>
        <button class="btn btn-ghost btn-sm" data-copy="${UI.esc(a.hook)}">Copiar gancho</button>
      </div>`;
  }
  function cardTitles(a) {
    return `
      <div class="result-card">
        <h3><span class="rc-emoji">📝</span> Títulos sugeridos</h3>
        <div class="title-list">
          ${a.titles.map((t, i) => `
            <div class="title-item">
              <span class="t-text">${i + 1}. ${UI.esc(t)}</span>
              <button class="mini-btn" data-copy="${UI.esc(t)}">Copiar</button>
            </div>`).join('')}
        </div>
      </div>`;
  }
  function cardCaption(a) {
    return `
      <div class="result-card">
        <h3><span class="rc-emoji">✍️</span> Legenda pronta</h3>
        <div class="caption-box" style="margin-bottom:14px;">${UI.esc(a.caption)}</div>
        <button class="btn btn-ghost btn-sm" data-copy="${UI.esc(a.caption)}">Copiar legenda</button>
      </div>`;
  }
  function cardHashtags(a) {
    return `
      <div class="result-card">
        <h3><span class="rc-emoji">#️⃣</span> Hashtags</h3>
        <div class="hashtags" style="justify-content:flex-start;margin-bottom:14px;">
          ${a.hashtags.map(h => `<span class="hash" data-copy="${UI.esc(h)}">${UI.esc(h)}</span>`).join('')}
        </div>
        <button class="btn btn-ghost btn-sm" data-copy="${UI.esc(a.hashtags.join(' '))}">Copiar todas</button>
      </div>`;
  }
  function cardStructure(a) {
    return `
      <div class="result-card">
        <h3><span class="rc-emoji">🎬</span> Estrutura do vídeo</h3>
        <div class="structure">
          ${a.structure.map(s => `
            <div class="struct-row">
              <div class="s-time">${s.time}</div>
              <div class="s-text">${UI.esc(s.text)}</div>
            </div>`).join('')}
        </div>
      </div>`;
  }
  function cardImprovements(a) {
    return `
      <div class="result-card">
        <h3><span class="rc-emoji">💡</span> Sugestões de melhoria</h3>
        <div class="improve-list">
          ${a.improvements.map(im => `
            <div class="improve-item"><span class="i-ico">${im.icon}</span><span class="i-text">${UI.esc(im.text)}</span></div>`).join('')}
        </div>
      </div>`;
  }
  function cardIdeas(a) {
    return `
      <div class="result-card">
        <h3><span class="rc-emoji">🔥</span> Ideias de vídeos semelhantes</h3>
        <div class="structure">
          ${a.ideas.map(id => `
            <div class="idea-card">
              <div class="i-title">💡 ${UI.esc(id.title)}</div>
              <div class="i-desc">${UI.esc(id.desc)}</div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  /* ============================================================
     Dashboard
     ============================================================ */
  async function pageDashboard() {
    if (!requireAuth()) return;
    const user = Store.currentUser();
    const history = await Store.getHistory();

    const total = history.length;
    const ideas = history.reduce((s, h) => s + h.analysis.ideas.length, 0);
    const avg = total ? Math.round(history.reduce((s, h) => s + h.score, 0) / total) : 0;

    const stats = [
      { ico: '📊', val: total, label: 'Análises realizadas' },
      { ico: '💡', val: ideas, label: 'Ideias geradas' },
      { ico: '🎬', val: total, label: 'Conteúdos analisados' },
      { ico: '🚀', val: avg, label: 'Média de potencial viral', suffix: '/100' }
    ];

    app.innerHTML = `
      <section class="section">
        <div class="container">
          <div class="dash-hello fade-in">
            <h1>Olá! 👋 <span style="background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;">${UI.esc(user.name.split(' ')[0])}</span></h1>
            <p>Bem-vindo(a) de volta. Aqui está o resumo das suas análises.</p>
          </div>

          <div class="grid grid-4">
            ${stats.map(s => `
              <div class="card stat-card reveal">
                <div class="stat-ico">${s.ico}</div>
                <div class="stat-val">${s.val}${s.suffix || ''}</div>
                <div class="stat-label">${s.label}</div>
              </div>`).join('')}
          </div>

          <div class="mt-5">
            <div class="history-head">
              <h2>Histórico de análises</h2>
              ${total ? '<button class="btn btn-ghost btn-sm" id="btnClearHistory">Limpar histórico</button>' : ''}
            </div>

            ${total === 0 ? `
              <div class="card empty-state">
                <div class="e-ico">📭</div>
                <h3>Nenhuma análise ainda</h3>
                <p>Analise seu primeiro conteúdo e veja as sugestões aparecerem aqui.</p>
                <a href="#/analisar" data-route class="btn btn-primary">🚀 Analisar meu conteúdo</a>
              </div>` : `
              <div class="history-list">
                ${history.map(h => `
                  <div class="hist-row reveal">
                    <div class="hist-plat">${h.platformIcon}</div>
                    <div class="hist-info">
                      <div class="hist-name">${UI.esc(h.subject)}</div>
                      <div class="hist-sub">${h.platformName} • ${formatDate(h.date)}</div>
                    </div>
                    <div class="hist-score ${UI.scoreClass(h.score)}">${h.score}</div>
                    <div class="hist-actions">
                      <button class="btn btn-primary btn-sm" data-view="${h.id}">Ver análise</button>
                    </div>
                  </div>`).join('')}
              </div>`}
          </div>
        </div>
      </section>`;

    const clearBtn = document.getElementById('btnClearHistory');
    if (clearBtn) clearBtn.addEventListener('click', async () => {
      await Store.clearHistory();
      UI.toast('Histórico limpo.', 'info');
      pageDashboard();
    });
    app.querySelectorAll('[data-view]').forEach(b => {
      b.addEventListener('click', async () => {
        const item = await Store.getAnalysisById(b.dataset.view);
        if (item) { currentAnalysis = item.analysis; location.hash = '#/result'; }
      });
    });
  }

  /* ============================================================
     Auth
     ============================================================ */
  function pageAuth(kind) {
    if (kind !== 'login' && Store.isLoggedIn()) { location.hash = '#/dashboard'; return; }

    const isLogin = kind === 'login';
    const isReset = kind === 'reset';
    const title = isReset ? 'Recuperar senha' : isLogin ? 'Entrar' : 'Criar conta';
    const sub = isReset
      ? 'Informe seu e-mail e enviaremos um link de recuperação.'
      : isLogin ? 'Acesse seu dashboard e histórico de análises.' : 'Crie sua conta gratuita e comece agora.';

    app.innerHTML = `
      <section class="section">
        <div class="container form-card fade-in">
          <div class="auth-card">
            <h2>${title}</h2>
            <p class="auth-sub">${sub}</p>

            ${isReset ? `
              <form id="authForm">
                <div class="field">
                  <label for="aEmail">E-mail</label>
                  <input class="input" type="email" id="aEmail" required placeholder="voce@email.com" />
                </div>
                <button class="btn btn-primary btn-block btn-lg" type="submit">Enviar link de recuperação</button>
              </form>
              <p class="auth-switch"><a href="#/entrar" data-route>← Voltar para o login</a></p>`
            : `
              <form id="authForm">
                ${isLogin ? '' : `
                <div class="field">
                  <label for="aName">Nome</label>
                  <input class="input" id="aName" required placeholder="Seu nome" />
                </div>`}
                <div class="field">
                  <label for="aEmail">E-mail</label>
                  <input class="input" type="email" id="aEmail" required placeholder="voce@email.com" />
                </div>
                <div class="field">
                  <label for="aPass">Senha</label>
                  <input class="input" type="password" id="aPass" required placeholder="••••••••" minlength="4" />
                </div>
                ${isLogin ? `<div class="field" style="text-align:right;margin-top:-6px;"><a href="#/recuperar" data-route style="font-size:13px;color:var(--purple);font-weight:600;">Esqueci minha senha</a></div>` : ''}
                <button class="btn btn-primary btn-block btn-lg" type="submit">${isLogin ? 'Entrar' : 'Criar conta'}</button>
              </form>
              <p class="auth-switch">
                ${isLogin ? 'Não tem uma conta? <a href="#/criar-conta" data-route>Cadastre-se</a>' : 'Já tem uma conta? <a href="#/entrar" data-route>Entrar</a>'}
              </p>`}
          </div>
        </div>
      </section>`;

    document.getElementById('authForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('aEmail').value.trim();
      const pass = document.getElementById('aPass')?.value || '';
      const btn = document.querySelector('#authForm button[type=submit]');
      if (btn) { btn.disabled = true; btn.textContent = 'Aguarde...'; }

      try {
        if (isReset) {
          const r = await Store.resetPassword(email);
          if (!r.ok) return fail(r.error);
          UI.toast('Enviamos um link de recuperação para seu e-mail.', 'success');
          location.hash = '#/entrar';
          return;
        }

        if (isLogin) {
          const r = await Store.login(email, pass);
          if (!r.ok) return fail(r.error);
          UI.toast('Bem-vindo de volta! 🎉');
          renderNav();
          location.hash = '#/dashboard';
        } else {
          const name = document.getElementById('aName').value.trim();
          if (name.length < 2) return fail('Informe seu nome.');
          const r = await Store.signup(name, email, pass);
          if (!r.ok) return fail(r.error);
          if (r.needsConfirm) {
            UI.toast('Conta criada! Confirme seu e-mail para entrar.', 'info');
            location.hash = '#/entrar';
            return;
          }
          UI.toast('Conta criada com sucesso! 🎉');
          renderNav();
          location.hash = '#/dashboard';
        }
      } catch (err) {
        UI.toast(err && err.message ? err.message : 'Algo deu errado. Tente novamente.', 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = isLogin ? 'Entrar' : 'Criar conta'; }
      }

      function fail(msg) { UI.toast(msg, 'error'); if (btn) { btn.disabled = false; btn.textContent = isLogin ? 'Entrar' : 'Criar conta'; } }
    });
  }

  /* ============================================================
     Static pages
     ============================================================ */
  function pageStatic(page) {
    if (page === 'como-funciona') {
      app.innerHTML = `
        <section class="section">
          <div class="container">
            <div class="sec-head fade-in">
              <span class="sec-tag">Como funciona</span>
              <h1 class="sec-title">Do conteúdo à otimização em 4 passos</h1>
              <p class="sec-sub">Simples, rápido e direto ao ponto.</p>
            </div>
            <div class="steps">
              ${[
                ['1','Envie seu conteúdo','Faça upload de um vídeo ou descreva sua ideia.'],
                ['2','A IA analisa','Avalia gancho, ritmo, estrutura e potencial.'],
                ['3','Receba sugestões','Ganchos, títulos, legendas, hashtags e estrutura.'],
                ['4','Melhore seu próximo vídeo','Aplique as recomendações e aumente o potencial viral.']
              ].map(([n,t,d]) => `
                <div class="step reveal"><div class="step-num">${n}</div><h3>${t}</h3><p>${d}</p></div>`).join('')}
            </div>
            <div class="center mt-5"><a href="#/analisar" data-route class="btn btn-primary btn-lg">🚀 Começar agora</a></div>
          </div>
        </section>
        ${sectionCta()}`;
    } else {
      const feats = [
        { ico:'🎯', t:'Análise de conteúdo', d:'Avalia o potencial de cada vídeo ou ideia.' },
        { ico:'💥', t:'Ganchos', d:'Frases de impacto para prender a atenção.' },
        { ico:'📝', t:'Títulos', d:'3 a 5 títulos otimizados por plataforma.' },
        { ico:'✍️', t:'Legendas', d:'Legendas prontas com CTA para copiar.' },
        { ico:'#️⃣', t:'Hashtags', d:'Hashtags relevantes para ampliar o alcance.' },
        { ico:'💡', t:'Ideias de vídeos', d:'5 ideias novas a partir do seu conteúdo.' },
        { ico:'🎬', t:'Estrutura de roteiro', d:'Passo a passo para organizar o vídeo.' },
        { ico:'🚀', t:'Pontuação de potencial viral', d:'Nota de 0 a 100 com sugestões de melhoria.' }
      ];
      app.innerHTML = `
        <section class="section">
          <div class="container">
            <div class="sec-head fade-in">
              <span class="sec-tag">Recursos</span>
              <h1 class="sec-title">Tudo que você precisa para viralizar</h1>
              <p class="sec-sub">Ferramentas de IA pensadas para criadores de conteúdo.</p>
            </div>
            <div class="grid grid-3">
              ${feats.map(f => `
                <div class="card card-hover reveal">
                  <div class="card-icon">${f.ico}</div>
                  <h3>${f.t}</h3>
                  <p>${f.d}</p>
                </div>`).join('')}
            </div>
          </div>
        </section>
        ${sectionCta()}`;
    }
  }

  /* ============================================================
     FAQ
     ============================================================ */
  function pageFaq() {
    const faqs = [
      { q: 'O Viraliza.AI garante que meu vídeo vai viralizar?', a: 'Não. A pontuação é uma estimativa baseada em características do conteúdo — gancho, estrutura, ritmo e práticas recomendadas. Nenhuma ferramenta garante viralização, pois isso depende do público, do algoritmo e do momento de publicação.' },
      { q: 'Quais plataformas são suportadas?', a: 'TikTok, Instagram Reels e YouTube Shorts. Você escolhe a plataforma ao analisar, e as sugestões são adaptadas a ela.' },
      { q: 'Posso usar pelo celular?', a: 'Sim. O Viraliza.AI é 100% responsivo e funciona perfeitamente em celular, tablet e computador.' },
      { q: 'Como funciona a análise?', a: 'Você envia um vídeo/imagem ou descreve sua ideia. A IA gera um potencial de viralização, ganchos, títulos, legenda, hashtags, estrutura de roteiro e ideias semelhantes em segundos.' }
    ];
    app.innerHTML = `
      <section class="section">
        <div class="container">
          <div class="sec-head fade-in">
            <span class="sec-tag">FAQ</span>
            <h1 class="sec-title">Perguntas frequentes</h1>
            <p class="sec-sub">Tire suas dúvidas sobre o Viraliza.AI.</p>
          </div>
          <div class="faq">
            ${faqs.map((f, i) => `
              <div class="faq-item">
                <button class="faq-q" data-i="${i}">${f.q}<span class="chev">▾</span></button>
                <div class="faq-a"><p>${f.a}</p></div>
              </div>`).join('')}
            <div class="faq-note"><span>⚠️</span><span>As pontuações de potencial de viralização são <strong>estimativas</strong> baseadas em características do conteúdo e <strong>não garantem</strong> viralização.</span></div>
          </div>
        </div>
      </section>
      ${sectionCta()}`;
    app.querySelectorAll('.faq-item').forEach(item => {
      item.querySelector('.faq-q').addEventListener('click', () => {
        const open = item.classList.contains('open');
        app.querySelectorAll('.faq-item.open').forEach(x => x.classList.remove('open'));
        if (!open) item.classList.add('open');
      });
    });
  }

  /* ============================================================
     Reusable sections
     ============================================================ */
  function sectionPlatforms() {
    return `
      <section class="section section-alt">
        <div class="container">
          <div class="sec-head reveal">
            <span class="sec-tag">Plataformas</span>
            <h2 class="sec-title">Otimize para onde seu público está</h2>
            <p class="sec-sub">Sugestões adaptadas para cada formato de vídeo curto.</p>
          </div>
          <div class="chip-grid reveal">
            ${PLATFORMS.map(p => `<span class="chip">${p.icon} ${p.name}</span>`).join('')}
          </div>
        </div>
      </section>`;
  }
  function sectionHowItWorks() {
    return `
      <section class="section">
        <div class="container">
          <div class="sec-head reveal">
            <span class="sec-tag">Como funciona</span>
            <h2 class="sec-title">De ideia a viral em 4 passos</h2>
          </div>
          <div class="steps">
            ${[
              ['1','Envie seu conteúdo','Arquivo de vídeo ou descrição da ideia.'],
              ['2','A IA analisa','Ganchos, ritmo e estrutura avaliados.'],
              ['3','Receba sugestões','Ganchos, títulos, legendas e hashtags.'],
              ['4','Melhore o próximo','Aplique e aumente o potencial viral.']
            ].map(([n,t,d]) => `
              <div class="step reveal"><div class="step-num">${n}</div><h3>${t}</h3><p>${d}</p></div>`).join('')}
          </div>
        </div>
      </section>`;
  }
  function sectionFeatures() {
    const feats = [
      { ico:'🎯', t:'Análise de conteúdo', d:'Avalia o potencial de cada vídeo ou ideia.' },
      { ico:'💥', t:'Ganchos', d:'Frases de impacto para os primeiros segundos.' },
      { ico:'📝', t:'Títulos', d:'3 a 5 títulos otimizados.' },
      { ico:'✍️', t:'Legendas', d:'Legendas prontas com CTA.' },
      { ico:'#️⃣', t:'Hashtags', d:'Hashtags para ampliar alcance.' },
      { ico:'💡', t:'Ideias de vídeos', d:'5 ideias novas por conteúdo.' },
      { ico:'🎬', t:'Estrutura de roteiro', d:'Organização passo a passo.' },
      { ico:'🚀', t:'Pontuação de potencial', d:'Nota de 0 a 100 com melhorias.' }
    ];
    return `
      <section class="section section-alt">
        <div class="container">
          <div class="sec-head reveal">
            <span class="sec-tag">Recursos</span>
            <h2 class="sec-title">Tudo para criar conteúdo que viraliza</h2>
            <p class="sec-sub">Ferramentas de IA pensadas para criadores.</p>
          </div>
          <div class="grid grid-3">
            ${feats.map(f => `
              <div class="card card-hover reveal">
                <div class="card-icon">${f.ico}</div>
                <h3>${f.t}</h3>
                <p>${f.d}</p>
              </div>`).join('')}
          </div>
        </div>
      </section>`;
  }
  function sectionCta() {
    return `
      <section class="section">
        <div class="container">
          <div class="cta-band reveal">
            <h2>Pronto para criar conteúdo que viraliza?</h2>
            <p>Analise seu primeiro vídeo gratuitamente e receba sugestões em segundos.</p>
            <a href="#/analisar" data-route class="btn btn-primary btn-lgx">🚀 Analisar meu conteúdo</a>
          </div>
        </div>
      </section>`;
  }

  /* ============================================================
     Helpers
     ============================================================ */
  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' • ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  function formatBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  /* ============================================================
     Wire up
     ============================================================ */
  yearEl.textContent = new Date().getFullYear();

  menuToggle.addEventListener('click', () => {
    if (mobileMenu.classList.contains('open')) closeMenu(); else openMenu();
  });
  btnLogout.addEventListener('click', doLogout);
  mobileMenu.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act="logout"]');
    if (act) { e.preventDefault(); doLogout(); }
    closeMenu();
  });

  // Re-renderiza o navbar quando a sessão Supabase muda
  window.__authChanged = () => renderNav();

  async function startApp() {
    await Store.init(); // aguarda o boot do Supabase
    navigate();
  }

  window.addEventListener('hashchange', navigate);
  startApp();
})();