let nombre = "Yayis";
let offset = 0;
let arreglo = ["guayaba", "mango", "piña", "fresa"];

const PALETTE = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#33FFF5"];
const radio= 200;
console.log( arreglo[0] );
console.log( PALETTE[0] );

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(PALETTE[4]);
}

function draw() {
    background(PALETTE[2]);
    beginShape();
    noFill();
    strokeWeight(5);
    stroke(PALETTE[4]);
    for (let i = 0; i < width; i++) {
        let angle = (i * 0.02) + offset;
        let y = sin(angle) * radio + (height / 2);
        vertex(i, y);
    }
    endShape();
    offset += 0.03;
}