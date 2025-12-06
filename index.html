const canvas = document.getElementById('tetra-canvas');
const ctx = canvas.getContext('2d');
const phaseDisplay = document.getElementById('phaseDisplay');

let animationRunning = true;
let width, height;

const SPACING = 38;
const TETRA_SIZE = 12;
const SQRT3_2 = Math.sqrt(3) / 2;
const TETRA_H = TETRA_SIZE * SQRT3_2;

const CRITICAL_CONNECTIONS = 3;

// Tetrahedra data
let tetraCount = 0;
let tetraX, tetraY, tetraRotation, tetraOpacity, tetraEntanglement;
let tetraActivationTime, tetraConnectionCount;
let tetraFaceStates;

// Lines data  
let lineCount = 0;
let lineT1, lineT2, lineStrength, lineActivationTime;
let lineIsFluctuation;
let lineFlickerEnd;

let tetraNeighborLines;

// System state
let systemPhase = 'forming';
let phaseStartTime = 0;
let globalTime = 0;
let seedX, seedY, seedIdx;
let fluctuationEndTime = 0;
let nucleationTriggered = false;

const phases = {
  forming: { duration: 3000, next: 'pure' },
  pure: { duration: 2000, next: 'fluctuating' },
  fluctuating: { duration: Infinity, next: 'spreading' },
  spreading: { duration: 18000, next: 'saturated' },
  saturated: { duration: 5000, next: 'dissolving' },
  // dissolving now controls its own transition; we keep duration Infinity
  // and manually jump back to 'fluctuating' when links are faded
  dissolving: { duration: Infinity, next: 'fluctuating' }
};

function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  initSystem();
}

function initSystem() {
  const cols = Math.ceil(width / SPACING) + 4;
  const rows = Math.ceil(height / (SPACING * 0.866)) + 4;
  const offsetX = (width - (cols - 1) * SPACING) / 2;
  const offsetY = (height - (rows - 1) * SPACING * 0.866) / 2;
  
  tetraCount = cols * rows;
  
  tetraX = new Float32Array(tetraCount);
  tetraY = new Float32Array(tetraCount);
  tetraRotation = new Float32Array(tetraCount);
  tetraOpacity = new Float32Array(tetraCount);
  tetraEntanglement = new Float32Array(tetraCount);
  tetraActivationTime = new Float32Array(tetraCount);
  tetraConnectionCount = new Uint8Array(tetraCount);
  tetraFaceStates = new Float32Array(tetraCount * 4);
  
  tetraNeighborLines = [];
  
  let idx = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      tetraX[idx] = offsetX + j * SPACING + (i % 2) * (SPACING / 2);
      tetraY[idx] = offsetY + i * SPACING * 0.866;
      tetraRotation[idx] = Math.random() * Math.PI * 2;
      tetraOpacity[idx] = 0;
      tetraEntanglement[idx] = 0;
      tetraActivationTime[idx] = Infinity;
      tetraConnectionCount[idx] = 0;
      tetraNeighborLines.push([]);
      
      for (let f = 0; f < 4; f++) {
        tetraFaceStates[idx * 4 + f] = 0.3 + Math.random() * 0.7;
      }
      idx++;
    }
  }
  
  const lines = [];
  for (let i = 0; i < tetraCount; i++) {
    for (let j = i + 1; j < tetraCount; j++) {
      const dx = tetraX[i] - tetraX[j];
      const dy = tetraY[i] - tetraY[j];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < SPACING * 1.2) {
        lines.push([i, j]);
      }
    }
  }
  
  lineCount = lines.length;
  lineT1 = new Uint16Array(lineCount);
  lineT2 = new Uint16Array(lineCount);
  lineStrength = new Float32Array(lineCount);
  lineActivationTime = new Float32Array(lineCount);
  lineIsFluctuation = new Uint8Array(lineCount);
  lineFlickerEnd = new Float32Array(lineCount);
  
  for (let i = 0; i < lineCount; i++) {
    lineT1[i] = lines[i][0];
    lineT2[i] = lines[i][1];
    lineStrength[i] = 0;
    lineActivationTime[i] = Infinity;
    lineIsFluctuation[i] = 0;
    lineFlickerEnd[i] = 0;
    
    tetraNeighborLines[lines[i][0]].push(i);
    tetraNeighborLines[lines[i][1]].push(i);
  }
  
  systemPhase = 'forming';
  phaseStartTime = globalTime;
  nucleationTriggered = false;
  fluctuationEndTime = 0;
}

function updateFluctuation() {
  // MIDPOINT settings - visible but not frantic
  const flickerChance = 0.0018;  // Between 0.0008 and 0.003
  const flickerDuration = 1200 + Math.random() * 1500; // 1.2-2.7 seconds
  
  for (let i = 0; i < tetraCount; i++) {
    tetraConnectionCount[i] = 0;
  }
  
  for (let i = 0; i < lineCount; i++) {
    if (lineIsFluctuation[i] === 0 && lineStrength[i] < 0.01 && Math.random() < flickerChance) {
      lineIsFluctuation[i] = 1;
      lineFlickerEnd[i] = globalTime + flickerDuration;
    }
    
    if (lineIsFluctuation[i] === 1 && globalTime > lineFlickerEnd[i]) {
      lineIsFluctuation[i] = 0;
    }
    
    if (lineIsFluctuation[i] === 1) {
      lineStrength[i] += (0.85 - lineStrength[i]) * 0.05; // Visible strength, moderate rise
      tetraConnectionCount[lineT1[i]]++;
      tetraConnectionCount[lineT2[i]]++;
    } else if (lineActivationTime[i] === Infinity) {
      lineStrength[i] *= 0.94; // Moderate fade
    }
  }
  
  // Check for critical mass
  if (!nucleationTriggered && globalTime > fluctuationEndTime) {
    for (let i = 0; i < tetraCount; i++) {
      if (tetraConnectionCount[i] >= CRITICAL_CONNECTIONS) {
        nucleationTriggered = true;
        seedIdx = i;
        seedX = tetraX[i];
        seedY = tetraY[i];
        
        // Clear fluctuation flags
        for (let j = 0; j < lineCount; j++) {
          lineIsFluctuation[j] = 0;
        }
        
        systemPhase = 'spreading';
        phaseStartTime = globalTime;
        startEntanglementWave();
        return;
      }
    }
  }
  
  // Tetrahedra glow with connections
  for (let i = 0; i < tetraCount; i++) {
    const targetEnt = tetraConnectionCount[i] > 0 ? tetraConnectionCount[i] * 0.18 : 0;
    tetraEntanglement[i] += (targetEnt - tetraEntanglement[i]) * 0.04;
  }
}

function startEntanglementWave() {
  const waveSpeed = 0.05;
  
  for (let i = 0; i < tetraCount; i++) {
    const dx = tetraX[i] - seedX;
    const dy = tetraY[i] - seedY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    tetraActivationTime[i] = globalTime + dist / waveSpeed;
  }
  
  for (let i = 0; i < lineCount; i++) {
    const t1Time = tetraActivationTime[lineT1[i]];
    const t2Time = tetraActivationTime[lineT2[i]];
    lineActivationTime[i] = Math.max(t1Time, t2Time) + 80;
  }
}

function updatePhase() {
  const elapsed = globalTime - phaseStartTime;
  const phase = phases[systemPhase];

  switch (systemPhase) {
    case 'forming':
      phaseDisplay.textContent = 'FORMING CONDENSATE';
      for (let i = 0; i < tetraCount; i++) {
        if (elapsed > i * 1.8) { // Midpoint stagger
          tetraOpacity[i] += (1 - tetraOpacity[i]) * 0.02; // Midpoint rise
        }
      }
      break;

    case 'pure':
      phaseDisplay.textContent = 'PURE CONDENSATE';
      for (let i = 0; i < tetraCount; i++) {
        tetraOpacity[i] += (1 - tetraOpacity[i]) * 0.02;
      }
      break;

    case 'fluctuating':
      phaseDisplay.textContent = 'QUANTUM FLUCTUATIONS';
      if (fluctuationEndTime === 0) {
        fluctuationEndTime = globalTime + 5000 + Math.random() * 5000; // 5-10 seconds
      }
      updateFluctuation();
      return;

    case 'spreading':
      phaseDisplay.textContent = 'ENTANGLEMENT SPREADING';
      
      // Fade old fluctuation lines
      for (let i = 0; i < lineCount; i++) {
        if (lineActivationTime[i] === Infinity || globalTime < lineActivationTime[i]) {
          lineStrength[i] *= 0.96;
        }
      }
      
      // Wave propagation
      for (let i = 0; i < tetraCount; i++) {
        if (globalTime > tetraActivationTime[i]) {
          tetraEntanglement[i] += (1 - tetraEntanglement[i]) * 0.005;
        }
      }
      for (let i = 0; i < lineCount; i++) {
        if (globalTime > lineActivationTime[i]) {
          lineStrength[i] += (1 - lineStrength[i]) * 0.005;
        }
      }
      break;

    case 'saturated':
      phaseDisplay.textContent = 'SATURATED STATE';
      break;

    case 'dissolving':
      phaseDisplay.textContent = 'DISSOLVING';
      // Gradually fade entanglement and links, but keep the condensate visible
      let maxLine = 0;
      for (let i = 0; i < lineCount; i++) {
        lineStrength[i] *= 0.90; // smooth but noticeable fade
        if (lineStrength[i] > maxLine) maxLine = lineStrength[i];
      }
      // Let entanglement relax, but don't kill the condensate
      for (let i = 0; i < tetraCount; i++) {
        tetraEntanglement[i] *= 0.96;
      }

      // When links are essentially gone, restart fluctuations (no full reset)
      if (maxLine < 0.03 && elapsed > 1500) {
        systemPhase = 'fluctuating';
        phaseStartTime = globalTime;
        nucleationTriggered = false;
        fluctuationEndTime = 0;

        // Clear entanglement-wave bookkeeping, keep geometry + opacity
        for (let i = 0; i < tetraCount; i++) {
          tetraActivationTime[i] = Infinity;
          tetraConnectionCount[i] = 0;
        }
        for (let i = 0; i < lineCount; i++) {
          lineStrength[i] = 0;
          lineActivationTime[i] = Infinity;
          lineIsFluctuation[i] = 0;
          lineFlickerEnd[i] = 0;
        }
      }
      // We handle our own transition, skip generic phase change below
      return;
  }

  // Generic phase transition (for all phases except fluctuating/dissolving)
  if (phase && phase.duration !== Infinity && elapsed > phase.duration) {
    systemPhase = phase.next;
    phaseStartTime = globalTime;
    if (systemPhase === 'forming') {
      initSystem();
    }
  }
}

const triVerts = [
  { x: 0, y: -TETRA_H * 0.6 },
  { x: -TETRA_SIZE / 2, y: TETRA_H * 0.4 },
  { x: TETRA_SIZE / 2, y: TETRA_H * 0.4 }
];

const faceCenters = [
  { x: 0, y: -TETRA_H * 0.25 },
  { x: -TETRA_SIZE * 0.22, y: TETRA_H * 0.15 },
  { x: TETRA_SIZE * 0.22, y: TETRA_H * 0.15 },
  { x: 0, y: TETRA_H * 0.05 }
];

function render() {
  // Solid background
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, width, height);
  
  // Draw lines
  ctx.lineCap = 'round';
  for (let i = 0; i < lineCount; i++) {
    const s = lineStrength[i];
    if (s < 0.02) continue;
    
    const x1 = tetraX[lineT1[i]], y1 = tetraY[lineT1[i]];
    const x2 = tetraX[lineT2[i]], y2 = tetraY[lineT2[i]];
    
    // Check if this is a "true" entanglement line (part of spreading wave)
    const isTrueEntanglement =
      lineActivationTime[i] !== Infinity && globalTime > lineActivationTime[i];
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    
    if (isTrueEntanglement) {
      // Strong, bright gold for true entanglement
      ctx.strokeStyle = `rgba(255, 210, 120, ${s * 0.85})`;
      ctx.lineWidth = 1.5 + s * 2.5;
      ctx.stroke();
      
      // Add glow layer
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(201, 169, 98, ${s * 0.3})`;
      ctx.lineWidth = 4 + s * 4;
      ctx.stroke();
    } else {
      // Subtle for fluctuations
      ctx.strokeStyle = `rgba(201, 169, 98, ${s * 0.55})`;
      ctx.lineWidth = 1 + s * 1.5;
      ctx.stroke();
    }
  }
  
  // Draw tetrahedra
  for (let i = 0; i < tetraCount; i++) {
    const op = tetraOpacity[i];
    if (op < 0.02) continue;
    
    const x = tetraX[i];
    const y = tetraY[i];
    const rot = tetraRotation[i];
    const ent = tetraEntanglement[i];
    
    tetraRotation[i] += 0.0015 + ent * 0.0015;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    
    ctx.beginPath();
    ctx.moveTo(triVerts[0].x, triVerts[0].y);
    ctx.lineTo(triVerts[1].x, triVerts[1].y);
    ctx.lineTo(triVerts[2].x, triVerts[2].y);
    ctx.closePath();
    
    const r = 20 + ent * 54;
    const g = 45 + ent * 79;
    const b = 35 + ent * 54;
    const alpha = op * (0.45 + ent * 0.5);
    
    ctx.fillStyle = `rgba(${r|0}, ${g|0}, ${b|0}, ${alpha})`;
    ctx.fill();
    
    ctx.strokeStyle = `rgba(201, 169, 98, ${op * (0.3 + ent * 0.5)})`;
    ctx.lineWidth = 0.5 + ent * 1.2;
    ctx.stroke();
    
    // Face indicators
    const faceBaseAlpha = op * (0.55 + ent * 0.45);
    const faceSize = 2 + ent * 2;
    
    for (let f = 0; f < 4; f++) {
      const fc = faceCenters[f];
      const brightness = tetraFaceStates[i * 4 + f];
      
      ctx.beginPath();
      ctx.arc(fc.x, fc.y, faceSize + 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201, 169, 98, ${faceBaseAlpha * brightness * 0.35})`;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(fc.x, fc.y, faceSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 230, 180, ${faceBaseAlpha * brightness})`;
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  // Nucleation point during spreading
  if (systemPhase === 'spreading' && seedX !== undefined) {
    const elapsed = globalTime - phaseStartTime;
    const radius = elapsed * 0.05;
    const alpha = Math.max(0, 0.4 - radius * 0.00018);
    
    if (alpha > 0.01) {
      ctx.beginPath();
      ctx.arc(seedX, seedY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(201, 169, 98, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(seedX, seedY, 6 + Math.sin(elapsed * 0.008) * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 220, 150, ${alpha * 0.9})`;
      ctx.fill();
    }
  }
  
  // Highlight tetrahedra near critical mass
  if (systemPhase === 'fluctuating') {
    for (let i = 0; i < tetraCount; i++) {
      const count = tetraConnectionCount[i];
      if (count >= 2) {
        ctx.beginPath();
        ctx.arc(tetraX[i], tetraY[i], 14 + count * 3, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 200, 100, ${0.12 + count * 0.08})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
}

function animate(time) {
  globalTime = time;
  
  if (animationRunning) {
    updatePhase();
    render();
  }
  
  requestAnimationFrame(animate);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
requestAnimationFrame(animate);

document.getElementById('toggleAnim').addEventListener('click', function() {
  animationRunning = !animationRunning;
  this.textContent = animationRunning ? 'Animation: ON' : 'Animation: OFF';
  if (!animationRunning) {
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, width, height);
  }
});

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

document.getElementById('sidebarToggle').addEventListener('click', () => {
  sidebar.classList.add('open');
  overlay.classList.add('active');
});

document.getElementById('closeSidebar').addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
});

overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
});

const toggleBtn = document.getElementById('toggleAnim');
const phaseDisp = document.getElementById('phaseDisplay');
window.addEventListener('scroll', () => {
  const landingHeight = document.getElementById('landing').offsetHeight;
  const hidden = window.scrollY > landingHeight - 100;
  toggleBtn.style.opacity = hidden ? '0' : '1';
  toggleBtn.style.pointerEvents = hidden ? 'none' : 'auto';
  phaseDisp.style.opacity = hidden ? '0' : '0.6';
});
