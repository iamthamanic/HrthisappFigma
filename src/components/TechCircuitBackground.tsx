import { useEffect, useRef } from 'react';

/**
 * Koordinator Background - Hybrid Animation
 * Combines: Hub & Spoke + Network Graph + Workflow Pipeline
 * 
 * TWEAKABLE PARAMETERS:
 * - HUB_SIZE: Central hub radius (default: 80)
 * - SATELLITE_COUNT: Number of orbiting nodes (default: 7)
 * - ORBIT_RADIUS: Distance from hub to satellites (default: 250)
 * - ROTATION_SPEED: Orbit rotation speed (default: 0.0003)
 * - PACKET_COUNT: Data packets flowing on connections (default: 30)
 * - PARTICLE_COUNT: Background ambient particles (default: 150)
 * - NETWORK_DENSITY: Probability of network connections (default: 0.3)
 */

// === TWEAKABLE PARAMETERS ===
const HUB_SIZE = 120;
const SATELLITE_COUNT = 12;
const ORBIT_RADIUS = 1800;
const ROTATION_SPEED = 0.00008;
const PACKET_COUNT = 40;
const PARTICLE_COUNT = 0; // Disabled - no particles
const NETWORK_DENSITY = 0.75;

// === COLOR PALETTE ===
const COLORS = {
  bg: '#f9fafb',           // Light gray background (matching UI)
  bgLight: '#ffffff',      // White
  hubCore: '#155dfc',      // Logo blue
  hubGlow: '#4a8aff',      // Lighter blue
  satellite: '#155dfc',    // Logo blue
  satelliteGlow: '#6ba3ff',
  connection: '#155dfc',   // Logo blue
  connectionGlow: '#7db3ff',
  packet: '#155dfc',       // Logo blue
  packetAccent: '#4a8aff',
  particleBlue: '#155dfc',
  particleLight: '#c7deff',
};

// === TYPES ===
interface Node {
  x: number;
  y: number;
  angle?: number;
  radius: number;
  color: string;
  glowColor: string;
  pulsePhase: number;
  type: 'hub' | 'satellite';
}

interface Connection {
  from: number;
  to: number;
  active: boolean;
  strength: number;
  pulsePhase: number;
  opacity: number; // Smooth fade in/out
  targetOpacity: number; // Target for fade
  lastFadeTime: number; // Prevent too frequent fades
  reactivateTime: number; // When to reactivate (0 = not scheduled)
}

interface DataPacket {
  connectionIndex: number;
  progress: number;
  speed: number;
  size: number;
  color: string;
  direction: number; // 1 or -1
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
}

export default function TechCircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const packetsRef = useRef<DataPacket[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let centerX = 0;
    let centerY = 0;

    // === RESIZE HANDLER ===
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      width = rect.width;
      height = rect.height;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      
      ctx.scale(dpr, dpr);
      
      centerX = width / 2;
      centerY = height / 2;

      // Reinitialize on resize
      initElements();
    };

    // === INITIALIZE ELEMENTS ===
    const initElements = () => {
      const nodes = nodesRef.current;
      const connections = connectionsRef.current;
      const packets = packetsRef.current;
      const particles = particlesRef.current;

      // Clear arrays
      nodes.length = 0;
      connections.length = 0;
      packets.length = 0;
      particles.length = 0;

      // Create central HUB
      nodes.push({
        x: centerX,
        y: centerY,
        radius: HUB_SIZE,
        color: COLORS.hubCore,
        glowColor: COLORS.hubGlow,
        pulsePhase: 0,
        type: 'hub',
      });

      // Create SATELLITE nodes in orbit
      for (let i = 0; i < SATELLITE_COUNT; i++) {
        const angle = (Math.PI * 2 * i) / SATELLITE_COUNT;
        nodes.push({
          x: 0, // Will be calculated in update
          y: 0,
          angle,
          radius: 40 + Math.random() * 20,
          color: COLORS.satellite,
          glowColor: COLORS.satelliteGlow,
          pulsePhase: Math.random() * Math.PI * 2,
          type: 'satellite',
        });
      }

      // Create CONNECTIONS
      // Hub to all satellites (Hub & Spoke)
      for (let i = 1; i < nodes.length; i++) {
        connections.push({
          from: 0,
          to: i,
          active: true,
          strength: 0.8,
          pulsePhase: Math.random() * Math.PI * 2,
          opacity: 1,
          targetOpacity: 1,
          lastFadeTime: 0,
          reactivateTime: 0,
        });
      }

      // Network connections between satellites (Network Graph)
      for (let i = 1; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.random() < NETWORK_DENSITY) {
            connections.push({
              from: i,
              to: j,
              active: Math.random() > 0.15,
              strength: 0.3 + Math.random() * 0.4,
              pulsePhase: Math.random() * Math.PI * 2,
              opacity: 1,
              targetOpacity: 1,
              lastFadeTime: 0,
              reactivateTime: 0,
            });
          }
        }
      }

      // Create DATA PACKETS (Workflow Pipeline)
      for (let i = 0; i < PACKET_COUNT; i++) {
        packets.push({
          connectionIndex: Math.floor(Math.random() * connections.length),
          progress: Math.random(),
          speed: 0.0003 + Math.random() * 0.0005,
          size: 3 + Math.random() * 4,
          color: Math.random() > 0.5 ? COLORS.packet : COLORS.satellite,
          direction: Math.random() > 0.5 ? 1 : -1,
        });
      }

      // Create BACKGROUND PARTICLES
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          size: Math.random() * 2 + 0.5,
          color: Math.random() > 0.5 ? COLORS.particleBlue : COLORS.particleLight,
          opacity: Math.random() * 0.4 + 0.2,
        });
      }
    };

    // === UPDATE LOGIC ===
    const update = (deltaTime: number) => {
      const nodes = nodesRef.current;
      const connections = connectionsRef.current;
      const packets = packetsRef.current;
      const particles = particlesRef.current;

      // Update satellite positions (rotation around hub)
      for (let i = 1; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.angle !== undefined) {
          node.angle += ROTATION_SPEED * deltaTime;
          node.x = centerX + Math.cos(node.angle) * ORBIT_RADIUS;
          node.y = centerY + Math.sin(node.angle) * ORBIT_RADIUS;
        }
        node.pulsePhase += 0.002 * deltaTime;
      }

      // Update hub pulse
      nodes[0].pulsePhase += 0.001 * deltaTime;

      // Update connections (smooth fade)
      const currentTime = performance.now();
      connections.forEach((conn) => {
        conn.pulsePhase += 0.003 * deltaTime;
        
        // Check if connection should reactivate
        if (conn.reactivateTime > 0 && currentTime >= conn.reactivateTime) {
          conn.active = true;
          conn.targetOpacity = 1;
          conn.reactivateTime = 0; // Reset
        }
        
        // Smooth fade in/out based on targetOpacity
        const fadeSpeed = 0.0015; // Much slower, softer fade
        if (conn.opacity < conn.targetOpacity) {
          conn.opacity = Math.min(conn.opacity + fadeSpeed * deltaTime, conn.targetOpacity);
        } else if (conn.opacity > conn.targetOpacity) {
          conn.opacity = Math.max(conn.opacity - fadeSpeed * deltaTime, conn.targetOpacity);
        }
      });

      // Update data packets
      packets.forEach((packet) => {
        const oldProgress = packet.progress;
        packet.progress += packet.speed * deltaTime * packet.direction;
        
        // Detect packet completion (wrapped around)
        const completed = packet.direction === 1 
          ? (oldProgress < 1 && packet.progress >= 1)
          : (oldProgress > 0 && packet.progress <= 0);
        
        if (completed) {
          const conn = connections[packet.connectionIndex];
          if (conn) {
            // Only fade out if enough time has passed since last fade (cooldown)
            // AND only 50% of the time (random chance)
            const timeSinceLastFade = currentTime - conn.lastFadeTime;
            const minCooldown = 5000; // 5 seconds minimum between fades
            
            if (timeSinceLastFade > minCooldown && Math.random() < 0.5) {
              conn.targetOpacity = 0;
              conn.active = false;
              conn.lastFadeTime = currentTime;
              
              // Schedule re-activation using reactivateTime (no setTimeout)
              const randomDelay = 2000 + Math.random() * 6000; // 2-8 seconds
              conn.reactivateTime = currentTime + randomDelay;
            }
          }
          
          // Assign packet to a new active connection (random selection)
          const activeConnections = connections
            .map((c, i) => ({ conn: c, index: i }))
            .filter(({ conn }) => conn.active && conn.opacity > 0.3);
          
          if (activeConnections.length > 0) {
            const newConn = activeConnections[Math.floor(Math.random() * activeConnections.length)];
            packet.connectionIndex = newConn.index;
            packet.progress = Math.random() * 0.2; // Start at random position (0-20%)
            packet.direction = Math.random() > 0.5 ? 1 : -1; // Random direction
          }
        }
        
        // Wrap around
        if (packet.progress > 1) packet.progress = 0;
        if (packet.progress < 0) packet.progress = 1;

        // Occasionally change connection (reduced frequency)
        if (Math.random() < 0.00002 * deltaTime) {
          packet.connectionIndex = Math.floor(Math.random() * connections.length);
          packet.direction = Math.random() > 0.5 ? 1 : -1;
          packet.progress = Math.random() * 0.3; // Random start position
        }
      });

      // Update particles
      particles.forEach((particle) => {
        particle.x += particle.vx * deltaTime * 0.016;
        particle.y += particle.vy * deltaTime * 0.016;

        // Wrap around screen
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
      });
    };

    // === RENDER LOGIC ===
    const render = () => {
      const nodes = nodesRef.current;
      const connections = connectionsRef.current;
      const packets = packetsRef.current;
      const particles = particlesRef.current;

      // Background gradient
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height));
      bgGradient.addColorStop(0, COLORS.bg);
      bgGradient.addColorStop(1, COLORS.bgLight);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw particles (bottom layer)
      particles.forEach((particle) => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity * 0.3;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw connections - always render, opacity controls visibility
      connections.forEach((conn) => {
        if (conn.opacity < 0.01) return; // Skip completely invisible

        const fromNode = nodes[conn.from];
        const toNode = nodes[conn.to];

        const pulse = Math.sin(conn.pulsePhase) * 0.3 + 0.7;

        // Glow layer
        ctx.strokeStyle = COLORS.connectionGlow;
        ctx.lineWidth = 4;
        ctx.globalAlpha = conn.strength * 0.15 * pulse * conn.opacity;
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();

        // Crisp layer
        ctx.strokeStyle = COLORS.connection;
        ctx.lineWidth = 2;
        ctx.globalAlpha = conn.strength * 0.4 * pulse * conn.opacity;
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      // Draw data packets
      ctx.globalCompositeOperation = 'lighter';
      packets.forEach((packet) => {
        const conn = connections[packet.connectionIndex];
        if (!conn || !conn.active) return;

        const fromNode = nodes[conn.from];
        const toNode = nodes[conn.to];

        const x = fromNode.x + (toNode.x - fromNode.x) * packet.progress;
        const y = fromNode.y + (toNode.y - fromNode.y) * packet.progress;

        // Glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, packet.size * 3);
        gradient.addColorStop(0, packet.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, packet.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = packet.color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(x, y, packet.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      // Nodes are invisible - only used as connection points
    };

    // === ANIMATION LOOP ===
    let lastTime = performance.now();
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      update(deltaTime);
      render();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // === INITIALIZE ===
    resize();
    animate(performance.now());

    // === EVENT LISTENERS ===
    window.addEventListener('resize', resize);

    // === CLEANUP ===
    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}