let mic;
function setup() {
    createCanvas(windowWidth, windowHeight);
    mic = new p5.AudioIn();
    mic.start();
}
function draw() {
    background(0);
    let vol = mic.getLevel();
    let diameter = vol * width*10;
    stroke(250);
    strokeWeight(100);
    fill(vol*255,0,255);
    ellipse(width / 2, height / 2, diameter, diameter);
}