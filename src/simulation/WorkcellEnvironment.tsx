import React from 'react';
import { Grid } from '@react-three/drei';

interface WorkcellEnvironmentProps {
  showGrid?: boolean;
  showAxes?: boolean;
  showEnvelope?: boolean;
  reachMm?: number;
}

export const WorkcellEnvironment: React.FC<WorkcellEnvironmentProps> = ({
  showGrid = true,
  showAxes = true,
  showEnvelope = false,
  reachMm = 600,
}) => {
  const reachM = reachMm / 1000;

  return (
    <group position={[0, 0, 0]}>
      {/* Heavy Engineering Workbench Top */}
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[1.2, 0.04, 1.0]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0.2} roughness={0.7} />
      </mesh>

      {/* Robot Base Riser / Mounting Flange Plate */}
      <mesh position={[0, 0.002, 0]}>
        <boxGeometry args={[0.26, 0.004, 0.26]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Workbench Legs (4 Extruded Aluminum Struts) */}
      {[
        [-0.55, -0.45],
        [0.55, -0.45],
        [-0.55, 0.35],
        [0.55, 0.35],
      ].map(([lx, lz], idx) => (
        <mesh key={idx} position={[lx, -0.42, lz]}>
          <boxGeometry args={[0.05, 0.8, 0.05]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Safety Boundary Perimeter Marker on Table */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.56, 0.58, 48]} />
        <meshBasicMaterial color="#f59e0b" opacity={0.6} transparent />
      </mesh>

      {/* Source Staging Tray Area */}
      <group position={[0.22, 0.002, -0.18]}>
        <mesh>
          <boxGeometry args={[0.24, 0.004, 0.18]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.003, 0]}>
          <boxGeometry args={[0.22, 0.002, 0.16]} />
          <meshBasicMaterial color="#38bdf8" wireframe />
        </mesh>
      </group>

      {/* Target Destination Tray Area */}
      <group position={[-0.22, 0.002, -0.18]}>
        <mesh>
          <boxGeometry args={[0.24, 0.004, 0.18]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.003, 0]}>
          <boxGeometry args={[0.22, 0.002, 0.16]} />
          <meshBasicMaterial color="#34d399" wireframe />
        </mesh>
      </group>

      {/* Three.js Grid */}
      {showGrid && (
        <Grid
          position={[0, 0.001, 0]}
          args={[1.4, 1.4]}
          cellSize={0.05}
          cellThickness={0.7}
          cellColor="#94a3b8"
          sectionSize={0.2}
          sectionThickness={1.2}
          sectionColor="#475569"
          fadeDistance={2.5}
        />
      )}

      {/* Origin Coordinate Axes Triad */}
      {showAxes && (
        <group position={[0, 0.01, 0]}>
          <axesHelper args={[0.15]} />
        </group>
      )}

      {/* Spherical Reachable Workspace Envelope (Toggleable) */}
      {showEnvelope && (
        <mesh position={[0, 0.18, 0]}>
          <sphereGeometry args={[reachM, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.75]} />
          <meshBasicMaterial color="#00f2fe" wireframe opacity={0.15} transparent />
        </mesh>
      )}
    </group>
  );
};
