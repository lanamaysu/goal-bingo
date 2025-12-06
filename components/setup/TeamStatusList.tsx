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
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${u.isReady ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
        >
          <div
            className={`w-2 h-2 rounded-full ${u.isReady ? 'bg-green-500' : 'bg-gray-400 animate-pulse'}`}
          />
          <span className={`text-sm font-bold ${u.isReady ? 'text-green-700' : 'text-gray-500'}`}>
            {u.name}
          </span>
        </div>
      ))}
      {/* Show placeholders for missing players */}
      {Array.from({ length: Math.max(0, totalPlayers - users.length) }).map((_, i) => (
        <div
          key={`p-${i}`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-dashed border-gray-300 bg-gray-50 opacity-50"
        >
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <span className="text-sm text-gray-400 italic">等待加入...</span>
        </div>
      ))}
    </div>
  );
};

export default TeamStatusList;
