import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useGameStore } from '../store/useGameStore';

export const AccuracyChart: React.FC = () => {
  const { analysisResult, currentMoveIndex } = useGameStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!analysisResult || !mounted) return null;

  const data = analysisResult.moves.map((m, i) => ({
    name: i + 1,
    eval: Math.max(-10, Math.min(10, m.eval_after_cp / 100)),
    move: m.move_san
  }));

  return (
    <div className="h-64 w-full bg-gray-900/50 backdrop-blur-md rounded-2xl p-6 border border-gray-800 shadow-xl flex flex-col">
      <h3 className="text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em]">Game Trajectory</h3>
      <div className="flex-1 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="name" hide />
            <YAxis domain={[-11, 11]} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', fontSize: '12px' }}
              itemStyle={{ color: '#10B981' }}
              cursor={{ stroke: '#4B5563', strokeWidth: 1 }}
            />
            <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
            <Line 
              type="linear" 
              dataKey="eval" 
              stroke="#10B981" 
              strokeWidth={2.5} 
              dot={false}
              activeDot={{ r: 4, fill: '#F3F4F6', stroke: '#10B981', strokeWidth: 2 }} 
            />
            {currentMoveIndex >= 0 && (
              <ReferenceLine x={currentMoveIndex + 1} stroke="#F3F4F6" strokeOpacity={0.3} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
