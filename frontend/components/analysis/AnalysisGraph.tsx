import React, { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';

interface AnalysisGraphProps {
  height?: number;
  showBadges?: boolean;
}

export const AnalysisGraph: React.FC<AnalysisGraphProps> = ({ height = 80, showBadges = true }) => {
  const { analysisResult, currentMoveIndex, setCurrentMoveIndex, setPreviewMoveIndex } = useGameStore();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Trigger animation on mount or when game changes
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [analysisResult?.moves.length]);

  if (!analysisResult) return null;
  const moves = analysisResult.moves;
  if (!moves || moves.length === 0) return null;

  const width = 1000; 

  const getEvalY = (cp: number) => {
    // Clamp between -1000 and 1000 (+/- 10 pawns)
    const clampedCp = Math.max(-1000, Math.min(1000, cp || 0));
    // map to [height, 0]
    return (height / 2) - (clampedCp / 1000) * (height / 2);
  };

  const pointData = useMemo(() => {
    return moves.map((m, i) => {
      const x = (i / Math.max(1, moves.length - 1)) * width;
      const y = getEvalY(m.eval_after_cp);
      const delta = Math.abs(m.eval_after_cp - (i > 0 ? moves[i-1].eval_after_cp : 0));
      return { x, y, cp: m.eval_after_cp, delta, classification: m.classification, move_san: m.move_san };
    });
  }, [moves, width, height]);

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

      // Tension = 0.5 (Catmull-Rom) -> divided by 3 for cubic bezier control points -> 1/6
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
  }, [pointData]);

  const fillPath = pointData.length > 0 
    ? `${curvePath} L ${pointData[pointData.length - 1].x},${height / 2} L 0,${height / 2} Z` 
    : '';

  const badges = useMemo(() => {
    if (!showBadges) return [];
    const validBadges: any[] = [];
    
    for (let i = 0; i < pointData.length; i++) {
      const p = pointData[i];
      const cls = p.classification;
      
      // 1. Filter classes
      if (!['brilliant', 'excellent', 'great', 'inaccuracy', 'mistake', 'blunder'].includes(cls)) continue;
      
      // 2. Eval changed >= 0.5 pawns (50 cp)
      if (p.delta < 50) continue;
      
      let badgeY = p.y;
      
      // 3. Near 0 offset
      if (Math.abs(p.cp) < 30) {
        badgeY -= 15;
      }
      
      // 4. Overlap resolution
      const overlap = validBadges.find(b => Math.abs(b.x - p.x) < 12 && Math.abs(b.iconY - badgeY) < 20);
      if (overlap) {
        badgeY -= 20;
      }
      
      validBadges.push({ ...p, iconY: badgeY, badgeCls: cls, index: i });
    }
    return validBadges;
  }, [pointData, showBadges]);

  const displayIndex = currentMoveIndex;
  const activeX = displayIndex >= 0 && displayIndex < moves.length ? pointData[displayIndex].x : 0;
  const activeY = displayIndex >= 0 && displayIndex < moves.length ? pointData[displayIndex].y : height / 2;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPos = e.clientX - rect.left;
    const pct = xPos / rect.width;
    const idx = Math.round(pct * (moves.length - 1));
    const safeIdx = Math.max(0, Math.min(moves.length - 1, idx));
    setHoverIndex(safeIdx);
    setPreviewMoveIndex(safeIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setPreviewMoveIndex(null);
  };

  const handleClick = () => {
    if (hoverIndex !== null) {
      setCurrentMoveIndex(hoverIndex);
    }
  };

  const getBadgeStyle = (cls: string) => {
    switch (cls) {
      case 'brilliant': return { bg: '#06b6d4', sym: '!!' };
      case 'excellent': 
      case 'great': return { bg: '#86efac', sym: '!' };
      case 'inaccuracy': return { bg: '#f59e0b', sym: '?!' };
      case 'mistake': return { bg: '#f97316', sym: '?' };
      case 'blunder': return { bg: '#ef4444', sym: '??' };
      default: return { bg: '#71717a', sym: '' };
    }
  };

  return (
    <div className="w-full relative cursor-crosshair group" style={{ height: height }}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full overflow-visible" 
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <defs>
          <clipPath id="whiteClip">
            <rect x="0" y="0" width={width} height={height / 2} />
          </clipPath>
          <clipPath id="blackClip">
            <rect x="0" y={height / 2} width={width} height={height / 2} />
          </clipPath>
          <clipPath id="revealMask">
             <rect x="0" y="0" width={width} height={height} className={isAnimating ? "animate-reveal-graph" : ""} />
          </clipPath>
        </defs>
        
        <style>
          {`
            @keyframes revealGraph {
              0% { width: 0; }
              100% { width: ${width}px; }
            }
            .animate-reveal-graph {
              animation: revealGraph 600ms ease-out forwards;
            }
          `}
        </style>

        <g clipPath="url(#revealMask)">
          {/* White Advantage Area */}
          <path 
            d={fillPath} 
            fill="rgba(255, 255, 255, 0.85)" 
            clipPath="url(#whiteClip)" 
          />
          
          {/* Black Advantage Area */}
          <path 
            d={fillPath} 
            fill="rgba(30, 30, 30, 0.9)" 
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
            clipPath="url(#blackClip)" 
          />
          
          {/* Center Line */}
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 3" />
          
          {/* Eval Line (Hero Curve) */}
          <path 
            d={curvePath} 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.4)" 
            strokeWidth="1" 
          />
        </g>

        {/* Hover Hairline */}
        {hoverIndex !== null && pointData[hoverIndex] && (
          <line 
            x1={pointData[hoverIndex].x} 
            y1="0" 
            x2={pointData[hoverIndex].x} 
            y2={height} 
            stroke="#52525b" 
            strokeWidth="1" 
            strokeDasharray="4 2"
            className="pointer-events-none"
          />
        )}

        {/* Current Position Indicator */}
        {displayIndex >= 0 && displayIndex < moves.length && (
           <g className="transition-transform duration-75 pointer-events-none">
             <line x1={activeX} y1="0" x2={activeX} y2={height} stroke="#fbbf24" strokeWidth="1" opacity="0.7" />
             <circle 
               cx={activeX} 
               cy={activeY} 
               r="3" 
               fill="#fbbf24"
             />
           </g>
        )}

        {/* Badges Overlay */}
        <g className={isAnimating ? "animate-reveal-graph" : ""} clipPath="url(#revealMask)">
          {badges.map((b, i) => {
            const { bg, sym } = getBadgeStyle(b.badgeCls);
            // "MISTAKE" uses a single "?" in a slightly larger circle according to spec
            const r = b.badgeCls === 'mistake' ? 10 : 9; 
            return (
              <g key={i} transform={`translate(${b.x}, ${b.iconY})`} className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] pointer-events-none">
                <circle cx="0" cy="0" r={r} fill={bg} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <text x="0" y="0.5" fontSize={b.badgeCls === 'mistake' ? "12" : "9"} fontWeight="bold" fill="white" textAnchor="middle" dominantBaseline="middle">
                  {sym}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      
      {/* Tooltip */}
      {hoverIndex !== null && pointData[hoverIndex] && (
        <div 
          className="absolute z-50 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white shadow-xl px-3 py-2 pointer-events-none transform -translate-x-1/2 min-w-[120px]"
          style={{
            left: `${(pointData[hoverIndex].x / width) * 100}%`,
            top: pointData[hoverIndex].y > height / 2 ? -45 : height + 10
          }}
        >
          <div className="font-bold text-zinc-300 whitespace-nowrap mb-0.5">
            Move {Math.floor(hoverIndex/2)+1} · {pointData[hoverIndex].move_san}
          </div>
          <div className="text-zinc-400">
            Eval: {(pointData[hoverIndex].cp / 100).toFixed(1)}
            {pointData[hoverIndex].classification && <span className="capitalize ml-1 text-zinc-300">({pointData[hoverIndex].classification})</span>}
          </div>
        </div>
      )}
    </div>
  );
};
