import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

interface AnalysisGraphProps {
  height?: number;
  showBadges?: boolean;
}

export const AnalysisGraph: React.FC<AnalysisGraphProps> = ({ height = 40, showBadges = false }) => {
  const { analysisResult, currentMoveIndex, setCurrentMoveIndex } = useGameStore();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!analysisResult) return null;
  const moves = analysisResult.moves;
  if (!moves || moves.length === 0) return null;

  const width = 300; 
  
  const getEvalY = (cp: number) => {
    const evalCp = cp || 0;
    return (height / 2) - (height / 2) * (2 / Math.PI) * Math.atan(evalCp / 200);
  };

  const pointData = moves.map((m, i) => {
    const x = (i / (moves.length - 1 || 1)) * width;
    const y = getEvalY(m.eval_after_cp);
    return { x, y, cp: m.eval_after_cp, delta: Math.abs(m.eval_after_cp - (i > 0 ? moves[i-1].eval_after_cp : 0)), classification: m.classification };
  });

  const pointsStr = pointData.map(p => `${p.x},${p.y}`).join(' ');
  const areaPoints = `0,${height / 2} ${pointsStr} ${width},${height / 2}`;
  
  const displayIndex = hoverIndex !== null ? hoverIndex : currentMoveIndex;
  const activeX = displayIndex >= 0 && displayIndex < moves.length ? pointData[displayIndex].x : 0;
  const activeY = displayIndex >= 0 && displayIndex < moves.length ? pointData[displayIndex].y : height / 2;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPos = e.clientX - rect.left;
    const pct = xPos / rect.width;
    const idx = Math.round(pct * (moves.length - 1));
    const safeIdx = Math.max(0, Math.min(moves.length - 1, idx));
    setHoverIndex(safeIdx);
  };

  const handleClick = () => {
    if (hoverIndex !== null) {
      setCurrentMoveIndex(hoverIndex);
    }
  };

  const getBadgeColor = (cls: string) => {
    switch (cls) {
      case 'brilliant': return '#06b6d4';
      case 'great': return '#3b82f6';
      case 'best': return '#22c55e';
      case 'inaccuracy': return '#fbbf24';
      case 'mistake': return '#f97316';
      case 'blunder': return '#ef4444';
      default: return '#71717a';
    }
  };

  const getBadgeText = (cls: string) => {
    switch (cls) {
      case 'brilliant': return '!!';
      case 'great': return '!';
      case 'best': return '★';
      case 'inaccuracy': return '?!';
      case 'mistake': return '?';
      case 'blunder': return '??';
      default: return '';
    }
  };

  return (
    <div className="w-full relative cursor-crosshair px-2" style={{ height: height + 20 }}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full overflow-visible" 
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
        onClick={handleClick}
      >
        <defs>
          <clipPath id="above">
            <rect x="0" y="0" width={width} height={height / 2} />
          </clipPath>
          <clipPath id="below">
            <rect x="0" y={height / 2} width={width} height={height / 2} />
          </clipPath>
        </defs>
        
        {/* White winning (above midline) */}
        <polygon points={areaPoints} fill="rgba(255,255,255,0.8)" clipPath="url(#above)" />
        {/* Black winning (below midline) */}
        <polygon points={areaPoints} fill="rgba(0,0,0,0.6)" clipPath="url(#below)" />
        
        {/* Midline */}
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="4 3" />
        
        {/* Active Line indicator */}
        {displayIndex >= 0 && displayIndex < moves.length && (
           <g className="transition-all duration-75">
             <line x1={activeX} y1="0" x2={activeX} y2={height} stroke="#fbbf24" strokeWidth="1" opacity={hoverIndex !== null ? "0.8" : "0.4"} />
             <circle 
               cx={activeX} 
               cy={activeY} 
               r="3" 
               fill="#fbbf24"
               stroke="#262421"
               strokeWidth="1.5"
             />
           </g>
        )}

        {/* Badges Overlay */}
        {showBadges && pointData.map((p, i) => {
          if (['blunder', 'mistake', 'inaccuracy', 'brilliant', 'great'].includes(p.classification)) {
            const badgeText = getBadgeText(p.classification);
            return (
              <g key={i} transform={`translate(${p.x}, ${p.y - 12})`}>
                <circle cx="0" cy="0" r="6" fill={getBadgeColor(p.classification)} stroke="#262421" strokeWidth="1" />
                <text x="0" y="3" fontSize="6" fontWeight="bold" fill="white" textAnchor="middle" dominantBaseline="middle">
                  {badgeText}
                </text>
              </g>
            );
          }
          return null;
        })}
      </svg>
      
      {/* Container background block underneath graph to match screenshot */}
      <div className="absolute left-2 right-2 bottom-0 h-[2px] bg-zinc-800 rounded-full" />
    </div>
  );
};
