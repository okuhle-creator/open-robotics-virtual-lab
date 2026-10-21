import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { LabMode } from '../../types/simulation';
import { Sliders, Box, Layers, Code, BookOpen } from 'lucide-react';

interface TabItem {
  id: LabMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'jogging', label: 'Robot Jog & Kinematics', icon: Sliders },
  { id: 'pick_place', label: 'Pick & Place Lab', icon: Box },
  { id: 'conveyor', label: 'Conveyor Sorting Line', icon: Layers },
  { id: 'programming', label: 'Programming Studio', icon: Code },
  { id: 'curriculum', label: 'Curriculum & Manual', icon: BookOpen },
];

export const NavigationTabs: React.FC = () => {
  const { activeLab, setActiveLab } = useSimulation();

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-4 flex items-center space-x-1 select-none overflow-x-auto">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeLab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveLab(tab.id)}
            className={`flex items-center space-x-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition whitespace-nowrap ${
              isActive
                ? 'border-teal-500 text-teal-300 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
