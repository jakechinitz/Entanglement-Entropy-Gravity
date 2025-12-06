// Animation + UI logic
(function () {
  const canvas = document.getElementById('tetra-canvas');
  const phaseDisplay = document.getElementById('phaseDisplay');
  const toggleBtn = document.getElementById('toggleAnim');

  let ctx = null;
  let animationRunning = true;
  let width = 0;
  let height = 0;

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
    forming: { duration: 4000, next: 'pure' },
    pure: { duration: 2500, next: 'fluctuating' },
    fluctuating: { duration: Infinity, next: 'spreading' },
    spreading: { duration: 18000, next: 'saturated' },
    saturated: { duration: 10000, next: 'dissolving' },
    // dissolving will control its own transition based on link fadeout
    dissolving: { duration: Infinity, next: 'fluctuating' }
  };

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

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initSystem();
  }

  function initSystem() {
    // Extra padding to fill the screen completely
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
    // Slightly brighter, but still distinct from true entanglement
    const flickerChance = 0.0018;
    const flickerDuration = 1200 + Math.random() * 1500; // 1.2–2.7 s

    for (let i = 0; i < tetraCount; i++) {
      tetraConnectionCount[i] = 0;
    }

    for (let i = 0; i < lineCount; i++) {
      // Start new flickers
      if (
        lineIsFluctuation[i] === 0 &&
        lineStrength[i] < 0.01 &&
        Math.random() < flickerChance
      ) {
        lineIsFluctuation[i] = 1;
        lineFlickerEnd[i] = globalTime + flickerDuration;
      }

      // End flickers
      if (lineIsFluctuation[i] === 1 && globalTime > lineFlickerEnd[i]) {
        lineIsFluctuation[i] = 0;
      }

      if (lineIsFluctuation[i] === 1) {
        // Visible strength, moderate rise
        lineStrength[i] += (0.85 - lineStrength[i]) * 0.05;
        tetraConnectionCount[lineT1[i]]++;
        tetraConnectionCount[lineT2[i]]++;
      } else if (lineActivationTime[i] === Infinity) {
        // Only fade if not part of spreading wave
        lineStrength[i] *= 0.94;
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

          // Clear fluctuation flags (spreading will take over)
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

    // IMPORTANT: reset all line strengths before entanglement wave starts
    // so they don't inherit bright fluctuation state and flash.
    for (let i = 0; i < lineCount; i++) {
      lineStrength[i] = 0;
      lineIsFluctuation[i] = 0;
      lineFlickerEnd[i] = 0;
    }

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
        if (phaseDisplay) phaseDisplay.textContent = 'FORMING CONDENSATE';
        for (let i = 0; i < tetraCount; i++) {
          if (elapsed > i * 1.8) {
            tetraOpacity[i] += (1 - tetraOpacity[i]) * 0.02;
          }
        }
        break;

      case 'pure':
        if (phaseDisplay) phaseDisplay.textContent = 'PURE CONDENSATE';
        for (let i = 0; i < tetraCount; i++) {
          tetraOpacity[i] += (1 - tetraOpacity[i]) * 0.02;
        }
        break;

      case 'fluctuating':
        if (phaseDisplay) phaseDisplay.textContent = 'QUANTUM FLUCTUATIONS';
        if (fluctuationEndTime === 0) {
          fluctuationEndTime = globalTime + 5000 + Math.random() * 5000; // 5–10 s
        }
        updateFluctuation();
        // Fluctuating phase controls its own transition via nucleation
        return;

      case 'spreading':
        if (phaseDisplay) phaseDisplay.textContent = 'ENTANGLEMENT SPREADING';

        // Fade out any remaining fluctuation-only lines
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
        if (phaseDisplay) phaseDisplay.textContent = 'SATURATED STATE';
        // Let everything sit at near-maximum
        break;

      case 'dissolving':
        if (phaseDisplay) phaseDisplay.textContent = 'DISSOLVING';
        // Fade all entanglement links together; keep the condensate visible
        let maxLine = 0;
        for (let i = 0; i < lineCount; i++) {
          // Strong uniform decay
          lineStrength[i] *= 0.90;
          if (lineStrength[i] > maxLine) maxLine = lineStrength[i];
        }

        // Let entanglement relax slightly but not vanish
        for (let i = 0; i < tetraCount; i++) {
          tetraEntanglement[i] *= 0.98;
        }

        // When links are essentially gone, restart quantum fluctuations (no full reset)
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
        // We handle transition ourselves; skip generic phase change below
        return;
    }

    // Generic phase transition for all but fluctuating/dissolving
    if (phase && phase.duration !== Infinity && elapsed > phase.duration) {
      systemPhase = phase.next;
      phaseStartTime = globalTime;
      if (systemPhase === 'forming') {
        // Only used on very first pass; we never go back here from dissolving
        initSystem();
      }
    }
  }

  function render() {
    if (!ctx) return;

    // Solid background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, width, height);

    // Draw lines
    ctx.lineCap = 'round';
    for (let i = 0; i < lineCount; i++) {
      const s = lineStrength[i];
      if (s < 0.02) continue;

      const x1 = tetraX[lineT1[i]];
      const y1 = tetraY[lineT1[i]];
      const x2 = tetraX[lineT2[i]];
      const y2 = tetraY[lineT2[i]];

      const isEntangled =
        lineActivationTime[i] !== Infinity && lineIsFluctuation[i] === 0;

      // True entanglement links: brighter, thicker, more "solid"
      let alpha, widthScale, color;
      if (isEntangled) {
        alpha = 0.3 + s * 0.9;
        widthScale = 1.6 + s * 2.6;
        color = `rgba(246, 218, 160, ${alpha})`;
      } else {
        // Fluctuation links: a bit brighter than before, but still softer
        alpha = 0.16 + s * 0.5;
        widthScale = 1.0 + s * 1.3;
        color = `rgba(201, 169, 98, ${alpha})`;
      }

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = widthScale;
      ctx.stroke();
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
      const alpha = op * (0.4 + ent * 0.5);

      ctx.fillStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${alpha})`;
      ctx.fill();

      ctx.strokeStyle = `rgba(201, 169, 98, ${op * (0.25 + ent * 0.5)})`;
      ctx.lineWidth = 0.5 + ent * 1.2;
      ctx.stroke();

      // Face indicators
      const faceBaseAlpha = op * (0.5 + ent * 0.5);
      const faceSize = 2 + ent * 2;
      for (let f = 0; f < 4; f++) {
        const fc = faceCenters[f];
        const brightness = tetraFaceStates[i * 4 + f];

        ctx.beginPath();
        ctx.arc(fc.x, fc.y, faceSize + 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 169, 98, ${faceBaseAlpha * brightness * 0.3})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(fc.x, fc.y, faceSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 230, 190, ${faceBaseAlpha * brightness})`;
        ctx.fill();
      }

      ctx.restore();
    }

    // Nucleation highlight during spreading
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
        ctx.arc(
          seedX,
          seedY,
          6 + Math.sin(elapsed * 0.008) * 2,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 220, 150, ${alpha})`;
        ctx.fill();
      }
    }

    // Subtle highlight for near-critical tetrahedra in fluctuation phase
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

  // Init animation only if canvas exists
  if (canvas && canvas.getContext) {
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    requestAnimationFrame(animate);

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        animationRunning = !animationRunning;
        this.textContent = animationRunning ? 'Animation: ON' : 'Animation: OFF';
        if (!animationRunning && ctx) {
          ctx.fillStyle = '#050508';
          ctx.fillRect(0, 0, width, height);
        }
      });
    }
  }

  // Sidebar behavior (works on all pages)
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

  // Scroll fade for controls on landing section
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      const landing = document.getElementById('landing');
      if (!landing || !toggleBtn || !phaseDisplay) return;

      const landingHeight = landing.offsetHeight;
      const hidden = window.scrollY > landingHeight - 100;

      toggleBtn.style.opacity = hidden ? '0' : '1';
      toggleBtn.style.pointerEvents = hidden ? 'none' : 'auto';
      phaseDisplay.style.opacity = hidden ? '0' : '0.6';
    });
  }
})();
