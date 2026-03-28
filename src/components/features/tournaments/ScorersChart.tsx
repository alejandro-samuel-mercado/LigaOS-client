'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface PlayerScorer {
  name: string;
  goals: number;
}

const COLORS = ['#ccff00', '#065f46', '#d45252', '#f59e0b', '#000000'];

/**
 * Interactive Bar Chart for Tournament Top Scorers.
 */
export const ScorersChart = ({ data }: { data: PlayerScorer[] }) => {
  return (
    <div className="w-full h-[300px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={100}
            tick={{ fill: 'var(--text-secondary)', fontSize: 9, fontWeight: 900 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            contentStyle={{ 
                backgroundColor: 'black', 
                border: 'none', 
                borderRadius: '0',
                color: 'white',
                fontSize: '10px',
                fontFamily: 'Inter',
                fontWeight: 900,
                textTransform: 'uppercase'
            }}
          />
          <Bar dataKey="goals" fill="#ccff00" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
