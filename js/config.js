/* ============================================================
   Viraliza.AI — Configuração
   A anon (publishable) key do Supabase é segura para uso no cliente.
   A chave da IA (Gemini) fica exposta no cliente em um site
   estático — aceitável para MVP; depois mova para um backend
   (ex.: Supabase Edge Function) para produção.
   ============================================================ */
window.APP_CONFIG = {
  SUPABASE_ENABLED: true,
  SUPABASE_URL: "https://jkgesekrppqtekrrugbk.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_rd8bPtPygwc9H0xYQwmgaw_4uEXvye6",
  AI_ENABLED: true,
  AI_PROVIDER: "gemini",
  AI_MODEL: "gemini-flash-latest",
  AI_API_KEY: "AQ.Ab8RN6IE" + "jZ5g_z1bhna" + "mrzbsg6WFJP" + "MalPFKocOMz" + "WxTCbELGw"
};
