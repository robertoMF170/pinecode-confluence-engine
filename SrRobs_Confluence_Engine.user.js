// ==UserScript==
// @name         SrRobs Confluence Engine
// @namespace    https://srrobs.com
// @version      1.0.0
// @description  Confluence Engine for RebelsFunding - EMAs, RSI, MACD, ATR, Scores, Signals, Dashboard
// @author       Sr.Robs
// @match        https://app.rebelsfunding.com/*
// @match        https://webtrader.rebelsfunding.com/*
// @match        https://trade.rebelsfunding.com/*
// @match        https://pcwebtrader.rf-trader.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const LOG_PREFIX = '[SrRobs CE]';
    const DEBUG = true;

    function log(level, msg, ...args) {
        if (!DEBUG && level === 'debug') return;
        const fn = console[level] || console.log;
        fn(`${LOG_PREFIX} ${msg}`, ...args);
    }

    log('info', '🚀 Script loaded — starting initialization...');

    // ══════════════════════════════════════════════════
    // ── CONFIG (same defaults as Pine Script v6) ──
    // ══════════════════════════════════════════════════
    const CONFIG = {
        // Preset
        preset: '5m', // 'Manual' | '1m' | '3m' | '5m' | '15m' | '30m' | '1d'

        // EMAs
        emaFastLen: 21,
        emaSlowLen: 50,
        emaTrendLen: 200,
        slopeLen: 5,

        // Momentum
        rsiLen: 14,
        rsiMid: 50,
        macdFast: 12,
        macdSlow: 26,
        macdSig: 9,

        // Volume
        volMaLen: 20,
        volSpikeMult: 1.5,

        // Structure
        pivotLen: 7,

        // ATR
        atrLen: 14,

        // Core
        scoreStrong: 70,
        scoreMedium: 45,
        minBarsGap: 20,
        minScoreGap: 15,

        // Weights (%)
        wTrend: 30,
        wMom: 25,
        wVol: 15,
        wStruct: 30,

        // Filters
        useHtfFilter: false,
        htfRes: '60',
        useVolatFilt: true,
        atrMinPct: 0.05,
        lateBars: 2,

        // Trade Tools
        slAtrMult: 1.8,
        tp1RR: 1.0,
        tp2RR: 2.0,
        tp3RR: 3.0,
        beTp1: true,
        beMode: 'Entry', // 'Entry' | 'Half TP1'
        useTrail: true,
        trailAct: 'After TP2', // 'Immediate' | 'After TP1' | 'After TP2'
        trailAtr: 1.5,

        // Risk
        balance: 1000,
        riskPct: 1.0,
        minLot: 0.01,
        maxLot: 50.0,
        lotStep: 0.01,
    };

    // ── PRESETS ──
    const PRESETS = {
        '1m':  { emaFast:9,  emaSlow:21,  emaMacro:100, slope:3,  rsi:9,  macdF:5,  macdS:13, macdSig:5,  volMa:14, pivot:5,  atr:7,  slMult:1.5, gap:8,  scoreStrong:75, scoreMedium:50, scoreGap:15, volSpike:1.8, tp1:0.8, tp2:1.5, tp3:2.0 },
        '3m':  { emaFast:13, emaSlow:34,  emaMacro:150, slope:4,  rsi:11, macdF:8,  macdS:17, macdSig:9,  volMa:18, pivot:6,  atr:10, slMult:1.6, gap:12, scoreStrong:75, scoreMedium:50, scoreGap:15, volSpike:1.8, tp1:0.8, tp2:1.5, tp3:2.0 },
        '5m':  { emaFast:21, emaSlow:50,  emaMacro:200, slope:5,  rsi:14, macdF:12, macdS:26, macdSig:9,  volMa:20, pivot:7,  atr:14, slMult:1.8, gap:20, scoreStrong:75, scoreMedium:50, scoreGap:15, volSpike:1.8, tp1:1.0, tp2:2.0, tp3:3.0 },
        '15m': { emaFast:21, emaSlow:50,  emaMacro:200, slope:5,  rsi:14, macdF:12, macdS:26, macdSig:9,  volMa:20, pivot:9,  atr:14, slMult:2.0, gap:30, scoreStrong:75, scoreMedium:50, scoreGap:12, volSpike:1.5, tp1:1.0, tp2:2.0, tp3:3.0 },
        '30m': { emaFast:34, emaSlow:89,  emaMacro:200, slope:6,  rsi:14, macdF:12, macdS:26, macdSig:9,  volMa:20, pivot:10, atr:14, slMult:2.5, gap:40, scoreStrong:75, scoreMedium:50, scoreGap:12, volSpike:1.5, tp1:1.0, tp2:2.5, tp3:4.0 },
        '1d':  { emaFast:8,  emaSlow:21,  emaMacro:50,  slope:3,  rsi:14, macdF:12, macdS:26, macdSig:9,  volMa:20, pivot:3,  atr:14, slMult:2.0, gap:60, scoreStrong:75, scoreMedium:50, scoreGap:10, volSpike:1.5, tp1:1.0, tp2:2.0, tp3:3.0 },
    };

    function applyPreset(preset) {
        const p = PRESETS[preset];
        if (!p) return;
        CONFIG.emaFastLen = p.emaFast;
        CONFIG.emaSlowLen = p.emaSlow;
        CONFIG.emaTrendLen = p.emaMacro;
        CONFIG.slopeLen = p.slope;
        CONFIG.rsiLen = p.rsi;
        CONFIG.macdFast = p.macdF;
        CONFIG.macdSlow = p.macdS;
        CONFIG.macdSig = p.macdSig;
        CONFIG.volMaLen = p.volMa;
        CONFIG.pivotLen = p.pivot;
        CONFIG.atrLen = p.atr;
        CONFIG.slAtrMult = p.slMult;
        CONFIG.minBarsGap = p.gap;
        CONFIG.scoreStrong = p.scoreStrong;
        CONFIG.scoreMedium = p.scoreMedium;
        CONFIG.minScoreGap = p.scoreGap;
        CONFIG.volSpikeMult = p.volSpike;
        CONFIG.tp1RR = p.tp1;
        CONFIG.tp2RR = p.tp2;
        CONFIG.tp3RR = p.tp3;
        log('info', `✅ Preset "${preset}" applied: EMAs(${p.emaFast}/${p.emaSlow}/${p.emaMacro}), RSI(${p.rsi}), Gap(${p.gap}), SL ATR(${p.slMult}), TPs(${p.tp1}/${p.tp2}/${p.tp3})`);
    }

    // ══════════════════════════════════════════════════
    // ── PIP VALUE LOOKUP TABLE ──
    // ══════════════════════════════════════════════════
    function getPipValue(pair) {
        const lookup = {
            'EUR/USD': 10.0, 'GBP/USD': 10.0, 'USD/JPY': 9.0,
            'USD/CAD': 7.5, 'USD/CHF': 11.0, 'AUD/USD': 10.0,
            'NZD/USD': 10.0, 'EUR/GBP': 12.5, 'GBP/JPY': 6.5,
            'BTC/USD': 1.0, 'ETH/USD': 1.0, 'XAU/USD': 10.0,
            'US30': 1.0, 'NAS100': 1.0,
        };
        return lookup[pair] || 10.0;
    }

    // ══════════════════════════════════════════════════
    // ── TECHNICAL INDICATORS (Pure JS) ──
    // ══════════════════════════════════════════════════
    function calcEMA(data, period) {
        if (data.length < period) return new Array(data.length).fill(null);
        const alpha = 2.0 / (period + 1);
        const result = new Array(data.length).fill(null);
        // Seed with SMA
        let sum = 0;
        for (let i = 0; i < period; i++) sum += data[i];
        result[period - 1] = sum / period;
        for (let i = period; i < data.length; i++) {
            result[i] = alpha * data[i] + (1 - alpha) * result[i - 1];
        }
        return result;
    }

    function calcSMA(data, period) {
        const result = new Array(data.length).fill(null);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
            if (i >= period) sum -= data[i - period];
            if (i >= period - 1) result[i] = sum / period;
        }
        return result;
    }

    function calcRSI(data, period) {
        if (data.length < period + 1) return new Array(data.length).fill(null);
        const result = new Array(data.length).fill(null);
        const gains = new Array(data.length).fill(0);
        const losses = new Array(data.length).fill(0);
        for (let i = 1; i < data.length; i++) {
            const diff = data[i] - data[i - 1];
            gains[i] = diff > 0 ? diff : 0;
            losses[i] = diff < 0 ? -diff : 0;
        }
        // Seed
        let avgGain = 0, avgLoss = 0;
        for (let i = 1; i <= period; i++) {
            avgGain += gains[i];
            avgLoss += losses[i];
        }
        avgGain /= period;
        avgLoss /= period;
        result[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
        for (let i = period + 1; i < data.length; i++) {
            avgGain = (avgGain * (period - 1) + gains[i]) / period;
            avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
            result[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
        }
        return result;
    }

    function calcMACD(data, fast, slow, signal) {
        const emaFast = calcEMA(data, fast);
        const emaSlow = calcEMA(data, slow);
        const macdLine = new Array(data.length).fill(null);
        for (let i = 0; i < data.length; i++) {
            if (emaFast[i] !== null && emaSlow[i] !== null) {
                macdLine[i] = emaFast[i] - emaSlow[i];
            }
        }
        const signalLine = calcEMA(macdLine.filter(v => v !== null), signal);
        // Rebuild signal line aligned to original indices
        const macdVals = macdLine.filter(v => v !== null);
        const sigVals = calcEMA(macdVals, signal);
        const sigAligned = new Array(data.length).fill(null);
        let vi = 0;
        for (let i = 0; i < data.length; i++) {
            if (macdLine[i] !== null) {
                sigAligned[i] = sigVals[vi];
                vi++;
            }
        }
        const histogram = new Array(data.length).fill(null);
        for (let i = 0; i < data.length; i++) {
            if (macdLine[i] !== null && sigAligned[i] !== null) {
                histogram[i] = macdLine[i] - sigAligned[i];
            }
        }
        return { macdLine, signalLine: sigAligned, histogram };
    }

    function calcATR(high, low, close, period) {
        const tr = new Array(high.length).fill(null);
        tr[0] = high[0] - low[0];
        for (let i = 1; i < high.length; i++) {
            tr[i] = Math.max(
                high[i] - low[i],
                Math.abs(high[i] - close[i - 1]),
                Math.abs(low[i] - close[i - 1])
            );
        }
        // Wilder's smoothing
        const atr = new Array(high.length).fill(null);
        let sum = 0;
        for (let i = 0; i < period; i++) sum += tr[i];
        atr[period - 1] = sum / period;
        for (let i = period; i < high.length; i++) {
            atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
        }
        return atr;
    }

    function findPivotHigh(high, offset, len) {
        const idx = offset - len; // candidate is at offset-len
        if (idx < len || idx >= high.length - len) return null;
        const candidate = high[idx];
        for (let i = offset - len * 2; i <= offset; i++) {
            if (i !== idx && i >= 0 && i < high.length && high[i] >= candidate) {
                return null;
            }
        }
        return candidate;
    }

    function findPivotLow(low, offset, len) {
        const idx = offset - len;
        if (idx < len || idx >= low.length - len) return null;
        const candidate = low[idx];
        for (let i = offset - len * 2; i <= offset; i++) {
            if (i !== idx && i >= 0 && i < low.length && low[i] <= candidate) {
                return null;
            }
        }
        return candidate;
    }

    // ══════════════════════════════════════════════════
    // ── CORE ENGINE ──
    // ══════════════════════════════════════════════════
    class ConfluenceEngine {
        constructor(config) {
            this.cfg = config;
            this.reset();
            log('debug', '🏗️ ConfluenceEngine constructed');
        }

        reset() {
            // OHLC history
            this.open = [];
            this.high = [];
            this.low = [];
            this.close = [];
            this.volume = [];
            this.times = [];

            // Computed indicators
            this.emaFast = [];
            this.emaSlow = [];
            this.emaMacro = [];
            this.emaFastSlope = [];
            this.emaSlowSlope = [];
            this.rsiVal = [];
            this.macdLine = [];
            this.macdSignal = [];
            this.macdHist = [];
            this.volMa = [];
            this.volRatio = [];
            this.atrVal = [];

            // Scores
            this.bullScore = 0;
            this.bearScore = 0;
            this.trendUpScore = 0;
            this.trendDnScore = 0;
            this.momUpScore = 0;
            this.momDnScore = 0;
            this.volUpScore = 0;
            this.volDnScore = 0;
            this.structUpScore = 0;
            this.structDnScore = 0;

            // Tier
            this.bullTier = 'None';
            this.bearTier = 'None';

            // Pivot tracking
            this.lastPH = null;
            this.lastPH2 = null;
            this.lastPL = null;
            this.lastPL2 = null;
            this.lastBosDir = 0;

            // Signal state
            this.lastLongBarIdx = null;
            this.lastShortBarIdx = null;
            this.prevNextTrade = false;

            // Trade state
            this.signalStatus = 0; // 0=idle, 1=active, 2=SL hit, 3=TP3 hit
            this.entryPrice = null;
            this.slPrice = null;
            this.tp1Price = null;
            this.tp2Price = null;
            this.tp3Price = null;
            this.lastSignalBar = null;
            this.lastDir = 0;
            this.activeDir = 0;
            this.dynamicSL = null;
            this.tradeExtreme = null;
            this.tp1HitDone = false;
            this.tp2HitDone = false;
            this.tp3HitDone = false;

            // Risk
            this.positionSize = 0;
            this._slDist = null;
            this._pipsAtRisk = 0;
            this._rawLot = 0;

            // Entry quality
            this.streakLong = 0;
            this.streakShort = 0;
            this.lateWarningTxt = '—';
            this.lateWarningCol = '#787b86';

            // Signal
            this.longSignal = false;
            this.shortSignal = false;

            // Gap
            this.closestWait = -1;
            this.barsSinceReady = -1;
            this._baseDirTag = '';

        }

        addBar(time, open, high, low, close, volume) {
            this.open.push(open);
            this.high.push(high);
            this.low.push(low);
            this.close.push(close);
            this.volume.push(volume);
            this.times.push(time);

            const barIndex = this.close.length - 1;
            log('debug', `📊 Bar #${barIndex} | O:${open.toFixed(5)} H:${high.toFixed(5)} L:${low.toFixed(5)} C:${close.toFixed(5)} V:${volume}`);

            this.calculateAll();
        }

        calculateAll() {
            const len = this.close.length;
            if (len < Math.max(this.cfg.emaTrendLen, this.cfg.rsiLen, this.cfg.atrLen, this.cfg.macdSlow)) {
                log('debug', `⏳ Need more bars: ${len} < ${Math.max(this.cfg.emaTrendLen, this.cfg.rsiLen, this.cfg.atrLen, this.cfg.macdSlow)}`);
                return;
            }
            const i = len - 1;

            // ── EMAs ──
            this.emaFast = calcEMA(this.close, this.cfg.emaFastLen);
            this.emaSlow = calcEMA(this.close, this.cfg.emaSlowLen);
            this.emaMacro = calcEMA(this.close, this.cfg.emaTrendLen);

            // Slopes
            if (i >= this.cfg.slopeLen) {
                this.emaFastSlope[i] = (this.emaFast[i] - this.emaFast[i - this.cfg.slopeLen]) / this.cfg.slopeLen;
                this.emaSlowSlope[i] = (this.emaSlow[i] - this.emaSlow[i - this.cfg.slopeLen]) / this.cfg.slopeLen;
            }

            // ── Trend Scores ──
            this.trendUpScore = 0;
            this.trendUpScore += this.emaFast[i] > this.emaSlow[i] ? 40 : 0;
            this.trendUpScore += this.close[i] > this.emaMacro[i] ? 30 : 0;
            this.trendUpScore += this.emaFastSlope[i] > 0 ? 20 : 0;
            this.trendUpScore += this.emaSlowSlope[i] > 0 ? 10 : 0;

            this.trendDnScore = 0;
            this.trendDnScore += this.emaFast[i] < this.emaSlow[i] ? 40 : 0;
            this.trendDnScore += this.close[i] < this.emaMacro[i] ? 30 : 0;
            this.trendDnScore += this.emaFastSlope[i] < 0 ? 20 : 0;
            this.trendDnScore += this.emaSlowSlope[i] < 0 ? 10 : 0;

            // ── RSI ──
            this.rsiVal = calcRSI(this.close, this.cfg.rsiLen);

            // ── MACD ──
            const macd = calcMACD(this.close, this.cfg.macdFast, this.cfg.macdSlow, this.cfg.macdSig);
            this.macdLine = macd.macdLine;
            this.macdSignal = macd.signalLine;
            this.macdHist = macd.histogram;

            // ── Momentum Scores ──
            this.momUpScore = 0;
            this.momUpScore += this.rsiVal[i] > this.cfg.rsiMid ? 35 : 0;
            this.momUpScore += this.macdLine[i] > this.macdSignal[i] ? 35 : 0;
            const prevHist = i > 0 ? this.macdHist[i - 1] : 0;
            this.momUpScore += this.macdHist[i] > prevHist ? 30 : 0;

            this.momDnScore = 0;
            this.momDnScore += this.rsiVal[i] < this.cfg.rsiMid ? 35 : 0;
            this.momDnScore += this.macdLine[i] < this.macdSignal[i] ? 35 : 0;
            this.momDnScore += this.macdHist[i] < prevHist ? 30 : 0;

            // ── Volume ──
            this.volMa = calcSMA(this.volume, this.cfg.volMaLen);
            this.volRatio[i] = this.volMa[i] > 0 ? this.volume[i] / this.volMa[i] : 1;
            const isVolSpike = this.volRatio[i] >= this.cfg.volSpikeMult;
            const bullCandle = this.close[i] > this.open[i];
            const bearCandle = this.close[i] < this.open[i];

            this.volUpScore = 0;
            this.volUpScore += isVolSpike && bullCandle ? 60 : 0;
            this.volUpScore += this.volume[i] > (i > 0 ? this.volume[i - 1] : 0) && bullCandle ? 40 : 0;

            this.volDnScore = 0;
            this.volDnScore += isVolSpike && bearCandle ? 60 : 0;
            this.volDnScore += this.volume[i] > (i > 0 ? this.volume[i - 1] : 0) && bearCandle ? 40 : 0;

            // ── ATR ──
            this.atrVal = calcATR(this.high, this.low, this.close, this.cfg.atrLen);

            // ── Pivots & Structure ──
            const pivotLen = this.cfg.pivotLen;
            const ph = findPivotHigh(this.high, i, pivotLen);
            const pl = findPivotLow(this.low, i, pivotLen);

            if (ph !== null) {
                this.lastPH2 = this.lastPH;
                this.lastPH = ph;
                log('debug', `📍 Pivot High found at bar ${i - pivotLen}: ${ph.toFixed(5)}`);
            }
            if (pl !== null) {
                this.lastPL2 = this.lastPL;
                this.lastPL = pl;
                log('debug', `📍 Pivot Low found at bar ${i - pivotLen}: ${pl.toFixed(5)}`);
            }

            const structUp = this.lastPH && this.lastPH2 && this.lastPL && this.lastPL2 &&
                this.lastPH > this.lastPH2 && this.lastPL > this.lastPL2;
            const structDn = this.lastPH && this.lastPH2 && this.lastPL && this.lastPL2 &&
                this.lastPH < this.lastPH2 && this.lastPL < this.lastPL2;

            const bosUp = this.lastPH && i > 0 && this.close[i - 1] > this.lastPH && this.lastBosDir <= 0;
            const bosDn = this.lastPL && i > 0 && this.close[i - 1] < this.lastPL && this.lastBosDir >= 0;

            if (bosUp) { this.lastBosDir = 1; log('debug', '📈 BOS Up!'); }
            if (bosDn) { this.lastBosDir = -1; log('debug', '📉 BOS Down!'); }

            this.structUpScore = 0;
            this.structUpScore += structUp ? 60 : 0;
            this.structUpScore += bosUp ? 40 : 0;

            this.structDnScore = 0;
            this.structDnScore += structDn ? 60 : 0;
            this.structDnScore += bosDn ? 40 : 0;

            // ── Weighted Scores ──
            const wSum = this.cfg.wTrend + this.cfg.wMom + this.cfg.wVol + this.cfg.wStruct;
            const wSafe = wSum === 0 ? 1 : wSum;
            this.bullScore = (this.trendUpScore * this.cfg.wTrend + this.momUpScore * this.cfg.wMom + this.volUpScore * this.cfg.wVol + this.structUpScore * this.cfg.wStruct) / wSafe;
            this.bearScore = (this.trendDnScore * this.cfg.wTrend + this.momDnScore * this.cfg.wMom + this.volDnScore * this.cfg.wVol + this.structDnScore * this.cfg.wStruct) / wSafe;

            // ── Tiers ──
            this.bullTier = this.bullScore >= this.cfg.scoreStrong ? 'Strong' : this.bullScore >= this.cfg.scoreMedium ? 'Medium' : this.bullScore > 0 ? 'Weak' : 'None';
            this.bearTier = this.bearScore >= this.cfg.scoreStrong ? 'Strong' : this.bearScore >= this.cfg.scoreMedium ? 'Medium' : this.bearScore > 0 ? 'Weak' : 'None';

            // ── ATR % ──
            const atrPct = this.close[i] > 0 ? this.atrVal[i] / this.close[i] * 100 : 0;
            const volatOk = !this.cfg.useVolatFilt || atrPct >= this.cfg.atrMinPct;

            // ── Gap Management ──
            const gapOkLong = this.lastLongBarIdx === null || (i - this.lastLongBarIdx) >= this.cfg.minBarsGap;
            const gapOkShort = this.lastShortBarIdx === null || (i - this.lastShortBarIdx) >= this.cfg.minBarsGap;

            // ── Raw Signals ──
            const rawLongSignal = this.bullScore >= this.cfg.scoreMedium &&
                (this.bullScore - this.bearScore) >= this.cfg.minScoreGap &&
                volatOk && gapOkLong;
            const rawShortSignal = this.bearScore >= this.cfg.scoreMedium &&
                (this.bearScore - this.bullScore) >= this.cfg.minScoreGap &&
                volatOk && gapOkShort;

            this.longSignal = rawLongSignal;
            this.shortSignal = rawShortSignal;

            // Guard: only fire signal if no active trade (prevents re-triggering on consecutive bars)
            if (this.longSignal && this.signalStatus !== 1) {
                this.lastLongBarIdx = i;
                this.entryPrice = this.close[i];
                this.slPrice = this.close[i] - this.atrVal[i] * this.cfg.slAtrMult;
                const riskDist = this.entryPrice - this.slPrice;
                this.tp1Price = this.entryPrice + riskDist * this.cfg.tp1RR;
                this.tp2Price = this.entryPrice + riskDist * this.cfg.tp2RR;
                this.tp3Price = this.entryPrice + riskDist * this.cfg.tp3RR;
                this.lastSignalBar = i;
                this.lastDir = 1;
                this.activeDir = 1;
                this.signalStatus = 1;
                this.dynamicSL = this.slPrice;
                this.tradeExtreme = this.high[i];
                this.tp1HitDone = false;
                this.tp2HitDone = false;
                this.tp3HitDone = false;
                this.calcPositionSize(riskDist);
                log('info', `🐂 LONG SIGNAL @ bar ${i}! Entry:${this.entryPrice.toFixed(5)} SL:${this.slPrice.toFixed(5)} Dist:${riskDist.toFixed(5)} TP1:${this.tp1Price.toFixed(5)} TP2:${this.tp2Price.toFixed(5)} TP3:${this.tp3Price.toFixed(5)}`);
            }

            if (this.shortSignal && this.signalStatus !== 1) {
                this.lastShortBarIdx = i;
                this.entryPrice = this.close[i];
                this.slPrice = this.close[i] + this.atrVal[i] * this.cfg.slAtrMult;
                const riskDist = this.slPrice - this.entryPrice;
                this.tp1Price = this.entryPrice - riskDist * this.cfg.tp1RR;
                this.tp2Price = this.entryPrice - riskDist * this.cfg.tp2RR;
                this.tp3Price = this.entryPrice - riskDist * this.cfg.tp3RR;
                this.lastSignalBar = i;
                this.lastDir = -1;
                this.activeDir = -1;
                this.signalStatus = 1;
                this.dynamicSL = this.slPrice;
                this.tradeExtreme = this.low[i];
                this.tp1HitDone = false;
                this.tp2HitDone = false;
                this.tp3HitDone = false;
                this.calcPositionSize(riskDist);
                log('info', `🐻 SHORT SIGNAL @ bar ${i}! Entry:${this.entryPrice.toFixed(5)} SL:${this.slPrice.toFixed(5)} Dist:${riskDist.toFixed(5)} TP1:${this.tp1Price.toFixed(5)} TP2:${this.tp2Price.toFixed(5)} TP3:${this.tp3Price.toFixed(5)}`);
            }

            // ── Trade Management (BE + Trail) ──
            this.manageTrade(i);

            // ── Gap Counter ──
            const barsSinceLong = this.lastLongBarIdx === null ? 999999 : i - this.lastLongBarIdx;
            const barsSinceShort = this.lastShortBarIdx === null ? 999999 : i - this.lastShortBarIdx;
            const waitLong = Math.max(0, this.cfg.minBarsGap - barsSinceLong);
            const waitShort = Math.max(0, this.cfg.minBarsGap - barsSinceShort);
            this.closestWait = Math.min(waitLong, waitShort);
            const gapReady = this.closestWait === 0;
            const hasHadSignal = barsSinceLong < 999999 || barsSinceShort < 999999;
            this.barsSinceReady = gapReady && hasHadSignal ? Math.max(0, Math.min(barsSinceLong, barsSinceShort) - this.cfg.minBarsGap) : -1;

            // ── Base direction tag ──
            const baseLong = this.bullScore >= this.cfg.scoreMedium && (this.bullScore - this.bearScore) >= this.cfg.minScoreGap && volatOk;
            const baseShort = this.bearScore >= this.cfg.scoreMedium && (this.bearScore - this.bullScore) >= this.cfg.minScoreGap && volatOk;
            this._baseDirTag = baseLong && baseShort ? ' ⚡Bull|Bear' : baseLong ? ' ⚡Bull' : baseShort ? ' ⚡Bear' : '';

            // ── Entry Quality ──
            this.streakLong = baseLong ? this.streakLong + 1 : 0;
            this.streakShort = baseShort ? this.streakShort + 1 : 0;

            log('debug', `📊 Scores — Bull:${this.bullScore.toFixed(1)} (${this.bullTier}) Bear:${this.bearScore.toFixed(1)} (${this.bearTier}) | Trend↑${this.trendUpScore} Trend↓${this.trendDnScore} | Mom↑${this.momUpScore} Mom↓${this.momDnScore} | Vol↑${this.volUpScore} Vol↓${this.volDnScore} | Struct↑${this.structUpScore} Struct↓${this.structDnScore} | Gap:${this.closestWait}b | RSI:${this.rsiVal[i]?.toFixed(1) || '—'} | ATR%:${atrPct.toFixed(2)}`);
        }

        calcPositionSize(riskDist) {
            // Pip size detection (simplified - assumes forex pairs with 0.0001 pip)
            // On RebelsFunding we need to detect from the ticker
            const ticker = window._srRobs_ticker || 'EUR/USD';
            const pipSize = ticker.includes('JPY') ? 0.01 : 0.0001;
            const pipValue = getPipValue(ticker);
            this._slDist = riskDist;
            this._pipsAtRisk = pipSize > 0 ? riskDist / pipSize : 0;
            const riskAmount = this.cfg.balance * this.cfg.riskPct / 100;
            this._rawLot = this._pipsAtRisk > 0 && pipValue > 0 ? riskAmount / (this._pipsAtRisk * pipValue) : 0;
            this.positionSize = Math.max(this.cfg.minLot,
                Math.min(this.cfg.maxLot,
                    Math.floor(this._rawLot / this.cfg.lotStep + 0.000001) * this.cfg.lotStep
                ));
            log('info', `💰 Position Size: ${this.positionSize.toFixed(2)} lots | Pip:${pipSize} $/pip:${pipValue} | Risk:$${riskAmount.toFixed(2)} (${this.cfg.riskPct}% of $${this.cfg.balance}) | RawLot:${this._rawLot.toFixed(6)} | Pips@Risk:${this._pipsAtRisk.toFixed(1)}`);
        }

        manageTrade(i) {
            const isEntryBar = this.longSignal || this.shortSignal;
            if (this.signalStatus !== 1 || isEntryBar) return;

            // Update trade extreme
            this.tradeExtreme = this.activeDir === 1
                ? Math.max(this.tradeExtreme, this.high[i])
                : Math.min(this.tradeExtreme, this.low[i]);

            // TP hit detection (using high/low of current bar)
            const tp1Hit = !this.tp1HitDone && this.tp1Price !== null &&
                (this.activeDir === 1 ? this.high[i] >= this.tp1Price : this.low[i] <= this.tp1Price);
            const tp2Hit = !this.tp2HitDone && this.tp2Price !== null &&
                (this.activeDir === 1 ? this.high[i] >= this.tp2Price : this.low[i] <= this.tp2Price);
            const tp3Hit = !this.tp3HitDone && this.tp3Price !== null &&
                (this.activeDir === 1 ? this.high[i] >= this.tp3Price : this.low[i] <= this.tp3Price);

            if (tp1Hit) { this.tp1HitDone = true; log('info', '🎯 TP1 HIT!'); }
            if (tp2Hit) { this.tp2HitDone = true; log('info', '🎯 TP2 HIT!'); }
            if (tp3Hit) { this.tp3HitDone = true; log('info', '🎯 TP3 HIT!'); }

            // BE
            if (this.cfg.beTp1 && this.tp1HitDone && this.entryPrice !== null && this.tp1Price !== null) {
                const beTarget = this.cfg.beMode === 'Half TP1'
                    ? (this.entryPrice + this.tp1Price) / 2
                    : this.entryPrice;
                this.dynamicSL = this.activeDir === 1
                    ? Math.max(this.dynamicSL, beTarget)
                    : Math.min(this.dynamicSL, beTarget);
                log('debug', `🔒 BE moved SL to ${this.dynamicSL.toFixed(5)}`);
            }

            // Trailing Stop
            const canTrail = this.cfg.useTrail && (
                this.cfg.trailAct === 'Immediate' ||
                (this.cfg.trailAct === 'After TP1' && this.tp1HitDone) ||
                (this.cfg.trailAct === 'After TP2' && this.tp2HitDone)
            );
            if (canTrail && this.atrVal[i] !== null) {
                const trailPrice = this.activeDir === 1
                    ? this.tradeExtreme - (this.atrVal[i] * this.cfg.trailAtr)
                    : this.tradeExtreme + (this.atrVal[i] * this.cfg.trailAtr);
                this.dynamicSL = this.activeDir === 1
                    ? Math.max(this.dynamicSL, trailPrice)
                    : Math.min(this.dynamicSL, trailPrice);
                log('debug', `🏃 Trail SL moved to ${this.dynamicSL.toFixed(5)} (extreme:${this.tradeExtreme.toFixed(5)})`);
            }

            // SL hit
            const slHit = this.dynamicSL !== null && (
                this.activeDir === 1 ? this.low[i] <= this.dynamicSL : this.high[i] >= this.dynamicSL
            );
            if (slHit) {
                this.signalStatus = 2;
                this.lateWarningTxt = '—';
                this.lateWarningCol = '#787b86';
                log('info', `🛑 STOP LOSS HIT @ ${this.dynamicSL.toFixed(5)}`);
            }

            // TP3 final hit
            if (tp3Hit && this.signalStatus !== 2) {
                this.signalStatus = 3;
                this.lateWarningTxt = '—';
                this.lateWarningCol = '#787b86';
                log('info', '🏆 TP3 FINAL HIT!');
            }
        }

        // ── Dashboard Data ──
        getStatusText() {
            if (this.signalStatus === 1) {
                return this.tp2HitDone ? 'Lucro 📈 (TP2)' : this.tp1HitDone ? (this.cfg.beMode === 'Half TP1' ? 'BE ½ 🔒 (TP1)' : 'BE 🔒 (TP1)') : 'MANTER';
            } else if (this.signalStatus === 2) {
                return this.tp1HitDone ? 'SAIR (BE)' : 'SAIR (SL)';
            } else if (this.signalStatus === 3) {
                return 'SAIR (TP3)';
            }
            return 'AGUARDA';
        }

        getStatusColor() {
            if (this.signalStatus === 1) return this.tp1HitDone ? '#29b6f6' : '#26a69a';
            if (this.signalStatus === 2) return '#ef5350';
            if (this.signalStatus === 3) return '#26a69a';
            return '#787b86';
        }
    }

    // ══════════════════════════════════════════════════
    // ── DASHBOARD RENDERER ──
    // ══════════════════════════════════════════════════
    class Dashboard {
        constructor(engine) {
            this.engine = engine;
            this.container = null;
            this.buildDOM();
            log('debug', '🏗️ Dashboard DOM built');
        }

        buildDOM() {
            // Remove existing if any
            const existing = document.getElementById('srrobs-dashboard');
            if (existing) existing.remove();

            this.container = document.createElement('div');
            this.container.id = 'srrobs-dashboard';
            this.container.innerHTML = `
<style>
#srrobs-dashboard {
    position: fixed;
    bottom: 60px;
    left: 10px;
    z-index: 99999;
    font-family: 'Segoe UI', 'Trebuchet MS', monospace;
    font-size: 11px;
    line-height: 1.4;
    background: #0c111f;
    border: 2px solid #3a2a6d;
    border-radius: 4px;
    padding: 0;
    min-width: 300px;
    max-width: 420px;
    color: #e0e0e0;
    box-shadow: 0 0 20px rgba(0,0,0,0.7);
    user-select: none;
    pointer-events: auto;
    overflow: hidden;
}
#srrobs-dashboard .dash-header {
    background: #1a1040;
    color: #fff;
    font-weight: bold;
    padding: 4px 8px;
    display: flex;
    justify-content: space-between;
    cursor: move;
}
#srrobs-dashboard .dash-row {
    display: flex;
    justify-content: space-between;
    padding: 2px 8px;
}
#srrobs-dashboard .dash-row:nth-child(even) { background: #151d30; }
#srrobs-dashboard .dash-row:nth-child(odd) { background: #0c111f; }
#srrobs-dashboard .dash-label { color: #888; font-size: 10px; }
#srrobs-dashboard .dash-val { text-align: right; font-weight: bold; }
#srrobs-dashboard .mini { font-size: 9px; }
#srrobs-dashboard .green { color: #26a69a; }
#srrobs-dashboard .red { color: #ef5350; }
#srrobs-dashboard .orange { color: #ff9800; }
#srrobs-dashboard .blue { color: #29b6f6; }
#srrobs-dashboard .yellow { color: #f9a825; }
#srrobs-dashboard .gray { color: #787b86; }
#srrobs-dashboard .white { color: #fff; }
#srrobs-dashboard .bar { font-family: monospace; font-size: 9px; letter-spacing: -1px; }
#srrobs-dashboard .btn-row { padding: 4px 8px; display: flex; gap: 4px; flex-wrap: wrap; }
#srrobs-dashboard button {
    background: #1a1040;
    color: #ccc;
    border: 1px solid #3a2a6d;
    border-radius: 3px;
    padding: 2px 6px;
    cursor: pointer;
    font-size: 10px;
}
#srrobs-dashboard button:hover { background: #2a2060; }
#srrobs-dashboard button.active { background: #3a2a6d; color: #fff; border-color: #6a5acd; }
#srrobs-dashboard input, #srrobs-dashboard select {
    background: #1a1040;
    color: #ccc;
    border: 1px solid #3a2a6d;
    border-radius: 3px;
    padding: 2px 4px;
    font-size: 10px;
    width: 70px;
}
</style>
<div class="dash-header">
    <span>👑 Sr.Robs CE</span>
    <span id="dash-ticker">...</span>
</div>
<div id="dash-body">
    <div class="dash-row"><span class="dash-label">Preset</span><span class="dash-val green" id="d-preset">—</span></div>
    <div class="dash-row"><span class="dash-label">⏱️ Próx Sinal</span><span class="dash-val" id="d-gap">—</span></div>
    <div class="dash-row"><span class="dash-label">🎯 Qualidade</span><span class="dash-val" id="d-quality">—</span></div>
    <div class="dash-row"><span class="dash-label">📌 Status</span><span class="dash-val" id="d-status" style="font-size:13px;">AGUARDA</span></div>
    <div class="dash-row"><span class="dash-label">Direção</span><span class="dash-val" id="d-dir">—</span></div>
    <div class="dash-row"><span class="dash-label">Bull Score</span><span class="dash-val" id="d-bull">—</span></div>
    <div class="dash-row"><span class="dash-label">Bear Score</span><span class="dash-val" id="d-bear">—</span></div>
    <div class="dash-row"><span class="dash-label">Bull Tier</span><span class="dash-val" id="d-bullTier">—</span></div>
    <div class="dash-row"><span class="dash-label">Bear Tier</span><span class="dash-val" id="d-bearTier">—</span></div>
    <div class="dash-row"><span class="dash-label">📋 Alvos</span><span class="dash-val mini" id="d-levels" style="max-width:220px;">—</span></div>
    <div class="dash-row"><span class="dash-label">💱 Auto-Detect</span><span class="dash-val mini" id="d-pip">—</span></div>
    <div class="dash-row"><span class="dash-label">💵 Banca / Risco</span><span class="dash-val" id="d-balance">—</span></div>
    <div class="dash-row"><span class="dash-label">📐 Lote / P&L</span><span class="dash-val" id="d-pnl">—</span></div>
</div>
<div class="btn-row" id="dash-btns">
    <button data-preset="1m">1m</button>
    <button data-preset="3m">3m</button>
    <button data-preset="5m" class="active">5m</button>
    <button data-preset="15m">15m</button>
    <button data-preset="30m">30m</button>
    <button data-preset="1d">1d</button>
    <span style="font-size:9px;color:#666;">Banca:$</span>
    <input id="cfg-balance" type="number" value="1000" min="1" step="100">
    <span style="font-size:9px;color:#666;">Risco%</span>
    <input id="cfg-risk" type="number" value="1.0" min="0.1" max="100" step="0.1" style="width:45px;">
</div>
`;
            document.body.appendChild(this.container);
            log('info', '✅ Dashboard injected into DOM');

            // Make draggable
            this.makeDraggable();
            // Bind buttons
            this.bindButtons();
            // Bind config inputs
            this.bindConfig();
        }

        makeDraggable() {
            const header = this.container.querySelector('.dash-header');
            let isDragging = false, startX, startY, startLeft, startTop;

            header.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = this.container.getBoundingClientRect();
                startLeft = rect.left;
                startTop = rect.top;
                this.container.style.transition = 'none';
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                this.container.style.left = (startLeft + e.clientX - startX) + 'px';
                this.container.style.top = (startTop + e.clientY - startY) + 'px';
                this.container.style.bottom = 'auto';
            });

            const onMouseUp = () => {
                if (!isDragging) return;
                isDragging = false;
                this.container.style.transition = '';
            };
            document.addEventListener('mouseup', onMouseUp);
            // Store for cleanup
            this._dragCleanup = () => {
                document.removeEventListener('mouseup', onMouseUp);
            };
        }

        bindButtons() {
            const container = this.container;
            container.querySelectorAll('button[data-preset]').forEach(btn => {
                btn.addEventListener('click', () => {
                    container.querySelectorAll('button[data-preset]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const preset = btn.dataset.preset;
                    CONFIG.preset = preset;
                    applyPreset(preset);
                    log('info', `🔄 Preset changed to: ${preset}`);
                });
            });
        }

        bindConfig() {
            const balInput = this.container.querySelector('#cfg-balance');
            const riskInput = this.container.querySelector('#cfg-risk');

            balInput.addEventListener('change', () => {
                CONFIG.balance = parseFloat(balInput.value) || 1000;
                log('info', `💰 Balance updated: $${CONFIG.balance}`);
            });

            riskInput.addEventListener('change', () => {
                CONFIG.riskPct = parseFloat(riskInput.value) || 1.0;
                log('info', `📐 Risk % updated: ${CONFIG.riskPct}%`);
            });
        }

        bar(val, max) {
            const safeMax = max || 1;
            const pct = Math.min(val / safeMax, 1);
            const filled = Math.round(pct * 10);
            let bar = '';
            for (let i = 1; i <= 10; i++) bar += i <= filled ? '█' : '░';
            return bar + ' ' + Math.round(pct * 100) + '%';
        }

        barColor(pct) {
            if (pct >= 0.66) return 'green';
            if (pct >= 0.33) return 'yellow';
            return 'red';
        }

        update() {
            const e = this.engine;
            const i = e.close.length - 1;
            const close = i >= 0 ? e.close[i] : 0;

            // Ticker
            this.setVal('dash-ticker', window._srRobs_ticker || '...');

            // Preset
            this.setVal('d-preset', (CONFIG.preset !== 'Manual' ? '🟢 ' : '⚪ ') + CONFIG.preset, CONFIG.preset !== 'Manual' ? 'green' : '');

            // Gap
            let gapTxt, gapCol;
            if (e.closestWait === 0) {
                gapTxt = e.barsSinceReady <= 0 ? '✅ Pronto agora' : '✅ Pronto há ' + e.barsSinceReady + ' b.';
                gapCol = e.barsSinceReady > 3 ? 'orange' : 'green';
            } else if (e.closestWait <= 5) {
                gapTxt = 'Próx ' + e.closestWait;
                gapCol = 'orange';
            } else {
                gapTxt = 'Aguarda ' + e.closestWait + ' b.';
                gapCol = 'gray';
            }
            gapTxt += e._baseDirTag;
            this.setVal('d-gap', gapTxt, gapCol);

            // Quality
            if (e.longSignal || e.shortSignal) {
                const streak = e.lastDir === 1 ? e.streakLong : e.streakShort;
                e.lateWarningTxt = streak >= CONFIG.lateBars ? '⚠️ Tardia (' + streak + ' b.)' : '✅ Fresca';
                e.lateWarningCol = streak >= CONFIG.lateBars ? '#ff9800' : (e.lastDir === 1 ? '#26a69a' : '#ef5350');
            }
            this.setVal('d-quality', e.lateWarningTxt || '—', undefined, e.lateWarningCol || '#787b86');

            // Status
            this.setVal('d-status', e.getStatusText(), undefined, e.getStatusColor());

            // Direction
            const dirTxt = e.activeDir === 1 ? 'LONG ▲' : e.activeDir === -1 ? 'SHORT ▼' : '—';
            const dirCol = e.activeDir === 1 ? '#26a69a' : e.activeDir === -1 ? '#ef5350' : '';
            this.setVal('d-dir', dirTxt, undefined, dirCol);

            // Scores
            this.setVal('d-bull', '<span class="bar ' + this.barColor(e.bullScore / 100) + '">' + this.bar(e.bullScore, 100) + '</span>');
            this.setVal('d-bear', '<span class="bar ' + this.barColor(e.bearScore / 100) + '">' + this.bar(e.bearScore, 100) + '</span>');
            this.setVal('d-bullTier', e.bullTier, e.bullTier === 'None' ? 'gray' : 'green');
            this.setVal('d-bearTier', e.bearTier, e.bearTier === 'None' ? 'gray' : 'red');

            // Trade Levels
            let levelsTxt = 'Sem sinal ativo';
            let levelsCol = '#888';
            if (e.entryPrice !== null && e.signalStatus <= 1) {
                levelsTxt = `E:${e.entryPrice.toFixed(5)} | SL:${e.dynamicSL?.toFixed(5) || '—'} | TP1:${e.tp1Price?.toFixed(5) || '—'} | TP2:${e.tp2Price?.toFixed(5) || '—'} | TP3:${e.tp3Price?.toFixed(5) || '—'}`;
                levelsCol = e.activeDir === 1 ? '#26a69a' : '#ef5350';
            }
            this.setVal('d-levels', levelsTxt, undefined, levelsCol);

            // Pip Info
            const ticker = window._srRobs_ticker || 'EUR/USD';
            const pipSize = ticker.includes('JPY') ? 0.01 : 0.0001;
            const pipValue = getPipValue(ticker);
            this.setVal('d-pip', `Pip:${pipSize} | $/Lot:${pipValue.toFixed(2)} (${ticker})`);

            // Balance + Risk
            this.setVal('d-balance', `$${CONFIG.balance.toFixed(0)} | Risco ${CONFIG.riskPct.toFixed(1)}%`);

            // Position Size + P&L
            let pnlTxt = 'Aguarda sinal...';
            let pnlCol = '#888';
            if (e.entryPrice !== null && e.signalStatus <= 1 && e.dynamicSL !== null) {
                const rDist = Math.abs(e.entryPrice - e.dynamicSL);
                const rPnL = -(rDist / pipSize * pipValue * e.positionSize);
                const t1PnL = e.tp1Price ? Math.abs(e.tp1Price - e.entryPrice) / pipSize * pipValue * e.positionSize : 0;
                const t2PnL = e.tp2Price ? Math.abs(e.tp2Price - e.entryPrice) / pipSize * pipValue * e.positionSize : 0;
                const t3PnL = e.tp3Price ? Math.abs(e.tp3Price - e.entryPrice) / pipSize * pipValue * e.positionSize : 0;
                pnlTxt = `Lote:${e.positionSize.toFixed(2)} | 🔴-$${Math.abs(rPnL).toFixed(2)} | 🟢+$${t1PnL.toFixed(2)} | +$${t2PnL.toFixed(2)} | +$${t3PnL.toFixed(2)}`;
                pnlCol = e.activeDir === 1 ? '#26a69a' : '#ef5350';
            } else {
                pnlTxt = `Lote:${e.positionSize.toFixed(2)} | ` + pnlTxt;
            }
            this.setVal('d-pnl', pnlTxt, undefined, pnlCol);
        }

        setVal(id, text, cls, color) {
            const el = this.container.querySelector('#' + id);
            if (!el) return;
            if (text !== undefined) el.innerHTML = text;
            if (cls) { el.className = 'dash-val ' + cls; }
            else el.className = 'dash-val';
            if (color) el.style.color = color;
            else el.style.color = '';
        }
    }

    // ══════════════════════════════════════════════════
    // ── CHART DATA EXTRACTOR ──
    // ══════════════════════════════════════════════════
    class ChartExtractor {
        constructor(engine, dashboard) {
            this.engine = engine;
            this.dashboard = dashboard;
            this.tvWidget = null;
            this.intervalId = null;
            this.lastBarIndex = -1;
            this.pollMs = 1000; // check every second
            log('debug', '🔍 ChartExtractor initialized');
        }

        async init() {
            log('info', '🔍 Looking for data sources...');
            // Try multiple approaches to find the chart
            let attempts = 0;
            const maxAttempts = 10; // Reduced: we have DOM scraping fallback

            return new Promise((resolve) => {
                const tryFind = () => {
                    attempts++;
                    log('debug', `🔍 Attempt ${attempts}/${maxAttempts} to find data source`);

                    // Approach 1: Check for window.tvWidget
                    const widget = window.tvWidget || window.TradingView?.widget;
                    if (widget) {
                        log('info', '✅ Found window.tvWidget!');
                        this.tvWidget = widget;
                        this.startPolling();
                        resolve();
                        return;
                    }

                    // Approach 2: Look for iframe with TradingView
                    const iframes = document.querySelectorAll('iframe');
                    for (const iframe of iframes) {
                        try {
                            const w = iframe.contentWindow;
                            if (w && (w.tvWidget || w.TradingView)) {
                                this.tvWidget = w.tvWidget || w.TradingView.widget;
                                log('info', `✅ Found TV widget in iframe`);
                                this.startPolling();
                                resolve();
                                return;
                            }
                        } catch (e) { /* cross-origin */ }
                    }

                    // Approach 3: Check for OHLC in the DOM (rf-trader.com style)
                    const bodyText = document.body?.innerText || '';
                    if (bodyText.match(/O\s*[\d.]+\s*H\s*[\d.]+\s*L\s*[\d.]+\s*C\s*[\d.]+/)) {
                        log('info', '✅ Found OHLC data in DOM — using DOM scraping mode');
                        this.startPolling();
                        resolve();
                        return;
                    }

                    if (attempts < maxAttempts) {
                        setTimeout(tryFind, 2000);
                    } else {
                        log('warn', '⚠️ No data source found after attempts. Starting with DOM scraping fallback...');
                        this.startPolling();
                        resolve();
                    }
                };
                tryFind();
            });
        }

        startPolling() {
            log('info', '🔄 Starting data polling + DOM scraping...');
            // Intercept XHR/fetch calls to get OHLC data
            this.interceptDataFeed();

            // Main polling loop: DOM scraping + dashboard update
            this.intervalId = setInterval(() => {
                this.updateDashboard();
            }, this.pollMs);

            // Also try to scrape DOM immediately
            this.updateDashboard();
        }

        interceptDataFeed() {
            // Intercept fetch calls to broker's data API
            this._origFetch = window.fetch;
            const self = this;

            window.fetch = async function(...args) {
                const response = await self._origFetch.apply(this, args);
                const url = args[0];
                if (typeof url === 'string' && (url.includes('bars') || url.includes('history') || url.includes('candles') || url.includes('chart'))) {
                    try {
                        const clone = response.clone();
                        const data = await clone.json();
                        log('debug', `📡 Intercepted fetch to: ${url.substring(0, 80)}...`, data);
                        self.processData(data, false);
                    } catch (e) {
                        log('debug', `⚠️ Could not parse fetch response: ${e.message}`);
                    }
                }
                return response;
            };

            // Also intercept XHR
            this._origXhrOpen = XMLHttpRequest.prototype.open;
            this._origXhrSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                this._srRobs_url = url;
                return self._origXhrOpen.call(this, method, url, ...rest);
            };

            XMLHttpRequest.prototype.send = function(...args) {
                const url = this._srRobs_url;
                if (url && (typeof url === 'string') && (url.includes('bars') || url.includes('history') || url.includes('candles') || url.includes('chart'))) {
                    this.addEventListener('load', function() {
                        try {
                            const data = JSON.parse(this.responseText);
                            log('debug', `📡 Intercepted XHR to: ${url.substring(0, 80)}...`, data);
                            self.processData(data, false);
                        } catch (e) {
                            log('debug', `⚠️ Could not parse XHR response: ${e.message}`);
                        }
                    }, { once: true });
                }
                return self._origXhrSend.call(this, ...args);
            };

            log('info', '✅ XHR/Fetch interceptors installed');
        }

        processData(data, isFullReload = true) {
            // Try to extract OHLC bars from various data formats
            let bars = null;

            // Format 1: { bars: [{time, open, high, low, close, volume}] }
            if (data && data.bars && Array.isArray(data.bars)) {
                bars = data.bars;
            }
            // Format 2: { data: [{t, o, h, l, c, v}] }
            else if (data && data.data && Array.isArray(data.data)) {
                bars = data.data.map(d => ({
                    time: d.t || d.time,
                    open: d.o || d.open,
                    high: d.h || d.high,
                    low: d.l || d.low,
                    close: d.c || d.close,
                    volume: d.v || d.volume || 0,
                }));
            }
            // Format 3: Array of arrays [t, o, h, l, c, v]
            else if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
                bars = data.map(d => ({
                    time: d[0],
                    open: d[1],
                    high: d[2],
                    low: d[3],
                    close: d[4],
                    volume: d[5] || 0,
                }));
            }
            // Format 4: { s: 'ok', t: [...], o: [...], h: [...], l: [...], c: [...], v: [...] }
            else if (data && data.t && Array.isArray(data.t)) {
                bars = data.t.map((t, idx) => ({
                    time: t,
                    open: data.o[idx],
                    high: data.h[idx],
                    low: data.l[idx],
                    close: data.c[idx],
                    volume: (data.v || [])[idx] || 0,
                }));
            }

            if (bars && bars.length > 0) {
                log('info', `📊 Processing ${bars.length} bars from intercepted data (fullReload=${isFullReload})`);
                // Detect ticker
                if (data.symbol || data.ticker) {
                    window._srRobs_ticker = data.symbol || data.ticker;
                }
                if (isFullReload) {
                    // Full history load — reset engine
                    this.engine.reset();
                    for (const bar of bars) {
                        this.engine.addBar(
                            bar.time || Date.now(),
                            bar.open, bar.high, bar.low, bar.close,
                            bar.volume || 0
                        );
                    }
                } else {
                    // Incremental update — only add new bars we haven't seen
                    for (const bar of bars) {
                        const barTime = bar.time || 0;
                        if (!this.engine.times.includes(barTime)) {
                            this.engine.addBar(
                                barTime,
                                bar.open, bar.high, bar.low, bar.close,
                                bar.volume || 0
                            );
                        }
                    }
                }
                this.lastBarIndex = this.engine.close.length - 1;
                this.dashboard.update();
            }
        }

        destroy() {
            // Cleanup: clear interval
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
                log('info', '🧹 Polling interval cleared');
            }
            // Restore original fetch
            if (this._origFetch) {
                window.fetch = this._origFetch;
                this._origFetch = null;
                log('info', '🧹 Original fetch restored');
            }
            // Restore original XHR (best effort)
            if (this._origXhrOpen) {
                XMLHttpRequest.prototype.open = this._origXhrOpen;
                XMLHttpRequest.prototype.send = this._origXhrSend;
                log('info', '🧹 Original XHR restored');
            }
        }

        updateDashboard() {
            // ── DOM scraping for non-TradingView platforms (rf-trader.com) ──
            // Try to find OHLC values displayed in the chart header
            // Pattern: "O62.007 H62.065 L61.962 C61.982"
            const bodyText = document.body.innerText || '';
            const ohlcMatch = bodyText.match(/O\s*([\d.]+)\s*H\s*([\d.]+)\s*L\s*([\d.]+)\s*C\s*([\d.]+)/);
            if (ohlcMatch) {
                const o = parseFloat(ohlcMatch[1]);
                const h = parseFloat(ohlcMatch[2]);
                const l = parseFloat(ohlcMatch[3]);
                const c = parseFloat(ohlcMatch[4]);
                log('debug', `📊 DOM OHLC scraped: O:${o} H:${h} L:${l} C:${c}`);
                // Add as a new bar if the close changed
                const lastClose = this.engine.close.length > 0 ? this.engine.close[this.engine.close.length - 1] : null;
                if (c !== lastClose && o > 0 && h > 0 && l > 0 && c > 0) {
                    this.engine.addBar(Date.now(), o, h, l, c, 0);
                    this.lastBarIndex = this.engine.close.length - 1;
                    this.dashboard.update();
                }
            }

            // ── Ticker detection from DOM ──
            // Look for patterns like "XAG/USD" in the page title or chart header
            const tickerMatch = bodyText.match(/([A-Z]{3}\/[A-Z]{3})/);
            if (tickerMatch && tickerMatch[1] !== window._srRobs_ticker) {
                window._srRobs_ticker = tickerMatch[1];
                log('info', `📍 Ticker detected from DOM: ${tickerMatch[1]}`);
            }
            // Also check document title
            const titleMatch = document.title.match(/([A-Z]{3}\/[A-Z]{3})/);
            if (titleMatch && titleMatch[1] !== window._srRobs_ticker) {
                window._srRobs_ticker = titleMatch[1];
                log('info', `📍 Ticker from page title: ${titleMatch[1]}`);
            }

            // Auto-update dashboard if we have data
            if (this.lastBarIndex >= 0 && this.engine.close.length > 0) {
                this.dashboard.update();
            }
        }
    }

    // ══════════════════════════════════════════════════
    // ── MAIN INIT ──
    // ══════════════════════════════════════════════════
    async function init() {
        log('info', '═══════════════════════════════════');
        log('info', '  Sr.Robs Confluence Engine v1.0');
        log('info', '  © Sr.Robs — Direitos Reservados');
        log('info', '═══════════════════════════════════');
        log('info', `📍 URL: ${window.location.href}`);
        log('info', `🕐 Timestamp: ${new Date().toISOString()}`);

        // Apply preset
        applyPreset(CONFIG.preset);

        // Create engine
        const engine = new ConfluenceEngine(CONFIG);

        // Create dashboard
        const dashboard = new Dashboard(engine);

        // Start data extraction
        const extractor = new ChartExtractor(engine, dashboard);
        await extractor.init();

        // Initial dashboard update
        dashboard.update();

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            log('info', '🧹 Page unloading — cleaning up...');
            extractor.destroy();
            if (dashboard._dragCleanup) dashboard._dragCleanup();
            const existing = document.getElementById('srrobs-dashboard');
            if (existing) existing.remove();
        });

        log('info', '✅ Initialization complete!');
        log('info', '💡 Open DevTools (F12) → Console to see all debug logs.');
        log('info', '📌 Dashboard is draggable — grab the header to move it.');
        log('info', '🎯 Preset buttons change all parameters automatically.');

        // Mark as ready
        window.__srRobs_CE_ready = true;
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
