/**
 * Generates a complete, single-file standalone index.html
 * containing pure Vanilla JavaScript, CSS, and HTML with no external dependencies
 * so the user can download and open it directly anywhere in any browser.
 */

export function generateStandaloneHTML(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nu Audio Visualizer - Standalone Edition</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #060810;
      --card-bg: rgba(15, 23, 42, 0.85);
      --border: rgba(255, 255, 255, 0.1);
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --primary: #06b6d4;
    }
    body.light-theme {
      --bg: #f8fafc;
      --card-bg: rgba(255, 255, 255, 0.88);
      --border: rgba(0, 0, 0, 0.1);
      --text: #0f172a;
      --text-muted: #64748b;
      --primary: #0284c7;
    }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100vh;
      user-select: none;
      transition: background 0.3s ease, color 0.3s ease;
    }
    #canvas-container {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
    /* Controls Bar */
    #controls {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 40px);
      max-width: 900px;
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 14px 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
      z-index: 10;
    }
    .timeline-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
    }
    .timeline-row input[type="range"] {
      flex: 1;
    }
    .btn-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
    }
    .btn-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    button, label.btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    body.light-theme button, body.light-theme label.btn {
      background: rgba(0, 0, 0, 0.05);
    }
    button:hover, label.btn:hover {
      background: rgba(255, 255, 255, 0.18);
    }
    body.light-theme button:hover, body.light-theme label.btn:hover {
      background: rgba(0, 0, 0, 0.1);
    }
    button.primary {
      background: var(--primary);
      color: #020617;
      border-color: var(--primary);
      font-weight: 600;
    }
    button.primary:hover {
      opacity: 0.9;
    }
    button.danger {
      background: #ef4444;
      border-color: #f87171;
      color: white;
    }
    /* Range input styling */
    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
      height: 6px;
      outline: none;
    }
    body.light-theme input[type="range"] {
      background: rgba(0, 0, 0, 0.15);
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--primary);
      cursor: pointer;
    }
    /* Settings panel */
    #settings-panel {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 340px;
      max-height: 85vh;
      overflow-y: auto;
      background: var(--card-bg);
      backdrop-filter: blur(18px);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px;
      display: none;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      z-index: 20;
    }
    .setting-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 13px;
    }
    .setting-label {
      display: flex;
      justify-content: space-between;
      color: var(--text-muted);
    }
    input[type="file"] { display: none; }
    /* Top Bar */
    header {
      position: absolute;
      top: 16px;
      left: 20px;
      right: 20px;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: none;
    }
    header > * { pointer-events: auto; }
    .logo {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge {
      font-size: 11px;
      background: rgba(6, 182, 212, 0.15);
      color: var(--primary);
      padding: 2px 8px;
      border-radius: 9999px;
      border: 1px solid rgba(6, 182, 212, 0.3);
    }
    #rec-status {
      display: none;
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(239, 68, 68, 0.95);
      color: white;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      align-items: center;
      gap: 8px;
      z-index: 20;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .preset-grid {
      display: grid;
      grid-cols: 2;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .preset-btn {
      padding: 6px 8px;
      border-radius: 8px;
      font-size: 11px;
      text-align: left;
    }
  </style>
</head>
<body>

  <header>
    <div style="display:flex; align-items:center; gap:10px;">
      <div class="logo">
        <span style="color:#06b6d4;">✦</span> Nu
      </div>
      <span class="badge">Standalone</span>
    </div>

    <div style="display:flex; align-items:center; gap:8px;">
      <button id="btn-theme" title="Ganti Mode Gelap / Terang">🌓 Tema</button>
    </div>
  </header>

  <div id="rec-status">
    ● Perekaman Video: <span id="rec-timer">00:00</span>
  </div>

  <div id="canvas-container">
    <canvas id="visualizerCanvas"></canvas>
  </div>

  <!-- Settings Panel -->
  <div id="settings-panel">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h3 style="font-size:16px; font-weight:600;">Kustomisasi Visualizer</h3>
      <button id="close-settings" style="padding:4px 8px;">✕</button>
    </div>

    <!-- Presets Section -->
    <div class="setting-item">
      <div class="setting-label"><span>Pilih Preset Nu</span></div>
      <div class="preset-grid">
        <button class="preset-btn" onclick="applyPreset('cyberpunk')">⚡ Cyberpunk</button>
        <button class="preset-btn" onclick="applyPreset('solar')">🔥 Solar EDM</button>
        <button class="preset-btn" onclick="applyPreset('matrix')">🌿 Emerald Matrix</button>
        <button class="preset-btn" onclick="applyPreset('vaporwave')">🌅 Vaporwave</button>
        <button class="preset-btn" onclick="applyPreset('minimal')">✨ Deep Minimal</button>
        <button class="preset-btn" onclick="applyPreset('trap')">💥 Trap 808</button>
      </div>
    </div>

    <div class="setting-item">
      <div class="setting-label"><span>Varian Skin Visualizer</span><span id="skin-val" style="font-size:10px; color:var(--primary); font-weight:600;">Circular Bars</span></div>
      <select id="skin-select" style="width:100%; padding:8px 10px; border-radius:8px; background:rgba(255,255,255,0.06); color:var(--text); border:1px solid var(--border); font-size:12px; cursor:pointer;">
        <option value="circular-bars">📊 Circular Bars (Nu Classic)</option>
        <option value="waveform-lines">〰️ Waveform Lines (Oscilloscope)</option>
        <option value="geometric-shards">💎 Geometric Shards (Polygonal)</option>
        <option value="cyber-hex">⬡ Cyber Hex (Techno HUD)</option>
        <option value="equalizer-grid">▦ Equalizer Grid (Matrix VU)</option>
      </select>
    </div>

    <div class="setting-item">
      <div class="setting-label"><span>Sensitivitas Bass</span><span id="bass-val">1.4</span></div>
      <input type="range" id="bass-sens" min="0.5" max="3" step="0.1" value="1.4">
    </div>

    <div class="setting-item">
      <div class="setting-label"><span>Sensitivitas Denyut Beat (Threshold)</span><span id="pulse-sens-val">1.2x</span></div>
      <input type="range" id="pulse-sens" min="0.2" max="3" step="0.1" value="1.2">
    </div>

    <div class="setting-item">
      <div class="setting-label"><span>Jumlah Bar Spektrum</span><span id="bars-val">96</span></div>
      <input type="range" id="bar-count" min="32" max="180" step="4" value="96">
    </div>

    <div class="setting-item">
      <div class="setting-label"><span>Radius Lingkaran Tengah</span><span id="radius-val">110px</span></div>
      <input type="range" id="center-radius" min="60" max="180" step="5" value="110">
    </div>

    <div class="setting-item">
      <div class="setting-label"><span>Warna Utama (Neon Primary)</span></div>
      <input type="color" id="primary-color" value="#06b6d4" style="width:100%; height:32px; background:none; border:none; cursor:pointer;">
    </div>

    <div class="setting-item">
      <div class="setting-label"><span>Warna Sekunder (Secondary)</span></div>
      <input type="color" id="secondary-color" value="#8b5cf6" style="width:100%; height:32px; background:none; border:none; cursor:pointer;">
    </div>

    <div class="setting-item">
      <div class="setting-label"><span>Glow & Bayangan Neon</span><span id="glow-val">18</span></div>
      <input type="range" id="glow-sens" min="0" max="35" step="1" value="18">
    </div>

    <div class="setting-item">
      <div class="setting-label"><span>Jumlah Partikel Bintang</span><span id="part-val">60</span></div>
      <input type="range" id="part-count" min="0" max="150" step="10" value="60">
    </div>

    <div class="setting-item">
      <div class="setting-label"><span>💫 Particle Trail (Motion Blur)</span><span id="trail-val" style="color:var(--primary); font-weight:bold;">OFF</span></div>
      <label style="display:flex; align-items:center; gap:8px; font-size:12px; cursor:pointer;">
        <input type="checkbox" id="part-trail" style="cursor:pointer; accent-color:var(--primary);">
        <span>Aktifkan jejak blur (semi-transparent clearRect)</span>
      </label>
    </div>

    <div class="setting-item" style="gap:8px;">
      <label class="btn" style="width:100%; justify-content:center;">
        🖼️ Upload Cover Art Tengah
        <input type="file" id="cover-input" accept="image/*">
      </label>
      <label class="btn" style="width:100%; justify-content:center;">
        🌄 Upload Background Gambar
        <input type="file" id="bg-input" accept="image/*">
      </label>
    </div>
  </div>

  <!-- Player Controls Bar -->
  <div id="controls">
    <div class="timeline-row">
      <span id="time-curr">00:00</span>
      <input type="range" id="seek-bar" min="0" max="100" value="0">
      <span id="time-dur">00:00</span>
    </div>

    <div class="btn-row">
      <div class="btn-group">
        <button id="btn-play" class="primary">▶ Play / Demo</button>
        <label class="btn">
          📁 Pilih Audio / Video
          <input type="file" id="file-input" accept="audio/*,video/*">
        </label>
      </div>

      <div class="btn-group">
        <input type="range" id="vol-slider" min="0" max="1" step="0.05" value="0.9" style="width:70px;">
        <button id="btn-settings">⚙ Pengaturan</button>
        <button id="btn-record">🔴 Rekam Video</button>
      </div>
    </div>
  </div>

  <audio id="audio-el" crossorigin="anonymous"></audio>

  <script>
    // Pure Vanilla Nu Audio Visualizer & Video Exporter Engine
    const canvas = document.getElementById('visualizerCanvas');
    const ctx = canvas.getContext('2d');
    const audio = document.getElementById('audio-el');
    const fileInput = document.getElementById('file-input');
    const coverInput = document.getElementById('cover-input');
    const bgInput = document.getElementById('bg-input');
    const btnPlay = document.getElementById('btn-play');
    const btnTheme = document.getElementById('btn-theme');
    const seekBar = document.getElementById('seek-bar');
    const timeCurr = document.getElementById('time-curr');
    const timeDur = document.getElementById('time-dur');
    const volSlider = document.getElementById('vol-slider');
    const btnSettings = document.getElementById('btn-settings');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettings = document.getElementById('close-settings');
    const btnRecord = document.getElementById('btn-record');
    const recStatus = document.getElementById('rec-status');
    const recTimer = document.getElementById('rec-timer');

    // Theme state
    let isLightTheme = (localStorage.getItem('nu_standalone_theme') || localStorage.getItem('avee_standalone_theme')) === 'light';
    function updateTheme() {
      if (isLightTheme) {
        document.body.classList.add('light-theme');
        btnTheme.textContent = '🌙 Gelap';
      } else {
        document.body.classList.remove('light-theme');
        btnTheme.textContent = '☀️ Terang';
      }
      localStorage.setItem('nu_standalone_theme', isLightTheme ? 'light' : 'dark');
    }
    btnTheme.addEventListener('click', () => {
      isLightTheme = !isLightTheme;
      updateTheme();
    });
    updateTheme();

    // Visualizer Configuration
    const config = {
      skin: 'circular-bars',
      bassSens: 1.4,
      pulseSens: 1.2,
      barCount: 96,
      radius: 110,
      glow: 18,
      primaryColor: '#06b6d4',
      secondaryColor: '#8b5cf6',
      accentColor: '#ec4899',
      particleCount: 60,
      particleTrails: false,
      rotation: 0
    };

    // Presets with matching Skin variants
    const presets = {
      cyberpunk: { skin: 'circular-bars', bassSens: 1.35, pulseSens: 1.2, barCount: 96, radius: 110, primaryColor: '#06b6d4', secondaryColor: '#8b5cf6', glow: 18, particleTrails: false },
      solar: { skin: 'geometric-shards', bassSens: 1.6, pulseSens: 1.4, barCount: 112, radius: 115, primaryColor: '#eab308', secondaryColor: '#f97316', glow: 22, particleTrails: false },
      matrix: { skin: 'waveform-lines', bassSens: 1.15, pulseSens: 1.0, barCount: 120, radius: 125, primaryColor: '#10b981', secondaryColor: '#06b6d4', glow: 24, particleTrails: false },
      vaporwave: { skin: 'circular-bars', bassSens: 1.4, pulseSens: 1.2, barCount: 84, radius: 105, primaryColor: '#f97316', secondaryColor: '#ec4899', glow: 20, particleTrails: false },
      minimal: { skin: 'cyber-hex', bassSens: 1.1, pulseSens: 0.9, barCount: 64, radius: 130, primaryColor: '#e0e7ff', secondaryColor: '#38bdf8', glow: 12, particleTrails: false },
      trap: { skin: 'equalizer-grid', bassSens: 2.2, pulseSens: 1.8, barCount: 128, radius: 95, primaryColor: '#ef4444', secondaryColor: '#a855f7', glow: 26, particleTrails: true },
    };

    const skinNames = {
      'circular-bars': 'Circular Bars',
      'waveform-lines': 'Waveform Lines',
      'geometric-shards': 'Geometric Shards',
      'cyber-hex': 'Cyber Hex',
      'equalizer-grid': 'Equalizer Grid'
    };

    window.applyPreset = function(id) {
      const p = presets[id];
      if (!p) return;
      Object.assign(config, p);
      document.getElementById('skin-select').value = config.skin;
      document.getElementById('skin-val').textContent = skinNames[config.skin] || config.skin;
      document.getElementById('bass-sens').value = config.bassSens;
      document.getElementById('bass-val').textContent = config.bassSens;
      if (document.getElementById('pulse-sens')) {
        document.getElementById('pulse-sens').value = config.pulseSens || 1.2;
        document.getElementById('pulse-sens-val').textContent = (config.pulseSens || 1.2) + 'x';
      }
      document.getElementById('bar-count').value = config.barCount;
      document.getElementById('bars-val').textContent = config.barCount;
      document.getElementById('center-radius').value = config.radius;
      document.getElementById('radius-val').textContent = config.radius + 'px';
      document.getElementById('primary-color').value = config.primaryColor;
      document.getElementById('secondary-color').value = config.secondaryColor;
      document.getElementById('glow-sens').value = config.glow;
      document.getElementById('glow-val').textContent = config.glow;
      const trailChk = document.getElementById('part-trail');
      if (trailChk) {
        trailChk.checked = !!config.particleTrails;
        document.getElementById('trail-val').textContent = config.particleTrails ? 'ON' : 'OFF';
      }
    };

    // Images
    let coverImg = null;
    let bgImg = null;

    // Web Audio API
    let audioCtx = null;
    let analyser = null;
    let sourceNode = null;
    let streamDest = null;
    let dataArray = null;
    let isSynthDemo = false;
    let demoTimer = null;

    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.82;
        streamDest = audioCtx.createMediaStreamDestination();

        sourceNode = audioCtx.createMediaElementSource(audio);
        sourceNode.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.connect(streamDest);

        dataArray = new Uint8Array(analyser.frequencyBinCount);
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }

    // Canvas Resize
    function resizeCanvas() {
      const container = document.getElementById('canvas-container');
      canvas.width = container.clientWidth * window.devicePixelRatio;
      canvas.height = container.clientHeight * window.devicePixelRatio;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Floating Particles
    const particles = [];
    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < config.particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          size: 1 + Math.random() * 2.5,
          alpha: 0.3 + Math.random() * 0.5
        });
      }
    }
    initParticles();

    // Procedural Cover Art
    const defaultCover = document.createElement('canvas');
    defaultCover.width = 256;
    defaultCover.height = 256;
    const dctx = defaultCover.getContext('2d');
    dctx.fillStyle = '#0f172a';
    dctx.beginPath();
    dctx.arc(128, 128, 128, 0, Math.PI * 2);
    dctx.fill();
    dctx.strokeStyle = '#06b6d4';
    dctx.lineWidth = 4;
    dctx.stroke();
    dctx.fillStyle = '#ffffff';
    dctx.font = 'bold 36px sans-serif';
    dctx.textAlign = 'center';
    dctx.fillText('NU', 128, 140);

    // Audio Play / Synth Demo
    btnPlay.addEventListener('click', () => {
      initAudio();
      if (audio.src && audio.src !== '') {
        if (audio.paused) {
          audio.play();
          btnPlay.textContent = '❚❚ Pause';
        } else {
          audio.pause();
          btnPlay.textContent = '▶ Play';
        }
      } else {
        // Toggle Synthesized Demo Beat
        if (!isSynthDemo) {
          startSynthDemo();
          btnPlay.textContent = '❚❚ Stop Demo';
        } else {
          stopSynthDemo();
          btnPlay.textContent = '▶ Play / Demo';
        }
      }
    });

    function startSynthDemo() {
      isSynthDemo = true;
      let step = 0;
      function tick() {
        if (!isSynthDemo || !audioCtx) return;
        const t = audioCtx.currentTime;
        // Kick
        if (step % 4 === 0) {
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.frequency.setValueAtTime(130, t);
          osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
          g.gain.setValueAtTime(0.8, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          osc.connect(g);
          g.connect(analyser);
          osc.start(t);
          osc.stop(t + 0.26);
        }
        // Synth Bass
        if (step % 2 === 0) {
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(step % 8 < 4 ? 65 : 77, t);
          g.gain.setValueAtTime(0.4, t);
          g.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
          osc.connect(g);
          g.connect(analyser);
          osc.start(t);
          osc.stop(t + 0.2);
        }
        step++;
        demoTimer = setTimeout(tick, 120);
      }
      tick();
    }

    function stopSynthDemo() {
      isSynthDemo = false;
      if (demoTimer) clearTimeout(demoTimer);
    }

    // File Input
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      initAudio();
      stopSynthDemo();
      const url = URL.createObjectURL(file);
      audio.src = url;
      audio.play();
      btnPlay.textContent = '❚❚ Pause';
    });

    coverInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const img = new Image();
      img.src = URL.createObjectURL(file);
      coverImg = img;
    });

    bgInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const img = new Image();
      img.src = URL.createObjectURL(file);
      bgImg = img;
    });

    // Timeline
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        seekBar.value = (audio.currentTime / audio.duration) * 100;
        timeCurr.textContent = formatTime(audio.currentTime);
        timeDur.textContent = formatTime(audio.duration);
      }
    });
    seekBar.addEventListener('input', () => {
      if (audio.duration) {
        audio.currentTime = (seekBar.value / 100) * audio.duration;
      }
    });
    volSlider.addEventListener('input', (e) => {
      audio.volume = e.target.value;
    });
    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return \`\${m < 10 ? '0' : ''}\${m}:\${s < 10 ? '0' : ''}\${s}\`;
    }

    // Settings UI
    btnSettings.addEventListener('click', () => {
      settingsPanel.style.display = settingsPanel.style.display === 'flex' ? 'none' : 'flex';
    });
    closeSettings.addEventListener('click', () => {
      settingsPanel.style.display = 'none';
    });
    document.getElementById('skin-select').addEventListener('change', (e) => {
      config.skin = e.target.value;
      document.getElementById('skin-val').textContent = skinNames[config.skin] || config.skin;
    });
    document.getElementById('bass-sens').addEventListener('input', (e) => {
      config.bassSens = parseFloat(e.target.value);
      document.getElementById('bass-val').textContent = e.target.value;
    });
    document.getElementById('pulse-sens').addEventListener('input', (e) => {
      config.pulseSens = parseFloat(e.target.value);
      document.getElementById('pulse-sens-val').textContent = e.target.value + 'x';
    });
    document.getElementById('bar-count').addEventListener('input', (e) => {
      config.barCount = parseInt(e.target.value);
      document.getElementById('bars-val').textContent = e.target.value;
    });
    document.getElementById('center-radius').addEventListener('input', (e) => {
      config.radius = parseInt(e.target.value);
      document.getElementById('radius-val').textContent = e.target.value + 'px';
    });
    document.getElementById('primary-color').addEventListener('input', (e) => {
      config.primaryColor = e.target.value;
    });
    document.getElementById('secondary-color').addEventListener('input', (e) => {
      config.secondaryColor = e.target.value;
    });
    document.getElementById('glow-sens').addEventListener('input', (e) => {
      config.glow = parseInt(e.target.value);
      document.getElementById('glow-val').textContent = e.target.value;
    });
    document.getElementById('part-count').addEventListener('input', (e) => {
      config.particleCount = parseInt(e.target.value);
      document.getElementById('part-val').textContent = e.target.value;
      initParticles();
    });
    document.getElementById('part-trail').addEventListener('change', (e) => {
      config.particleTrails = e.target.checked;
      document.getElementById('trail-val').textContent = e.target.checked ? 'ON' : 'OFF';
    });

    // Recording Engine
    let mediaRecorder = null;
    let recChunks = [];
    let recSec = 0;
    let recInterval = null;

    btnRecord.addEventListener('click', () => {
      initAudio();
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        startRecording();
      } else {
        stopRecording();
      }
    });

    function startRecording() {
      try {
        const stream = canvas.captureStream(60);
        if (streamDest && streamDest.stream.getAudioTracks().length > 0) {
          stream.addTrack(streamDest.stream.getAudioTracks()[0]);
        }
        
        let mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
        let ext = 'mp4';
        if (!MediaRecorder.isTypeSupported(mime)) {
          mime = 'video/mp4';
          if (!MediaRecorder.isTypeSupported(mime)) {
            mime = 'video/webm; codecs="vp9,opus"';
            ext = 'webm';
            if (!MediaRecorder.isTypeSupported(mime)) {
              mime = 'video/webm';
            }
          }
        }

        recChunks = [];
        mediaRecorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8000000 });
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recChunks.push(e.data); };
        mediaRecorder.onstop = () => {
          clearInterval(recInterval);
          recStatus.style.display = 'none';
          btnRecord.textContent = '🔴 Rekam Video';
          btnRecord.classList.remove('danger');
          const blob = new Blob(recChunks, { type: mime });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = \`nu-visualizer-\${Date.now()}.\${ext}\`;
          a.click();
        };

        mediaRecorder.start(1000);
        recSec = 0;
        recStatus.style.display = 'flex';
        btnRecord.textContent = '⏹ Stop Rekam';
        btnRecord.classList.add('danger');

        recInterval = setInterval(() => {
          recSec++;
          recTimer.textContent = formatTime(recSec);
        }, 1000);
      } catch (err) {
        alert('Gagal merekam: ' + err.message);
      }
    }

    function stopRecording() {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }

    // Main Visualizer Animation Loop
    let smoothedBass = 0;
    let beatPulseIntensity = 0;
    function render() {
      requestAnimationFrame(render);
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Extract Audio Data
      let bass = 0;
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        let bSum = 0;
        const bCount = Math.floor(analyser.frequencyBinCount * 0.08);
        for (let i = 0; i < bCount; i++) bSum += dataArray[i];
        bass = Math.pow((bSum / (bCount * 255)) * 1.3, 1.4) * config.bassSens;
      }
      smoothedBass += (bass - smoothedBass) * 0.25;

      // Pulse Sensitivity Threshold Detection for Visual Size Shifts
      const pSens = Math.max(0.1, config.pulseSens || 1.2);
      const beatThreshold = Math.max(0.06, Math.min(0.85, 0.68 - (pSens - 0.5) * 0.26));
      let targetPulse = 0;
      if (bass > beatThreshold) {
        const excess = bass - beatThreshold;
        targetPulse = Math.min(1.8, (excess / Math.max(0.1, 1 - beatThreshold)) * Math.sqrt(pSens) * 1.4);
      }
      if (targetPulse > beatPulseIntensity) {
        beatPulseIntensity += (targetPulse - beatPulseIntensity) * 0.72;
      } else {
        beatPulseIntensity *= 0.86;
      }

      // Background & Motion Blur Trail Canvas Clear
      if (config.particleTrails) {
        // Semi-transparent clearRect approach (fillRect with alpha) creating motion blur trail effect
        ctx.fillStyle = isLightTheme ? 'rgba(248, 250, 252, 0.22)' : 'rgba(6, 8, 16, 0.22)';
        ctx.fillRect(0, 0, w, h);
      } else {
        if (bgImg && bgImg.complete) {
          ctx.drawImage(bgImg, 0, 0, w, h);
          ctx.fillStyle = isLightTheme ? 'rgba(255, 255, 255, 0.7)' : 'rgba(6, 8, 16, 0.7)';
          ctx.fillRect(0, 0, w, h);
        } else {
          ctx.fillStyle = isLightTheme ? '#f8fafc' : '#060810';
          ctx.fillRect(0, 0, w, h);
        }
      }

      // Particles
      for (let p of particles) {
        p.x += p.vx * (1 + smoothedBass * 1.8);
        p.y += p.vy * (1 + smoothedBass * 1.8);
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.fillStyle = config.primaryColor;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Center Visualizer
      ctx.save();
      ctx.translate(cx, cy);
      const pulse = 1 + beatPulseIntensity * 0.22;
      ctx.scale(pulse, pulse);
      config.rotation += 0.003 + smoothedBass * 0.005;
      ctx.rotate(config.rotation);

      // Radial Spectrum Drawing modified by active Skin variant
      const bars = config.barCount;
      const step = (Math.PI * 2) / bars;
      const r = config.radius;
      if (config.glow > 0) {
        ctx.shadowBlur = config.glow;
        ctx.shadowColor = config.primaryColor;
      }

      if (config.skin === 'waveform-lines') {
        // Waveform Lines Ribbon
        ctx.beginPath();
        for (let i = 0; i <= bars; i++) {
          const idx = i % bars;
          const a = i * step;
          let val = 0;
          if (dataArray) {
            const di = Math.floor((idx / bars) * (dataArray.length * 0.7));
            val = (dataArray[di] || 0) / 255;
          }
          const dist = r + val * 120 + (Math.sin(i * 0.2 + config.rotation * 3) * 15 * (1 + smoothedBass));
          const px = Math.cos(a) * dist;
          const py = Math.sin(a) * dist;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = config.primaryColor;
        ctx.stroke();

        // Secondary wave
        ctx.beginPath();
        for (let i = 0; i <= bars; i++) {
          const idx = (i + 12) % bars;
          const a = i * step;
          let val = 0;
          if (dataArray) {
            const di = Math.floor((idx / bars) * (dataArray.length * 0.7));
            val = (dataArray[di] || 0) / 255;
          }
          const dist = r + val * 100;
          const px = Math.cos(a) * dist;
          const py = Math.sin(a) * dist;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = config.secondaryColor;
        ctx.stroke();
      } else if (config.skin === 'geometric-shards') {
        // Geometric Shards
        for (let i = 0; i < bars; i++) {
          let val = 0;
          if (dataArray) {
            const idx = Math.floor((i / bars) * (dataArray.length * 0.7));
            val = (dataArray[idx] || 0) / 255;
          }
          const h = Math.max(5, val * 150 * (1 + smoothedBass * 0.25));
          const a = i * step;
          ctx.save();
          ctx.rotate(a);
          ctx.beginPath();
          ctx.moveTo(0, r + h);
          ctx.lineTo(-4, r + h * 0.4);
          ctx.lineTo(-2, r);
          ctx.closePath();
          ctx.fillStyle = config.primaryColor;
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(0, r + h);
          ctx.lineTo(4, r + h * 0.4);
          ctx.lineTo(2, r);
          ctx.closePath();
          ctx.fillStyle = config.secondaryColor;
          ctx.fill();

          if (val > 0.5) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, r + h, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      } else if (config.skin === 'cyber-hex') {
        // Cyber Hex
        for (let i = 0; i < bars; i++) {
          let val = 0;
          if (dataArray) {
            const idx = Math.floor((i / bars) * (dataArray.length * 0.7));
            val = (dataArray[idx] || 0) / 255;
          }
          const dist = r + val * 140;
          const a = i * step;
          ctx.save();
          ctx.rotate(a);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, r);
          ctx.lineTo(0, dist - 4);
          ctx.stroke();

          ctx.beginPath();
          for (let h = 0; h < 6; h++) {
            const ha = (h * Math.PI) / 3;
            const px = Math.sin(ha) * 4;
            const py = dist + Math.cos(ha) * 4;
            if (h === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = val > 0.4 ? config.accentColor : config.primaryColor;
          ctx.fill();
          ctx.restore();
        }
      } else if (config.skin === 'equalizer-grid') {
        // Equalizer Grid
        const maxSegs = 8;
        for (let i = 0; i < bars; i++) {
          let val = 0;
          if (dataArray) {
            const idx = Math.floor((i / bars) * (dataArray.length * 0.7));
            val = (dataArray[idx] || 0) / 255;
          }
          const activeSegs = Math.max(1, Math.floor(val * maxSegs));
          const a = i * step;
          ctx.save();
          ctx.rotate(a);
          for (let s = 0; s < maxSegs; s++) {
            const sy = r + s * 12;
            ctx.fillStyle = s < activeSegs ? (s / maxSegs < 0.6 ? config.primaryColor : config.secondaryColor) : 'rgba(255,255,255,0.06)';
            ctx.beginPath();
            ctx.rect(-2.5, sy, 5, 8);
            ctx.fill();
          }
          ctx.restore();
        }
      } else {
        // Default Circular Bars (Nu Classic)
        for (let i = 0; i < bars; i++) {
          let val = 0;
          if (dataArray) {
            const idx = Math.floor((i / bars) * (dataArray.length * 0.7));
            val = (dataArray[idx] || 0) / 255;
          }
          const barH = Math.max(4, val * 160);
          ctx.save();
          ctx.rotate(i * step);

          const grad = ctx.createLinearGradient(0, r, 0, r + barH);
          grad.addColorStop(0, config.primaryColor);
          grad.addColorStop(1, config.secondaryColor);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(-2.5, r, 5, barH, 2.5);
          ctx.fill();
          ctx.restore();
        }
      }

      // Center Cover Art
      ctx.shadowBlur = config.glow;
      ctx.shadowColor = config.primaryColor;
      ctx.beginPath();
      ctx.arc(0, 0, r - 6, 0, Math.PI * 2);
      ctx.strokeStyle = config.primaryColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, r - 8, 0, Math.PI * 2);
      ctx.clip();
      ctx.shadowBlur = 0;
      const cImg = (coverImg && coverImg.complete) ? coverImg : defaultCover;
      ctx.drawImage(cImg, -(r - 8), -(r - 8), (r - 8) * 2, (r - 8) * 2);
      ctx.restore();

      ctx.restore();
    }
    render();
  </script>
</body>
</html>`;
}
