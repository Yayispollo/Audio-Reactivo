// Source audio file for this sketch.
const WAVE_AUDIO_PATH = "./audio/angel_song.mp3";

// p5.SoundFile instance controlled by user interaction.
let waveSong;
// FFT analyzer used for waveform extraction.
let waveFft;
// Amplitude analyzer for global level.
let waveAmplitude;
// Smoothed level used for ribbon thickness.
let waveLevel = 0;

function preload() {
  waveSong = loadSound(WAVE_AUDIO_PATH);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  waveFft = new p5.FFT(0.9, 512);
  waveFft.setInput(waveSong);
  waveAmplitude = new p5.Amplitude();
  waveAmplitude.setInput(waveSong);
  noFill();
}

function draw() {
  waveLevel = lerp(waveLevel, waveAmplitude.getLevel(), 0.14);
  background(7, 10, 18);

  const waveform = waveFft.waveform();
  const bandHeight = height / 2;

  translate(0, height / 2);
  stroke(83, 214, 200);
  strokeWeight(1);
  beginShape();
  for (let i = 0; i < waveform.length; i++) {
    const x = map(i, 0, waveform.length - 1, 0, width);
    const y = waveform[i] * bandHeight * 0.18;
    curveVertex(x, y);
  }
  endShape();
}

function toggleWaveSong() {
  userStartAudio();
  if (!waveSong || !waveSong.isLoaded()) {
    return;
  }
  if (waveSong.isPlaying()) {
    waveSong.pause();
  } else {
    waveSong.loop();
  }
}

function mousePressed() {
  toggleWaveSong();
}

function touchStarted() {
  toggleWaveSong();
}

function keyPressed() {
  if (key === " ") {
    toggleWaveSong();
    return false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}