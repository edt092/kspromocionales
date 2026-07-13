Act as a Lead Creative Frontend Engineer and Senior Interaction Designer. Your task is to architect and code a high-performance, immersive 3D promotional products web platform based on market research insights from Vistaprint and a strict corporate design system. 

The stack must leverage HTML5, Tailwind CSS, Three.js (or React Three Fiber), and GSAP (ScrollTrigger) to create a web experience where promotional products feel premium, tactile, and modern.

---

### 1. BRAND IDENTITY & DESIGN TOKENS
Strictly adhere to the following color palette and brand geometry:
- Primary Dark / Backgrounds: Deep Dark Slate (`#0B0F19`)
- Accent / Brand Color: Vibrant Electric Blue (`#1061FF`)
- Secondary High-Contrast: Laser Cyan / Teal (`#00E5FF`)
- Base Light / Clean Cards: Minimalist White / Light Gray (`#F8FAFC`)
- Typography: `#FFFFFF` for primary text on dark containers; `#0F172A` for light containers.
- Geometric Rule: The logo utilizes precise, clean, geometric grid lines. The web UI layout must replicate this with thin, elegant, high-tech grid borders (`border-slate-800`), mimicking a modern dashboard or a precise blueprint interface.

---

### 2. CONTEXTUAL UX STRATEGY (Based on Industry Reports)
Promotional product buyers care about tactile quality, volume scaling, and fast category filtering. The UI must solve this visually:
- Virtual Showroom: Instead of static 2D images, the core interface will rely on interactive 3D mockups.
- Dynamic Scannability: High visual hierarchy to quickly separate apparel, drinkware, tech, and office supplies.

---

### 3. THE SKELETON OF MOVEMENT & 3D SCENE ORCHESTRATION

#### A. Hero Section: "The Infinite Showcase"
- Layout: Asymmetric split-screen. Right/Center contains a WebGL Canvas. Left contains bold, high-contrast typography (`#FFFFFF`).
- 3D Interaction (Three.js): A dynamic, floating 3D matrix showcase of core promotional objects (a premium matte water bottle, a tech gadget, and a structured notebook).
- Scroll-Based Parallax (GSAP): As the user scrolls down, the 3D objects don't just move up; they rotate on their Y-axis and smoothly scatter/disperse towards the next content sections, guiding the user’s eye dynamically down the page.
- Visual Depth: A subtle background grid of thin blue/cyan glowing lines that moves at 0.3x the speed of the foreground elements.

#### B. The Content Path: "The Interactive Blueprint Grid"
- Transition to a CSS Grid layout mimicking an architectural catalog. 
- GSAP Sequencing: When scrolling into the category section, grid cells animate using a stagger reveal effect (lines draw first using SVG `stroke-dashoffset` or scale, then product data fades in from `y: 30`).
- Hover States (Micro-interactions): 
  * Cards must feature a 3D tilt effect on mousemove.
  * On hovering over a product card, the background WebGL canvas slightly shifts focal depth (bokeh/DOF effect) to focus closer on that product's 3D bounding box area.
  * Buttons must use magnetic attraction towards the cursor with an expanding circular background clip.

#### C. Decision Zones: "The Scale & Customization Section"
- A dedicated interactive section explaining bulk pricing or customization layers.
- Movement: A horizontal scroll pin section using GSAP ScrollTrigger. As the user scrolls vertically, the screen locks and slides horizontally to showcase the "Step 1: Choose Product", "Step 2: Upload Logo", "Step 3: Preview in 3D" flow.

---

### 4. CODE IMPLEMENTATION PARAMETERS
- Provide clean, production-ready, modular code (HTML/Tailwind/JS or React components).
- Ensure the Three.js canvas is highly optimized: use a single requestAnimationFrame loop, basic materials or optimized PBR materials, low-poly geometries, and proper resize listeners.
- Separate GSAP logic into clear timelines anchored to ScrollTrigger markers.
- Add descriptive code comments explaining the math behind the mouse-tracking perspective calculations and scroll sequencing.

WEB POSICION PARA COLOMBIA 
DEBES USAR ASTRO 
DEBES USAR SOLO PNPM NUNCA NPM 
POSICON PARA BUCARAMANGA Y DEMAS CIUDADES PRINCIPALES 
ESTA WEB ES LA VERSION COLOMBIA DE C:\Users\Dagon\Desktop\MILLONARIE_DEV_PROYECTS\PROMOCIONALES\KSP\KSPROMOCIONALES\ksp-ecommerce-engine
LA WEB USA IGUAL LOS PRODCUTOS DE CATALOGOSPROMOCIONALES.COM 
LA WEB DEBE SER AÑADIDA AL ETL C:\Users\Dagon\Desktop\MILLONARIE_DEV_PROYECTS\PROMOCIONALES\promo-content-pipeline
DEBES USAR informe_vistaprint_promotional_products.MD como arquitectura de ejmplo y diseño del frontend