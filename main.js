<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Entanglement Condensate</title>
    <style>
        /* --- 1. CSS STYLES --- */
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #050508; /* Matches the animation bg */
            overflow-x: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #ffffff;
        }

        /* The Canvas acts as the background */
        #tetra-canvas {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 0;
        }

        /* UI Overlay - sits on top of canvas */
        .ui-layer {
            position: fixed;
            z-index: 10;
            pointer-events: none; /* Let clicks pass through to canvas if needed */
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 20px;
            box-sizing: border-box;
        }

        /* Top Left Phase Display */
        #phaseDisplay {
            font-size: 12px;
            letter-spacing: 1.5px;
            opacity: 0.6;
            color: #C9A962; /* Gold accent */
            text-transform: uppercase;
        }

        /* Bottom Right Toggle Button */
        #toggleAnim {
            pointer-events: auto; /* Enable clicking */
            cursor: pointer;
            font-size: 12px;
            letter-spacing: 1px;
            opacity: 0.6;
            color: #fff;
            align-self: flex-end;
            transition: opacity 0.3s;
        }
        
        #toggleAnim:hover {
            opacity: 1;
        }

        /* Example Content Section to demonstrate scrolling */
        #landing {
            position: relative;
            z-index: 5;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
        }
        
        h1 {
            font-size: 2rem;
            font-weight: 300;
            letter-spacing: 2px;
            color: rgba(255,255,255,0.9);
            text-align: center;
        }

        /* Mobile Optimization */
        @media (max-width: 768px) {
            h1 { font-size: 1.5rem; }
        }
    </style>
</head>
<body>

    <canvas id="tetra-canvas"></canvas>

    <div class="ui-layer">
        <div id="phaseDisplay">INITIALIZING SYSTEM...</div>
        <div id="toggleAnim">Animation: ON</div>
    </div>

    <div id="landing">
        <h1>ENTANGLEMENT<br>CONDENSATE</h1>
    </div>

    <script>
    class EntanglementField {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.phaseDisplay = options.phaseDisplayId ? document.getElementById(options.phaseDisplayId) : null;

        // Performance: Cap pixel ratio to save battery on mobile
        this.maxDpr = 1.5;

        this.ctx = null;
        this.animationRunning = true;
        this.width = 0;
        this.height = 0;
        this.animationFrameId = null;

        // System State
        this.systemPhase = 'forming';
        this.phaseStartTime = 0;
        this.globalTime = 0;
        this.seedX = 0;
        this.seedY = 0;
        this.fluctuationEndTime = 0;
        this.nucleationTriggered = false;

        this.phases = {
            forming: { duration: 3000, next: 'pure' },
            pure: { duration: 2000, next: 'fluctuating' },
            fluctuating: { duration: Infinity, next: 'spreading' },
            spreading: { duration: 18000, next: 'saturated' },
            saturated: { duration: 5000, next: 'dissolving' },
            dissolving: { duration: Infinity, next: 'fluctuating' }
        };

        if (this.canvas) {
            // Make sure the canvas visually fills the viewport
            this.canvas.style.position = 'fixed';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100vw';
            this.canvas.style.height = '100vh';

            // 'alpha: false' tells browser the background is opaque = faster rendering
            this.ctx = this.canvas.getContext('2d', { alpha: false });
            this.bindEvents();
            this.resizeCanvas();
            this.start();
        }
    }

    updateGeometryConstants() {
        const isMobile = this.width < 768;

        this.SPACING = isMobile ? 28 : 38;
        this.TETRA_SIZE = isMobile ? 9 : 12;

        this.SQRT3_2 = Math.sqrt(3) / 2;
        this.TETRA_H = this.TETRA_SIZE * this.SQRT3_2;
        this.CRITICAL_CONNECTIONS = 3;

        this.triVerts = [
            { x: 0, y: -this.TETRA_H * 0.6 },
            { x: -this.TETRA_SIZE / 2, y: this.TETRA_H * 0.4 },
            { x: this.TETRA_SIZE / 2, y: this.TETRA_H * 0.4 }
        ];

        this.faceCenters = [
            { x: 0, y: -this.TETRA_H * 0.25 },
            { x: -this.TETRA_SIZE * 0.22, y: this.TETRA_H * 0.15 },
            { x: this.TETRA_SIZE * 0.22, y: this.TETRA_H * 0.15 },
            { x: 0, y: this.TETRA_H * 0.05 }
        ];
    }

    bindEvents() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.resizeCanvas(), 200);
        });
    }

    resizeCanvas() {
        if (!this.canvas || !this.ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Reset the transform BEFORE changing size & scaling
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;

        this.ctx.scale(dpr, dpr);

        this.updateGeometryConstants();
        this.initSystem();
    }

    initSystem() {
        const cols = Math.ceil(this.width / this.SPACING) + 2;
        const rows = Math.ceil(this.height / (this.SPACING * 0.866)) + 2;

        const totalGridW = (cols - 1) * this.SPACING;
        const totalGridH = (rows - 1) * this.SPACING * 0.866;
        const offsetX = (this.width - totalGridW) / 2;
        const offsetY = (this.height - totalGridH) / 2;

        this.tetraCount = cols * rows;
        if (this.tetraCount > 3000) this.tetraCount = 3000;

        this.tetraX = new Float32Array(this.tetraCount);
        this.tetraY = new Float32Array(this.tetraCount);
        this.tetraRotation = new Float32Array(this.tetraCount);
        this.tetraOpacity = new Float32Array(this.tetraCount);
        this.tetraEntanglement = new Float32Array(this.tetraCount);
        this.tetraActivationTime = new Float32Array(this.tetraCount);
        this.tetraConnectionCount = new Uint8Array(this.tetraCount);
        this.tetraFaceStates = new Float32Array(this.tetraCount * 4);

        let idx = 0;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (idx >= this.tetraCount) break;
                this.tetraX[idx] = offsetX + j * this.SPACING + (i % 2) * (this.SPACING / 2);
                this.tetraY[idx] = offsetY + i * this.SPACING * 0.866;
                this.tetraRotation[idx] = Math.random() * Math.PI * 2;
                this.tetraOpacity[idx] = 0;
                this.tetraEntanglement[idx] = 0;
                this.tetraActivationTime[idx] = Infinity;
                this.tetraConnectionCount[idx] = 0;
                for (let f = 0; f < 4; f++) {
                    this.tetraFaceStates[idx * 4 + f] = 0.3 + Math.random() * 0.7;
                }
                idx++;
            }
        }

        const lines = [];
        const distLimit = this.SPACING * 1.2;

        for (let i = 0; i < this.tetraCount; i++) {
            for (let j = i + 1; j < this.tetraCount; j++) {
                const dx = this.tetraX[i] - this.tetraX[j];
                const dy = this.tetraY[i] - this.tetraY[j];
                if (Math.abs(dx) > distLimit || Math.abs(dy) > distLimit) continue;
                if ((dx * dx + dy * dy) < (distLimit * distLimit)) {
                    lines.push([i, j]);
                }
            }
        }

        this.lineCount = lines.length;
        this.lineT1 = new Uint16Array(this.lineCount);
        this.lineT2 = new Uint16Array(this.lineCount);
        this.lineStrength = new Float32Array(this.lineCount);
        this.lineActivationTime = new Float32Array(this.lineCount);
        this.lineIsFluctuation = new Uint8Array(this.lineCount);
        this.lineFlickerEnd = new Float32Array(this.lineCount);

        for (let i = 0; i < this.lineCount; i++) {
            this.lineT1[i] = lines[i][0];
            this.lineT2[i] = lines[i][1];
            this.lineStrength[i] = 0;
            this.lineActivationTime[i] = Infinity;
            this.lineIsFluctuation[i] = 0;
            this.lineFlickerEnd[i] = 0;
        }

        this.systemPhase = 'forming';
        this.phaseStartTime = this.globalTime;
        this.nucleationTriggered = false;
        this.fluctuationEndTime = 0;
    }

    updateFluctuation() {
        const flickerChance = 0.0018;
        const flickerDuration = 1200 + Math.random() * 1500;
        this.tetraConnectionCount.fill(0);

        for (let i = 0; i < this.lineCount; i++) {
            if (this.lineIsFluctuation[i] === 0 &&
                this.lineStrength[i] < 0.01 &&
                Math.random() < flickerChance) {
                this.lineIsFluctuation[i] = 1;
                this.lineFlickerEnd[i] = this.globalTime + flickerDuration;
            }

            if (this.lineIsFluctuation[i] === 1 && this.globalTime > this.lineFlickerEnd[i]) {
                this.lineIsFluctuation[i] = 0;
            }

            if (this.lineIsFluctuation[i] === 1) {
                this.lineStrength[i] += (0.85 - this.lineStrength[i]) * 0.05;
                this.tetraConnectionCount[this.lineT1[i]]++;
                this.tetraConnectionCount[this.lineT2[i]]++;
            } else if (this.lineActivationTime[i] === Infinity) {
                this.lineStrength[i] *= 0.94;
            }
        }

        if (!this.nucleationTriggered && this.globalTime > this.fluctuationEndTime) {
            for (let i = 0; i < this.tetraCount; i++) {
                if (this.tetraConnectionCount[i] >= this.CRITICAL_CONNECTIONS) {
                    this.nucleationTriggered = true;
                    this.seedIdx = i;
                    this.seedX = this.tetraX[i];
                    this.seedY = this.tetraY[i];
                    this.lineIsFluctuation.fill(0);
                    this.systemPhase = 'spreading';
                    this.phaseStartTime = this.globalTime;
                    this.startEntanglementWave();
                    return;
                }
            }
        }

        for (let i = 0; i < this.tetraCount; i++) {
            const targetEnt = this.tetraConnectionCount[i] > 0
                ? this.tetraConnectionCount[i] * 0.18
                : 0;
            this.tetraEntanglement[i] += (targetEnt - this.tetraEntanglement[i]) * 0.04;
        }
    }

    startEntanglementWave() {
        const waveSpeed = 0.05;
        for (let i = 0; i < this.tetraCount; i++) {
            const dx = this.tetraX[i] - this.seedX;
            const dy = this.tetraY[i] - this.seedY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.tetraActivationTime[i] = this.globalTime + dist / waveSpeed;
        }
        for (let i = 0; i < this.lineCount; i++) {
            const t1Time = this.tetraActivationTime[this.lineT1[i]];
            const t2Time = this.tetraActivationTime[this.lineT2[i]];
            this.lineActivationTime[i] = Math.max(t1Time, t2Time) + 80;
        }
    }

    updatePhase() {
        const elapsed = this.globalTime - this.phaseStartTime;
        const phase = this.phases[this.systemPhase];

        if (this.phaseDisplay) {
            let text = '';
            switch (this.systemPhase) {
                case 'forming': text = 'FORMING CONDENSATE'; break;
                case 'pure': text = 'PURE CONDENSATE'; break;
                case 'fluctuating': text = 'QUANTUM FLUCTUATIONS'; break;
                case 'spreading': text = 'ENTANGLEMENT SPREADING'; break;
                case 'saturated': text = 'SATURATED STATE'; break;
                case 'dissolving': text = 'DISSOLVING'; break;
            }
            if (this.phaseDisplay.textContent !== text) {
                this.phaseDisplay.textContent = text;
            }
        }

        switch (this.systemPhase) {
            case 'forming':
            case 'pure':
                for (let i = 0; i < this.tetraCount; i++) {
                    const target = (this.systemPhase === 'forming' && elapsed < i * 1.8) ? 0 : 1;
                    this.tetraOpacity[i] += (target - this.tetraOpacity[i]) * 0.02;
                }
                break;

            case 'fluctuating':
                if (this.fluctuationEndTime === 0) {
                    this.fluctuationEndTime = this.globalTime + 5000 + Math.random() * 5000;
                }
                this.updateFluctuation();
                return;

            case 'spreading':
                for (let i = 0; i < this.lineCount; i++) {
                    if (this.lineActivationTime[i] === Infinity ||
                        this.globalTime < this.lineActivationTime[i]) {
                        this.lineStrength[i] *= 0.96;
                    }
                }
                for (let i = 0; i < this.tetraCount; i++) {
                    if (this.globalTime > this.tetraActivationTime[i]) {
                        this.tetraEntanglement[i] += (1 - this.tetraEntanglement[i]) * 0.005;
                    }
                }
                for (let i = 0; i < this.lineCount; i++) {
                    if (this.globalTime > this.lineActivationTime[i]) {
                        this.lineStrength[i] += (1 - this.lineStrength[i]) * 0.005;
                    }
                }
                break;

            case 'dissolving':
                let maxLine = 0;
                for (let i = 0; i < this.lineCount; i++) {
                    this.lineStrength[i] *= 0.90;
                    if (this.lineStrength[i] > maxLine) maxLine = this.lineStrength[i];
                }
                for (let i = 0; i < this.tetraCount; i++) {
                    this.tetraEntanglement[i] *= 0.96;
                }

                if (maxLine < 0.03 && elapsed > 1500) {
                    this.systemPhase = 'fluctuating';
                    this.phaseStartTime = this.globalTime;
                    this.nucleationTriggered = false;
                    this.fluctuationEndTime = 0;
                    this.tetraActivationTime.fill(Infinity);
                    this.tetraConnectionCount.fill(0);
                    this.lineStrength.fill(0);
                    this.lineActivationTime.fill(Infinity);
                    this.lineIsFluctuation.fill(0);
                    this.lineFlickerEnd.fill(0);
                }
                return;
        }

        if (phase && phase.duration !== Infinity && elapsed > phase.duration) {
            this.systemPhase = phase.next;
            this.phaseStartTime = this.globalTime;
            if (this.systemPhase === 'forming') {
                this.initSystem();
            }
        }
    }

    render() {
        if (!this.ctx) return;
        this.ctx.fillStyle = '#050508';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.lineCap = 'round';

        // Lines
        for (let i = 0; i < this.lineCount; i++) {
            const s = this.lineStrength[i];
            if (s < 0.02) continue;

            const x1 = this.tetraX[this.lineT1[i]], y1 = this.tetraY[this.lineT1[i]];
            const x2 = this.tetraX[this.lineT2[i]], y2 = this.tetraY[this.lineT2[i]];
            const isTrue = this.lineActivationTime[i] !== Infinity &&
                           this.globalTime > this.lineActivationTime[i];

            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);

            if (isTrue) {
                this.ctx.strokeStyle = `rgba(255, 210, 120, ${s * 0.85})`;
                this.ctx.lineWidth = 1.5 + s * 2.5;
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.ctx.strokeStyle = `rgba(201, 169, 98, ${s * 0.3})`;
                this.ctx.lineWidth = 4 + s * 4;
                this.ctx.stroke();
            } else {
                this.ctx.strokeStyle = `rgba(201, 169, 98, ${s * 0.55})`;
                this.ctx.lineWidth = 1 + s * 1.5;
                this.ctx.stroke();
            }
        }

        // Tetrahedra
        for (let i = 0; i < this.tetraCount; i++) {
            const op = this.tetraOpacity[i];
            if (op < 0.02) continue;

            const x = this.tetraX[i], y = this.tetraY[i], ent = this.tetraEntanglement[i];
            this.tetraRotation[i] += 0.0015 + ent * 0.0015;

            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(this.tetraRotation[i]);

            this.ctx.beginPath();
            this.ctx.moveTo(this.triVerts[0].x, this.triVerts[0].y);
            this.ctx.lineTo(this.triVerts[1].x, this.triVerts[1].y);
            this.ctx.lineTo(this.triVerts[2].x, this.triVerts[2].y);
            this.ctx.closePath();

            const r = 20 + ent * 54;
            const g = 45 + ent * 79;
            const b = 35 + ent * 54;
            this.ctx.fillStyle = `rgba(${r|0}, ${g|0}, ${b|0}, ${op * (0.45 + ent * 0.5)})`;
            this.ctx.fill();

            this.ctx.strokeStyle = `rgba(201, 169, 98, ${op * (0.3 + ent * 0.5)})`;
            this.ctx.lineWidth = 0.5 + ent * 1.2;
            this.ctx.stroke();

            const faceBaseAlpha = op * (0.55 + ent * 0.45);
            const faceSize = 2 + ent * 2;
            for (let f = 0; f < 4; f++) {
                const fc = this.faceCenters[f];
                this.ctx.beginPath();
                this.ctx.arc(fc.x, fc.y, faceSize * 0.7, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 230, 180, ${faceBaseAlpha * this.tetraFaceStates[i * 4 + f]})`;
                this.ctx.fill();
            }

            this.ctx.restore();
        }

        // Expanding wave
        if (this.systemPhase === 'spreading' && this.seedX !== undefined) {
            const elapsed = this.globalTime - this.phaseStartTime;
            const radius = elapsed * 0.05;
            const alpha = Math.max(0, 0.4 - radius * 0.00018);
            if (alpha > 0.01) {
                this.ctx.beginPath();
                this.ctx.arc(this.seedX, this.seedY, radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(201, 169, 98, ${alpha})`;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        }
    }

    toggle() {
        this.animationRunning = !this.animationRunning;
        if (!this.animationRunning && this.ctx) {
            this.ctx.fillStyle = '#050508';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
        return this.animationRunning;
    }

    animate(time) {
        this.globalTime = time;
        if (this.animationRunning) {
            this.updatePhase();
            this.render();
        }
        this.animationFrameId = requestAnimationFrame((t) => this.animate(t));
    }

    start() {
        if (!this.animationFrameId) {
            this.animate(performance.now());
        }
    }
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    const field = new EntanglementField('tetra-canvas', {
        phaseDisplayId: 'phaseDisplay'
    });

    const toggleBtn = document.getElementById('toggleAnim');
    if (toggleBtn) {
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.addEventListener('click', () => {
            const isRunning = field.toggle();
            toggleBtn.textContent = isRunning ? 'Animation: ON' : 'Animation: OFF';
        });
    }
});
</script>

</body>
</html>
