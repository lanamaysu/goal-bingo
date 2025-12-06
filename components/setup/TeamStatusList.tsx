import React from 'react';
import { User } from '../../types';

interface TeamStatusListProps {
  users: User[];
  totalPlayers: number;
}

const TeamStatusList: React.FC<TeamStatusListProps> = ({ users, totalPlayers }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {users.map((u) => (
        <div
          key={u.id}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${u.isReady ? 'bg-brand-teal/10 border-brand-teal/30' : 'bg-white/50 dark:bg-black/20 border-accent/20'}`}
        >
          <div
            className={`w-2 h-2 rounded-full ${u.isReady ? 'bg-brand-teal' : 'bg-accent/40 animate-pulse'}`}
          />
          <span className={`text-sm font-bold ${u.isReady ? 'text-accent' : 'text-accent/60'}`}>
            {u.name}
          </span>
        </div>
      ))}
      {/* Show placeholders for missing players */}
      {Array.from({ length: Math.max(0, totalPlayers - users.length) }).map((_, i) => (
        <div
          key={`p-${i}`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-dashed border-accent/20 bg-white/30 dark:bg-black/10 opacity-50"
        >
          <div className="w-2 h-2 rounded-full bg-accent/20" />
          <span className="text-sm text-accent/40 italic">等待加入...</span>
        </div>
      ))}
    </div>
  );
};

export default TeamStatusList;
