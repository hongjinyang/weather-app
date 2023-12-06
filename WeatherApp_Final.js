let w;
let place = null;
let latitude, longitude;

// Array of vector
let particle = [];
let cloud = [];
let cloudDiameter = [];

// create noise scale
const noiseScale = 0.001;

// create an empty chart
let chart = {};

// import font
let myFont_01;
let myFont_02;
let myFont_03;
let myFont_04;

// import icons for info
let icon1;
let icon2;
let icon3;
let icon4;

// preload font and icon
function preload() {
  myFont_01 = loadFont('font/PxGrotesk-Black.otf');
  myFont_02 = loadFont('font/PxGrotesk-Bold.otf');
  myFont_03 = loadFont('font/PxGrotesk-Regular.otf');
  myFont_04 = loadFont('font/PxGroteskMono-Bold.otf');
  loadIcons();
  icon1 = loadImage('icons_info/humidity-svgrepo-com.svg');
  icon2 = loadImage('icons_info/cloud-snow-svgrepo-com.svg');
  icon3 = loadImage('icons_info/wind-svgrepo-com.svg');
  icon4 = loadImage('icons_info/temperature-feels-like-svgrepo-com.svg');
}

function setup() {
  windowRatio(390, 844);

  // get the current weather for Cambridge
  w = requestWeather('gps', lookupLocation);
  // w = requestWeather(42.37377875771454, -71.1113275063651);

  // initialize cloud diameter
  for (let i = 0; i < 50; i++) {
    cloudDiameter[i] = random(20, 80);
  }

  // initialize the chart layout
  chart.left = 40;
  chart.right = rwidth - chart.left;
  chart.top = rheight - 216;
  chart.bottom = rheight - 88;

  // setup rect mode
  rectMode(CORNER);
}


function draw() {
  // let c = color(44, 62, 80, 30);
  // background(c);

  if(w.ready) {
    // drawing weather condition as background
    let type = w.getConditionCode();
    drawWeatherType();
    
    // drawing current amount of clouds using circles
    drawCloud();

    // drawing current wind and direction
    drawWind();

    // create a gradient background on top
    // let c1 = color(0, 31, 53, 0);
    // let c2 = color("#00458d");
    // create the gradient background
    // setGradient(c1, c2);

    // update the ratio for charts
    updateRatio();
    
    // draw the data background
    fill("#144780");
    noStroke();
    rect(0, rheight - 330, rwidth, 860, 30);
    
    // draw specific weather info
    drawInfo();

    // drawing the location of gps request
    drawLocationText();

    // drawing the chart of next week precast
    drawWeek();

    // drawing the current weather
    drawWeather();
  }
  else {
    background("#144780");
    fill(255);
    textSize(40);
    textFont(myFont_04);
    text('LOADING...', rwidth/2, rheight/2)
  }
}

// create a function to demonstrate wind speed and direction
function drawWind() {
  //background(0, 10);

  let num = 10 * w.getWindSpeed();

  // create vector in random positions
  for(let i = 0; i < num; i ++) {
    particle.push(createVector(random(width), random(height)));
  }

  // get wind speed and direction from API
  let windSpeed = w.getWindSpeed() / 4;
  let windDirection = w.getWindDirection() - 90; // starting from -90

  // convert wind direction from degress to radians
  let windAngle = radians(windDirection);

  // calculate velocity based on wind speed and direction
  //let velocity = p5.Vector.fromAngle(windAngle, windSpeed);

  // calculate wind vector
  let windVector = createVector(cos(windAngle), sin(windAngle));
  windVector.mult(windSpeed);

  // draw dot on the screen
  for(let i = 0; i < num; i ++) {
    let p = particle[i];
    
    // draw particle
    stroke(255);
    strokeWeight(2.5);
    point(p.x, p.y);

    // create the noise
    let n = noise(p.x * noiseScale, p.y * noiseScale);
  
    // map the noise to an angle
    let angle = map(n, 0, 1, -PI, PI);

    // create the noise vector with noise angle
    let noiseVector = createVector(cos(angle), sin(angle));
    noiseVector.mult(6);

    // create velocity based on windVecotr with a deviation of noise Vector with a weight
    let velocity = p5.Vector.lerp(windVector, noiseVector, 0.25);

    // noiseVector.add(windVector);

    p.add(velocity);

    // check if offscreen, and set the time of display to 10 seconds
    if(!onScreen(p) && frameCount < 1000) {
      p.x = random(width);
      p.y = random(height);
    }
  }
}


// create a function to draw cloud cover
function drawCloud() {
  let num = 100 * w.getCloudCover();

  // create vector in random positions
  for(let i = 0; i < num; i ++) {
    cloud.push(createVector(random(width), random(height)));
  }

  // get wind speed and direction from API
  let windSpeed = w.getWindSpeed() / 5;
  let windDirection = w.getWindDirection() - 90; // starting from -90

  // convert wind direction from degress to radians
  let windAngle = radians(windDirection);

  // calculate wind vector
  let windVector = createVector(cos(windAngle), sin(windAngle));
  windVector.mult(windSpeed);

  // draw dot on the screen
  for(let i = 0; i < num; i ++) {
    let c = cloud[i];

    // draw cloud
    noStroke();
    fill(225, 225, 225, 10);
    ellipse(c.x, c.y, cloudDiameter[i], cloudDiameter[i]);

    // create the noise
    let n = noise(c.x * noiseScale, c.y * noiseScale);
  
    // map the noise to an angle
    let angle = map(n, 0, 1, -PI, PI);

    // create the noise vector with noise angle
    let noiseVector = createVector(cos(angle), sin(angle));
    noiseVector.mult(2);

    // create velocity based on windVecotr with a deviation of noise Vector with a weight of 0.3
    let velocity = p5.Vector.lerp(windVector, noiseVector, 0.6);

    // noiseVector.add(windVector);

    c.add(velocity);

    // check if offscreen
    if(!onScreen(c)) {
      c.x = random(width);
      c.y = random(height);
    }
  }
}


// create a function to detect whether the particle moves out of the screen
function onScreen(v) {
  return v.x >= 0 && v.x <= width && v.y >= 0 && v.y <= height;
}


function drawWeatherType() {
  // get weather type from API
  let type = w.getConditionCode();

  // get time of the day
  let now = w.getTime();
  let hr = now.hour24();

  if (hr >= 7 && hr < 19) {
    if(type == "Clear" || type == "MostlyClear") {
      // background(122, 207, 255, 30);
      let c1 = color(25, 75, 125, 50);
      let c2 = color(175, 200, 225, 80);
      setGradient(0, 0, width, height, c1, c2);
      
    }
    else if (type == "Rain" || type == "Drizzle" || type == "HeavyRain" || type == "Showers" || type == "FreezingDrizzle" || type == "FreezingRain") {
      // background(129, 139, 158, 50);
      let c1 = color(107, 170, 227, 80);
      let c2 = color(167, 183, 212, 50);
      setGradient(0, 0, width, height, c2, c1);
    }
    else if (type == "Snow" || type == "Flurries" || type == "HeavySnow" || type == "MixedRainAndSleet" || type == "MixedRainAndSnow" || type == "MixedSnowAndSleet" || type == "ScatteredSnowShowers" || type == "Sleet" || type == "SnowShowers" || type == "Blizzard" || type == "BlowingSnow") {
      // background(167, 183, 212, 50);
      let c1 = color(192, 219, 210, 50);
      let c2 = color(168, 193, 236, 80);
      setGradient(0, 0, width, height, c1, c2);
    }
    else if (type == "Cloudy" || type == "MostlyCloudy" || type == "PartlyCloudy" || type == "Breezy") {
      // background(168, 193, 236, 50);
      let c1 = color(160, 196, 194, 50);
      let c2 = color(168, 193, 236, 80);
      setGradient(0, 0, width, height, c1, c2);
    }
    else if (type == "Haze" || type == "Smoke" || type == "Hot" || type == "Tornado") {
      background(216, 203, 144, 30);
    }
    else {
      // background(113, 125, 150, 35);
      let c1 = color(113, 125, 150, 50);
      let c2 = color(65, 91, 131, 80);
      setGradient(0, 0, width, height, c2, c1);
    }
  }
  else {
    // background(0, 31, 53, 30);
    let c1 = color(0, 31, 53, 30);
    let c2 = color(0, 48, 96, 80);
    setGradient(0, 0, width, height, c1, c2);
  }
}


// create a function to set gradient
function setGradient(x, y, w, h, c1, c2) {
  noFill();

  // top to bottom gradient
  for (let i = y; i <= y + h; i++) {
    let inter = map(i, y, y + h, 0, 1);
    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(x, i, x + w, i);
  }
}


function mouseReleased() {
  noiseSeed(millis());
}


// create a function that draws the precast for next week
function drawWeek() {
  // get the weather data for next week for both highs and lows
  let highs = w.getTemperatureMax('days');
  let lows = w.getTemperatureMin('days');
  
  // find the max highs and lows
  let maxTemp = max(highs);
  let minTemp = min(lows);

  // get time of the day
  let now = w.getTime();
  let hr = now.hour24();

  // draw chart background
  // noStroke();
  // fill("#00458d");
  // // fill(255);
  // rect(0, chart.top - 45, rwidth, chart.bottom - chart.top + 85, 20);

  // loop each data to create chart, for only next 7 days
  for(let i = 0; i < 7; i++) {
    let x = map(i, 0, 6, chart.left + 10, chart.right - 10);
    let y1 = map(highs[i], minTemp, maxTemp, chart.bottom + 10, chart.top);
    let y2 = map(lows[i], minTemp, maxTemp, chart.bottom + 10, chart.top);

    // draw each column
    strokeWeight(6);
    strokeCap(ROUND);
    stroke(0,0,0,50);
    line(x, chart.top, x, chart.bottom)

    // draw weather data with gradient
    let numSegments = 70;
    let segmentLength = (y1 - y2) / numSegments;
    for (let j = 0; j < numSegments; j++) {
      let currentY = y2 + j * segmentLength;
      let currentTemp = map(currentY, chart.bottom, chart.top, minTemp, maxTemp);
      let colorValue = map(currentTemp, 25, 90, 0, 1);
      
      // create a gradient color that matches the temperature, from blue to green to red
      let gradientColor;
      if (colorValue < 0.5) {
        // blue to green gradient
        let blueToGreenValue = map(colorValue, 0, 0.5, 0, 1);
        gradientColor = lerpColor(color("#0088ef"), color("#86ec97"), blueToGreenValue);
      } else {
        // green to red gradient
        let greenToRedValue = map(colorValue, 0.5, 1, 0, 1);
        gradientColor = lerpColor(color("#86ec97"), color("#a60007"), greenToRedValue);
      }

      // set the stroke color
      stroke(gradientColor);
      line(x, currentY, x, currentY + segmentLength);
    }
    

    // draw average points for every day
    // compute average degree
    let average = map((highs[i] + lows[i])/2, minTemp, maxTemp, chart.bottom, chart.top);
    
    // draw temp average for each 
    if (i != 0) {
      fill(255, 220);
      noStroke();
      ellipse (x, average, 6.5, 6.5);
    }

    // draw text for the data
    textAlign(CENTER, TOP);
    noStroke();
    
    // text for high temp
    textSize(16);
    textFont(myFont_02);
    fill(255);
    text(round(highs[i]) + "°", x, chart.top - 30);
      
    // text for low temp
    textSize(12);
    textFont(myFont_03);
    fill(255, 255, 255, 150);
    text(round(lows[i]) + "°", x, chart.bottom + 8);

    // get day of week
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + i + 1); // Get the date for the next 7 days
    let date = moment(currentDate);
    let dayOfWeek = date.format('ddd');
    textSize(14);
    textFont(myFont_02);
    fill(255);
    text(dayOfWeek, x, chart.bottom + 26);
  }
   
  // draw the trend for next 7 days
   drawAverage();
}


// draw average temperature to present the trend for next week
function drawAverage() {
  // get the weather data for next week for both highs and lows
  let highs = w.getTemperatureMax('days');
  let lows = w.getTemperatureMin('days');
  
  // find the max highs and lows
  let maxTemp = max(highs);
  let minTemp = min(lows);
  
  // draw the average temperature curve
  noFill();
  stroke(255, 255, 255, 50);
  strokeWeight(3.5);

  beginShape();
  // add the first point
  let x = map(0, 0, 6, chart.left + 10, chart.right -10);
  let average = map((highs[0] + lows[0])/2, minTemp, maxTemp, chart.bottom, chart.top);
  curveVertex(x, average);

  for (let j = 0; j < 7; j += 1)
  {
    // draw average temp of each day
    let x = map(j, 0, 6, chart.left + 10, chart.right -10);

    // compute the average of the highs and lows for each days
    let average2 = map((highs[j] + lows[j])/2, minTemp, maxTemp, chart.bottom, chart.top);
    
    curveVertex(x, average2);
  }

  // add the last point
  let lastX = map(6, 0, 6, chart.left + 10, chart.right - 10);
  let lastAverage = map((highs[6] + lows[6])/2, minTemp, maxTemp, chart.bottom, chart.top);
  curveVertex(lastX, lastAverage);
  endShape();
  
  // draw current day average as a point
  fill(0, 0, 0, 50);
  stroke(255);
  strokeWeight(2.5);
  ellipse (x, average, 8, 8);
}


// draw the current weather of the day
function drawWeather() {
  // when was this forecast updated?
  let forecastTime = w.getTime();
  
  // draw temps
  noStroke();
  fill(255);
  textFont(myFont_02);
  textSize(100);
  textAlign(CENTER);
  
  // get the temperature, including min and max, and then round it
  let temps = round(w.getTemperature()) + '°';
  let tempHr = w.getTemperature('hours');

  // compute next 24 hrs temps
  const count = 24;
  tempHr = subset(tempHr, 0, count);

  // compute min and max temp for next 24 hr
  let minTemp = round(min(tempHr)) + '°';
  let maxTemp = round(max(tempHr)) + '°';

  // show the temperature in degrees
  let h1 = 90;
  text(temps, rwidth/2 + 20, h1);

  // display date, min and max temp
  textFont(myFont_02);
  textSize(16);
  text(forecastTime.dayOfWeek() + "   " + minTemp + "/ " + maxTemp, rwidth/2, h1 + 112);

  // display the weather condition icon
  let h2 = 310;
  let code = w.getConditionCode();
  drawIcon(code, rwidth/2, h2, 60);

  // show current conditions
  textSize(16);
  textFont(myFont_03);
  text(w.getConditionText(), rwidth/2, h2 + 60);
}


// draw key information
function drawInfo() {
  // draw a rect as the background
  fill(245);
  noStroke();
  rect(38, rheight - 380, rwidth - 76, 110, 30);
  
  // show indicators for humidity, wind, precipitation
  let h1 = 505;
  let h2 = h1 + 20;

  // draw info icons
  fill(0);
  imageMode(CENTER);
  image(icon1, rwidth/5 + 12, h1, 25, 25);
  image(icon3, 2 * rwidth/5 + 4, h1, 25, 25);
  image(icon2, 3 * rwidth/5 - 4, h1, 30, 30);
  image(icon4, 4 * rwidth/5 - 12, h1, 27, 27);

  // draw icon background
  fill(20, 71, 128, 40);
  noStroke();
  ellipse(rwidth/5 + 12, h1, 45, 45);
  ellipse(2 * rwidth/5 + 4, h1, 45, 45);
  ellipse(3 * rwidth/5 - 4, h1, 45, 45);
  ellipse(4 * rwidth/5 - 12, h1, 45, 45);
  
  // draw text
  // textFont(myFont_02);
  // textSize(12);
  // fill(0, 0, 0, 90);
  // text("Humidity", rwidth/4, h2);
  // text("Wind\n", rwidth/2, h2);
  // text("Precipitation\n", 3*rwidth/4, h2);
  
  // draw data
  fill(0);
  textSize(16);
  textFont(myFont_02);
  let h3 = 540;
  text(formatPercent(w.getHumidity()), rwidth/5 + 12, h3);
  text(nf(w.getWindSpeed(), 0, 1) + "mph", 2 * rwidth/5 + 4, h3);
  text(formatPercent(w.getPrecipitationChance('minutes')[0]), 3 * rwidth/5 - 4, h3);
  text(round(w.getApparentTemperature()) + "°", 4 * rwidth/5 - 12, h3);
}


// once the weather data arrives, look up this location
function lookupLocation() {
  // when the weather data is available, store the lat and lon to show later
  latitude = w.getLatitude();
  longitude = w.getLongitude();
  // request the name of the location for that lat and lon
  requestLocation(latitude, longitude, locationArrived, locationError);
}


// this function will run as soon as the location data arrives 
function locationArrived(data) {
  // the 'data' returned is fairly complicated, so parseLocation()
  // identifies common identifiers for US addresses
  place = parseLocation(data);
}


// this function will run if there's a problem getting the location data
function locationError(data) {
  message = 'Error';
}


// draw location once available
function drawLocationText() {
  if (place != null) {
    textSize(20);
    textFont(myFont_04);
    fill(255);
    noStroke();
    textAlign(CENTER);
    
    // display the city and state
    text(place.city + "," + place.state_short, rwidth/2, 50);
  }
}
