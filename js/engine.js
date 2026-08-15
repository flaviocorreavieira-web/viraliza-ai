/* ============================================================
   Viraliza.AI — Mock AI engine
   Gera análises realistas e variadas para demonstrar o fluxo.
   Futuramente, este módulo pode ser trocado por chamadas a uma
   API real de IA sem alterar o restante da interface.
   ============================================================ */
(function (global) {
  'use strict';

  const PLATFORMS = [
    { id: 'tiktok', name: 'TikTok',          handle: '@tiktok',   icon: '🎵' },
    { id: 'reels',  name: 'Instagram Reels', handle: '@reels',    icon: '📸' },
    { id: 'shorts', name: 'YouTube Shorts',  handle: '@shorts',   icon: '▶️' }
  ];

  const DEFAULT_TAGS = ['viraliza', 'conteudo', 'tiktok', 'reels', 'shorts', 'criador'];

  const DEFAULT_HOOK = 'Pare o que está fazendo e veja isso até o final — vale a pena.';

  const GROUPS = {
    jogos: {
      w: ['jogo', 'game', 'gamer', 'jogando', 'viciado', 'fase'],
      score: 78,
      hooks: [
        'Você não vai acreditar no que aconteceu nos primeiros 10 segundos',
        'Esse erro no jogo mudou tudo para mim',
        'Só perdeu tempo quem não viu isso até o final'
      ],
      tags: ['gaming', 'gameplay', 'gamer', 'jogos', 'jogarbem', 'gamebr']
    },
    receitas: {
      w: ['receita', 'comida', 'cozinha', 'café', 'lanche', 'restaurante', 'doce'],
      score: 74,
      hooks: [
        'Faça isso em 2 minutos — fica melhor que de restaurante',
        'O truque que ninguém te contou sobre isso',
        'Se você provar isso, não vai querer outra coisa'
      ],
      tags: ['receita', 'comida', 'cozinha', 'food', 'cooking', 'receitas']
    },
    treino: {
      w: ['treino', 'academia', 'musculação', 'exercício', 'perna', 'corpo', 'fitness'],
      score: 71,
      hooks: [
        'Faça 3x por semana e veja o resultado em dias',
        'O erro que todo mundo comete no treino',
        'Só 4 minutos, mas valem mais que uma hora'
      ],
      tags: ['treino', 'fitness', 'academia', 'gym', 'treinocasa', 'motivacao']
    },
    dinheiro: {
      w: ['dinheiro', 'investir', 'renda', 'ganhar', 'financeiro', 'poupar'],
      score: 82,
      hooks: [
        'Ninguém te contou isso antes de você gastar',
        'O que eu faria com 50 reais se tivesse começando hoje',
        'Pare de fazer isso se você quer dinheiro sobrando'
      ],
      tags: ['dinheiro', 'financas', 'investimentos', 'renda', 'moneytok', 'fyp']
    },
    tecnologia: {
      w: ['celular', 'app', 'gadget', 'iphone', 'android', 'tech', 'tecnologia'],
      score: 73,
      hooks: [
        'Esse recurso escondido vale mais que o celular inteiro',
        'Só 9% das pessoas sabe que isso funciona',
        'Testei por 30 dias e o resultado foi surpreendente'
      ],
      tags: ['tech', 'tecnologia', 'gadget', 'iphone', 'android', 'apps']
    },
    viagem: {
      w: ['viagem', 'viajar', 'destino', 'hotel', 'praia', 'turismo'],
      score: 76,
      hooks: [
        'Eu não sabia que isso existia até viajar para lá',
        'O segredo para viajar gastando muito menos',
        '3 lugares que parecem cenário de filme no Brasil'
      ],
      tags: ['viagem', 'travel', 'destinos', 'viagens', 'rotas', 'brasil']
    },
    pets: {
      w: ['cachorro', 'gato', 'pet', 'bichinho', 'pata', 'ração'],
      score: 81,
      hooks: [
        'Quando eu vi ele fazendo isso, chorei',
        'O que meu bichinho fez hoje me surpreendeu',
        'Eu sabia que isso ia acontecer com esse bebê'
      ],
      tags: ['pets', 'cachorro', 'gato', 'animais', 'petlove', 'fofos']
    },
    produtividade: {
      w: ['estudo', 'rotina', 'organizar', 'trabalhar', 'estudar', 'hábito', 'produtivo'],
      score: 68,
      hooks: [
        'Deixei de fazer isso e minha produtividade triplicou',
        'O método que me salvou em 5 minutos por dia',
        'Essa rotina mudou meus dias em 2 semanas'
      ],
      tags: ['produtividade', 'estudos', 'rotina', 'foco', 'habitos']
    }
  };

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pickN(arr, n) {
    const s = [...arr].sort(() => Math.random() - 0.5);
    return s.slice(0, Math.min(n, s.length));
  }
  function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  // Detecta o grupo mais provável pelo texto (heurística simples)
  function detectGroup(text) {
    const t = (text || '').toLowerCase();
    let best = null, bestScore = 0;
    for (const key in GROUPS) {
      const g = GROUPS[key];
      let s = 0;
      for (const w of g.w) if (t.includes(w)) s += w.length;
      if (s > bestScore) { bestScore = s; best = g; }
    }
    return best;
  }

  function slugify(text) {
    const s = String(text || '')
      .replace(/[^\w\sÀ-ú]/gi, '')
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .join(' ');
    return cap(s) || 'Meu conteúdo';
  }

  // ------------------------------------------------------------
  // IA REAL (Gemini) — usada quando AI_ENABLED e AI_API_KEY existem.
  // Em caso de erro, o app cai no motor simulado (mock) abaixo.
  // ------------------------------------------------------------
  function stripJson(text) {
    const t = String(text || '').trim();
    const m = t.match(/\{[\s\S]*\}/);
    return m ? m[0] : t;
  }

  // Deixa o JSON do modelo tolerante: remove vírgulas sobrando e
  // converte quebras de linha literais dentro de strings.
  function lenientParse(json) {
    try { return JSON.parse(json); } catch (_) {}
    let out = '', inStr = false;
    for (let i = 0; i < json.length; i++) {
      const ch = json[i];
      if (ch === '"') {
        let bs = 0, j = i - 1;
        while (j >= 0 && json[j] === '\\') { bs++; j--; }
        if (bs % 2 === 0) inStr = !inStr;
        out += ch;
      } else if (inStr && ch === '\n') {
        out += '\\n';
      } else {
        out += ch;
      }
    }
    out = out.replace(/,\s*([}\]])/g, '$1');
    try { return JSON.parse(out); } catch (_) {}
    return null;
  }

  async function aiGenerate(input) {
    const cfg = window.APP_CONFIG || {};
    const key = cfg.AI_API_KEY;
    const model = cfg.AI_MODEL || 'gemini-flash-latest';
    const desc = (input.description || '').trim();
    const platformName = (input.platformName) || (input.platform || 'tiktok');

    const prompt = `Você é um especialista em conteúdo viral para redes sociais (TikTok, Reels, Shorts).
Analise a descrição abaixo e responda SOMENTE com JSON válido, sem texto extra, exatamente com estas chaves:
{
  "score": <0-100>,
  "verdict": "<frase curta de avaliação>",
  "hook": "<gancho forte em PT-BR, máx 14 palavras>",
  "titles": ["<3 títulos otimizados em PT-BR>"],
  "caption": "<legenda em PT-BR com CTA e emojis>",
  "hashtags": ["<5-8 hashtags em PT-BR, sem #>"],
  "structure": [{"time":"<faixa>","text":"<instrução>"}],
  "improvements": [{"icon":"<emoji>","text":"<melhoria>"}],
  "ideas": [{"title":"<título>","desc":"<descrição curta>"}]
}

Plataforma: ${platformName}.
Descrição do conteúdo: "${desc.slice(0, 1500)}"`;

    let res = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 3000 }
        })
      });
      if (res.ok) break;
      if (res.status === 503 || res.status === 429) {
        await new Promise(r => setTimeout(r, 1600));
        continue;
      }
      break;
    }
    if (!res.ok) throw new Error('Gemini HTTP ' + res.status);
    const data = await res.json();
    const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts
      ? data.candidates[0].content.parts.map(p => p.text || '').join('')
      : '';
    if (!text) throw new Error('Gemini sem resposta');
    const parsed = lenientParse(stripJson(text));
    if (!parsed) throw new Error('Gemini devolveu JSON inválido');

    const platform = PLATFORMS.find(p => p.id === input.platform) || PLATFORMS[0];
    const score = Math.max(20, Math.min(99, parseInt(parsed.score, 10) || 60));
    const titles = Array.isArray(parsed.titles) ? parsed.titles.slice(0, 5) : [];
    const hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags.slice(0, 8).map(h => '#' + String(h).replace(/^#/, '')) : [];
    const structure = Array.isArray(parsed.structure) ? parsed.structure.slice(0, 5) : [];
    const improvements = Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 5) : [];
    const ideas = Array.isArray(parsed.ideas) ? parsed.ideas.slice(0, 5) : [];

    return {
      score,
      verdict: parsed.verdict || 'Análise concluída.',
      platform,
      subject: slugify(desc),
      hook: parsed.hook || DEFAULT_HOOK,
      titles: titles.length ? titles : ['Título otimizado para viralizar'],
      caption: parsed.caption || '',
      hashtags: hashtags.length ? hashtags : DEFAULT_TAGS.map(h => '#' + h),
      structure: structure.length ? structure : [],
      improvements: improvements.length ? improvements : [],
      ideas: ideas.length ? ideas : [],
      date: new Date().toISOString(),
      ai: true
    };
  }

  async function generate(input) {
    const cfg = window.APP_CONFIG || {};
    if (cfg.AI_ENABLED && cfg.AI_API_KEY && cfg.AI_API_KEY !== '__GEMINI_KEY__') {
      try {
        const r = await aiGenerate(input);
        return r;
      } catch (e) {
        try { console.warn('IA indisponível, usando modo simulado:', e.message); } catch (_) {}
      }
    }
    return mockGenerate(input);
  }

  function mockGenerate(input) {
    const desc = input.description || '';
    const group = detectGroup(desc) || GROUPS[Math.random() < 0.5 ? 'jogos' : 'receitas'];
    const platform = PLATFORMS.find(p => p.id === input.platform) || PLATFORMS[0];
    const subject = slugify(desc);

    // --- Potencial de viralização ---
    let score = group.score + rand(-6, 6);
    if (desc.length > 0 && desc.length < 24) score -= 6;
    if (desc.length > 150) score += 3;
    score = Math.max(28, Math.min(98, score));

    // --- Gancho ---
    const hook = pick(group.hooks || DEFAULT_HOOK);

    // --- Títulos ---
    const tpl = [
      `O segredo sobre "${subject}" que ninguém te conta`,
      `Como fazer "${subject}" do jeito certo (não errei de novo)`,
      `A verdade sobre "${subject}" que surpreende todo mundo`,
      `3 atalhos para "${subject}" — o último é o melhor`,
      `"${subject}": o que eu descobri testando por 30 dias`
    ];
    const titles = pickN(tpl, rand(3, 5));

    // --- Legenda ---
    const caption =
`${subject} é o tipo de conteúdo que costuma segurar a atenção — por isso usei um gancho forte nos primeiros segundos. 👇

🎯 ${hook}

Esse formato funciona bem, então:
✅ Salve para assistir de novo
✅ Compartilhe com quem precisa disso
✅ Comente sua opinião, eu leio tudo

#${(group.tags[0] || 'conteudo')}`;

    // --- Hashtags ---
    const hashtags = [...new Set([...(group.tags || []), ...pickN(DEFAULT_TAGS, 3)])]
      .slice(0, 8)
      .map(h => '#' + h.replace(/[^\wáéíóúâêôãõç]/gi, ''));

    // --- Estrutura ---
    const structure = [
      { time: '0–3 segundos', text: 'Abertura com o gancho mais forte — capte a atenção imediatamente.' },
      { time: '3–10 segundos', text: 'Apresente o problema e gere expectativa (antes x depois).' },
      { time: 'Desenvolvimento', text: 'Entregue o conteúdo com ritmo acelerado e cortes rápidos.' },
      { time: 'Final / CTA', text: 'Peça comentário, salvamento ou compartilhamento para ampliar o alcance.' }
    ];

    // --- Sugestões de melhoria ---
    const allImprovements = [
      { icon: '🎬', text: 'Adicione cortes a cada 1–2 segundos para manter o ritmo acelerado.' },
      { icon: '🔊', text: 'Use uma música/áudio em alta na plataforma para impulsionar o alcance.' },
      { icon: '📱', text: 'Mantenha o conteúdo centralizado — as bordas podem ser cortadas.' },
      { icon: '👀', text: 'Exagere levemente a reação nos primeiros segundos para segurar o swipe.' },
      { icon: '🏷️', text: 'Adicione legendas — a maioria assiste sem som.' },
      { icon: '🔄', text: 'Recapitule o gancho no final para incentivar o replay.' },
      { icon: '🎯', text: 'Cite um número ou promessa clara no gancho para gerar curiosidade.' },
      { icon: '🤝', text: 'Responda comentários da primeira hora para turbinar o algoritmo.' }
    ];
    const improvements = pickN(allImprovements, 5);

    // --- Ideias semelhantes ---
    const ideaPool = [
      { title: `Reagindo a um viral sobre ${subject}`, desc: 'Assista e reaja em tempo real, com comentários sinceros.' },
      { title: `Testei o que todo mundo fala sobre ${subject}`, desc: 'Formato "cobaia": testa e mostra o resultado honesto.' },
      { title: `Antes x depois: ${subject}`, desc: 'Comparação visual que gera compartilhamentos.' },
      { title: `O erro que quase ninguém sabe sobre ${subject}`, desc: 'Gancho educativo com alto potencial de salvamento.' },
      { title: `Comentários polêmicos sobre ${subject}`, desc: 'Reaja a comentários reais do público e engaje.' },
      { title: `1 minuto para dominar ${subject}`, desc: 'Formato direto e útil, perfeito para salvar.' }
    ];
    const ideas = pickN(ideaPool, 5);

    const verdict =
      score >= 85 ? 'Potencial altíssimo de viralização 🚀'
      : score >= 65 ? 'Bom potencial — os ajustes abaixo podem elevar bastante 📈'
      : 'Potencial médio — as melhorias sugeridas podem transformar o conteúdo 💪';

    return {
      score,
      verdict,
      platform,
      subject,
      hook,
      titles,
      caption,
      hashtags,
      structure,
      improvements,
      ideas,
      date: new Date().toISOString()
    };
  }

  global.ViralizaEngine = { PLATFORMS, generate, slugify };
})(window);