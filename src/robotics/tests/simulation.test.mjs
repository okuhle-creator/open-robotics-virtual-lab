import test from 'node:test';
import assert from 'node:assert/strict';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function normalizeAngleDeg(angleDeg) {
  let a = angleDeg % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a;
}

const ORV_600_SPEC = {
  id: 'orv-600',
  name: 'ORV-600 Articulated Arm',
  dof: 6,
  reachMm: 600,
  linkDimensions: {
    baseHeightMm: 180,
    upperArmMm: 240,
    forearmMm: 220,
    wristMm: 65,
    toolMm: 75,
  },
  homeJointsDeg: [0, 25, -45, 0, 20, 0],
  jointLimits: [
    { index: 0, name: 'J1', minDeg: -165, maxDeg: 165 },
    { index: 1, name: 'J2', minDeg: -60, maxDeg: 110 },
    { index: 2, name: 'J3', minDeg: -130, maxDeg: 80 },
    { index: 3, name: 'J4', minDeg: -170, maxDeg: 170 },
    { index: 4, name: 'J5', minDeg: -105, maxDeg: 105 },
    { index: 5, name: 'J6', minDeg: -180, maxDeg: 180 },
  ],
};

function computeForwardKinematics(robot, jointsDeg) {
  const { baseHeightMm, upperArmMm, forearmMm, wristMm, toolMm } = robot.linkDimensions;
  const toolAssemblyMm = wristMm + toolMm;

  const j1 = (jointsDeg[0] || 0) * DEG2RAD;
  const j2 = (jointsDeg[1] || 0) * DEG2RAD;
  const j3 = (jointsDeg[2] || 0) * DEG2RAD;
  const j5 = (jointsDeg[4] || 0) * DEG2RAD;

  const theta2 = j2;
  const theta23 = j2 + j3;
  const theta235 = j2 + j3 + j5;

  const rElbow = upperArmMm * Math.sin(theta2);
  const zElbow = baseHeightMm + upperArmMm * Math.cos(theta2);

  const rWrist = rElbow + forearmMm * Math.sin(theta23);
  const zWrist = zElbow + forearmMm * Math.cos(theta23);

  const rTcp = rWrist + toolAssemblyMm * Math.sin(theta235);
  const zTcp = zWrist + toolAssemblyMm * Math.cos(theta235);

  const cosJ1 = Math.cos(j1);
  const sinJ1 = Math.sin(j1);

  return {
    x: Number((rTcp * cosJ1).toFixed(2)),
    y: Number((rTcp * sinJ1).toFixed(2)),
    z: Number(zTcp.toFixed(2)),
    pitchDeg: Number((theta235 * RAD2DEG).toFixed(1)),
  };
}

function computeInverseKinematics(robot, target, preferredToolPitchDeg = 90) {
  const { baseHeightMm, upperArmMm, forearmMm, wristMm, toolMm } = robot.linkDimensions;
  const toolAssemblyMm = wristMm + toolMm;

  const j1Rad = Math.atan2(target.y, target.x);
  const j1Deg = normalizeAngleDeg(j1Rad * RAD2DEG);

  const j1Limit = robot.jointLimits[0];
  if (j1Deg < j1Limit.minDeg || j1Deg > j1Limit.maxDeg) {
    return { reachable: false, reason: 'Base J1 limit exceeded' };
  }

  const toolPitchRad = preferredToolPitchDeg * DEG2RAD;
  const rTarget = Math.sqrt(target.x * target.x + target.y * target.y);
  const rWrist = rTarget - toolAssemblyMm * Math.sin(toolPitchRad);
  const zWrist = target.z - toolAssemblyMm * Math.cos(toolPitchRad);

  const deltaR = rWrist;
  const deltaZ = zWrist - baseHeightMm;
  const distSq = deltaR * deltaR + deltaZ * deltaZ;
  const dist = Math.sqrt(distSq);

  const maxReach = upperArmMm + forearmMm;
  if (dist > maxReach) {
    return { reachable: false, reason: `Target wrist point out of reach (${dist.toFixed(1)}mm > ${maxReach}mm)` };
  }

  const cosTheta3 = (distSq - upperArmMm * upperArmMm - forearmMm * forearmMm) / (2 * upperArmMm * forearmMm);
  const clampedCosTheta3 = Math.max(-1, Math.min(1, cosTheta3));
  const theta3Rad = -Math.acos(clampedCosTheta3);
  const j3Deg = theta3Rad * RAD2DEG;

  const A = upperArmMm + forearmMm * Math.cos(theta3Rad);
  const B = forearmMm * Math.sin(theta3Rad);

  const theta2Rad = Math.atan2(A * deltaR - B * deltaZ, B * deltaR + A * deltaZ);
  const j2Deg = theta2Rad * RAD2DEG;
  const j5Deg = preferredToolPitchDeg - (j2Deg + j3Deg);

  return {
    reachable: true,
    jointAnglesDeg: [j1Deg, j2Deg, j3Deg, 0, j5Deg, 0],
  };
}

// ================= TEST SUITE =================
test('Forward Kinematics computes consistent TCP coordinates at Home pose', () => {
  const homeJoints = ORV_600_SPEC.homeJointsDeg;
  const tcp = computeForwardKinematics(ORV_600_SPEC, homeJoints);

  assert.ok(tcp.z > 0, 'TCP Z must be positive in upright home position');
  assert.ok(tcp.x > 0, 'TCP X should be forward in positive quadrant');
  assert.equal(tcp.y, 0, 'TCP Y must be zero when Base J1 is 0 degrees');
});

test('Forward Kinematics base rotation rotates TCP about Z-axis', () => {
  const rotatedJoints = [90, 25, -45, 0, 20, 0];
  const tcp = computeForwardKinematics(ORV_600_SPEC, rotatedJoints);

  assert.ok(Math.abs(tcp.x) < 0.01, 'TCP X must be approximately zero at J1 = 90°');
  assert.ok(tcp.y > 0, 'TCP Y must be positive at J1 = 90°');
});

test('Inverse Kinematics successfully solves reachable target position', () => {
  const reachableTarget = { x: 220, y: -160, z: 120 };
  const ik = computeInverseKinematics(ORV_600_SPEC, reachableTarget, 90);

  assert.equal(ik.reachable, true, 'Target should be within reach envelope');
  assert.ok(Array.isArray(ik.jointAnglesDeg), 'Solution must contain array of joint angles');
  assert.equal(ik.jointAnglesDeg.length, 6, 'Must provide 6 joint angles');

  // Verify that FK of this IK solution lands back on the target!
  const verifiedFK = computeForwardKinematics(ORV_600_SPEC, ik.jointAnglesDeg);
  const errX = Math.abs(verifiedFK.x - reachableTarget.x);
  const errY = Math.abs(verifiedFK.y - reachableTarget.y);
  const errZ = Math.abs(verifiedFK.z - reachableTarget.z);

  assert.ok(errX < 2.0, `Discrepancy in X (${errX}mm) exceeds tolerance`);
  assert.ok(errY < 2.0, `Discrepancy in Y (${errY}mm) exceeds tolerance`);
  assert.ok(errZ < 2.0, `Discrepancy in Z (${errZ}mm) exceeds tolerance`);
});

test('Inverse Kinematics explicitly rejects target beyond maximum physical reach', () => {
  const unreachableTarget = { x: 800, y: 800, z: 500 };
  const ik = computeInverseKinematics(ORV_600_SPEC, unreachableTarget, 90);

  assert.equal(ik.reachable, false, 'Unreachable target must not claim success');
  assert.ok(ik.reason.includes('out of reach'), 'Reason must explicitly mention out of reach condition');
});

test('Grasp contact verification enforces distance threshold', () => {
  const objectPos = { x: 220, y: -160, z: 12 };
  const validTcp = { x: 225, y: -158, z: 32 };
  const invalidTcp = { x: 350, y: 0, z: 200 };

  const distValid = Math.sqrt(
    Math.pow(validTcp.x - objectPos.x, 2) +
    Math.pow(validTcp.y - objectPos.y, 2) +
    Math.pow(validTcp.z - (objectPos.z + 20), 2)
  );

  const distInvalid = Math.sqrt(
    Math.pow(invalidTcp.x - objectPos.x, 2) +
    Math.pow(invalidTcp.y - objectPos.y, 2) +
    Math.pow(invalidTcp.z - (objectPos.z + 20), 2)
  );

  assert.ok(distValid <= 45, 'Close TCP must be within 45mm grasp threshold');
  assert.ok(distInvalid > 45, 'Distant TCP must fail grasp threshold');
});

test('Conveyor rule sorting correctly routes items to assigned bins', () => {
  const rules = [
    { color: 'red', shape: 'all', targetBin: 'Bin A', active: true },
    { color: 'green', shape: 'all', targetBin: 'Bin B', active: true },
    { color: 'blue', shape: 'all', targetBin: 'Bin C', active: true },
  ];

  const redItem = { color: 'red', shape: 'box' };
  const greenItem = { color: 'green', shape: 'cylinder' };
  const yellowItem = { color: 'yellow', shape: 'box' };

  const matchRed = rules.find((r) => r.active && (r.color === 'all' || r.color === redItem.color));
  const matchGreen = rules.find((r) => r.active && (r.color === 'all' || r.color === greenItem.color));
  const matchYellow = rules.find((r) => r.active && (r.color === 'all' || r.color === yellowItem.color));

  assert.equal(matchRed.targetBin, 'Bin A');
  assert.equal(matchGreen.targetBin, 'Bin B');
  assert.equal(matchYellow, undefined, 'Unconfigured item should not match rule');
});
