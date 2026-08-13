/* ============================================================
   Viraliza.AI — Store (fachada de persistência)
   Usa o backend Supabase quando disponível; caso contrário,
   volta ao localStorage local. A interface exposta ao app é a
   mesma nos dois casos.
   ============================================================ */
(function (global) {
  'use strict';

  const USERS_KEY = 'viraliza_users';
  const SESSION_KEY = 'viraliza_session';
  const HISTORY_KEY = 'viraliza_history';

  // Fallback em memória quando localStorage é bloqueado (ex.: preview em iframe).
  const mem = {};
  function storage() { try { return window.localStorage; } catch (e) { return null; } }
  function read(key) {
    const ls = storage();
    if (ls) { try { return JSON.parse(ls.getItem(key)) || null; } catch (e) { return null; } }
    return key in mem ? mem[key] : null;
  }
  function write(key, val) {
    const ls = storage();
    if (ls) { try { ls.setItem(key, JSON.stringify(val)); } catch (e) {} return; }
    mem[key] = val;
  }
  function removeKey(key) {
    const ls = storage();
    if (ls) { try { ls.removeItem(key); } catch (e) {} return; }
    delete mem[key];
  }

  function useSupabase() {
    return global.Supabase && global.Supabase.ready === true;
  }

  const Store = {
    /** Inicializa aguardando o boot do Supabase. Chame no start do app. */
    async init() {
      if (global.supabaseBoot) {
        try { await global.supabaseBoot; } catch (e) {}
      }
    },

    /* ---- Sessão (síncrono, para render imediato) ---- */
    isLoggedIn() { return !!this.currentUser(); },

    currentUser() {
      if (useSupabase()) return global.Supabase.currentUser();
      const s = read(SESSION_KEY);
      if (!s) return null;
      const users = this.getUsers();
      return users.find(u => u.email === s.email) || null;
    },

    /* ---- Auth (assíncrono) ---- */
    async signup(name, email, password) {
      if (useSupabase()) {
        return global.Supabase.signUp(name, email, password);
      }
      const users = this.getUsers();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { ok: false, error: 'Já existe uma conta com este e-mail.' };
      }
      const user = { name, email, password: btoa('viraliza' + password), createdAt: new Date().toISOString() };
      users.push(user);
      this.saveUsers(users);
      write(SESSION_KEY, { email });
      return { ok: true, user };
    },

    async login(email, password) {
      if (useSupabase()) return global.Supabase.login(email, password);
      const users = this.getUsers();
      const u = users.find(x => x.email.toLowerCase() === email.toLowerCase());
      if (!u) return { ok: false, error: 'Conta não encontrada. Crie uma conta.' };
      if (u.password !== btoa('viraliza' + password)) return { ok: false, error: 'Senha incorreta.' };
      write(SESSION_KEY, { email });
      return { ok: true, user: u };
    },

    async logout() {
      if (useSupabase()) return global.Supabase.logout();
      removeKey(SESSION_KEY);
      return { ok: true };
    },

    async resetPassword(email) {
      if (useSupabase()) return global.Supabase.resetPassword(email);
      const users = this.getUsers();
      const u = users.find(x => x.email.toLowerCase() === email.toLowerCase());
      if (!u) return { ok: false, error: 'Não encontramos uma conta com este e-mail.' };
      return { ok: true };
    },

    /* ---- Histórico (async) ---- */
    async getHistory() {
      if (useSupabase()) {
        try { return await global.Supabase.getHistory(); } catch (e) { return []; }
      }
      const user = this.currentUser();
      return this.getHistoryLocal(user ? user.email : null);
    },

    async addAnalysis(analysis) {
      if (useSupabase()) {
        try { return await global.Supabase.addAnalysis(analysis); } catch (e) { return null; }
      }
      const user = this.currentUser();
      if (!user) return null;
      const h = read(HISTORY_KEY) || {};
      const list = h[user.email] || [];
      const item = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        subject: analysis.subject,
        platform: analysis.platform.id,
        platformName: analysis.platform.name,
        platformIcon: analysis.platform.icon,
        score: analysis.score,
        date: analysis.date,
        analysis
      };
      list.unshift(item);
      h[user.email] = list;
      write(HISTORY_KEY, h);
      return item;
    },

    async getAnalysisById(id) {
      if (useSupabase()) return global.Supabase.getHistoryById(id);
      const user = this.currentUser();
      return (this.getHistoryLocal(user ? user.email : null)).find(x => x.id === id) || null;
    },

    async clearHistory() {
      if (useSupabase()) { try { await global.Supabase.clearHistory(); } catch (e) {} return; }
      const user = this.currentUser();
      if (!user) return;
      const h = read(HISTORY_KEY) || {};
      h[user.email] = [];
      write(HISTORY_KEY, h);
    },

    /* ---- helpers internos (fallback local) ---- */
    getUsers() { return read(USERS_KEY) || []; },
    saveUsers(list) { write(USERS_KEY, list); },
    getHistoryLocal(email) {
      const h = read(HISTORY_KEY) || {};
      return (email && h[email]) || [];
    }
  };

  global.Store = Store;
})(window);