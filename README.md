# Viraliza.AI

Plataforma SaaS de inteligência artificial para ajudar criadores a aumentar o potencial de viralização de vídeos no TikTok, Instagram Reels e YouTube Shorts.

## Como executar

Abra o arquivo `index.html` em qualquer navegador moderno (ou sirva a pasta com um servidor estático, ex.: `python3 -m http.server`). Não há dependências nem build — é uma SPA em HTML/CSS/JS puro.

## Fluxo testável

Página inicial → Analisar conteúdo → Carregamento → Resultado → Dashboard → Histórico

## Estrutura

```
index.html        Shell da aplicação (navbar, footer, orbs, toasts)
css/styles.css     Tema escuro premium (design system em variáveis CSS)
js/engine.js       Motor de IA SIMULADO — gera análises realistas/variadas
js/store.js        Persistência local (auth + histórico via localStorage)
js/ui.js           Helpers de UI (toast, copiar, animações de barra/nota)
js/app.js          Roteador + todas as páginas (home, análise, resultado, dashboard, auth, estáticas, FAQ)
```

## Integração com Supabase (backend real)

O app já vem integrado com **Supabase** para autenticação real e banco de dados de histórico. Configuração em `js/config.js` (URL + anon/publishable key).

### Para funcionar de verdade, você precisa fazer 2 coisas:

1. **Criar a tabela** — rode o conteúdo de `supabase/schema.sql` no **SQL Editor** do seu projeto Supabase (cria a tabela `history` com Row Level Security, onde cada usuário só acessa o próprio histórico).
2. **Servir por HTTP/HTTPS** — Supabase (e o `import()` do SDK via CDN) exige origem http(s). Abra o app via `python3 -m http.server` ou publique online. Em `file://`, o app cai automaticamente para o fallback local (localStorage).

> Dica de login instantâneo: no Supabase, **Authentication → Providers → Email**, desligue **"Confirm email"** para o usuário entrar logo após criar a conta. Se mantiver ligada, o usuário recebe e-mail de confirmação antes de conseguir logar.

Se o Supabase não estiver acessível (sem rede/CDN), o app usa `localStorage` automaticamente — nenhum fluxo quebra.

## Pontos de escalabilidade (prontos para troca futura)

- **IA real:** `js/engine.js` exporta `ViralizaEngine.generate(input)` → basta trocar o corpo por uma chamada a uma API (ex.: OpenAI/Gemini) sem alterar a interface.
- **Banco de dados / backend:** `js/store.js` isola toda a persistência em uma única camada (`Store`), que pode ser reimplementada com chamadas HTTP a um servidor e banco real.
- **Autenticação real:** `Store.signup/login/resetPassword` já definem o contrato; substituir pelo backend desejado.
- **Créditos / assinaturas / pagamentos:** não implementados nesta versão (conforme solicitado). O fluxo de análise já concentra a "ação paga" em um único ponto (`goAnalyze`), facilitando adicionar gates de créditos depois.
- **Analytics:** as estatísticas do dashboard já são calculadas a partir do histórico; basta conectar a uma fonte real.

## Observações

- As pontuações de "potencial de viralização" são **estimativas** geradas por heurística/simulação e **não garantem** viralização.
- Credenciais são armazenadas localmente apenas para demonstração (não seguras para produção).