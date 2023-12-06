// This code handles loading and drawing Apple's weather 
// icons from SVG files exported from the SF Symbols app.
// The implementation here relies on the fact that each of those .svg files
// contain a single "path" object and will not work with other SVG files.

// To use it:
// 1. Add loadIcons() to preload()
// 2. Inside draw, something like: drawIcon('Hail', width/2, height/2, 150); 


let iconData = { };

// Mapping of each 'condition code' to the name of an icon file.
// Only 25 of the available 48 icons currently being used
// to cover the 40 conditions returned by the WeatherKit API.
const iconLookup = {
  "Blizzard": "wind.snow",
  "BlowingSnow": "wind.snow",
  "Breezy": "wind",
  "Clear": "sun.max",
  "Cloudy": "cloud",
  "Drizzle": "cloud.drizzle",
  "Dust": "sun.dust",
  "Flurries": "cloud.snow",
  "Fog": "cloud.fog",
  "FreezingDrizzle": "cloud.sleet",  // not ideal
  "FreezingRain": "cloud.hail",  // not ideal
  "Frigid": "thermometer.low",
  "Hail": "cloud.hail",
  "Haze": "sun.haze",
  "HeavyRain": "cloud.heavyrain",
  "HeavySnow": "snowflake",  // not ideal
  "Hot": "thermometer.high",
  "Hurricane": "hurricane",
  "IsolatedThunderstorms": "cloud.sun.bolt",
  "MixedRainAndSleet": "cloud.hail",  // not ideal
  "MixedRainAndSnow": "cloud.sleet",  // not ideal
  "MixedRainfall": "cloud.drizzle",
  "MixedSnowAndSleet": "cloud.sleet",  // ok, but
  "MostlyClear": "sun.min",  // not ideal
  "MostlyCloudy": "cloud.sun",  // undifferentiated
  "PartlyCloudy": "cloud.sun",
  "Rain": "cloud.rain",
  "ScatteredShowers": "cloud.drizzle",
  "ScatteredSnowShowers": "cloud.snow",  // undifferentiated
  "ScatteredThunderstorms": "cloud.sun.bolt",
  "SevereThunderstorm": "cloud.bolt.rain",
  "Showers": "cloud.drizzle",
  "Sleet": "cloud.sleet",
  "Smoke": "smoke",
  "Snow": "snowflake",
  "SnowShowers": "cloud.snow",
  "Thunderstorm": "cloud.bolt",
  "Tornado": "tornado",
  "TropicalStorm": "tropicalstorm",
  "Windy": "wind",
};


function loadIcons() {
  for (const [code, icon] of Object.entries(iconLookup)) {
    iconData[code] = loadXML("icons/" + icon + ".svg");
  }
}


function drawIcon(code, x, y, diameter) {
  push();
  translate(x, y);

  // The size the SVG files were exported at, even though
  // they start at 0,0 and extend to their width and height.
  const ICON_SIZE = 128;
  // Use ICON_SIZE as the default if not specified.
  diameter = diameter || ICON_SIZE;   

  let xml = iconData[code];
  let origWidth = xml.getNum('width');
  let origHeight = xml.getNum('height');
  scale(diameter / ICON_SIZE);
  // center the image
  translate(-origWidth/2, -origHeight/2);

  let pd = xml.getChild('g').getChild('path');
  let path = new Path2D(pd.getString("d"));
  drawingContext.fill(path);

  pop();
}
