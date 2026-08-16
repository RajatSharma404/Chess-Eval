import React, { useState, useMemo, useRef } from 'react';
import { useGameStore, Move } from '../../store/useGameStore';
import { clsx } from 'clsx';

interface AnalysisGraphProps {
  height?: number;
  showBadges?: boolean;
}

export const AnalysisGraph: React.FC<AnalysisGraphProps> = ({ height = 110, showBadges = true }) => {
  const { analysisResult, currentMoveIndex, setCurrentMoveIndex, setPreviewMoveIndex } = useGameStore();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!analysisResult) return null;
  const moves = analysisResult.moves;
  if (!moves || moves.length === 0) return null;

  const width = 600;

  // Sigmoidal / Atan scaling so micro-advantages (e.g. +0.8) are prominent,
  // while large blunders (+8.0 / mate) smoothly asymptote without squashing the rest of the game.
  const getEvalY = (cp: number) => {
    const score = cp || 0;
    const normalized = Math.atan(score / 280) / (Math.PI / 2); // Ranges -1 to 1
    return (height / 2) - (normalized * (height * 0.42));
  };

  const pointData = useMemo(() => {
    return moves.map((m, i) => {
      const x = (i / Math.max(1, moves.length - 1)) * width;
      const y = getEvalY(m.eval_after_cp);
      const prevEval = i > 0 ? moves[i - 1].eval_after_cp : 0;
      const delta = Math.abs(m.eval_after_cp - prevEval);
      const xPct = (i / Math.max(1, moves.length - 1)) * 100;
      const yPct = (y / height) * 100;

      return {
        index: i,
        x,
        y,
        xPct,
        yPct,
        cp: m.eval_after_cp,
        delta,
        classification: m.classification,
        move_san: m.move_san,
        move_number: Math.floor(i / 2) + 1,
        isWhite: i % 2 === 0
      };
    });
  }, [moves, height]);

  // Smooth Catmull-Rom cubic spline interpolation
  const curvePath = useMemo(() => {
    if (pointData.length === 0) return '';
    if (pointData.length === 1) return `M ${pointData[0].x},${pointData[0].y}`;
    if (pointData.length === 2) return `M ${pointData[0].x},${pointData[0].y} L ${pointData[1].x},${pointData[1].y}`;

    let path = `M ${pointData[0].x},${pointData[0].y}`;
    for (let i = 0; i < pointData.length - 1; i++) {
      const p0 = i > 0 ? pointData[i - 1] : pointData[i];
      const p1 = pointData[i];
      const p2 = pointData[i + 1];
      const p3 = i < pointData.length - 2 ? pointData[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
  }, [pointData]);

  // Top Area (White Advantage, above center line)
  const whiteAreaPath = useMemo(() => {
    if (pointData.length === 0) return '';
    const lastX = pointData[pointData.length - 1].x;
    return `${curvePath} L ${lastX},${height / 2} L 0,${height / 2} Z`;
  }, [curvePath, pointData, height]);

  // Key Moment Badges with smart collision suppression so they NEVER overlap
  const badges = useMemo(() => {
    if (!showBadges) return [];
    const keyPoints = pointData.filter(p => 
      ['blunder', 'mistake', 'brilliant'].includes(p.classification) ||
      (p.classification === 'inaccuracy' && p.delta >= 120)
    );

    const filtered: typeof pointData = [];
    const minHorizontalDistancePct = 5.5; // Min 5.5% distance between badges

    // Sort by severity so worst blunders and brilliants take priority
    const severityRank: Record<string, number> = {
      brilliant: 4,
      blunder: 3,
      mistake: 2,
      inaccuracy: 1
    };

    const sortedByPriority = [...keyPoints].sort((a, b) => 
      (severityRank[b.classification] || 0) - (severityRank[a.classification] || 0)
    );

    for (const point of sortedByPriority) {
      const collides = filtered.some(existing => 
        Math.abs(existing.xPct - point.xPct) < minHorizontalDistancePct
      );
      if (!collides) {
        filtered.push(point);
      }
    }

    return filtered.sort((a, b) => a.index - b.index);
  }, [pointData, showBadges]);

  const activeIndex = hoverIndex !== null ? hoverIndex : currentMoveIndex;
  const activePoint = activeIndex >= 0 && activeIndex < pointData.length ? pointData[activeIndex] : null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPos = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, xPos / rect.width));
    const idx = Math.round(pct * (moves.length - 1));
    const safeIdx = Math.max(0, Math.min(moves.length - 1, idx));
    setHoverIndex(safeIdx);
    setPreviewMoveIndex(safeIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setPreviewMoveIndex(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverIndex !== null) {
      setCurrentMoveIndex(hoverIndex);
    }
  };

  const getBadgeMeta = (cls: string) => {
    switch (cls) {
      case 'brilliant':
        return { label: '!!', bg: 'bg-cyan-500 shadow-cyan-500/50', text: 'text-cyan-950', ring: 'ring-cyan-400/40' };
      case 'blunder':
        return { label: '??', bg: 'bg-red-500 shadow-red-500/50', text: 'text-white', ring: 'ring-red-400/40' };
      case 'mistake':
        return { label: '?', bg: 'bg-orange-500 shadow-orange-500/50', text: 'text-white', ring: 'ring-orange-400/40' };
      case 'inaccuracy':
        return { label: '?!', bg: 'bg-amber-400 shadow-amber-400/50', text: 'text-amber-950', ring: 'ring-amber-300/40' };
      default:
        return { label: '✓', bg: 'bg-emerald-500', text: 'text-black', ring: 'ring-emerald-400/40' };
    }
  };

  return (
    <div className="w-full flex flex-col gap-1.5 select-none font-sans">
      {/* Advantage Metrics Top Legend */}
      <div className="flex justify-between items-center px-1 text-[10px] text-zinc-400 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-bold text-zinc-300">White Advantage</span>
        </div>
        <div className="text-zinc-500">Evaluation Curve</div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-zinc-300">Black Advantage</span>
          <span className="w-2 h-2 rounded-full bg-red-400"></span>
        </div>
      </div>

      {/* Main Graph Card */}
      <div 
        ref={containerRef}
        className="w-full relative rounded-xl bg-gradient-to-b from-[#18181b] via-[#121215] to-[#09090b] border border-white/10 shadow-inner overflow-hidden cursor-crosshair group"
        style={{ height: height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* SVG Drawing Layer */}
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full block" 
          preserveAspectRatio="none"
        >
          <defs>
            {/* White Advantage Gradient */}
            <linearGradient id="whiteAdvantageGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>

            {/* Black Advantage Gradient */}
            <linearGradient id="blackAdvantageGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.02" />
              <stop offset="50%" stopColor="#ef4444" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.45" />
            </linearGradient>

            {/* Curve Line Gradient */}
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>

            {/* Clip masks for split zero-line shading */}
            <clipPath id="topClip">
              <rect x="0" y="0" width={width} height={height / 2} />
            </clipPath>
            <clipPath id="bottomClip">
              <rect x="0" y={height / 2} width={width} height={height / 2} />
            </clipPath>
          </defs>

          {/* Background Grid Lines */}
          <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 3" />

          {/* Zero Neutral Center Line */}
          <line 
            x1="0" 
            y1={height / 2} 
            x2={width} 
            y2={height / 2} 
            stroke="rgba(255, 255, 255, 0.18)" 
            strokeWidth="1" 
            strokeDasharray="4 3" 
          />

          {/* Top Half Fill (White Advantage) */}
          <path 
            d={whiteAreaPath} 
            fill="url(#whiteAdvantageGrad)" 
            clipPath="url(#topClip)" 
          />

          {/* Bottom Half Fill (Black Advantage) */}
          <path 
            d={whiteAreaPath} 
            fill="url(#blackAdvantageGrad)" 
            clipPath="url(#bottomClip)" 
          />

          {/* Glowing Ambient Curve Background */}
          <path 
            d={curvePath} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="3.5" 
            strokeOpacity="0.25"
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Hero Advantage Curve Line */}
          <path 
            d={curvePath} 
            fill="none" 
            stroke="url(#lineGrad)" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>

        {/* Laser Cursor & Point for Active/Hovered Move */}
        {activePoint && (
          <div 
            className="absolute top-0 bottom-0 pointer-events-none transition-all duration-75 z-20"
            style={{ left: `${activePoint.xPct}%` }}
          >
            {/* Vertical Guide Line */}
            <div className="absolute inset-y-0 w-[1.5px] -translate-x-1/2 bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />

            {/* Glowing Focal Point On Curve */}
            <div 
              className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]"
              style={{ top: `${activePoint.yPct}%` }}
            />
          </div>
        )}

        {/* HTML Badges Overlay - Always perfectly circular and crisp! */}
        {showBadges && badges.map((b) => {
          const meta = getBadgeMeta(b.classification);
          const isSelected = currentMoveIndex === b.index;

          return (
            <button
              key={b.index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentMoveIndex(b.index);
              }}
              title={`Move ${b.move_number}${b.isWhite ? '.' : '...'} ${b.move_san} (${b.classification})`}
              className={clsx(
                "absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center font-black text-[9px] sm:text-[10px] leading-none shadow-md transition-transform hover:scale-125 z-10 ring-1",
                meta.bg,
                meta.text,
                meta.ring,
                isSelected ? "scale-125 ring-2 ring-white" : "hover:z-30"
              )}
              style={{
                left: `${b.xPct}%`,
                top: `${b.yPct}%`
              }}
            >
              {meta.label}
            </button>
          );
        })}

        {/* Glassmorphic Interactive Hover Tooltip */}
        {hoverIndex !== null && pointData[hoverIndex] && (
          <div 
            className="absolute z-40 bg-zinc-950/95 backdrop-blur-md border border-white/15 rounded-xl text-xs text-white shadow-2xl p-2.5 pointer-events-none transform -translate-x-1/2 min-w-[130px]"
            style={{
              left: `${pointData[hoverIndex].xPct}%`,
              top: pointData[hoverIndex].yPct > 50 ? '8px' : `${height - 62}px`
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-amber-400 font-mono">
                {pointData[hoverIndex].move_number}{pointData[hoverIndex].isWhite ? '.' : '...'} {pointData[hoverIndex].move_san}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                {pointData[hoverIndex].cp > 0 ? '+' : ''}{(pointData[hoverIndex].cp / 100).toFixed(1)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-[10px] text-zinc-400 capitalize">
              <span>{pointData[hoverIndex].classification || 'book move'}</span>
              {pointData[hoverIndex].delta > 30 && (
                <span className="text-red-400 font-mono">
                  -{(pointData[hoverIndex].delta / 100).toFixed(1)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
