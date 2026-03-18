Product Requirements Document (PRD)

Project: 3D Exploded Architecture Scroll - Burj Khalifa Edition

1. Project Overview

Objective: Create an interactive, high-performance web experience that utilizes 3D rendering and scroll-linked animations (scrollytelling) to "deconstruct" the Burj Khalifa.
Target Audience: Architecture enthusiasts, design agency portfolios, or real estate showcases.
Core Concept: As the user scrolls down the page, a high-fidelity 3D model of the Burj Khalifa breaks apart into its core structural components (Spire, High-Rise/Suites, Residential, Hotel/Base, Foundation), accompanied by descriptive typography.

2. Tech Stack Requirements

Core Structure: HTML5, CSS3 (Modern, semantic structure, CSS Variables).

3D Rendering Engine: Three.js (via WebGL).

Animation Engine: GSAP (GreenSock Animation Platform).

Scroll Plugin: GSAP ScrollTrigger.

Asset Format: .glb or .gltf (for final production model).

3. User Experience (UX) & Scroll Mapping

The experience is divided into 5 distinct scroll phases. Each phase occupies 100vh (one full screen height) of scroll distance.

Phase

Scroll Trigger

3D Camera Action

3D Model Action

UI Text Displayed

1. Hero

0% - 20%

Wide shot, angled low looking up.

Intact tower, subtle idle rotation.

"Burj Khalifa: The Vertical City"

2. The Spire

20% - 40%

Pans up to the top third.

Spire group pulls upward (+Y axis).

Details on the 4000-ton structural steel spire.

3. Corporate & Residential

40% - 60%

Pans to the middle sections.

Mid-sections pull apart horizontally and vertically.

Details on the Y-shaped setback floorplates.

4. Armani Hotel

60% - 80%

Pans down to the lower third.

Lower sections separate slightly.

Details on the base concourse and hotel tiers.

5. Foundation

80% - 100%

High-angle shot looking down.

All layers fully exploded. Raft foundation isolated.

Details on the 192 concrete piles.

4. Technical Specifications

4.1. Three.js Scene Setup

Environment: Deep black or dark slate background (#050505 or Three.js FogExp2 for depth).

Lighting:

1x AmbientLight (low intensity, e.g., 0.3).

1x Main DirectionalLight (Key light, warm tint, casting shadows).

1x Secondary DirectionalLight (Backlight/Rim light, cool tint like #88bbff to highlight the glass/steel).

Renderer: antialias: true, alpha: true, PCFSoftShadowMap enabled. Pixel ratio capped at Math.min(window.devicePixelRatio, 2) for performance.

4.2. 3D Asset Structure (Crucial for Exploded View)

Whether procedurally generated or imported via GLTFLoader, the building must be grouped hierarchically:

Scene

architectureGroup

group_Spire (Tiers 20-30+)

group_HighRise (Tiers 10-19)

group_LowRise (Tiers 1-9)

group_Foundation (Base pad and piles)

4.3. Procedural Prototype (If applicable before 3D model)

If testing without a .glb file, the procedural generation must mimic the Burj Khalifa's Y-shaped footprint:

Instead of squares (like the Jenga tower), group three rotated rectangles (at 0, 120, and 240 degrees) radiating from a central core.

Apply setbacks (reduce scale) as the for loop reaches higher floor indices.

4.4. GSAP ScrollTrigger Logic

Scrubbing: Set scrub: 1 or 1.5 for smooth interpolation (prevents jittery animations if the user scrolls abruptly).

Camera Tracking: Do not attach the camera strictly to a path. Instead, animate camera.position and camera.lookAt coordinates using GSAP timelines simultaneously with the model separation.

5. Testing Strategy & QA Plan

5.1. Performance & FPS Testing

Target: 60 FPS on desktop, 30-60 FPS on mid-tier mobile devices.

Metrics to track: Draw calls (keep under 200 if possible), polygon count (optimize .glb to < 200k polys).

Tools: Chrome DevTools Performance Tab, Three.js stats.js monitor.

5.2. Responsiveness & Device Testing

Desktop: Ensure scroll wheel mapping feels 1:1 with model separation.

Touch/Mobile: Test touch-drag scrolling. Ensure text sections do not overlap the 3D focal point (adjust CSS padding or flex alignment based on media queries).

Resize Handling: Verify window.addEventListener('resize') correctly updates camera.aspect and renderer.setSize.

5.3. Visual QA

Shadows: Check for shadow acne (adjust shadow bias) or cutoff shadows (increase shadow camera frustum: shadow.camera.left/right/top/bottom).

Z-Fighting: Ensure procedural floors or model meshes do not share exact Y-coordinates to prevent flickering.

6. Development Milestones

Phase 1: Environment Setup. HTML/CSS scaffolding, initialize Three.js scene, camera, lights, and blank canvas.

Phase 2: Procedural Prototyping. Build a simplified, Y-shaped stepped tower using Three.js primitives and group them logically.

Phase 3: Animation Wiring. Hook up GSAP ScrollTrigger. Create the master timeline and sync camera movements with the exploding layers.

Phase 4: Asset Integration. Replace the procedural code with GLTFLoader to import the actual Burj Khalifa .glb file. Map the existing GSAP animations to the .glb groups.

Phase 5: Polish & Optimization. Adjust lighting, add text fade animations, implement mobile media queries, and optimize asset loading (add a loading screen).