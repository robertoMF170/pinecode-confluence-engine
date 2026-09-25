# Sr.Robs Confluence Engine — Tampermonkey Script para RebelsFunding

## 📦 Instalação

### 1. Instalar Tampermonkey
- **Chrome/Edge**: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
- **Firefox**: https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/

### 2. Instalar o Script
1. Abre o Tampermonkey → clica no ícone → **"Create a new script"**
2. Apaga tudo o que aparece
3. Abre o ficheiro `SrRobs_Confluence_Engine.user.js`
4. Copia TODO o conteúdo e cola no editor do Tampermonkey
5. Clica **Ctrl+S** (ou File → Save)
6. O script aparece na lista com o nome **"Sr.Robs Confluence Engine — RebelsFunding"**

### 3. Verificar
1. Abre a plataforma RebelsFunding (ex: `app.rebelsfunding.com`)
2. Abre as DevTools: **F12 → Console**
3. Devias ver:
```
[SrRobs CE] 🚀 Script loaded — starting initialization...
[SrRobs CE] 🔍 Looking for TradingView widget...
```
4. O dashboard aparece no canto inferior esquerdo

---

## 🧠 Como Funciona

| Componente | Descrição |
|---|---|
| **Dashboard** | Painel flutuante com scores, status, alvos, P&L. **Arrastável** pelo cabeçalho. |
| **Presets** | Botões 1m/1m+15m/3m/3m+30m/5m/5m+1H/15m/15m+4H/30m/30m+4H/1h/1H+4H/1d — mudam automaticamente EMAs, RSI, MACD, ATR, gaps, TPs. |
| **Presets +HTF** | **15m+4H**, **30m+4H**, **1H+4H**, **5m+1H**, **3m+30m**, **1m+15m**: o TF base otimizado + filtro HTF em modo **Confluence**: o HTF entra como 5ª perna no score (EMA/RSI/MACD/ATR reais do HTF) e o SL passa a `max(ATR TF×mult, ATR HTF×0.6)`. Estrutura HTF➔LTF: 1H➔5m (day trade), 30m➔3m (sweet spot), 15m➔1m (velocidade máxima), 4H➔15m/30m/1H (swing). O preset **1h** (1 hora) tem parâmetros dedicados: EMA 21/50/200, MACD 12/26/9, pivot 7, gap 24 barras. |
| **Banca/Risco** | Inputs para saldo da conta + % de risco por trade → lote calculado automaticamente. |
| **Indicadores** | EMAs, RSI, MACD, ATR, Pivot Points, Volume MA — calculados em JavaScript puro. |
| **Scoring** | Trend (30%) + Momentum (25%) + Volume (15%) + Structure (30%) → Bull/Bear scores. |
| **Sinais** | Bull score ≥ Medium + gap mínimo de score + filtros de volatilidade + gap de barras. |
| **Gestão** | BE após TP1, Trailing Stop configurável, 3 níveis de TP, SL dinâmico. |

---

## 🔍 Debugging (F12 → Console)

**Todos os passos críticos têm logs de debug.** O que procurar:

### Logs importantes:
```
[SrRobs CE] 🚀 Script loaded                         — script carregou
[SrRobs CE] ✅ Found window.tvWidget!                  — encontrou o gráfico
[SrRobs CE] 📡 Intercepted fetch/XHR to: ...          — intercetou dados OHLC
[SrRobs CE] 📊 Processing 500 bars                    — processou candles
[SrRobs CE] 🐂 LONG SIGNAL @ bar 234!                 — sinal de compra!
[SrRobs CE] 💰 Position Size: 0.05 lots               — lote calculado
[SrRobs CE] 🎯 TP1 HIT!                              — take-profit atingido
[SrRobs CE] 🏃 Trail SL moved to ...                  — trailing stop ativo
[SrRobs CE] 🛑 STOP LOSS HIT @ ...                    — stop loss atingido
```

### Se não aparecerem dados:
1. Verifica se o `@match` no script inclui o domínio correto da RebelsFunding
2. Procura `[SrRobs CE] ⚠️` ou `[SrRobs CE] ❌` na consola
3. O script tenta 4 abordagens diferentes para encontrar o widget do TradingView
4. Se a plataforma usar um domínio diferente, edita a linha `@match` no script

### Se o dashboard aparecer mas sem dados:
- O script está à espera de intercetar chamadas à API de dados OHLC
- Podes forçar dados de teste adicionando candles manualmente (ver secção "Dados de Teste")

---

## ⚙️ Configuração Manual

Edita o objeto `CONFIG` no início do script para ajustar defaults:

```javascript
const CONFIG = {
    preset: '5m',       // preset inicial
    balance: 1000,      // $ saldo da conta
    riskPct: 1.0,       // % risco por trade
    slAtrMult: 1.8,     // multiplicador ATR para SL
    tp1RR: 1.0,         // R:R do TP1
    tp2RR: 2.0,         // R:R do TP2
    tp3RR: 3.0,         // R:R do TP3
    // ... (todos os parâmetros disponíveis)
};
```

---

## 🔴 Limitações Conhecidas

1. **O dashboard é só um painel HTML** — não desenha linhas no gráfico do TradingView. Para isso seria preciso acesso à API `chart.createShape()` que as plataformas de corretoras normalmente bloqueiam.

2. **Dados OHLC** — o script interceta `fetch`/`XHR` para capturar dados. Se a RebelsFunding usar WebSockets para o data feed, pode ser preciso ajustar a lógica de interceção.

3. **HTF Filter** — no script JS não está implementado (requer dados de múltiplos TFs via API). No **Pine Script** (`SrRobs_Confluence_Engine.pine`) está completo: modo `Gate` (filtro binário) ou `Confluence` (5ª perna no score). Os presets **15m+4H**, **30m+4H**, **1H+4H**, **5m+1H**, **3m+30m**, **1m+15m** ativam tudo automaticamente com o HTF correto para cada par.

4. **Alertas sonoros** — não incluídos (o Pine Script original usa `alert()` para webhooks).

---

## 🐛 Problemas Comuns

| Problema | Solução |
|---|---|
| Script não aparece | Verifica se o domínio bate com o `@match` no script |
| Dashboard sem dados | Abre F12 → Console e procura logs `[SrRobs CE]` |
| Dashboard atrás de elementos | Aumenta o `z-index` no CSS (linha ~340) |
| Lote sempre 0.01 | Verifica `balance` e `riskPct` — com banca pequena o lote mínimo é 0.01 |
| Scores sempre 0 | Precisa de candles suficientes (>200 para EMA Macro) |

---

Feito com ❤️ por Sr.Robs — Todos os direitos reservados.
