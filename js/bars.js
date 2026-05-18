const BARS_AUDIO_PATH = './audio/angel_song.mp3'; 
let song;
let barsFFT;
const barBins = 64;

function preload() {
    song = loadSound(BARS_AUDIO_PATH);
}

function setup() {
    // Creamos el lienzo al tamaño exacto de la ventana visible
    createCanvas(windowWidth, windowHeight);
    
    colorMode(HSB, 360, 100, 100, 1);
    barsFFT = new p5.FFT(0.88, barBins);
    barsFFT.setInput(song);
    noStroke();
}

function draw() {
    background(0, 0, 5, 0.15); 
    
    if (!song.isPlaying()) {
        fill(0, 0, 100); 
        textAlign(CENTER, CENTER);
        textSize(16);
        text("Haz clic en la pantalla para iniciar el audio", width / 2, height / 2);
        return; 
    }

    const spectrum = barsFFT.analyze();
    const numBars = spectrum.length;
    
    // Optimizamos el ancho para que quepa perfectamente en pantallas grandes y chicas
    const barWidth = (width * 0.7) / numBars; 

    push();
    translate(width / 2, height / 2); 

    for (let i = 0; i < numBars; i++) {
        const energy = spectrum[i];
        
        // Ajustamos la altura máxima (height * 0.4) para evitar que las barras 
        // toquen los bordes superior e inferior de la pantalla
        const h = map(energy, 0, 255, 4, height * 0.4);
        
        let hue;
        if (i < numBars / 2) {
            hue = map(i, 0, numBars / 2, 20, 220); 
        } else {
            hue = map(i, numBars / 2, numBars, 220, 300); 
        }
        
        const xPos = i * barWidth - (numBars * barWidth) / 2;

        // 1. Resplandor (Glow)
        fill(hue, 80, 100, 0.05); 
        rect(xPos, -h / 2, barWidth * 2, h, 20);
        
        // 2. Barra Principal
        fill(hue, 80, 100, 0.8); 
        rect(xPos, -h / 2, barWidth * 0.8, h, 12);

        // 3. Puntos de brillo
        fill(hue, 30, 100, 1);
        circle(xPos + barWidth * 0.4, -h / 2, barWidth * 0.4);
        circle(xPos + barWidth * 0.4, h / 2, barWidth * 0.4);
    }
    pop();
}

function mousePressed() {
    if (song.isPlaying()) {
        song.pause();
    } else {
        song.play();
    }
}

// Esto recalcula el tamaño del lienzo instantáneamente si se rota la pantalla o se cambia el tamaño
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}