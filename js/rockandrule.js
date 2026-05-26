// Referencias del DOM
const canvas = document.getElementById('visualizer_canvas');
const ctx = canvas.getContext('2d');
const welcomeModal = document.getElementById('welcome_modal');
const btnEnter = document.getElementById('btn_enter');
const btnReset = document.getElementById('btn_reset');
const musicElement = document.getElementById('music_element');

// Inputs
const inputSensitivity = document.getElementById('input_sensitivity');
const inputSpacing = document.getElementById('input_spacing');
const inputLobes = document.getElementById('input_lobes');

// Labels
const labelSensitivity = document.getElementById('label_sensitivity');
const labelSpacing = document.getElementById('label_spacing');
const labelLobes = document.getElementById('label_lobes');

// Estado del visualizador (Valores optimizados)
const settings = {
  sensitivity: 2.2,
  spacing: 25,
  lobes: 5.0,
  scale: 280,
  maxSize: 18,
  minSize: 1.5,
  glow: 12 
};

// Clase PerlinNoise Optimizada
class PerlinNoise {
  constructor() {
    this.p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) this.p[i] = Math.floor(Math.random() * 256);
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = this.p[i & 255];
  }
  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(t, a, b) { return a + t * (b - a); }
  grad(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
  }
  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const A = this.perm[X] + Y;
    const B = this.perm[X + 1] + Y;
    return this.lerp(v, this.lerp(u, this.grad(this.perm[A], x, y),
                                     this.grad(this.perm[B], x - 1, y)),
                         this.lerp(u, this.grad(this.perm[A + 1], x, y - 1),
                                     this.grad(this.perm[B + 1], x - 1, y - 1)));
  }
}

const perlin = new PerlinNoise();

// Actualizar estados reactivamente
inputSensitivity.addEventListener('input', (e) => {
  settings.sensitivity = parseFloat(e.target.value);
  labelSensitivity.innerText = settings.sensitivity.toFixed(1) + 'x';
});
inputSpacing.addEventListener('input', (e) => {
  settings.spacing = Math.max(15, parseInt(e.target.value));
  labelSpacing.innerText = settings.spacing + 'px';
});
inputLobes.addEventListener('input', (e) => {
  settings.lobes = parseFloat(e.target.value);
  labelLobes.innerText = settings.lobes.toFixed(1);
});
btnReset.addEventListener('click', () => {
  ctx.fillStyle = '#030303';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});

// Redimensionado Dinámico del Canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.fillStyle = '#030303';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Web Audio API
let audioCtx, analyser, source, dataArray;
let isInitialized = false;

function initAudio() {
  if (isInitialized) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  source = audioCtx.createMediaElementSource(musicElement);
  
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;  
  analyser.smoothingTimeConstant = 0.8;

  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  isInitialized = true;
}

btnEnter.addEventListener('click', async () => {
  initAudio();
  
  // Asegurar que el contexto se despierte
  if (audioCtx && audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  
  // RECONEXIÓN DE SEGURIDAD: Asegura el puente hacia tus altavoces
  analyser.connect(audioCtx.destination);
  
  welcomeModal.style.opacity = 0;
  setTimeout(() => {
    welcomeModal.style.display = 'none';
  }, 400);
  
  // Reproducir e inspeccionar posibles errores de carga
  musicElement.play()
    .then(() => console.log('Reproducción iniciada correctamente.'))
    .catch(err => console.error('Error crítico al reproducir el archivo MP3:', err));
});

// Superfórmula 2D
function superformula(theta, m, n1, n2, n3, a = 1.0, b = 1.0) {
  const part1 = Math.pow(Math.abs(Math.cos((m * theta) / 4) / a), n2);
  const part2 = Math.pow(Math.abs(Math.sin((m * theta) / 4) / b), n3);
  return Math.pow(part1 + part2, -1 / n1);
}

function mapRange(val, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return outMin;
  return outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin);
}

// Ciclo de Renderización
let lastTime = 0;
let runTime = 0;

function getAudioLevels() {
  if (!isInitialized) {
    return { bass: 0, mid: 0, treble: 0, full: 0 };
  }

  analyser.getByteFrequencyData(dataArray);

  let bassSum = 0, midSum = 0, trebleSum = 0, fullSum = 0;
  const bassLimit = 12; 
  const midLimit = 75;  

  for (let i = 0; i < dataArray.length; i++) {
    const val = (dataArray[i] / 255) * settings.sensitivity;
    fullSum += val;
    if (i < bassLimit) bassSum += val;
    else if (i < midLimit) midSum += val;
    else trebleSum += val;
  }

  return {
    bass: Math.min(1.0, bassSum / bassLimit),
    mid: Math.min(1.0, midSum / (midLimit - bassLimit)),
    treble: Math.min(1.0, trebleSum / (dataArray.length - midLimit)),
    full: Math.min(1.0, fullSum / dataArray.length)
  };
}

function render(time) {
  const delta = (time - lastTime) * 0.001;
  lastTime = time;
  runTime += delta;

  let levels;
  if (isInitialized && !musicElement.paused) {
    levels = getAudioLevels();
  } else {
    const t = time * 0.0015;
    levels = {
      bass: (Math.sin(t) + 1) * 0.15 + (Math.cos(t * 0.6) + 1) * 0.12,
      mid: (Math.cos(t * 1.2) + 1) * 0.12 + (Math.sin(t * 0.4) + 1) * 0.10,
      treble: (Math.sin(t * 2.0) + 1) * 0.08 + (Math.cos(t * 1.5) + 1) * 0.08,
      full: 0.15
    };
    levels.full = (levels.bass + levels.mid + levels.treble) / 2.5;
  }

  const bassVal = Math.pow(levels.bass, 0.7) * settings.sensitivity;
  const midVal = Math.pow(levels.mid, 0.7) * settings.sensitivity;
  const trebleVal = Math.pow(levels.treble, 0.7) * settings.sensitivity;
  const fullVal = Math.pow(levels.full, 0.7) * settings.sensitivity;

  ctx.fillStyle = 'rgba(3, 3, 3, 0.16)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const halfW = canvas.width / 2;
  const halfH = canvas.height / 2;

  const dynamicScale = settings.scale * (1.1 + Math.pow(bassVal, 1.3) * 0.95 + midVal * 0.45);
  const rotationOffset = runTime * 0.15 + Math.sin(runTime * 0.4) * midVal * 1.5 + midVal * 1.15;
  const dynamicM = settings.lobes + Math.sin(runTime * 2.5) * (midVal * 2.8) + (trebleVal * 1.8);

  const spacing = settings.spacing;
  const noiseScale = 0.012;
  const maxDisplacement = 60;

  if (settings.glow > 0) {
    ctx.shadowBlur = settings.glow;
  } else {
    ctx.shadowBlur = 0;
  }

  // Bucle de la matriz Halftone
  for (let x = -spacing; x < canvas.width + spacing; x += spacing) {
    for (let y = -spacing; y < canvas.height + spacing; y += spacing) {
      
      const aproxDx = x - halfW;
      const aproxDy = y - halfH;
      const aproxDist = Math.hypot(aproxDx, aproxDy);
      
      if (aproxDist > dynamicScale * 1.6) continue;

      const flowAngle = perlin.noise2D(x * noiseScale, y * noiseScale + runTime) * Math.PI * 2;
      const shift = perlin.noise2D(x * noiseScale + runTime, y * noiseScale) * maxDisplacement;

      const drawX = x + Math.cos(flowAngle) * shift * (1.0 + fullVal * 3.2 + bassVal * 2.1);
      const drawY = y + Math.sin(flowAngle) * shift * (1.0 + fullVal * 3.2 + bassVal * 2.1);

      const dx = drawX - halfW;
      const dy = drawY - halfH;
      const distance = Math.hypot(dx, dy);
      const rawTheta = Math.atan2(dy, dx);
      const theta = rawTheta - rotationOffset;

      const r_super = superformula(theta, dynamicM, 1.0, 1.7, 1.7);
      const edgeTurbulence = perlin.noise2D(Math.cos(rawTheta) * 1.5, Math.sin(rawTheta) * 1.5 + runTime) * 0.08;
      const finalSuperRadius = r_super * dynamicScale * (1.0 + edgeTurbulence * (1.0 + trebleVal * 2.4) + trebleVal * 0.55 + midVal * 0.35);

      const ratio = distance / finalSuperRadius;

      if (ratio > 1.25) continue;

      let halftoneFactor = 0.0;
      if (ratio <= 0.8) {
        halftoneFactor = mapRange(ratio, 0, 0.8, 1.0, 0.7) + fullVal * 1.45 + bassVal * 0.65;
      } else {
        halftoneFactor = mapRange(ratio, 0.8, 1.25, 0.7 + fullVal * 1.45 + bassVal * 0.65, 0.0);
      }

      const radius = settings.minSize + Math.max(0, halftoneFactor) * settings.maxSize;

      if (radius > 0.5) {
        let color;
        if (ratio < 0.25) color = '#f9e356';      
        else if (ratio < 0.55) color = '#ff5900'; 
        else if (ratio < 0.85) color = '#ff0419'; 
        else color = '#1e47fd'; // Corregido azul oscuro por Cyan para preservar la estética neón original

        ctx.beginPath();
        ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        
        if (settings.glow > 0 && radius > 3) { 
          ctx.shadowColor = color;
        } else {
          ctx.shadowColor = 'transparent'; // Evita fugas de sombra en círculos pequeños
        }

        ctx.fill();
      }
    }
  }

  // CORRECCIÓN: El requestAnimationFrame y el reset de sombra van fuera del bucle anidado for
  ctx.shadowBlur = 0; 
  ctx.shadowColor = 'transparent';
  requestAnimationFrame(render);
}

// Inicializar loop correctamente
requestAnimationFrame(render);