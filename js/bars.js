
const BARS_AUDI_PATH = './audio/metallica.mp3';
let song;
let barsFFT;
let barsAmp;
const barBins = 64;

function preload() {
    song = loadSound(BARS_AUDI_PATH);
}
function setup() {
    createCanvas(windowWidth, windowHeight);
    barsFFT = new p5.FFT(0.88,barBins);
    barsFFT.setInput(song);
    barsAmp = new p5.Amplitude();
    barsAmp.setInput(song);
    noStroke();
}
function draw() {
    const spectrum = barsFFT.analyze();
    const amp = barsAmp.getLevel();
    background(0);
    const margin = width * 0.08;
    const availableWidth = width - margin * 2;
    const barWidth = availableWidth / spectrum.length;

    for (let i = 0; i < spectrum.length; i++) {
        const x = margin + i * barWidth;
        const energy = spectrum[i];
        const barHeight = map(energy, 0, 255, 10, height * 0.42);
        fill(255, 255, 255);
        rect(x, height/2 - barHeight, barWidth * 0.8, barHeight);
      
    }
}
function mousePressed() {
    userStartAudio();
    if(song.isLoaded()) return song.play();
  
}