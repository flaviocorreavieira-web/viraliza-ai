/* ============================================================
   Viraliza.AI — UI helpers (toast, copy, reveal)
   ============================================================ */
(function (global) {
  'use strict';

  const UI = {
    esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    toast(msg, type = 'success') {
      const wrap = document.getElementById('toastWrap');
      const el = document.createElement('div');
      el.className = 'toast ' + type;
      el.innerHTML = `<span class="t-ico">${type === 'error' ? '⚠️' : type === 'info' ? '💡' : '✅'}</span><span>${this.esc(msg)}</span>`;
      wrap.appendChild(el);
      setTimeout(() => {
        el.style.transition = 'all .3s'; el.style.opacity = '0'; el.style.transform = 'translateY(10px)';
        setTimeout(() => el.remove(), 300);
      }, 2600);
    },

    copy(text, msg = 'Copiado!') {
      const done = () => this.toast(msg);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => { this.fallbackCopy(text); done(); });
      } else {
        this.fallbackCopy(text); done();
      }
    },
    fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    },

    scoreClass(score) {
      return score >= 70 ? 'high' : score >= 45 ? 'mid' : 'low';
    },

    scoreColor(score) {
      if (score >= 70) return 'var(--green)';
      if (score >= 45) return 'var(--amber)';
      return 'var(--red)';
    },

    revealOnScroll() {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
      }, { threshold: 0.12 });
      document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    },

    animateBar() {
      // Anima barras de nota depois que aparecem
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.querySelectorAll('.score-bar[data-score]').forEach(bar => {
            bar.style.width = bar.dataset.score + '%';
          });
          document.querySelectorAll('.score-circle[data-score]').forEach(c => {
            c.style.setProperty('--p', c.dataset.score);
          });
        });
      });
    }
  };

  global.UI = UI;
})(window);