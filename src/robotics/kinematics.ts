import { RobotSpecification, CartesianCoord, CartesianPose } from '../types/robot';
import { ForwardKinematicsResult, InverseKinematicsResult, SingularityCheck } from '../types/kinematics';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * Normalizes an angle to range [-180, 180] degrees
 */
export function normalizeAngleDeg(angleDeg: number): number {
  let a = angleDeg % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a;
}

/**
 * Validates joint angles against robot limits
 */
export function validateJointAngles(
  robot: RobotSpecification,
  jointsDeg: number[]
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  robot.jointLimits.forEach((limit, idx) => {
    const val = jointsDeg[idx];
    if (val === undefined || Number.isNaN(val)) {
      violations.push(`Joint ${idx + 1} (${limit.name}) has an undefined/NaN value.`);
    } else if (val < limit.minDeg - 0.05 || val > limit.maxDeg + 0.05) {
      violations.push(
        `Joint ${idx + 1} (${limit.name}) value ${val.toFixed(1)}° is out of bounds [${limit.minDeg}°, ${limit.maxDeg}°]`
      );
    }
  });

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Forward Kinematics (FK) for ORV-600 and generic 6-DOF Articulated Robots
 * Computes exact 3D Cartesian coordinates of each pivot link and the Tool Center Point (TCP).
 * Units: Millimeters (mm) and Degrees (°).
 */
export function computeForwardKinematics(
  robot: RobotSpecification,
  jointsDeg: number[]
): ForwardKinematicsResult {
  const { baseHeightMm, upperArmMm, forearmMm, wristMm, toolMm } = robot.linkDimensions;
  const toolAssemblyMm = wristMm + toolMm;

  if (robot.category === '4-DOF SCARA') {
    // SCARA Forward Kinematics
    const j1Rad = (jointsDeg[0] || 0) * DEG2RAD;
    const j2Rad = (jointsDeg[1] || 0) * DEG2RAD;
    const j3Z = jointsDeg[2] || 0; // linear stroke downwards
    const j4Rad = (jointsDeg[3] || 0) * DEG2RAD;

    const x1 = upperArmMm * Math.cos(j1Rad);
    const y1 = upperArmMm * Math.sin(j1Rad);

    const x2 = x1 + forearmMm * Math.cos(j1Rad + j2Rad);
    const y2 = y1 + forearmMm * Math.sin(j1Rad + j2Rad);

    const tcpZ = baseHeightMm - j3Z - toolMm;

    return {
      tcp: {
        x: Number(x2.toFixed(2)),
        y: Number(y2.toFixed(2)),
        z: Number(tcpZ.toFixed(2)),
        rollDeg: 0,
        pitchDeg: 0,
        yawDeg: Number(((j1Rad + j2Rad + j4Rad) * RAD2DEG).toFixed(2)),
      },
      linkPositions: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: baseHeightMm },
        { x: x1, y: y1, z: baseHeightMm },
        { x: x2, y: y2, z: baseHeightMm },
        { x: x2, y: y2, z: tcpZ },
      ],
      transformationMatrix: [
        [Math.cos(j1Rad + j2Rad), -Math.sin(j1Rad + j2Rad), 0, x2],
        [Math.sin(j1Rad + j2Rad), Math.cos(j1Rad + j2Rad), 0, y2],
        [0, 0, 1, tcpZ],
        [0, 0, 0, 1],
      ],
    };
  }

  // 6-DOF Articulated Arm
  const j1 = (jointsDeg[0] || 0) * DEG2RAD; // Base yaw
  const j2 = (jointsDeg[1] || 0) * DEG2RAD; // Shoulder pitch
  const j3 = (jointsDeg[2] || 0) * DEG2RAD; // Elbow pitch
  const j4 = (jointsDeg[3] || 0) * DEG2RAD; // Forearm roll
  const j5 = (jointsDeg[4] || 0) * DEG2RAD; // Wrist pitch
  const j6 = (jointsDeg[5] || 0) * DEG2RAD; // Flange roll

  // Planar forward calculations in elevation plane:
  const theta2 = j2;
  const theta23 = j2 + j3;
  const theta235 = j2 + j3 + j5;

  const p0: CartesianCoord = { x: 0, y: 0, z: 0 };
  const pShoulder: CartesianCoord = { x: 0, y: 0, z: baseHeightMm };

  // Radial distances from base axis
  const rElbow = upperArmMm * Math.sin(theta2);
  const zElbow = baseHeightMm + upperArmMm * Math.cos(theta2);

  const rWrist = rElbow + forearmMm * Math.sin(theta23);
  const zWrist = zElbow + forearmMm * Math.cos(theta23);

  const rTcp = rWrist + toolAssemblyMm * Math.sin(theta235);
  const zTcp = zWrist + toolAssemblyMm * Math.cos(theta235);

  // Rotate radially by base angle j1
  const cosJ1 = Math.cos(j1);
  const sinJ1 = Math.sin(j1);

  const pElbow: CartesianCoord = {
    x: Number((rElbow * cosJ1).toFixed(2)),
    y: Number((rElbow * sinJ1).toFixed(2)),
    z: Number(zElbow.toFixed(2)),
  };

  const pWrist: CartesianCoord = {
    x: Number((rWrist * cosJ1).toFixed(2)),
    y: Number((rWrist * sinJ1).toFixed(2)),
    z: Number(zWrist.toFixed(2)),
  };

  const pTcp: CartesianCoord = {
    x: Number((rTcp * cosJ1).toFixed(2)),
    y: Number((rTcp * sinJ1).toFixed(2)),
    z: Number(zTcp.toFixed(2)),
  };

  const pitchDeg = Number((theta235 * RAD2DEG).toFixed(1));
  const yawDeg = Number(((jointsDeg[0] || 0) + (jointsDeg[3] || 0)).toFixed(1));
  const rollDeg = Number((jointsDeg[5] || 0).toFixed(1));

  const tcpPose: CartesianPose = {
    ...pTcp,
    pitchDeg,
    yawDeg,
    rollDeg,
  };

  return {
    tcp: tcpPose,
    linkPositions: [p0, pShoulder, pElbow, pWrist, pTcp],
    transformationMatrix: [
      [cosJ1, -sinJ1, 0, pTcp.x],
      [sinJ1, cosJ1, 0, pTcp.y],
      [0, 0, 1, pTcp.z],
      [0, 0, 0, 1],
    ],
  };
}

/**
 * Analytical Inverse Kinematics (IK) for 6-DOF Robot with Spherical Wrist Decoupling
 * Determines exact joint angles for a requested Cartesian target (x, y, z in mm).
 */
export function computeInverseKinematics(
  robot: RobotSpecification,
  target: CartesianCoord,
  preferredToolPitchDeg: number = 90 // Default top-down pick and place orientation
): InverseKinematicsResult {
  const { baseHeightMm, upperArmMm, forearmMm, wristMm, toolMm } = robot.linkDimensions;
  const toolAssemblyMm = wristMm + toolMm;

  if (robot.category === '4-DOF SCARA') {
    // SCARA Inverse Kinematics
    const rSq = target.x * target.x + target.y * target.y;
    const r = Math.sqrt(rSq);
    const maxReach = upperArmMm + forearmMm;

    if (r > maxReach) {
      return {
        reachable: false,
        reason: `Target (${target.x}, ${target.y}) exceeds maximum SCARA reach (${r.toFixed(1)}mm > ${maxReach}mm).`,
      };
    }

    const cosJ2 = (rSq - upperArmMm * upperArmMm - forearmMm * forearmMm) / (2 * upperArmMm * forearmMm);
    const clampedCosJ2 = Math.max(-1, Math.min(1, cosJ2));
    const j2Rad = Math.acos(clampedCosJ2);

    const beta = Math.atan2(target.y, target.x);
    const psi = Math.atan2(forearmMm * Math.sin(j2Rad), upperArmMm + forearmMm * Math.cos(j2Rad));
    const j1Rad = beta - psi;

    const j3Z = baseHeightMm - target.z - toolMm;
    const j1Deg = j1Rad * RAD2DEG;
    const j2Deg = j2Rad * RAD2DEG;
    const j4Deg = 0;

    const joints = [j1Deg, j2Deg, j3Z, j4Deg];
    const validation = validateJointAngles(robot, joints);
    if (!validation.valid) {
      return { reachable: false, reason: validation.violations[0] };
    }

    return { reachable: true, jointAnglesDeg: joints };
  }

  // 6-DOF Articulated Arm IK
  // 1. Base rotation J1
  const j1Rad = Math.atan2(target.y, target.x);
  const j1Deg = normalizeAngleDeg(j1Rad * RAD2DEG);

  // Check Joint 1 limits
  const j1Limit = robot.jointLimits[0];
  if (j1Deg < j1Limit.minDeg || j1Deg > j1Limit.maxDeg) {
    return {
      reachable: false,
      reason: `Base rotation J1 (${j1Deg.toFixed(1)}°) exceeds physical limit [${j1Limit.minDeg}°, ${j1Limit.maxDeg}°].`,
    };
  }

  // 2. Wrist Center Decoupling
  const toolPitchRad = preferredToolPitchDeg * DEG2RAD;
  const rTarget = Math.sqrt(target.x * target.x + target.y * target.y);

  // Position of wrist pivot
  const rWrist = rTarget - toolAssemblyMm * Math.sin(toolPitchRad);
  const zWrist = target.z - toolAssemblyMm * Math.cos(toolPitchRad);

  // Vector from shoulder pivot (0, baseHeightMm) to wrist center (rWrist, zWrist)
  const deltaR = rWrist;
  const deltaZ = zWrist - baseHeightMm;
  const distSq = deltaR * deltaR + deltaZ * deltaZ;
  const dist = Math.sqrt(distSq);

  const maxReach = upperArmMm + forearmMm;
  const minReach = Math.abs(upperArmMm - forearmMm);

  if (dist > maxReach) {
    return {
      reachable: false,
      reason: `Target wrist point is out of reach (${dist.toFixed(1)}mm > max ${maxReach}mm).`,
      residualDistanceMm: dist - maxReach,
    };
  }

  if (dist < minReach + 15) {
    return {
      reachable: false,
      reason: `Target wrist point is too close to base column (internal singularity boundary).`,
    };
  }

  // 3. Law of Cosines for Elbow J3
  const cosTheta3 = (distSq - upperArmMm * upperArmMm - forearmMm * forearmMm) / (2 * upperArmMm * forearmMm);
  const clampedCosTheta3 = Math.max(-1, Math.min(1, cosTheta3));
  // Negative for standard elbow-up industrial configuration
  const theta3Rad = -Math.acos(clampedCosTheta3);
  const j3Deg = theta3Rad * RAD2DEG;

  // 4. Closed-form exact trigonometric solver for Shoulder angle J2
  const A = upperArmMm + forearmMm * Math.cos(theta3Rad);
  const B = forearmMm * Math.sin(theta3Rad);
  const theta2Rad = Math.atan2(A * deltaR - B * deltaZ, B * deltaR + A * deltaZ);
  const j2Deg = theta2Rad * RAD2DEG;

  // 5. Wrist Pitch J5 to achieve requested tool pitch
  const j5Deg = preferredToolPitchDeg - (j2Deg + j3Deg);

  // J4 and J6 default to 0 for planar target approach
  const j4Deg = 0;
  const j6Deg = 0;

  const solution = [
    Number(j1Deg.toFixed(2)),
    Number(j2Deg.toFixed(2)),
    Number(j3Deg.toFixed(2)),
    Number(j4Deg.toFixed(2)),
    Number(j5Deg.toFixed(2)),
    Number(j6Deg.toFixed(2)),
  ];

  // Verify full solution against physical joint limit stops
  const validation = validateJointAngles(robot, solution);
  if (!validation.valid) {
    return {
      reachable: false,
      reason: `Kinematic solution requires exceeding joint limits: ${validation.violations[0]}`,
    };
  }

  // Double check forward kinematics accuracy to ensure no discrepancy
  const fkCheck = computeForwardKinematics(robot, solution);
  const dx = fkCheck.tcp.x - target.x;
  const dy = fkCheck.tcp.y - target.y;
  const dz = fkCheck.tcp.z - target.z;
  const err = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return {
    reachable: true,
    jointAnglesDeg: solution,
    residualDistanceMm: Number(err.toFixed(2)),
  };
}

/**
 * Checks for singularity conditions (wrist flip, shoulder collinearity)
 */
export function checkSingularities(
  robot: RobotSpecification,
  jointsDeg: number[]
): SingularityCheck {
  const j3 = jointsDeg[2] || 0;
  const j5 = jointsDeg[4] || 0;

  // Wrist singularity occurs when J5 is at 0 (J4 and J6 axes become collinear)
  if (Math.abs(j5) < 3.0) {
    return {
      nearSingularity: true,
      type: 'wrist_singularity',
      warning: 'Near wrist singularity (J5 ≈ 0°). Axial orientation degrees of freedom degenerate.',
    };
  }

  // Boundary singularity occurs when elbow is fully outstretched
  if (Math.abs(j3) < 4.0) {
    return {
      nearSingularity: true,
      type: 'reach_boundary',
      warning: 'Near workspace reach boundary. Arm is nearly fully extended.',
    };
  }

  return { nearSingularity: false };
}
