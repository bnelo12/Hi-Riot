// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/**********************************************************
This will stream pictures and gps data on request.
**********************************************************/

var tessel = require('tessel');
var gpsLib = require('gps-a2235h');
var camera = require('camera-vc0706').use(tessel.port['A']);

// You REALLY want async = true.
// Otherwise, it'll block ALL execution waiting for server response.
var url = matrix.org;
var method = "POST";
var postData = "Some data";
var async = true;

var request = new XMLHttpRequest();

// This function attached to the XMLHttpRequest "onload" property specifies how
// the HTTP response will be handled.
request.onload = function () {

	// Because of javascript's fabulous closure concept, the XMLHttpRequest "request"
	// object declared above is available in this function even though this function
	// executes long after the request is sent and long after this function is
	// instantiated. This fact is CRUCIAL to the workings of XHR in ordinary
	// applications.

	// You can get all kinds of information about the HTTP response.
	   var status = request.status; // HTTP response status, e.g., 200 for "200 OK"
	   var data = request.responseText; // Returned data, e.g., an HTML document.
}

request.open(method, url, async);

request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
// Or... request.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
// Or... whatever

// Actually sends the request to the server.
request.send(postData);


/**********************************************
This is the GPS instance.
**********************************************/

// GPS uses software UART, which is only available on Port C on Tessel 1
// we use Port C because it is most isolated from RF noise
// Port C doesn't exist on Tessel 2 so use Port A
var portToUse = 'C';

if (!tessel.port[portToUse]) {
  portToUse = 'A';
}

var gps = gpsLib.use(tessel.port[portToUse]);

// Wait until the module is connected
gps.on('ready', function () {
  // Emit coordinates when we get a coordinate fix
  gps.on('coordinates', function (coords) {
    //console.log('Lat:', coords.lat, 'Lon:', coords.lon, 'Timestamp:', coords.timestamp);
  });

  // Emit altitude when we get an altitude fix
  gps.on('altitude', function (alt) {
    //console.log('Got an altitude of', alt.alt, 'meters (timestamp:' + alt.timestamp + ')');
  });

  // Emitted when we have information about a fix on satellites
  gps.on('fix', function (data) {
    //console.log(data.numSat, 'fixed.');
  });

  gps.on('dropped', function(){
    // we dropped the gps signal
    	//console.log("gps signal dropped");
  });
});

gps.on('error', function(err){
  //console.log("got this error", err);
});


var notificationLED = tessel.led[3]; // Set up an LED to notify when we're taking a picture

// Wait for the camera module to say it's ready
camera.on('ready', function() {
  notificationLED.high();
  // Take the picture
  camera.takePicture(function(err, image) {
    if (err) {
      //console.log('error taking image', err);
    } else {
      notificationLED.low();
      // Name the image
      var name = 'picture-' + Math.floor(Date.now()*1000) + '.jpg';
      // Save the image
      	//console.log('Picture saving as', name, '...');
      process.sendfile(name, image);
      	//console.log('done.');
      // Turn the camera off to end the script
      camera.disable();
    }
  });
});

camera.on('error', function(err) {
  //console.error(err);
});
