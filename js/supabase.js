/* ============================================================
   Viraliza.AI — Supabase backend (auth + banco)
   Carrega o cliente via import() dinâmico da CDN.
   Se falhar (sem rede/CDN), o app cai para o fallback local.
   ============================================================ */
(function (global) {
  'use strict';

  const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

  global.supabaseBoot = (async () => {
    const cfg = (global.APP_CONFIG || {});
    if (!cfg.SUPABASE_ENABLED) {
      global.Supabase = { ready: false };
      return;
    }

    let sb;
    try {
      const { createClient } = await import(CDN);
      // storage próprio: usa localStorage, mas cai para memória se estiver bloqueado
      // (ex.: preview renderizado em iframe/app), mantendo a sessão dentro da página.
      const memStore = {};
      const storageAdapter = {
        getItem: (key) => {
          try { const v = window.localStorage.getItem(key); return v; }
          catch (e) { return key in memStore ? memStore[key] : null; }
        },
        setItem: (key, value) => {
          try { window.localStorage.setItem(key, value); }
          catch (e) { memStore[key] = value; }
        },
        removeItem: (key) => {
          try { window.localStorage.removeItem(key); } catch (e) {}
          delete memStore[key];
        }
      };
      sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: { storage: storageAdapter, autoRefreshToken: true, persistSession: true }
      });
    } catch (e) {
      console.warn('Viraliza.AI: não foi possível carregar o cliente Supabase:', e);
      global.Supabase = { ready: false };
      return;
    }

    let session = null;
    try {
      const { data } = await sb.auth.getSession();
      session = data.session;
    } catch (e) { /* segue sem sessão */ }

    sb.auth.onAuthStateChange((_event, s) => {
      session = s;
      // notifica o app para atualizar navbar/página
      if (typeof global.__authChanged === 'function') global.__authChanged(s);
    });

    // Converte o usuário do Supabase para o formato do app
    function toAppUser(u) {
      if (!u) return null;
      const meta = u.user_metadata || {};
      return {
        id: u.id,
        email: u.email,
        name: meta.full_name || meta.name || u.email || 'Usuário'
      };
    }

    function currentSessionUser() {
      return toAppUser(session && session.user);
    }

    global.Supabase = {
      ready: true,
      session,
      currentUser: currentSessionUser,

      async signUp(name, email, password) {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } }
        });
        if (error) return { ok: false, error: error.message };
        // Se a confirmação de e-mail estiver habilitada, session será null
        if (data.session) {
          session = data.session;
          return { ok: true, user: toAppUser(data.user), needsConfirm: false };
        }
        return { ok: true, user: toAppUser(data.user), needsConfirm: true };
      },

      async login(email, password) {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) return { ok: false, error: error.message };
        session = data.session;
        return { ok: true, user: toAppUser(data.user) };
      },

      async logout() {
        await sb.auth.signOut();
        session = null;
        return { ok: true };
      },

      async resetPassword(email) {
        const { error } = await sb.auth.resetPasswordForEmail(email);
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      },

      /* ---- Banco: histórico de análises ---- */
      async getHistory() {
        const u = session && session.user;
        if (!u) return [];
        const { data, error } = await sb
          .from('history')
          .select('*')
          .eq('user_id', u.id)
          .order('date', { ascending: false });
        if (error) throw new Error(error.message);
        return (data || []).map(mapRow);
      },

      async addAnalysis(analysis) {
        const u = session && session.user;
        if (!u) return null;
        const row = {
          user_id: u.id,
          subject: analysis.subject,
          platform: analysis.platform.id,
          platform_name: analysis.platform.name,
          platform_icon: analysis.platform.icon,
          score: analysis.score,
          analysis: analysis
        };
        const { data, error } = await sb.from('history').insert(row).select().single();
        if (error) throw new Error(error.message);
        return mapRow(data);
      },

      async getHistoryById(id) {
        const u = session && session.user;
        if (!u) return null;
        const { data, error } = await sb
          .from('history').select('*').eq('id', id).maybeSingle();
        if (error) return null;
        return data ? mapRow(data) : null;
      },

      async clearHistory() {
        const u = session && session.user;
        if (!u) return;
        await sb.from('history').delete().eq('user_id', u.id);
      }
    };

    // Normaliza uma linha vinda do banco para o formato do app
    function mapRow(row) {
      const analysis = row.analysis || {
        subject: row.subject,
        platform: { id: row.platform, name: row.platform_name, icon: row.platform_icon },
        score: row.score,
        date: row.date
      };
      return {
        id: row.id,
        subject: analysis.subject || row.subject,
        platform: analysis.platform ? analysis.platform.id : row.platform,
        platformName: (analysis.platform && analysis.platform.name) || row.platform_name,
        platformIcon: (analysis.platform && analysis.platform.icon) || row.platform_icon,
        score: analysis.score != null ? analysis.score : row.score,
        date: row.date,
        analysis
      };
    }

    // concede acesso global a mapRow e sb para testes
    global.__sb = sb;
  })();
})(window);
