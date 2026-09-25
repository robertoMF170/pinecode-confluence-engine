//+------------------------------------------------------------------+
//|                   Sr.Robs Confluence Engine.mq5                   |
//|              © Sr.Robs — Direitos Reservados                      |
//|  v2.0 — Conversão completa Pine Script → MQL5 (MetaTrader 5)      |
//+------------------------------------------------------------------+
#property copyright   "Sr.Robs — Direitos Reservados"
#property link        ""
#property version     "2.00"
#property description "Sr.Robs Confluence Engine — Multi-Confluence Signal Engine para MT5"

// ═══════════════════════════════════════════════════════════════════
//  INDICATOR BUFFERS (for EMA plots)
// ═══════════════════════════════════════════════════════════════════
#property indicator_chart_window
#property indicator_buffers 3
#property indicator_plots   3

#property indicator_label1  "EMA Fast"
#property indicator_type1   DRAW_LINE
#property indicator_color1  clrDodgerBlue
#property indicator_width1  1

#property indicator_label2  "EMA Slow"
#property indicator_type2   DRAW_LINE
#property indicator_color2  clrOrange
#property indicator_width2  1

#property indicator_label3  "EMA Macro"
#property indicator_type3   DRAW_LINE
#property indicator_color3  clrMagenta
#property indicator_width3  2

// ═══════════════════════════════════════════════════════════════════
//  PLOT BUFFERS
// ═══════════════════════════════════════════════════════════════════
double g_bufEmaFast[];
double g_bufEmaSlow[];
double g_bufEmaMacro[];

// ═══════════════════════════════════════════════════════════════════
//  ENUMS
// ═══════════════════════════════════════════════════════════════════
enum ENUM_PRESET
{
   PRESET_MANUAL = 0,  // Manual
   PRESET_1M     = 1,  // 1m
   PRESET_3M     = 2,  // 3m
   PRESET_5M     = 3,  // 5m
   PRESET_15M    = 4,  // 15m
   PRESET_30M    = 5,  // 30m
};

enum ENUM_BE_MODE
{
   BE_ENTRY   = 0, // Entry
   BE_HALFTP1 = 1, // Half TP1
};

enum ENUM_TRAIL_START
{
   TRAIL_IMMEDIATE = 0, // Immediate
   TRAIL_AFTER_TP1 = 1, // After TP1
   TRAIL_AFTER_TP2 = 2, // After TP2
};

// ═══════════════════════════════════════════════════════════════════
//  INPUTS — ⏱️ PRESETS DE TIMEFRAME
// ═══════════════════════════════════════════════════════════════════
input group "⏱️ Presets de Timeframe (Sr.Robs)"
input ENUM_PRESET InpPreset = PRESET_5M; // 🎯 Preset | Ajusta scores, gaps, TPs, volume, pivot, SL, EMAs, RSI, MACD

// ═══════════════════════════════════════════════════════════════════
//  INPUTS — ⚙️ CORE SETTINGS
// ═══════════════════════════════════════════════════════════════════
input group "⚙️ Core Settings"
input int      InpScoreStrong = 70;    // Strong Threshold (50-100)
input int      InpScoreMedium = 45;    // Medium Threshold (20-90)
input int      InpMinBarsGap  = 15;    // Min Bars Between Signals
input double   InpMinScoreGap = 10;    // Min Score Gap Bull/Bear
input double   InpWTrend      = 30;    // Trend Weight %
input double   InpWMom        = 25;    // Momentum Weight %
input double   InpWVol        = 15;    // Volume Weight %
input double   InpWStruct     = 30;    // Structure Weight %

// ═══════════════════════════════════════════════════════════════════
//  INPUTS — 📈 TREND LEG
// ═══════════════════════════════════════════════════════════════════
input group "📈 Trend Leg"
input int      InpEmaFast  = 21;    // EMA Fast
input int      InpEmaSlow  = 50;    // EMA Slow
input int      InpEmaMacro = 200;   // EMA Macro
input int      InpSlopeLen = 5;     // Slope Lookback

// ═══════════════════════════════════════════════════════════════════
//  INPUTS — 🌊 MOMENTUM LEG
// ═══════════════════════════════════════════════════════════════════
input group "🌊 Momentum Leg"
input int      InpRsiLen   = 14;    // RSI Length
input int      InpRsiMid   = 50;    // RSI Midline
input int      InpMacdFast = 12;    // MACD Fast
input int      InpMacdSlow = 26;    // MACD Slow
input int      InpMacdSig  = 9;     // MACD Signal

// ═══════════════════════════════════════════════════════════════════
//  INPUTS — 📦 VOLUME LEG
// ═══════════════════════════════════════════════════════════════════
input group "📦 Volume Leg"
input int      InpVolMaLen = 20;    // Volume MA Length
input double   InpVolSpike = 1.5;   // Volume Spike Mult

// ═══════════════════════════════════════════════════════════════════
//  INPUTS — 🏗️ STRUCTURE LEG
// ═══════════════════════════════════════════════════════════════════
input group "🏗️ Structure Leg"
input int      InpPivotLen = 5;     // Pivot Lookback

// ═══════════════════════════════════════════════════════════════════
//  INPUTS — 🕯️ FILTERS
// ═══════════════════════════════════════════════════════════════════
input group "🕯️ Filters"
input int      InpAtrLen       = 14;    // ATR Length
input bool     InpUseHtfFilter = false; // Enable HTF Trend Filter
input ENUM_TIMEFRAMES InpHtfRes = PERIOD_H1; // HTF Timeframe
input bool     InpUseVolatFilt = true;  // Enable Volatility Filter
input double   InpAtrMinPct    = 0.05;  // Min ATR % of Price
input int      InpLateBars     = 2;     // Late Entry Threshold (Bars)

// ═══════════════════════════════════════════════════════════════════
//  INPUTS — 📐 TRADE TOOLS
// ═══════════════════════════════════════════════════════════════════
input group "📐 Trade Tools"
input double   InpSlAtrMult = 1.5;   // SL ATR Multiplier
input double   InpTp1RR     = 1.0;   // TP1 R:R
input double   InpTp2RR     = 2.0;   // TP2 R:R
input double   InpTp3RR     = 3.0;   // TP3 R:R
input bool     InpShowLevels = true; // Show Trade Levels
input bool     InpBeTp1     = true;  // BE After TP1
input ENUM_BE_MODE InpBeMode = BE_ENTRY; // BE Target
input bool     InpUseTrail  = true;  // Trailing Stop
input ENUM_TRAIL_START InpTrailAct = TRAIL_AFTER_TP2; // Start Trailing
input double   InpTrailAtr  = 1.5;   // Trailing ATR Mult

// ═══════════════════════════════════════════════════════════════════
//  INPUTS — 💰 RISK MANAGEMENT (Auto-Detect Pip + Position Size)
// ═══════════════════════════════════════════════════════════════════
input group "💰 Risk Management"
input double   InpBalance    = 1000;    // 💵 Account Balance ($)
input double   InpRiskPct    = 1.0;     // 📐 Risk per Trade (%)
input bool     InpShowRisk   = true;    // 📊 Show Risk Info in Dashboard
input double   InpMinLot     = 0.01;    // 🔻 Min Lot Size
input double   InpMaxLot     = 50.0;    // 🔺 Max Lot Size
input double   InpLotStep    = 0.01;    // ↕️ Lot Step

// ═══════════════════════════════════════════════════════════════════
//  INPUTS — 📊 DASHBOARD
// ═══════════════════════════════════════════════════════════════════
input group "📊 Dashboard"
input bool     InpShowDash = true;   // Show Dashboard

// ═══════════════════════════════════════════════════════════════════
//  INPUTS — 🌈 COLORS
// ═══════════════════════════════════════════════════════════════════
input group "🌈 Colors"
input color    InpColBull     = clrTeal;         // Bull
input color    InpColBear     = clrTomato;       // Bear
input color    InpColNeutral  = clrGray;         // Neutral
input color    InpColSL       = clrRed;          // SL
input color    InpColEntry    = clrDodgerBlue;   // Entry
input color    InpColTP       = clrTeal;         // TP

// ═══════════════════════════════════════════════════════════════════
//  RESOLVED PARAMETERS (set from preset or manual)
// ═══════════════════════════════════════════════════════════════════
int      g_emaFastLen, g_emaSlowLen, g_emaMacroLen, g_slopeLen;
int      g_rsiLen, g_rsiMid, g_macdFast, g_macdSlow, g_macdSig;
int      g_volMaLen; double g_volSpike;
int      g_pivotLen;
int      g_atrLen; double g_slAtrMult;
double   g_tp1RR, g_tp2RR, g_tp3RR;
int      g_scoreStrong, g_scoreMedium, g_minBarsGap;
double   g_minScoreGap;
int      g_lateBars;
double   g_wTrend, g_wMom, g_wVol, g_wStruct;
bool     g_beTp1; ENUM_BE_MODE g_beMode;
bool     g_useTrail; ENUM_TRAIL_START g_trailAct; double g_trailAtr;
bool     g_useHtf, g_useVolat; double g_atrMinPct;
ENUM_TIMEFRAMES g_htfRes;

// ═══════════════════════════════════════════════════════════════════
//  RISK MANAGEMENT — Auto-Detect pip & position size
// ═══════════════════════════════════════════════════════════════════
double   g_pipSize      = 0;      // Auto-detected pip size
double   g_pipValue     = 0;      // Auto-detected pip value per lot
double   g_positionSize = 0;      // Recommended lot size
double   g_riskAmount   = 0;      // Risk amount in account currency
// P&L values (displayed in dashboard)
double   g_riskPnL      = 0;
double   g_tp1PnL       = 0;
double   g_tp2PnL       = 0;
double   g_tp3PnL       = 0;

// ═══════════════════════════════════════════════════════════════════
//  GLOBAL TRADE STATE
// ═══════════════════════════════════════════════════════════════════
double   g_entryPrice    = 0;
double   g_slPrice       = 0;
double   g_tp1Price      = 0;
double   g_tp2Price      = 0;
double   g_tp3Price      = 0;
double   g_activeSL      = 0;
double   g_activeTP3     = 0;
double   g_dynamicSL     = 0;
double   g_tradeExtreme  = 0;
int      g_activeDir     = 0;
int      g_signalStatus  = 0;
int      g_lastSignalIdx = -1;
datetime g_lastSignalTime = 0;
bool     g_tp1Done = false, g_tp2Done = false, g_tp3Done = false;

int      g_lastLongIdx  = -1;
int      g_lastShortIdx = -1;

int      g_streakLong  = 0;
int      g_streakShort = 0;
string   g_lateWarnTxt = "—";
color    g_lateWarnCol = clrGray;

// Pivot state (accumulated chronologically)
double   g_lastPH  = 0;
double   g_lastPH2 = 0;
double   g_lastPL  = 0;
double   g_lastPL2 = 0;
int      g_lastBosDir = 0;

// Object prefix
string   g_objPrefix = "SRCE_";

// Scores for dashboard (saved from last bar)
double   g_lastBullScore = 0, g_lastBearScore = 0;
double   g_lastTrendUp = 0, g_lastTrendDn = 0;
double   g_lastMomUp = 0, g_lastMomDn = 0;
double   g_lastVolUp = 0, g_lastVolDn = 0;
double   g_lastStructUp = 0, g_lastStructDn = 0;
double   g_lastVolRatio = 0, g_lastAtrPct = 0;
bool     g_lastBaseLong = false, g_lastBaseShort = false;

// ═══════════════════════════════════════════════════════════════════
//  INDICATOR HANDLES
// ═══════════════════════════════════════════════════════════════════
int g_hEmaFast  = INVALID_HANDLE;
int g_hEmaSlow  = INVALID_HANDLE;
int g_hEmaMacro = INVALID_HANDLE;
int g_hRsi      = INVALID_HANDLE;
int g_hMacd     = INVALID_HANDLE;
int g_hAtr      = INVALID_HANDLE;
int g_hVolMa    = INVALID_HANDLE;
int g_hHtfEma   = INVALID_HANDLE;

// ═══════════════════════════════════════════════════════════════════
//  PRESET FUNCTION — applies preset values to global params
// ═══════════════════════════════════════════════════════════════════
void ApplyPreset(ENUM_PRESET p)
{
   if(p == PRESET_MANUAL) return;

   switch(p)
   {
      case PRESET_1M:  g_emaFastLen=9;  g_emaSlowLen=21;  g_emaMacroLen=100; g_slopeLen=3;  break;
      case PRESET_3M:  g_emaFastLen=13; g_emaSlowLen=34;  g_emaMacroLen=150; g_slopeLen=4;  break;
      case PRESET_5M:  g_emaFastLen=21; g_emaSlowLen=50;  g_emaMacroLen=200; g_slopeLen=5;  break;
      case PRESET_15M: g_emaFastLen=21; g_emaSlowLen=50;  g_emaMacroLen=200; g_slopeLen=5;  break;
      case PRESET_30M: g_emaFastLen=34; g_emaSlowLen=89;  g_emaMacroLen=200; g_slopeLen=6;  break;
   }

   switch(p)
   {
      case PRESET_1M:  g_rsiLen=9;  g_macdFast=5;  g_macdSlow=13; g_macdSig=5;  break;
      case PRESET_3M:  g_rsiLen=11; g_macdFast=8;  g_macdSlow=17; g_macdSig=9;  break;
      case PRESET_5M:  g_rsiLen=14; g_macdFast=12; g_macdSlow=26; g_macdSig=9;  break;
      case PRESET_15M: g_rsiLen=14; g_macdFast=12; g_macdSlow=26; g_macdSig=9;  break;
      case PRESET_30M: g_rsiLen=14; g_macdFast=12; g_macdSlow=26; g_macdSig=9;  break;
   }

   switch(p)
   {
      case PRESET_1M:  g_volMaLen=14; g_volSpike=1.8; break;
      case PRESET_3M:  g_volMaLen=18; g_volSpike=1.8; break;
      case PRESET_5M:  g_volMaLen=20; g_volSpike=1.8; break;
      case PRESET_15M: g_volMaLen=20; g_volSpike=1.5; break;
      case PRESET_30M: g_volMaLen=20; g_volSpike=1.5; break;
   }

   switch(p)
   {
      case PRESET_1M:  g_pivotLen=5;  break;
      case PRESET_3M:  g_pivotLen=6;  break;
      case PRESET_5M:  g_pivotLen=7;  break;
      case PRESET_15M: g_pivotLen=9;  break;
      case PRESET_30M: g_pivotLen=10; break;
   }

   switch(p)
   {
      case PRESET_1M:  g_atrLen=7;  break;
      case PRESET_3M:  g_atrLen=10; break;
      case PRESET_5M:  g_atrLen=14; break;
      case PRESET_15M: g_atrLen=14; break;
      case PRESET_30M: g_atrLen=14; break;
   }

   switch(p)
   {
      case PRESET_1M:  g_slAtrMult=1.5; g_tp1RR=0.8; g_tp2RR=1.5; g_tp3RR=2.0; break;
      case PRESET_3M:  g_slAtrMult=1.6; g_tp1RR=0.8; g_tp2RR=1.5; g_tp3RR=2.0; break;
      case PRESET_5M:  g_slAtrMult=1.8; g_tp1RR=1.0; g_tp2RR=2.0; g_tp3RR=3.0; break;
      case PRESET_15M: g_slAtrMult=2.0; g_tp1RR=1.0; g_tp2RR=2.0; g_tp3RR=3.0; break;
      case PRESET_30M: g_slAtrMult=2.5; g_tp1RR=1.0; g_tp2RR=2.5; g_tp3RR=4.0; break;
   }

   switch(p)
   {
      case PRESET_1M:  g_scoreStrong=75; g_scoreMedium=50; g_minBarsGap=8;  g_minScoreGap=15; break;
      case PRESET_3M:  g_scoreStrong=75; g_scoreMedium=50; g_minBarsGap=12; g_minScoreGap=15; break;
      case PRESET_5M:  g_scoreStrong=75; g_scoreMedium=50; g_minBarsGap=20; g_minScoreGap=15; break;
      case PRESET_15M: g_scoreStrong=75; g_scoreMedium=50; g_minBarsGap=30; g_minScoreGap=12; break;
      case PRESET_30M: g_scoreStrong=75; g_scoreMedium=50; g_minBarsGap=40; g_minScoreGap=12; break;
   }
}

// ═══════════════════════════════════════════════════════════════════
//  PIVOT DETECTION — standard order (arr[0]=oldest)
//  Pine Script: f_pivotHigh(high[1], len) → checks high[1]..high[1+len*2]
//  MQL5 at bar i: checks high[i-1]..high[i-1-len*2], candidate at i-1-len
// ═══════════════════════════════════════════════════════════════════
bool IsPivotHigh(const double &high[], int idx, int len)
{
   int startIdx = idx - 1;          // Pine high[1] offset
   int candIdx  = startIdx - len;   // Pine high[1+len]
   int endIdx   = startIdx - len*2; // Pine high[1+len*2]
   if(candIdx < 0 || endIdx < 0) return false;

   double candidate = high[candIdx];
   for(int j = startIdx; j >= endIdx; j--)
   {
      if(j == candIdx) continue;
      if(high[j] >= candidate) return false;
   }
   return true;
}

bool IsPivotLow(const double &low[], int idx, int len)
{
   int startIdx = idx - 1;
   int candIdx  = startIdx - len;
   int endIdx   = startIdx - len*2;
   if(candIdx < 0 || endIdx < 0) return false;

   double candidate = low[candIdx];
   for(int j = startIdx; j >= endIdx; j--)
   {
      if(j == candIdx) continue;
      if(low[j] <= candidate) return false;
   }
   return true;
}

// ═══════════════════════════════════════════════════════════════════
//  STATUS HELPERS
// ═══════════════════════════════════════════════════════════════════
string StatusText()
{
   if(g_signalStatus == 1)
   {
      if(g_tp2Done)  return "Lucro (TP2)";
      if(g_tp1Done)  return (g_beMode == BE_HALFTP1) ? "BE 1/2 (TP1)" : "BE (TP1)";
      return "MANTER";
   }
   if(g_signalStatus == 2) return g_tp1Done ? "SAIR (BE)" : "SAIR (SL)";
   if(g_signalStatus == 3) return "SAIR (TP3)";
   return "AGUARDA";
}

string TierLabel(double score)
{
   if(score >= g_scoreStrong) return "Strong";
   if(score >= g_scoreMedium) return "Medium";
   if(score > 0)            return "Weak";
   return "None";
}

string ProgBar(double val, double maxVal)
{
   double safeMax = (maxVal == 0) ? 1.0 : maxVal;
   int filled = (int)MathRound(MathMin(val / safeMax, 1.0) * 10);
   string bar = "";
   for(int i = 0; i < 10; i++)
      bar += (i < filled) ? "#" : "-";
   return bar + " " + IntegerToString((int)MathRound(val));
}

// ═══════════════════════════════════════════════════════════════════
//  DRAWING HELPERS
// ═══════════════════════════════════════════════════════════════════
void DeleteLevels()
{
   ObjectsDeleteAll(0, g_objPrefix);
}

void DrawLevels(int barIdx, datetime barTime)
{
   DeleteLevels();

   string slName = g_objPrefix + "SL";
   string enName = g_objPrefix + "Entry";
   string t1Name = g_objPrefix + "TP1";
   string t2Name = g_objPrefix + "TP2";
   string t3Name = g_objPrefix + "TP3";

   ObjectCreate(0, slName, OBJ_HLINE, 0, 0, g_slPrice);
   ObjectSetInteger(0, slName, OBJPROP_COLOR, InpColSL);
   ObjectSetInteger(0, slName, OBJPROP_WIDTH, 2);
   ObjectSetInteger(0, slName, OBJPROP_BACK, true);

   ObjectCreate(0, enName, OBJ_HLINE, 0, 0, g_entryPrice);
   ObjectSetInteger(0, enName, OBJPROP_COLOR, InpColEntry);
   ObjectSetInteger(0, enName, OBJPROP_WIDTH, 1);
   ObjectSetInteger(0, enName, OBJPROP_STYLE, STYLE_DASH);

   ObjectCreate(0, t1Name, OBJ_HLINE, 0, 0, g_tp1Price);
   ObjectSetInteger(0, t1Name, OBJPROP_COLOR, InpColTP);
   ObjectSetInteger(0, t1Name, OBJPROP_WIDTH, 1);
   ObjectSetInteger(0, t1Name, OBJPROP_STYLE, STYLE_DASH);

   ObjectCreate(0, t2Name, OBJ_HLINE, 0, 0, g_tp2Price);
   ObjectSetInteger(0, t2Name, OBJPROP_COLOR, InpColTP);
   ObjectSetInteger(0, t2Name, OBJPROP_WIDTH, 1);
   ObjectSetInteger(0, t2Name, OBJPROP_STYLE, STYLE_DASH);

   ObjectCreate(0, t3Name, OBJ_HLINE, 0, 0, g_tp3Price);
   ObjectSetInteger(0, t3Name, OBJPROP_COLOR, InpColTP);
   ObjectSetInteger(0, t3Name, OBJPROP_WIDTH, 1);
   ObjectSetInteger(0, t3Name, OBJPROP_STYLE, STYLE_DASH);

   // Labels at right edge (10 bars forward)
   int barShift = 10;
   datetime labelTime = barTime + barShift * PeriodSeconds();

   string txt = "SL " + DoubleToString(g_slPrice, _Digits);
   ObjectCreate(0, g_objPrefix+"SL_LBL", OBJ_TEXT, 0, labelTime, g_slPrice);
   ObjectSetString(0, g_objPrefix+"SL_LBL", OBJPROP_TEXT, txt);
   ObjectSetInteger(0, g_objPrefix+"SL_LBL", OBJPROP_COLOR, InpColSL);

   txt = "Entry " + DoubleToString(g_entryPrice, _Digits);
   ObjectCreate(0, g_objPrefix+"EN_LBL", OBJ_TEXT, 0, labelTime, g_entryPrice);
   ObjectSetString(0, g_objPrefix+"EN_LBL", OBJPROP_TEXT, txt);
   ObjectSetInteger(0, g_objPrefix+"EN_LBL", OBJPROP_COLOR, InpColEntry);

   txt = "TP1 " + DoubleToString(g_tp1Price, _Digits);
   ObjectCreate(0, g_objPrefix+"T1_LBL", OBJ_TEXT, 0, labelTime, g_tp1Price);
   ObjectSetString(0, g_objPrefix+"T1_LBL", OBJPROP_TEXT, txt);
   ObjectSetInteger(0, g_objPrefix+"T1_LBL", OBJPROP_COLOR, InpColTP);

   txt = "TP2 " + DoubleToString(g_tp2Price, _Digits);
   ObjectCreate(0, g_objPrefix+"T2_LBL", OBJ_TEXT, 0, labelTime, g_tp2Price);
   ObjectSetString(0, g_objPrefix+"T2_LBL", OBJPROP_TEXT, txt);
   ObjectSetInteger(0, g_objPrefix+"T2_LBL", OBJPROP_COLOR, InpColTP);

   txt = "TP3 " + DoubleToString(g_tp3Price, _Digits);
   ObjectCreate(0, g_objPrefix+"T3_LBL", OBJ_TEXT, 0, labelTime, g_tp3Price);
   ObjectSetString(0, g_objPrefix+"T3_LBL", OBJPROP_TEXT, txt);
   ObjectSetInteger(0, g_objPrefix+"T3_LBL", OBJPROP_COLOR, InpColTP);

   ChartRedraw(0);
}

// ═══════════════════════════════════════════════════════════════════
//  ON INIT
// ═══════════════════════════════════════════════════════════════════
int OnInit()
{
   // --- Step 1: Read ALL input values (applies regardless of preset) ---
   g_rsiMid    = InpRsiMid;
   g_lateBars  = InpLateBars;
   g_beTp1     = InpBeTp1;
   g_beMode    = InpBeMode;
   g_useTrail  = InpUseTrail;
   g_trailAct  = InpTrailAct;
   g_trailAtr  = InpTrailAtr;
   g_useHtf    = InpUseHtfFilter;
   g_useVolat  = InpUseVolatFilt;
   g_atrMinPct = InpAtrMinPct;
   g_htfRes    = InpHtfRes;
   g_wTrend    = InpWTrend;
   g_wMom      = InpWMom;
   g_wVol      = InpWVol;
   g_wStruct   = InpWStruct;

   // --- Step 2: Apply preset (overrides preset-specific values) ---
   if(InpPreset != PRESET_MANUAL)
   {
      ApplyPreset(InpPreset);
   }
   else
   {
      // Manual — use raw input values
      g_emaFastLen  = InpEmaFast;  g_emaSlowLen  = InpEmaSlow;
      g_emaMacroLen = InpEmaMacro; g_slopeLen    = InpSlopeLen;
      g_rsiLen      = InpRsiLen;
      g_macdFast    = InpMacdFast; g_macdSlow    = InpMacdSlow; g_macdSig = InpMacdSig;
      g_volMaLen    = InpVolMaLen; g_volSpike    = InpVolSpike;
      g_pivotLen    = InpPivotLen;
      g_atrLen      = InpAtrLen;   g_slAtrMult   = InpSlAtrMult;
      g_tp1RR = InpTp1RR; g_tp2RR = InpTp2RR; g_tp3RR = InpTp3RR;
      g_scoreStrong  = InpScoreStrong; g_scoreMedium = InpScoreMedium;
      g_minBarsGap   = InpMinBarsGap;  g_minScoreGap  = InpMinScoreGap;
   }

   // --- Step 3: Create indicator handles ---
   g_hEmaFast  = iMA(_Symbol, _Period, g_emaFastLen,  0, MODE_EMA, PRICE_CLOSE);
   g_hEmaSlow  = iMA(_Symbol, _Period, g_emaSlowLen,  0, MODE_EMA, PRICE_CLOSE);
   g_hEmaMacro = iMA(_Symbol, _Period, g_emaMacroLen, 0, MODE_EMA, PRICE_CLOSE);
   g_hRsi      = iRSI(_Symbol, _Period, g_rsiLen, PRICE_CLOSE);
   g_hMacd     = iMACD(_Symbol, _Period, g_macdFast, g_macdSlow, g_macdSig, PRICE_CLOSE);
   g_hAtr      = iATR(_Symbol, _Period, g_atrLen);
   g_hVolMa    = iMA(_Symbol, _Period, g_volMaLen, 0, MODE_SMA, VOLUME_TICK);

   if(g_useHtf)
      g_hHtfEma = iMA(_Symbol, g_htfRes, g_emaSlowLen, 0, MODE_EMA, PRICE_CLOSE);

   if(g_hEmaFast == INVALID_HANDLE || g_hEmaSlow == INVALID_HANDLE ||
      g_hEmaMacro == INVALID_HANDLE || g_hRsi == INVALID_HANDLE ||
      g_hMacd == INVALID_HANDLE || g_hAtr == INVALID_HANDLE ||
      g_hVolMa == INVALID_HANDLE)
   {
      Print("Error creating indicator handles");
      return INIT_FAILED;
   }

   // Set plot buffers as series (will use rates_total offset for standard access)
   SetIndexBuffer(0, g_bufEmaFast,  INDICATOR_DATA);
   SetIndexBuffer(1, g_bufEmaSlow,  INDICATOR_DATA);
   SetIndexBuffer(2, g_bufEmaMacro, INDICATOR_DATA);

   // Init state
   g_entryPrice = 0; g_signalStatus = 0; g_activeDir = 0;
   g_lastLongIdx = -1; g_lastShortIdx = -1;
   g_lastPH = 0; g_lastPH2 = 0; g_lastPL = 0; g_lastPL2 = 0; g_lastBosDir = 0;

   // ── Auto-Detect Pip Size & Pip Value ──
   double tickSize  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double point     = SymbolInfoDouble(_Symbol, SYMBOL_POINT);

   // Pip size: for most forex pairs pip = 10 * point (e.g. EURUSD: point=0.00001, pip=0.0001)
   // For JPY pairs (3-digit): point=0.001, pip=0.01 = 10 * point
   // For indices/crypto like US30 or BTC: point=pip, so pip=point
   if(point < 0.0001)        g_pipSize = point * 10;   // 5-digit forex
   else if(point < 0.001)    g_pipSize = point * 10;   // 4-digit forex
   else if(point < 0.1)      g_pipSize = point * 10;   // JPY 3-digit (0.001→0.01) & XAU (0.01→0.1)
   else                       g_pipSize = point;        // Indices/crypto: point=pip

   // Pip value per standard lot: tickValue * (pipSize / tickSize)
   if(tickSize > 0)
      g_pipValue = tickValue * (g_pipSize / tickSize);
   else
      g_pipValue = 10.0;  // fallback

   Print("💰 Risk Auto-Detect: tickSize=", tickSize, " tickValue=", tickValue,
         " point=", point, " pipSize=", g_pipSize, " pipValue=", g_pipValue);

   return INIT_SUCCEEDED;
}

// ═══════════════════════════════════════════════════════════════════
//  ON DEINIT
// ═══════════════════════════════════════════════════════════════════
void OnDeinit(const int reason)
{
   if(g_hEmaFast  != INVALID_HANDLE) IndicatorRelease(g_hEmaFast);
   if(g_hEmaSlow  != INVALID_HANDLE) IndicatorRelease(g_hEmaSlow);
   if(g_hEmaMacro != INVALID_HANDLE) IndicatorRelease(g_hEmaMacro);
   if(g_hRsi      != INVALID_HANDLE) IndicatorRelease(g_hRsi);
   if(g_hMacd     != INVALID_HANDLE) IndicatorRelease(g_hMacd);
   if(g_hAtr      != INVALID_HANDLE) IndicatorRelease(g_hAtr);
   if(g_hVolMa    != INVALID_HANDLE) IndicatorRelease(g_hVolMa);
   if(g_hHtfEma   != INVALID_HANDLE) IndicatorRelease(g_hHtfEma);

   DeleteLevels();
   Comment("");
}

// ═══════════════════════════════════════════════════════════════════
//  ON CALCULATE — Main Logic
//  STANDARD ORDER: arr[0]=oldest, arr[rates_total-1]=current (forming)
// ═══════════════════════════════════════════════════════════════════
int OnCalculate(const int rates_total,
                const int prev_calculated,
                const datetime &time[],
                const double   &open[],
                const double   &high[],
                const double   &low[],
                const double   &close[],
                const long     &tick_volume[],
                const long     &volume[],
                const int      &spread[])
{
   if(rates_total < g_emaMacroLen + g_pivotLen*2 + 50) return prev_calculated;

   // --- Get indicator data in STANDARD order (arr[0]=oldest) ---
   double emaF[], emaS[], emaM[], rsi[], macd[], macdS[], macdH[], atr[], volMa[];
   ArraySetAsSeries(emaF, false); ArraySetAsSeries(emaS, false); ArraySetAsSeries(emaM, false);
   ArraySetAsSeries(rsi, false);
   ArraySetAsSeries(macd, false); ArraySetAsSeries(macdS, false); ArraySetAsSeries(macdH, false);
   ArraySetAsSeries(atr, false);
   ArraySetAsSeries(volMa, false);

   int cnt = rates_total;
   if(CopyBuffer(g_hEmaFast, 0, 0, cnt, emaF) < cnt)  return prev_calculated;
   if(CopyBuffer(g_hEmaSlow, 0, 0, cnt, emaS) < cnt)  return prev_calculated;
   if(CopyBuffer(g_hEmaMacro,0, 0, cnt, emaM) < cnt)  return prev_calculated;
   if(CopyBuffer(g_hRsi,    0, 0, cnt, rsi)  < cnt)   return prev_calculated;
   if(CopyBuffer(g_hMacd,   0, 0, cnt, macd) < cnt)   return prev_calculated;
   if(CopyBuffer(g_hMacd,   1, 0, cnt, macdS) < cnt)  return prev_calculated;
   if(CopyBuffer(g_hMacd,   2, 0, cnt, macdH) < cnt)  return prev_calculated;
   if(CopyBuffer(g_hAtr,    0, 0, cnt, atr)  < cnt)   return prev_calculated;
   if(CopyBuffer(g_hVolMa,  0, 0, cnt, volMa) < cnt)  return prev_calculated;

   // HTF data
   double htfC = 0, htfE = 0;
   if(g_useHtf && g_hHtfEma != INVALID_HANDLE)
   {
      double htfCBuf[], htfEBuf[];
      ArraySetAsSeries(htfCBuf, false); ArraySetAsSeries(htfEBuf, false);
      if(CopyClose(_Symbol, g_htfRes, 0, 2, htfCBuf) >= 2) htfC = htfCBuf[1];
      if(CopyBuffer(g_hHtfEma, 0, 0, 2, htfEBuf) >= 2)    htfE = htfEBuf[1];
   }

   // --- Plot EMA buffers ---
   for(int i = 0; i < rates_total; i++)
   {
      g_bufEmaFast[i]  = emaF[i];
      g_bufEmaSlow[i]  = emaS[i];
      g_bufEmaMacro[i] = emaM[i];
   }

   // --- Determine start bar ---
   int start = prev_calculated > 0 ? prev_calculated - 1 : 0;
   int minStart = g_emaMacroLen + g_pivotLen*2 + 1;
   if(start < minStart) start = minStart;

   // --- MAIN LOOP (oldest → newest, standard order) ---
   for(int i = start; i < rates_total; i++)
   {
      // ---- TREND LEG ----
      double emaFSlope = (emaF[i] - emaF[i - g_slopeLen]) / g_slopeLen;
      double emaSSlope = (emaS[i] - emaS[i - g_slopeLen]) / g_slopeLen;

      double trendUp = 0;
      trendUp += (emaF[i] > emaS[i])     ? 40.0 : 0;
      trendUp += (close[i] > emaM[i])    ? 30.0 : 0;
      trendUp += (emaFSlope > 0)         ? 20.0 : 0;
      trendUp += (emaSSlope > 0)         ? 10.0 : 0;

      double trendDn = 0;
      trendDn += (emaF[i] < emaS[i])     ? 40.0 : 0;
      trendDn += (close[i] < emaM[i])    ? 30.0 : 0;
      trendDn += (emaFSlope < 0)         ? 20.0 : 0;
      trendDn += (emaSSlope < 0)         ? 10.0 : 0;

      // ---- MOMENTUM LEG ----
      double momUp = 0;
      momUp += (rsi[i] > g_rsiMid) ? 35.0 : 0;
      momUp += (macd[i] > macdS[i]) ? 35.0 : 0;
      momUp += (macdH[i] > macdH[i-1]) ? 30.0 : 0;

      double momDn = 0;
      momDn += (rsi[i] < g_rsiMid) ? 35.0 : 0;
      momDn += (macd[i] < macdS[i]) ? 35.0 : 0;
      momDn += (macdH[i] < macdH[i-1]) ? 30.0 : 0;

      // ---- VOLUME LEG ----
      double volRatio = (volMa[i] > 0) ? (double)volume[i] / volMa[i] : 1.0;
      bool isVolSpike = (volRatio >= g_volSpike);
      bool bullCandle = close[i] > open[i];
      bool bearCandle = close[i] < open[i];

      double volUp = 0;
      volUp += (isVolSpike && bullCandle) ? 60.0 : 0;
      volUp += (volume[i] > volume[i-1] && bullCandle) ? 40.0 : 0;

      double volDn = 0;
      volDn += (isVolSpike && bearCandle) ? 60.0 : 0;
      volDn += (volume[i] > volume[i-1] && bearCandle) ? 40.0 : 0;

      // ---- STRUCTURE LEG (Pivots + BOS) ----
      bool ph = IsPivotHigh(high, i, g_pivotLen);
      bool pl = IsPivotLow(low, i, g_pivotLen);

      int pivOff = g_pivotLen + 1; // offset from i to pivot value
      if(ph && i - pivOff >= 0) { g_lastPH2 = g_lastPH; g_lastPH = high[i - pivOff]; }
      if(pl && i - pivOff >= 0) { g_lastPL2 = g_lastPL; g_lastPL = low[i - pivOff]; }

      bool structUp = (g_lastPH > 0 && g_lastPH2 > 0 && g_lastPL > 0 && g_lastPL2 > 0 &&
                       g_lastPH > g_lastPH2 && g_lastPL > g_lastPL2);
      bool structDn = (g_lastPH > 0 && g_lastPH2 > 0 && g_lastPL > 0 && g_lastPL2 > 0 &&
                       g_lastPH < g_lastPH2 && g_lastPL < g_lastPL2);

      // BOS: break of structure — price closes beyond previous pivot
      bool bosUp = (g_lastPH > 0 && i >= 1 && close[i-1] > g_lastPH && g_lastBosDir <= 0);
      bool bosDn = (g_lastPL > 0 && i >= 1 && close[i-1] < g_lastPL && g_lastBosDir >= 0);
      if(bosUp) g_lastBosDir = 1;
      if(bosDn) g_lastBosDir = -1;

      double structUpSc = 0;
      structUpSc += structUp ? 60.0 : 0;
      structUpSc += bosUp ? 40.0 : 0;

      double structDnSc = 0;
      structDnSc += structDn ? 60.0 : 0;
      structDnSc += bosDn ? 40.0 : 0;

      // ---- WEIGHTED SCORES ----
      double wSum = g_wTrend + g_wMom + g_wVol + g_wStruct;
      if(wSum == 0) wSum = 1.0;

      double bullScore = (trendUp * g_wTrend + momUp * g_wMom + volUp * g_wVol + structUpSc * g_wStruct) / wSum;
      double bearScore = (trendDn * g_wTrend + momDn * g_wMom + volDn * g_wVol + structDnSc * g_wStruct) / wSum;

      // ---- FILTERS ----
      double atrPct = (close[i] > 0) ? atr[i] / close[i] * 100 : 0;
      bool volatOk = !g_useVolat || (atrPct >= g_atrMinPct);

      bool htfBullOk = true, htfBearOk = true;
      if(g_useHtf && htfC > 0 && htfE > 0)
      {
         htfBullOk = (htfC > htfE);
         htfBearOk = (htfC < htfE);
      }

      bool gapOkLong  = (g_lastLongIdx < 0) || (i - g_lastLongIdx) >= g_minBarsGap;
      bool gapOkShort = (g_lastShortIdx < 0) || (i - g_lastShortIdx) >= g_minBarsGap;

      bool baseLong  = (bullScore >= g_scoreMedium) && ((bullScore - bearScore) >= g_minScoreGap) && htfBullOk && volatOk;
      bool baseShort = (bearScore >= g_scoreMedium) && ((bearScore - bullScore) >= g_minScoreGap) && htfBearOk && volatOk;

      bool rawLong  = baseLong && gapOkLong;
      bool rawShort = baseShort && gapOkShort;

      // Signal fires only on CONFIRMED bars (not the forming bar)
      bool isConfirmed = (i < rates_total - 1);
      bool longSignal  = rawLong && isConfirmed;
      bool shortSignal = rawShort && isConfirmed;

      if(longSignal)  g_lastLongIdx = i;
      if(shortSignal) g_lastShortIdx = i;

      // Late entry tracking
      g_streakLong  = baseLong ? g_streakLong + 1 : 0;
      g_streakShort = baseShort ? g_streakShort + 1 : 0;

      // ---- SIGNAL EXECUTION ----
      if(longSignal)
      {
         g_entryPrice = close[i];
         g_slPrice    = close[i] - atr[i] * g_slAtrMult;
         double risk  = g_entryPrice - g_slPrice;
         g_tp1Price   = g_entryPrice + risk * g_tp1RR;
         g_tp2Price   = g_entryPrice + risk * g_tp2RR;
         g_tp3Price   = g_entryPrice + risk * g_tp3RR;
         g_lastSignalIdx = i;
         g_lastSignalTime = time[i];
         g_activeDir  = 1;
         g_signalStatus = 1;
         g_activeSL   = g_slPrice;
         g_activeTP3  = g_tp3Price;
         g_dynamicSL  = g_slPrice;
         g_tradeExtreme = high[i];
         g_tp1Done = false; g_tp2Done = false; g_tp3Done = false;

         // ── Position Size Calculation ──
         double pipsAtRisk = (g_pipSize > 0) ? risk / g_pipSize : 0;
         g_riskAmount = InpBalance * InpRiskPct / 100.0;
         if(pipsAtRisk > 0 && g_pipValue > 0)
            g_positionSize = g_riskAmount / (pipsAtRisk * g_pipValue);
         else
            g_positionSize = 0;
         // Clamp to lot steps
         g_positionSize = MathFloor(g_positionSize / InpLotStep + 0.000001) * InpLotStep;
         g_positionSize = MathMax(InpMinLot, MathMin(InpMaxLot, g_positionSize));
         // P&L
         g_riskPnL = -g_riskAmount;
         g_tp1PnL  = pipsAtRisk > 0 ? (g_tp1Price - g_entryPrice) / g_pipSize * g_pipValue * g_positionSize : 0;
         g_tp2PnL  = pipsAtRisk > 0 ? (g_tp2Price - g_entryPrice) / g_pipSize * g_pipValue * g_positionSize : 0;
         g_tp3PnL  = pipsAtRisk > 0 ? (g_tp3Price - g_entryPrice) / g_pipSize * g_pipValue * g_positionSize : 0;

         g_lateWarnTxt = (g_streakLong >= g_lateBars)
            ? "Tardia (" + IntegerToString(g_streakLong) + " b.)"
            : "Fresca";
         g_lateWarnCol = (g_streakLong >= g_lateBars) ? clrOrange : InpColBull;

         if(InpShowLevels) DrawLevels(i, time[i]);
         Alert("BUY Signal — ", _Symbol, " ", EnumToString(_Period),
               " | Entry:", DoubleToString(g_entryPrice, _Digits),
               " | SL:", DoubleToString(g_slPrice, _Digits),
               " | TP1:", DoubleToString(g_tp1Price, _Digits),
               " | TP2:", DoubleToString(g_tp2Price, _Digits),
               " | TP3:", DoubleToString(g_tp3Price, _Digits),
               " | Lot:", DoubleToString(g_positionSize, 2),
               " | Risk:$", DoubleToString(g_riskAmount, 2));
      }
      else if(shortSignal)
      {
         g_entryPrice = close[i];
         g_slPrice    = close[i] + atr[i] * g_slAtrMult;
         double risk  = g_slPrice - g_entryPrice;
         g_tp1Price   = g_entryPrice - risk * g_tp1RR;
         g_tp2Price   = g_entryPrice - risk * g_tp2RR;
         g_tp3Price   = g_entryPrice - risk * g_tp3RR;
         g_lastSignalIdx = i;
         g_lastSignalTime = time[i];
         g_activeDir  = -1;
         g_signalStatus = 1;
         g_activeSL   = g_slPrice;
         g_activeTP3  = g_tp3Price;
         g_dynamicSL  = g_slPrice;
         g_tradeExtreme = low[i];
         g_tp1Done = false; g_tp2Done = false; g_tp3Done = false;

         // ── Position Size Calculation ──
         double pipsAtRisk = (g_pipSize > 0) ? risk / g_pipSize : 0;
         g_riskAmount = InpBalance * InpRiskPct / 100.0;
         if(pipsAtRisk > 0 && g_pipValue > 0)
            g_positionSize = g_riskAmount / (pipsAtRisk * g_pipValue);
         else
            g_positionSize = 0;
         // Clamp to lot steps
         g_positionSize = MathFloor(g_positionSize / InpLotStep + 0.000001) * InpLotStep;
         g_positionSize = MathMax(InpMinLot, MathMin(InpMaxLot, g_positionSize));
         // P&L
         g_riskPnL = -g_riskAmount;
         g_tp1PnL  = pipsAtRisk > 0 ? (g_entryPrice - g_tp1Price) / g_pipSize * g_pipValue * g_positionSize : 0;
         g_tp2PnL  = pipsAtRisk > 0 ? (g_entryPrice - g_tp2Price) / g_pipSize * g_pipValue * g_positionSize : 0;
         g_tp3PnL  = pipsAtRisk > 0 ? (g_entryPrice - g_tp3Price) / g_pipSize * g_pipValue * g_positionSize : 0;

         g_lateWarnTxt = (g_streakShort >= g_lateBars)
            ? "Tardia (" + IntegerToString(g_streakShort) + " b.)"
            : "Fresca";
         g_lateWarnCol = (g_streakShort >= g_lateBars) ? clrOrange : InpColBear;

         if(InpShowLevels) DrawLevels(i, time[i]);
         Alert("SELL Signal — ", _Symbol, " ", EnumToString(_Period),
               " | Entry:", DoubleToString(g_entryPrice, _Digits),
               " | SL:", DoubleToString(g_slPrice, _Digits),
               " | TP1:", DoubleToString(g_tp1Price, _Digits),
               " | TP2:", DoubleToString(g_tp2Price, _Digits),
               " | TP3:", DoubleToString(g_tp3Price, _Digits),
               " | Lot:", DoubleToString(g_positionSize, 2),
               " | Risk:$", DoubleToString(g_riskAmount, 2));
      }

      // ---- TRADE MANAGEMENT (only on bars after the signal bar) ----
      if(g_signalStatus == 1 && i > g_lastSignalIdx)
      {
         // Update trade extreme
         if(g_activeDir == 1)
            g_tradeExtreme = MathMax(g_tradeExtreme, high[i]);
         else
            g_tradeExtreme = MathMin(g_tradeExtreme, low[i]);

         // TP detection
         if(!g_tp1Done && g_tp1Price > 0)
         {
            if((g_activeDir == 1 && high[i] >= g_tp1Price) ||
               (g_activeDir == -1 && low[i] <= g_tp1Price))
               g_tp1Done = true;
         }
         if(!g_tp2Done && g_tp2Price > 0)
         {
            if((g_activeDir == 1 && high[i] >= g_tp2Price) ||
               (g_activeDir == -1 && low[i] <= g_tp2Price))
               g_tp2Done = true;
         }
         if(!g_tp3Done && g_tp3Price > 0)
         {
            if((g_activeDir == 1 && high[i] >= g_tp3Price) ||
               (g_activeDir == -1 && low[i] <= g_tp3Price))
               g_tp3Done = true;
         }

         // 1. Breakeven after TP1
         if(g_beTp1 && g_tp1Done)
         {
            double beTarget = (g_beMode == BE_HALFTP1)
               ? (g_entryPrice + g_tp1Price) / 2.0
               : g_entryPrice;
            if(g_activeDir == 1)
               g_dynamicSL = MathMax(g_dynamicSL, beTarget);
            else
               g_dynamicSL = MathMin(g_dynamicSL, beTarget);
         }

         // 2. Trailing Stop
         bool canTrail = g_useTrail &&
            (g_trailAct == TRAIL_IMMEDIATE ||
            (g_trailAct == TRAIL_AFTER_TP1 && g_tp1Done) ||
            (g_trailAct == TRAIL_AFTER_TP2 && g_tp2Done));

         if(canTrail && atr[i] > 0)
         {
            double trailPrice = (g_activeDir == 1)
               ? g_tradeExtreme - (atr[i] * g_trailAtr)
               : g_tradeExtreme + (atr[i] * g_trailAtr);
            if(g_activeDir == 1)
               g_dynamicSL = MathMax(g_dynamicSL, trailPrice);
            else
               g_dynamicSL = MathMin(g_dynamicSL, trailPrice);
         }

         // SL/BE/Trail exit check (only on confirmed bars)
         if(isConfirmed && g_dynamicSL > 0)
         {
            bool slHit = (g_activeDir == 1) ? (low[i] <= g_dynamicSL) : (high[i] >= g_dynamicSL);
            bool tpFinalHit = (g_activeTP3 > 0)
               ? ((g_activeDir == 1) ? (high[i] >= g_activeTP3) : (low[i] <= g_activeTP3))
               : false;

            if(slHit)
            {
               g_signalStatus = 2;
               g_lateWarnTxt = "—";
               g_lateWarnCol = InpColNeutral;
               Alert("EXIT (SL/BE) — ", _Symbol, " ", EnumToString(_Period),
                     " | Reason:", g_tp1Done ? "BE/Trail" : "SL hit");
            }
            else if(tpFinalHit)
            {
               g_signalStatus = 3;
               g_lateWarnTxt = "—";
               g_lateWarnCol = InpColNeutral;
               Alert("EXIT (TP3) — ", _Symbol, " ", EnumToString(_Period));
            }
         }
      }

      // Save scores from last bar for dashboard
      if(i == rates_total - 1)
      {
         g_lastBullScore  = bullScore;
         g_lastBearScore  = bearScore;
         g_lastTrendUp    = trendUp;
         g_lastTrendDn    = trendDn;
         g_lastMomUp      = momUp;
         g_lastMomDn      = momDn;
         g_lastVolUp      = volUp;
         g_lastVolDn      = volDn;
         g_lastStructUp   = structUpSc;
         g_lastStructDn   = structDnSc;
         g_lastVolRatio   = volRatio;
         g_lastAtrPct     = atrPct;
         g_lastBaseLong   = baseLong;
         g_lastBaseShort  = baseShort;
      }
   }

   // ═══════════════════════════════════════════════════════════════
   //  DASHBOARD (Comment)
   // ═══════════════════════════════════════════════════════════════
   if(!InpShowDash)
   {
      Comment("");
      return rates_total;
   }

   int cur = rates_total - 1; // current bar index (standard order)

   string baseDirTag = "";
   if(g_lastBaseLong && g_lastBaseShort)          baseDirTag = " Bull|Bear";
   else if(g_lastBaseLong)                        baseDirTag = " Bull";
   else if(g_lastBaseShort)                       baseDirTag = " Bear";

   // Gap countdown
   int barsSinceLong  = (g_lastLongIdx < 0)  ? 999999 : (cur - g_lastLongIdx);
   int barsSinceShort = (g_lastShortIdx < 0) ? 999999 : (cur - g_lastShortIdx);
   int waitLong  = MathMax(0, g_minBarsGap - barsSinceLong);
   int waitShort = MathMax(0, g_minBarsGap - barsSinceShort);
   int closestWait = MathMin(waitLong, waitShort);

   string gapTxt;
   if(closestWait == 0)
      gapTxt = "Pronto agora";
   else if(closestWait <= 5)
      gapTxt = "Prox " + IntegerToString(closestWait);
   else
      gapTxt = "Aguarda " + IntegerToString(closestWait) + " b.";
   gapTxt += baseDirTag;

   string statusTxt = StatusText();

   string bullTier = TierLabel(g_lastBullScore);
   string bearTier = TierLabel(g_lastBearScore);

   string tradeLevels;
   if(g_entryPrice == 0 || g_signalStatus > 1)
      tradeLevels = "Sem sinal ativo";
   else
      tradeLevels = "E:" + DoubleToString(g_entryPrice, _Digits) +
                   " | SL:" + DoubleToString(g_dynamicSL, _Digits) +
                   " | TP1:" + DoubleToString(g_tp1Price, _Digits) +
                   " | TP2:" + DoubleToString(g_tp2Price, _Digits) +
                   " | TP3:" + DoubleToString(g_tp3Price, _Digits);

   string presetName = EnumToString(InpPreset);
   StringReplace(presetName, "PRESET_", "");

   string dash = "";
   dash += "=== Sr.Robs Confluence Engine | " + _Symbol + " " + EnumToString(_Period) + " ===\n";
   dash += "Preset: " + presetName + " | Direcao: ";
   dash += (g_activeDir == 1) ? "LONG" : (g_activeDir == -1) ? "SHORT" : "—";
   dash += "\n";
   dash += "----------------------------------------------\n";
   dash += "Prox Sinal: " + gapTxt + "\n";
   dash += "Qualidade:  " + g_lateWarnTxt + "\n";
   dash += "Status:     " + statusTxt + "\n";
   dash += "----------------------------------------------\n";
   dash += "Bull: " + ProgBar(g_lastBullScore, 100) + " | " + bullTier + "\n";
   dash += "Bear: " + ProgBar(g_lastBearScore, 100) + " | " + bearTier + "\n";
   dash += "----------------------------------------------\n";
   dash += "Trend:     " + ProgBar(MathMax(g_lastTrendUp, g_lastTrendDn), 100) + "\n";
   dash += "Momentum:  " + ProgBar(MathMax(g_lastMomUp, g_lastMomDn), 100) + "\n";
   dash += "Volume:    " + ProgBar(MathMax(g_lastVolUp, g_lastVolDn), 100) + "\n";
   dash += "Structure: " + ProgBar(MathMax(g_lastStructUp, g_lastStructDn), 100) + "\n";
   dash += "----------------------------------------------\n";
   dash += "Alvos: " + tradeLevels + "\n";
   dash += "Vol: " + DoubleToString(g_lastVolRatio, 2) + "x | ATR: " + DoubleToString(g_lastAtrPct, 2) + "%\n";

   // ── Risk Management Info ──
   if(InpShowRisk)
   {
      dash += "----------------------------------------------\n";
      dash += "💰 Pip: " + DoubleToString(g_pipSize, 5) + " | Value/Lot: $" + DoubleToString(g_pipValue, 2) + "\n";
      dash += "💵 Banca: $" + DoubleToString(InpBalance, 2) + " | Risco: " + DoubleToString(InpRiskPct, 1) + "%\n";
      if(g_entryPrice > 0 && g_signalStatus <= 1)
      {
         dash += "📐 Lote Recomendado: " + DoubleToString(g_positionSize, 2) + "\n";
         dash += "🔴 Risk: -$" + DoubleToString(MathAbs(g_riskPnL), 2);
         dash += " | 🟢 TP1: +$" + DoubleToString(g_tp1PnL, 2);
         dash += " | TP2: +$" + DoubleToString(g_tp2PnL, 2);
         dash += " | TP3: +$" + DoubleToString(g_tp3PnL, 2) + "\n";
      }
      else
      {
         dash += "📐 Lote: Aguarda sinal...\n";
      }
   }

   dash += "==============================================\n";

   Comment(dash);

   return rates_total;
}
//+------------------------------------------------------------------+
