// Animation + UI logic

(function() {
  const canvas = document.getElementById('tetra-canvas');
  const phaseDisplay = document.getElementById('phaseDisplay');
  const toggleBtn = document.getElementById('toggleAnim');

  let ctx;
  let animationRunning = true;
  let width = 0, height = 0;

  const SPACING = 38;
  const TETRA_SIZE = 12;
  const SQRT3_2 = Math.sqrt(3) / 2;
  const TETRA_H = TETRA_SIZE * SQRT3_2;
  const CRITICAL_CONNECTIONS = 3;

  let tetraCount = 0;
  let tetraX, tetraY, tetraRotation, tetraOpacity, tetraEntanglement;
  let tetraActivationTime, tetraConnectionCount;
  let tetraFaceStates;

  let lineCount = 0;
  let lineT1, lineT2, lineStrength, lineActivationTime;
  let lineIsFluctuation;
  let lineFlickerEnd;

  let tetraNeighborLines;

  let systemPhase = 'forming';
  let phaseStartTime = 0;
  let globalTime = 0;
  let seedX, seedY, seedIdx;
  let fluctuationEndTime = 0;
  let nucleationTriggered = false;

  const phases = {
    forming:     { duration: 3000,  next: 'pure' },
    pure:        { duration: 2000,  next: 'fluctuating' },
    fluctuating: { duration: Infinity, next: 'spreading' },
    spreading:   { duration: 18000, next: 'saturated' },
    saturated:   { duration: 5000,  next: 'dissolving' },
    dissolving:  { duration: 3000,  next: 'forming' }
  };

  function setPhaseLabel() {
    if (!phaseDisplay) return;
    const labels = {
      forming: 'CONDENSATE FORMING',
      pure: 'PURE CONDENSATE',
      fluctuating: 'QUANTUM FLUCTUATIONS',
      spreading: 'ENTANGLEMENT SPREADING',
      saturated: 'SATURATED NETWORK',
      dissolving: 'CONDENSATE DISSOLVING'
    };
    phaseDisplay.textContent = labels[systemPhase] || systemPhase.toUpperCase();
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    width  = canvas.width  = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initSystem();
  }

  function initSystem() {
    if (!canvas || !ctx) return;

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
        tetraActivationTime[idx] = 0;
        tetraConnectionCount[idx] = 0;

        for (let f = 0; f < 4; f++) {
          tetraFaceStates[idx * 4 + f] = Math.random();
        }

        idx++;
      }
    }

    const maxLines = tetraCount * 6;
    lineT1 = new Uint32Array(maxLines);
    lineT2 = new Uint32Array(maxLines);
    lineStrength = new Float32Array(maxLines);
    lineActivationTime = new Float32Array(maxLines);
    lineIsFluctuation = new Uint8Array(maxLines);
    lineFlickerEnd = new Float32Array(maxLines);
    lineCount = 0;

    for (let i = 0; i < tetraCount; i++) {
      tetraNeighborLines[i] = [];
    }

    systemPhase = 'forming';
    phaseStartTime = performance.now();
    nucleationTriggered = false;
    setPhaseLabel();
  }

  function addConnection(t1, t2, strength, isFluctuation) {
    if (lineCount >= lineT1.length) return;
    const idx = lineCount++;
    lineT1[idx] = t1;
    lineT2[idx] = t2;
    lineStrength[idx] = strength;
    lineActivationTime[idx] = globalTime;
    lineIsFluctuation[idx] = isFluctuation ? 1 : 0;
    lineFlickerEnd[idx] = isFluctuation ? globalTime + 400 + Math.random() * 400 : 0;

    tetraNeighborLines[t1].push(idx);
    tetraNeighborLines[t2].push(idx);

    tetraConnectionCount[t1] = Math.min(255, tetraConnectionCount[t1] + 1);
    tetraConnectionCount[t2] = Math.min(255, tetraConnectionCount[t2] + 1);
  }

  function updatePhase() {
    const elapsed = globalTime - phaseStartTime;
    const info = phases[systemPhase];

    if (info && info.duration !== Infinity && elapsed > info.duration) {
      systemPhase = info.next;
      phaseStartTime = globalTime;
      if (systemPhase === 'forming') {
        initSystem();
      }
      setPhaseLabel();
    }

    if (systemPhase === 'fluctuating' && !nucleationTriggered) {
      nucleationTriggered = true;
      fluctuationEndTime = globalTime + 3500;
      const attempts = 40;
      let bestIdx = 0;
      let maxCount = -1;
      for (let i = 0; i < attempts; i++) {
        const idx = (Math.random() * tetraCount) | 0;
        if (tetraConnectionCount[idx] > maxCount) {
          maxCount = tetraConnectionCount[idx];
          bestIdx = idx;
        }
      }
      seedIdx = bestIdx;
      seedX = tetraX[seedIdx];
      seedY = tetraY[seedIdx];
    }

    if (systemPhase === 'fluctuating' && globalTime > fluctuationEndTime) {
      systemPhase = 'spreading';
      phaseStartTime = globalTime;
      setPhaseLabel();
    }
  }

  function updateSystem() {
    if (!canvas || !ctx) return;

    const dt = 16;

    for (let i = 0; i < tetraCount; i++) {
      const conn = tetraConnectionCount[i];
      const target = Math.min(1, conn / CRITICAL_CONNECTIONS);
      tetraOpacity[i] += (target - tetraOpacity[i]) * 0.02;
      tetraEntanglement[i] += (target - tetraEntanglement[i]) * 0.02;
    }

    if (systemPhase === 'pure') {
      for (let i = 0; i < tetraCount; i++) {
        if (Math.random() < 0.0015) {
          const neighbors = tetraNeighborLines[i];
          if (neighbors.length < 4) {
            const j = (Math.random() * tetraCount) | 0;
            addConnection(i, j, 0.3 + Math.random() * 0.3, false);
          }
        }
      }
    }

    if (systemPhase === 'fluctuating') {
      if (Math.random() < 0.015) {
        const t1 = (Math.random() * tetraCount) | 0;
        const t2 = (Math.random() * tetraCount) | 0;
        addConnection(t1, t2, 0.35 + Math.random() * 0.4, true);
      }
    }

    if (systemPhase === 'spreading') {
      const elapsed = globalTime - phaseStartTime;
      const radius = elapsed * 0.07;
      const r2 = radius * radius;

      for (let i = 0; i < tetraCount; i++) {
        const dx = tetraX[i] - seedX;
        const dy = tetraY[i] - seedY;
        if (dx * dx + dy * dy < r2) {
          tetraEntanglement[i] = Math.min(1, tetraEntanglement[i] + 0.03);
          tetraOpacity[i] = Math.max(tetraOpacity[i], tetraEntanglement[i] * 0.9);
          if (Math.random() < 0.02 && tetraNeighborLines[i].length < 5) {
            const j = (Math.random() * tetraCount) | 0;
            addConnection(i, j, 0.4 + Math.random() * 0.3, false);
          }
        }
      }
    }

    if (systemPhase === 'dissolving') {
      for (let i = 0; i < tetraCount; i++) {
        tetraOpacity[i] *= 0.96;
        tetraEntanglement[i] *= 0.96;
      }
    }
  }

  function drawTetra(x, y, rotation, opacity, entanglement, faceStates) {
    const baseColor = [45, 74, 62];

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const e = entanglement;
    const glow = 0.15 + e * 0.45;

    ctx.beginPath();
    ctx.moveTo(0, -TETRA_H);
    ctx.lineTo(-TETRA_SIZE / 2, 0);
    ctx.lineTo(TETRA_SIZE / 2, 0);
    ctx.closePath();

    ctx.fillStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${0.45 + opacity * 0.4})`;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -TETRA_H);
    ctx.lineTo(TETRA_SIZE / 2, 0);
    ctx.lineTo(0, TETRA_H * 0.6);
    ctx.closePath();
    ctx.fillStyle = `rgba(${baseColor[0] + 20}, ${baseColor[1] + 20}, ${baseColor[2] + 10}, ${0.35 + opacity * 0.4})`;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -TETRA_H);
    ctx.lineTo(-TETRA_SIZE / 2, 0);
    ctx.lineTo(0, TETRA_H * 0.6);
    ctx.closePath();
    ctx.fillStyle = `rgba(${baseColor[0] - 10}, ${baseColor[1] - 5}, ${baseColor[2]}, ${0.32 + opacity * 0.4})`;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-TETRA_SIZE / 2, 0);
    ctx.lineTo(TETRA_SIZE / 2, 0);
    ctx.lineTo(0, TETRA_H * 0.6);
    ctx.closePath();
    ctx.fillStyle = `rgba(${baseColor[0]}, ${baseColor[1]} , ${baseColor[2] + 10}, ${0.28 + opacity * 0.35})`;
    ctx.fill();

    if (e > 0.1) {
      const gAlpha = glow * 0.7;
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, TETRA_SIZE * 1.9);
      gradient.addColorStop(0, `rgba(255, 220, 160, ${gAlpha})`);
      gradient.addColorStop(1, `rgba(0,0,0,0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, TETRA_SIZE * 1.9, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function render() {
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, width, height);

    updateSystem();

    ctx.lineWidth = 1.0;
    for (let i = 0; i < lineCount; i++) {
      const t1 = lineT1[i];
      const t2 = lineT2[i];
      const x1 = tetraX[t1];
      const y1 = tetraY[t1];
      const x2 = tetraX[t2];
      const y2 = tetraY[t2];
      const s = lineStrength[i];

      let alpha = 0.15 + s * 0.6;
      if (lineIsFluctuation[i]) {
        const remaining = Math.max(0, lineFlickerEnd[i] - globalTime);
        alpha *= Math.min(1, remaining / 400);
      }

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(201, 169, 98, ${alpha})`;
      ctx.stroke();
    }

    for (let i = 0; i < tetraCount; i++) {
      if (tetraOpacity[i] <= 0.02) continue;
      drawTetra(
        tetraX[i],
        tetraY[i],
        tetraRotation[i],
        tetraOpacity[i],
        tetraEntanglement[i],
        null
      );
    }

    if (systemPhase === 'spreading' && seedX !== undefined) {
      const elapsed = globalTime - phaseStartTime;
      const radius = elapsed * 0.05;
      const alpha = Math.max(0, 0.35 - radius * 0.00015);

      if (alpha > 0.01) {
        ctx.beginPath();
        ctx.arc(seedX, seedY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(201, 169, 98, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(seedX, seedY, 6 + Math.sin(elapsed * 0.008) * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 220, 150, ${alpha})`;
        ctx.fill();
      }
    }

    if (systemPhase === 'fluctuating') {
      for (let i = 0; i < tetraCount; i++) {
        const count = tetraConnectionCount[i];
        if (count >= 2) {
          ctx.beginPath();
          ctx.arc(tetraX[i], tetraY[i], 12 + count * 2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 200, 100, ${0.08 + count * 0.06})`;
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

  // Initialize animation only if canvas exists (home page)
  if (canvas) {
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    requestAnimationFrame(animate);
  }

  // Toggle animation button
  if (toggleBtn && canvas && ctx) {
    toggleBtn.addEventListener('click', function() {
      animationRunning = !animationRunning;
      this.textContent = animationRunning ? 'Animation: ON' : 'Animation: OFF';
      if (!animationRunning) {
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, width, height);
      }
    });
  }

  // Scroll fade for controls
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      const landing = document.getElementById('landing');
      if (!landing) return;

      const landingHeight = landing.offsetHeight;
      const hidden = window.scrollY > landingHeight - 100;

      if (toggleBtn) {
        toggleBtn.style.opacity = hidden ? '0' : '1';
        toggleBtn.style.pointerEvents = hidden ? 'none' : 'auto';
      }
      if (phaseDisplay) {
        phaseDisplay.style.opacity = hidden ? '0' : '0.6';
      }
    });
  }

  // Sidebar behavior
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const closeSidebarBtn = document.getElementById('closeSidebar');

  if (sidebar && overlay && sidebarToggle && closeSidebarBtn) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('active');
    });

    closeSidebarBtn.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
})();
