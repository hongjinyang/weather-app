// This code is a simple interface to Apple's WeatherKit API.
// It handles retrieving new data from .json files included in
// a sketch, or live data for a latitude/longitude via a server.

// Usage:
// requestWeather(42.3596764, -71.0958358);  // MIT
// requestWeather('data.json');  // read from a file
// requestWeather('gps');  // current GPS location

// Also possible to do with a callback:
// requestWeather('gps', function() {
//   ...do something here when the weather is updated
// });

// Or a second callback that handles errors:
// requestWeather('gps', function() {
//   ...do something here when the weather is updated
// }, function(errorMessage) {
//   console.error(errorMessage);  // print the message to the console
// });

// You can read about the API in more detail here:
// https://developer.apple.com/documentation/weatherkitrestapi/

function requestWeather() {
  "use strict";

  function Weather() {
    const self = this;
    self.ready = false;

    let data = null;
    let units = 'imperial';

    let userLoadCallback = null;
    let userErrorCallback = null;


    // TIME

    // Returns the time using the Moment class (for easier handling)
    // Could be called getTimeMoment(), but the vast majority of users
    // will be using this function, and getTime() is so much less awkward.
    this.getTime = function(range) {
      if (range) {
        let times = gatherRange(range, 'forecastStart');
        return times.map(value => new Moment(value));

      } else {
        return new Moment(data.currentWeather.asOf);
      }
    };


    // return the time or a series of times as a JavaScript Date object
    this.getTimeDate = function(range) {
      if (range) {
        let times = gatherRange(range, 'forecastStart');
        return times.map(value => new Date(value));

      } else {
        return new Date(data.currentWeather.asOf);
      }
    };


    // CONDITIONS

    // get the condition code as text with no spaces (suitable for mapping to an icon or image)
    this.getConditionCode = function(range) {
      return range ? gatherRange(range, 'conditionCode') : data.currentWeather.conditionCode;
    };


    // get the weather conditions in a more human-readable format
    // (i.e. 'MixedRainAndSnow' becomes 'Mixed Rain & Snow'
    this.getConditionText = function(range) {
      if (range) {
        return this.getConditionCode(range).map((code) => conditionCodeToText(code));
      } else {
        return conditionCodeToText(this.getConditionCode());
      }
    }


    // TEMPERATURE

    this.getTemperature = function(range) {
      if (range === 'days') {
        throw TypeError("Use getTemperatureMin('days') and getTemperatureMax('days') instead");
      } else if (range == 'minutes') {
        throw TypeError("getTemperature('minutes') not available, only getTemperature() and getTemperature('hours')");
      }
      if (range) {
        return gatherRange(range, 'temperature').map(value => convertCelsius(value));
      } else {
        return convertCelsius(data.currentWeather.temperature);
      }
    };


    // get the minimum daily temperature
    this.getTemperatureMin = function(range) {
      if (range !== 'days') {
        throw TypeError("Only getTemperatureMin('days') is available");
      }
      return convertCelsius(gatherRange(range, 'temperatureMin'));
    };


    // get the maximum daily temperature
    this.getTemperatureMax = function(range) {
      if (range !== 'days') {
        throw TypeError("Only getTemperatureMax('days') is available");
      }
      return convertCelsius(gatherRange(range, 'temperatureMax'));
    };


    // what the temperature feels like
    this.getApparentTemperature = function(range) {
      if (range) {
        if (range == 'hours') {
          return convertCelsius(gatherRange(range, 'temperatureApparent'));
        } else {
          throw TypeError('getApparentTemperature() only works with "hours"');
        }
      } else {
        return convertCelsius(data.currentWeather.temperatureApparent);
      }
    };


    // PRECIPITATION

    // percent chance of precipitation (0..1), a range is required
    this.getPrecipitationChance = function(range) {
      if (range) {
        return gatherRange(range, 'precipitationChance');
      } else {
        throw TypeError('getPrecipitationChance() requires "days", "minutes", or "hours"');
      }
    };


    // precipAccumulation for DarkSky, and was measured in centimeters
    // TODO Confirm the amount here is still centimeters
    this.getPrecipitationAmount = function(range) {
      if (range) {
        if (range == 'hours' || range == 'days') {
          return convertCentimeters(gatherRange(range, 'precipitationAmount'));
        } else {
          throw TypeError('getPrecipitationAmount() only works with "hours" and "days"');
        }
      } else {
        return convertCentimeters(data.currentWeather.precipitationAmount);
      }
    };


    // DarkSky used millimeters per hour; undocumented for WeatherKit
    // TODO Figure out whether centimeters being used here
    this.getPrecipitationIntensity = function(range) {
      if (range) {
        if (range == 'hours' || range == 'minutes') {
          return convertMillimeters(gatherRange(range, 'precipitationIntensity'));
        } else {
          throw TypeError('getPrecipitationIntensity() only works with "hours" and "minutes"');
        }
      } else {
        return convertMillimeters(data.currentWeather.precipitationIntensity);
      }
    };


    this.getPrecipitationType = function(range) {
      if (range) {
        if (range == 'days' || range == 'hours') {
          return gatherRange(range, 'precipitationType');
        } else {
          throw TypeError('getPrecipitationType() only works with "days" and "hours"');
        }
      } else {
        return data.currentWeather.precipitationType;
      }
    }


    // WIND

    // wind speed in miles per hour
    this.getWindSpeed = function(range) {
      if (range) {
        if (range == 'hours' || range == 'daytime' || range == 'overnight') {
          return convertKilometers(gatherRange(range, 'windSpeed'));
        } else {
          throw TypeError('getWindSpeed() only works with "hours", "daytime", and "overnight"');
        }
      } else {
        return convertKilometers(data.currentWeather.windSpeed);
      }
    };


    // wind direction in degrees (0..359), but only if getWindSpeed() is not 0
    this.getWindDirection = function(range) {
      if (range) {
        if (range == 'hours' || range == 'daytime' || range == 'overnight') {
          return gatherRange(range, 'windDirection');
        } else {
          throw TypeError('getWindDirection() only works with "hours", "daytime", and "overnight"');
        }
      } else {
        return data.currentWeather.windDirection;
      }
    };


    this.getWindGust = function(range) {
      if (range) {
        if (range == 'hours') {
          return convertKilometers(gatherRange(range, 'windGust'));
        } else {
          throw TypeError('getWindGust() only works with "hours"');
        }
      } else {
        return convertKilometers(data.currentWeather.windGust);
      }
    };


    // OTHER

    // returns humidity percentage as number (0..1)
    this.getHumidity = function(range) {
      if (range) {
        if (range == 'hours' || range == 'daytime' || range == 'overnight') {
          return gatherRange(range, 'humidity');
        } else {
          throw TypeError('getHumidity() only works with "hours", "daytime", and "overnight"');
        }
      } else {
        return data.currentWeather.humidity;
      }
    };


    // percent of sky covered by clouds (0..1)
    this.getCloudCover = function(range) {
      if (range) {
        if (range == 'hours' || range == 'daytime' || range == 'overnight') {
          return gatherRange(range, 'cloudCover');
        } else {
          throw TypeError('getCloudCover() only works with "hours", "daytime", and "overnight"');
        }
      } else {
        return data.currentWeather.cloudCover;
      }
    };

    this.getLatitude = function() {
      let meta = data.currentWeather.metadata;
      return meta.latitude;
    };
    
    
    this.getLongitude = function() {
      let meta = data.currentWeather.metadata;
      return meta.longitude;
    };

    // change units betweeen metric and imperial (default is imperial)
    this.setUnits = function(newUnits) {
      if (newUnits == 'metric' || newUnits == 'imperial') {
        units = newUnits;
      } else {
        throw TypeError('Units must be either "metric" or "imperial". The default is "imperial".');
      }
    }


    // get the original JSON object with all weather data
    this.getData = function() {
      return data;
    }


    // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

    // Internal functions, you can safely ignore these


    function convertCelsius(what) {
      if (what instanceof Array) {
        return what.map((value) => convertCelsius(value));
      } else {
        return units == 'metric' ? what : (what * 1.8 + 32);
      }
    }


    function convertKilometers(what) {
      if (what instanceof Array) {
        return what.map((value) => convertKilometers(value));
      } else {
        return units == 'metric' ? what : (what / 1.609344);
      }
    }


    function convertMillimeters(what) {
      if (what instanceof Array) {
        return what.map((value) => convertMillimeters(value));
      } else {
        return units == 'metric' ? what : (what / 25.4);
      }
    }


    function convertCentimeters(what) {
      if (what instanceof Array) {
        return what.map((value) => convertMillimeters(value));
      } else {
        return units == 'metric' ? what : (what / 2.54);
      }
    }


    function gatherRange(range, name) {
      if (range === 'minutes') {
        if (data.hasOwnProperty('forecastNextHour')) {
          if (data.forecastNextHour.hasOwnProperty('minutes')) {
            return gatherField(name, data.forecastNextHour.minutes);
          } else {
            console.error(`No ${range} available for ${name} in this forecast`);
            return null;
          }
        }

      } else if (range === 'hours') {
        if (data.hasOwnProperty('forecastHourly')) {
          return gatherField(name, data.forecastHourly.hours);
        } else {
          console.error(`No ${range} available for ${name} in this forecast`);
          return null;
        }

      } else if (range === 'days') {
        if (data.hasOwnProperty('forecastDaily')) {
          return gatherField(name, data.forecastDaily.days);
        } else {
          console.error(`No ${range} available for ${name} in this forecast`);
          return null;
        }

      } else if (range == "daytime") {
        if (data.hasOwnProperty('forecastDaily')) {
          return gatherSubField('daytimeForecast', name, data.forecastDaily.days);
        } else {
          console.error(`No ${range} available for ${name} in this forecast`);
          return null;
        }

      } else if (range == "overnight") {
        if (data.hasOwnProperty('forecastDaily')) {
          return gatherSubField('overnightForecast', name, data.forecastDaily.days);
        } else {
          console.error(`No ${range} available for ${name} in this forecast`);
          return null;
        }

      } else {
        throw TypeError("Use 'days', 'hours', or 'minutes' for the range");
      }
    }


    function gatherField(name, array) {
      var outgoing = [ ];
      var len = array.length;
      for (var i = 0; i < len; i++) {
        outgoing.push(array[i][name]);
      }
      return outgoing;
    }


    function gatherSubField(parent, name, array) {
      var outgoing = [ ];
      var len = array.length;
      for (var i = 0; i < len; i++) {
        outgoing.push(array[i][parent][name]);
      }
      return outgoing;
    }


    function loadCallback(newData) {
      //console.log('got load');
      //self.data = data;  // keep a copy of the original
      data = newData;

      //self.currently = data.currentWeather;
      //self.minutely = data.forecastNextHour;
      //self.hourly = data.forecastHourly;
      //self.daily = data.forecastDaily;

      self.ready = true;

      if (userLoadCallback != null) {
        userLoadCallback(self);
      }
    }


    function errorCallback(response) {
      console.error('Error while trying to retrieve the weather:');
      console.error(response);

      if (userErrorCallback != null) {
        userErrorCallback(response);
      }
    }


    // https://stackoverflow.com/a/7888303
    function conditionCodeToText(code) {
      return code.replace('And', ' &').match(/([A-Z]?[^A-Z]*)/g).slice(0, -1).join(" ");
    }


    // Round a number to a specific number of decimal places.
    // Unlike nf(), the result will still be a Number, not a String.
    // via https://www.jacklmoore.com/notes/rounding-in-javascript/
    function round(value, decimals) {
      return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }


    this.requestForecast = function() {
      let args = Array.from(arguments);  // otherwise pop() will not work
      if (args.length > 0) {
        if (typeof args[args.length-1] === 'function') {
          // at least one callback, are there two?
          if (args.length > 1 && typeof args[args.length-2] === 'function') {
            // contains both load and error callbacks
            userErrorCallback = args.pop();
          }
          userLoadCallback = args.pop();
        }
      }
      if (args.length === 1) {
        if (args[0] != 'gps') {
          loadJSON(args[0], loadCallback, errorCallback);
        } else {
          if (navigator.geolocation) {
            print('Getting GPS location...');
            navigator.geolocation.getCurrentPosition(function(position) {
              // Four decimal places should be enough for weather forecast location
              // https://www.forensicdjs.com/blog/gps-coordinates-many-decimal-places-need/
              let lat = round(position.coords.latitude, 4);
              let lon = round(position.coords.longitude, 4);
              self.requestForecast(lat, lon);
            },
            function (error) {
              switch (error.code) {
                case error.TIMEOUT: errorCallback('Position timeout'); break;
                case error.POSITION_UNAVAILABLE: errorCallback('Position unavailable'); break;
                case error.PERMISSION_DENIED: errorCallback('Location permission denied'); break;
                default: errorCallback('Unknown location error'); break;
              }
            });
          } else {
            errorCallback('This browser does not support navigator.geolocation');
          }
        }
      } else if (args.length === 2) {
        let lat = args[0];
        let lon = args[1];
        // By default, we route requests to a server that caches requests when
        // talking to the WeatherKit REST API. This prevents everyone from needing
        // to sign up for an API key, and it also helps insulate folks from errors.
        // For instance, if you accidentally put requestWeather() in draw(),
        // you'll use thousands of API calls, which can get expensive quickly.
        // (Because draw() runs at 60 times a second, you'll get to 1,000 calls
        // in less than 17 seconds.)
        let url = "https://weather.fathom.info/forecast/" + lat + "," + lon;
        console.log('Loading weather from ' + url);
        loadJSON(url, loadCallback, errorCallback);

      } else {
        console.log(arguments);
        console.log('Use requestWeather(filename), requestWeather(lat, lon), or requestWeather("gps")');
      }
    };
  }

  let w = new Weather();
  // Use apply() to pass arguments directly to another function
  w.requestForecast.apply(null, arguments);
  return w;
}