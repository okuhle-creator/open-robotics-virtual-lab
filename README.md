# Open Robotics Virtual Lab

An industrial-grade, free, browser-native 3D robotics simulation and educational learning platform. Engineered with **React 18**, **TypeScript**, **Three.js**, **React Three Fiber**, **Blockly**, **Monaco Editor**, **Tailwind CSS**, and **Supabase**.

---

## 🌟 Key Features

- **High-Fidelity 3D Virtual Robot Engine**: Interactive Three.js/React Three Fiber models with real-time forward and inverse kinematics, soft contact shadows, coordinate axes triads, and millimeter engineering grids.
- **Original Procedural Robot Models**:
  1. **ORV-600 Articulated** (6-DOF, 3kg payload, 600mm reach, spherical wrist)
  2. **ORV-SCARA 400** (4-DOF, 5kg payload, 400mm reach, vertical Z ballscrew quill)
  3. **ORV-Delta 300** (3-DOF parallel robot with carbon-fiber linkages)
  4. **ORV-Cobot 750** (6-DOF collaborative manipulator with RGB status halo)
- **7 Specialized Laboratory Modes**:
  - **Blockly Visual IDE**: Custom robotics blocks (START, MOVE_TO, MOVE_JOINT, GRIPPER, WAIT, PICK, PLACE, REPEAT) with live Python translation.
  - **Monaco Python IDE**: Code editor with syntax highlighting, autocomplete, and a safe browser-side interpreter for the `robot.*` API.
  - **Teach Pendant & Playback**: Joint and Cartesian jog controls, waypoint recorder, trajectory sequence reordering, and continuous looping.
  - **Industrial Pick & Place**: Workbench with cubes, cylinders, spheres, IC chips, staging trays, and storage buckets with contact grasp logic.
  - **2D Toolpath Drawing**: Generates parametric toolpaths (circle, square, triangle, star, letter contour) with real-time 3D line ribbon tracing.
  - **Conveyor Belt Sorting**: Factory conveyor line with photoelectric optical sensors, dynamic speeds, and automated sorting into color bins (A, B, C).
  - **Simulated Machine Vision**: Overhead optical inspection camera, bounding box detection, and quality classification.
- **8 Courses & 20 Modules**: Beginner, Intermediate, and Advanced robotics curriculum with theory, animated diagrams, interactive quizzes, and hands-on lab exercises.
- **Dual Mode Storage (Zero-Config Demo Mode + Supabase)**: Works 100% offline out-of-the-box with LocalStorage; easily connectable to Supabase for multi-user cloud synchronization.

---

## 🚀 Quickstart & Local Installation

### 1. Prerequisites
- Node.js 18+ (tested on Node v20 & v24)
- npm 9+

### 2. Install Dependencies
```bash
cd open-robotics-virtual-lab
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173` to start exploring the laboratory.

### 4. Production Build
```bash
npm run build
npm run preview
```

---

## ☁️ Supabase Cloud Configuration (Optional)

The application automatically runs in **Zero-Config Local Demo Mode** if Supabase keys are omitted. To connect your own Supabase project:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and execute the migration script located at:
   ```
   supabase/schema.sql
   ```
   This creates all required tables (`profiles`, `robots`, `projects`, `courses`, `lessons`, `course_progress`, `lab_sessions`, `achievements`) and applies Row Level Security (RLS) policies.
3. In the Supabase project dashboard, copy your **Project URL** and **Anon Public API Key**.
4. Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
5. Restart the Vite dev server (`npm run dev`). Cloud authentication and database sync are now enabled!

---

## 🚢 Deployment (Vercel, Netlify, Cloudflare)

The frontend is completely static and optimized for deployment on Vercel:

```bash
# Using Vercel CLI
npx vercel
```
Or connect your GitHub repository directly to Vercel/Netlify. Set the build command to `npm run build` and publish directory to `dist`.

---

## 📐 How the Simulation Engine Works

The architecture follows a clean 7-layer decoupled structure:

```
UI Layer (React 18 + Tailwind)
   ↓
Lab Controller (LabLayout.tsx)
   ↓
Program Interpreter (Blockly generator or Python AST interpreter)
   ↓
Robot Command Queue (RobotSimulationEngine in src/robotics/commandQueue.ts)
   ↓
Kinematics Engine (src/robotics/kinematics.ts - Forward & Inverse Kinematics)
   ↓
Simulation State (Joint angles J1..J6, TCP position, Gripper state)
   ↓
Three.js / React Three Fiber Renderer (RobotCanvas.tsx)
```

1. **Forward Kinematics (FK)**: Computes the 3D position and orientation of the Tool Center Point (TCP) from joint angles using standard Denavit-Hartenberg (DH) $4\times 4$ transformation matrices.
2. **Inverse Kinematics (IK)**: Computes target joint angles $[J_1..J_6]$ for any $(X, Y, Z)$ target using analytical trigonometry with wrist decoupling and collision boundary checking.
3. **Command Queue**: Executes commands sequentially with easeInOut cubic interpolation and Web Audio procedural feedback (servo whine and pneumatic hisses).

---

## 🤖 How to Add a New Robot

1. Open `src/types/robot.ts` and ensure your desired robot category is supported.
2. Add a new robot specification entry in `src/data/robotsData.ts`:
   ```typescript
   {
     id: 'orv-custom-500',
     name: 'ORV-Custom 500',
     category: 'Articulated',
     dof: 6,
     payloadKg: 4.0,
     reachMm: 500,
     repeatabilityMm: 0.03,
     weightKg: 16.0,
     difficulty: 'Intermediate',
     color: '#10b981',
     accentColor: '#34d399',
     defaultEndEffector: 'gripper',
     availableLabs: ['blocks', 'python', 'teaching', 'pick-place'],
     jointLimits: [...],
     cartesianLimits: {...},
     homeJoints: [0, 20, -40, 0, 20, 0],
     dhParameters: [...],
   }
   ```
3. If creating custom procedural 3D geometries, create a component in `src/simulation/` and register it inside `RobotCanvas.tsx`.

---

## 🔬 How to Add a New Lab

1. Create your new lab feature component in `src/features/labs/YourNewLab.tsx`.
2. Add the lab identifier to `LabType` in `src/types/project.ts`.
3. Register the lab tab and view component in `src/features/labs/LabLayout.tsx`.
4. Add a tile to `src/features/labs/LabHub.tsx` so students can launch it with one click.

---

## 📚 How to Add a New Course

1. Open `src/data/coursesData.ts`.
2. Add a new `Course` object with lessons, markdown content, quiz questions, and hands-on lab challenges.
3. The platform will automatically render the course in the catalog, track student progress, and grade quizzes in real time!

---

## ⚖️ License & Originality

This project is an **ORIGINAL** open-source educational resource designed from scratch for engineering education. All 3D geometry, kinematics solvers, visual styles, and code are 100% original and do not incorporate proprietary assets from Dobot or any other corporation.
