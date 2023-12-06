// These functions allow you to design for a specific set of dimensions,
// but maintain the aspect ratio if the window is a different size.

let rwidth, rheight;
let rmouseX, rmouseY;

let ratioLeft, ratioTop;
let ratioScale;

function windowRatio(wide, high) {
  rwidth = wide;
  rheight = high;

  resizeCanvas(windowWidth, windowHeight);
}

function updateRatio() {
  let aspectH = width / rwidth;
  let aspectV = height / rheight;
  ratioScale = min(aspectH, aspectV);
  ratioTop = (height - ratioScale* rheight) / 2;
  ratioLeft = (width - ratioScale* rwidth) / 2;
  translate(ratioLeft, ratioTop);
  scale(ratioScale);

  rmouseX = ratioX(mouseX);
  rmouseY = ratioY(mouseY);
}

function ratioX(x) {
  return (x - ratioLeft) / ratioScale;
}

function ratioY(y) {
  return (y - ratioTop) / ratioScale;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (!isLooping()) {
    redraw();
  }
}
