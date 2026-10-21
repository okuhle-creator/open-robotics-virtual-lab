import React from 'react';
import { SimulationProvider, useSimulation } from './context/SimulationContext';
import { Header } from './components/layout/Header';
import { NavigationTabs } from './components/layout/NavigationTabs';
import { StatusBar } from './components/layout/StatusBar';
import { EventLogPanel } from './components/layout/EventLogPanel';
import { WorkcellCanvas } from './simulation/WorkcellCanvas';
import { JoggingWorkbench } from './components/labs/JoggingWorkbench';
import { PickAndPlaceLab } from './components/labs/PickAndPlaceLab';
import { ConveyorSortingLab } from './components/labs/ConveyorSortingLab';
import { ProgrammingLab } from './components/labs/ProgrammingLab';
import { EngineeringManual } from './components/labs/EngineeringManual';

const WorkbenchContent: React.FC = () => {
  const {
    robot,
    jointAngles,
    gripperState,
    tcpPose,
    activeLab,
    settings,
    workpieces,
    targetSlots,
    pickPlaceState,
    conveyorItems,
    conveyorState,
  } = useSimulation();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
      {/* Navigation Sub-header */}
      <NavigationTabs />

      {/* Main Split Workstation */}
      <div className="flex-1 flex min-h-0 overflow-hidden flex-col md:flex-row">
        {/* Left: 3D Simulation Viewport */}
        <div className="flex-1 relative min-h-[380px] md:min-h-0">
          <WorkcellCanvas
            robot={robot}
            jointAnglesDeg={jointAngles}
            gripperState={gripperState}
            tcpPose={tcpPose}
            activeLab={activeLab}
            showGrid={settings.showFloorGrid}
            showAxes={settings.showCoordinateAxes}
            showEnvelope={settings.showWorkspaceEnvelope}
            workpieces={workpieces}
            targetSlots={targetSlots}
            activeWorkpieceId={pickPlaceState.activeWorkpieceId}
            conveyorItems={conveyorItems}
            conveyorState={conveyorState}
          />
        </div>

        {/* Right: Lab Engineering Control Panel */}
        <div className="w-full md:w-[460px] lg:w-[500px] shrink-0 h-[380px] md:h-auto min-h-0 border-t md:border-t-0 md:border-l border-slate-800">
          {activeLab === 'jogging' && <JoggingWorkbench />}
          {activeLab === 'pick_place' && <PickAndPlaceLab />}
          {activeLab === 'conveyor' && <ConveyorSortingLab />}
          {activeLab === 'programming' && <ProgrammingLab />}
          {activeLab === 'curriculum' && <EngineeringManual />}
        </div>
      </div>

      {/* Live Status Bar */}
      <StatusBar />

      {/* Live Telemetry Log */}
      <EventLogPanel />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SimulationProvider>
      <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
        <Header />
        <WorkbenchContent />
      </div>
    </SimulationProvider>
  );
};

export default App;
