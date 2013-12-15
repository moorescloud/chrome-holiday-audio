/* Do some fun stuff with Javascript via UDP
   Eventually we will implement the SecretAPI here.  Eventually. */

// Constructor method for the holiday using SecretAPI
// Requires a string 'address' (i.e. IP address 192.168.0.20) or resolvable name (i.e. 'light.local')
//
function Holiday(address) {
  this.address = address;
  console.log("Address set to ", this.address)
  
  this.NUM_GLOBES = 50;
  this.FRAME_SIZE = 160;      // Secret API rame size
  this.FRAME_IGNORE = 10;     // Ignore the first 10 bytes of frame
  socketId = null;         // No socket number just yet

  this.closeSocket = closeSocket;
  this.setglobe = setglobe;
  this.setstring = setstring;
  this.getglobe = getglobe;
  this.chase = chase;
  this.render = render;

  var globes = new Uint8Array(160);
  this.globes = globes;
  console.log('Array created');

  // Fill the header of the array with zeroes
  for (i=0; i < this.FRAME_IGNORE; i++) {
    this.globes[i] = 0x00;
  }

  // Create the socket we'll use to communicate with the Holiday
  chrome.socket.create('udp', {},
   function(socketInfo) {           // Callback when creation is complete
      // The socket is created, now we want to connect to the service
      socketId = socketInfo.socketId;
      console.log('socket created ', socketInfo.socketId);
    }
  );

  function closeSocket() {
    // Clean up after ourselves;
    chrome.socket.destroy(socketId);
    console.log("Socket destroyed");
  }

  function setglobe(globenum, r, g, b) {
    // Sets a globe's color
    if ((globenum < 0) || (globenum >= this.NUM_GLOBES)) {
      return;
    }

    baseptr = this.FRAME_IGNORE + 3*globenum;
    globes[baseptr] = r;
    globes[baseptr+1] = g;
    globes[baseptr+2] = b; 

    return;
  }

  function setstring(r, g, b) {
    // Sets the whole string to the same color very quickly.
    baseptr = this.FRAME_IGNORE;
    for (j = 0; j < this.NUM_GLOBES; j++) {
      globes[baseptr] = r;
      baseptr +=1
      globes[baseptr+1] = g;
      baseptr +=1
      globes[baseptr+2] = b;
      baseptr +=1
    }
    return;
  }

  function chase(r, g, b) {
    // Move all the globes up one position
    // Set the first globe to the passed RGB
    baseptr = this.FRAME_IGNORE;
    for (j = 0; j < (this.NUM_GLOBES-1); j++) {   // Move up
      globes[baseptr+3] = globes[baseptr];        // move R
      baseptr += 1;
      globes[baseptr+3] = globes[baseptr];        // Move G
      baseptr += 1;     
      globes[baseptr+3] = globes[baseptr];        // Move B
      baseptr += 1;  
    }
    this.setglobe(0, r, g, b);                    // Add bottom
  }

  function getglobe() {
    // Sets a globe's color
    if ((globenum < 0) || (globenum >= this.NUM_GLOBES)) {
      return;
    }

    baseptr = this.FRAME_IGNORE + 3*globenum;
    r = globes[baseptr];
    g = globes[baseptr+1];
    b = globes[baseptr+2];
    return [r,g,b];
  }


  function render() {
    //console.log("Holiday.render");
    //var locaddr = this.address;
    var glbs = this.globes;
    var sid = socketId;
    if (sid == null) {
      console.log("No socket abort render");
      return;
    }

    // Connect via the socket
    chrome.socket.connect(socketId, this.address, 9988, function(result) {

       // We are now connected to the socket so send it some data
      chrome.socket.write(socketId, glbs.buffer,
       function(sendInfo) {
         //console.log("wrote " + sendInfo.bytesWritten);
         return;
      });
    });
    return;
  }

}

// Copied wholesale (and thankfully) from 
// http://ianreah.com/2013/02/28/Real-time-analysis-of-streaming-audio-data-with-Web-Audio-API.html
//
$(function () {
    // Future-proofing...
    var context;
    if (typeof AudioContext !== "undefined") {
        context = new AudioContext();
    } else if (typeof webkitAudioContext !== "undefined") {
        context = new webkitAudioContext();
    } else {
        $(".hideIfNoApi").hide();
        $(".showIfNoApi").show();
        return;
    }

    // Overkill - if we've got Web Audio API, surely we've got requestAnimationFrame. Surely?...
    // requestAnimationFrame polyfill by Erik Möller
    // fixes from Paul Irish and Tino Zijdel
    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
                                    || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };

    // Create the analyser
    var analyser = context.createAnalyser();
    analyser.fftSize = 256;
    console.log("analyzer: ", analyser.frequencyBinCount, analyser.frequencyBinCount);
    var frequencyData = new Uint8Array(analyser.frequencyBinCount);
    var timeData = new Uint8Array(analyser.frequencyBinCount);

    // Set up the visualisation elements
    var visualisation = $("#visualisation");
  var barSpacingPercent = 100 / analyser.frequencyBinCount;
    for (var i = 0; i < analyser.frequencyBinCount; i++) {
      $("<div/>").css("left", i * barSpacingPercent + "%")
      .appendTo(visualisation);
    }
    var bars = $("#visualisation > div");

    function makePrettyHolidayFromData(datas) {

      if (hol == null)
        return;

      // Let's sum the bytes and hope for the best here
      // Start off simple, with individual byte values which become the color.
      for (i=0; i < hol.NUM_GLOBES; i++) {

        if (datas[i] < BAR_BLUE) {
          c = [ 0x00, 0x00, 0x80 ];
        } else if ( datas[i] < BAR_CYAN ) {
          c = [ 0x00, 0x80, 0x80 ];        
        } else if ( datas[i] < BAR_GREEN ) {
          c = [ 0x00, 0x80, 0x00 ];
        } else if ( datas[i] < BAR_YELLOW ) {
          c = [ 0x80, 0x80, 0x00 ];
        } else {
          c = [ 0x80, 0x00, 0x00 ];
        }
        hol.setglobe(i, c[0], c[1], c[2]);
      }
      hol.render();
    }

    // Get the frequency data and update the visualisation
    function update() {
        //console.log('update');
        requestAnimationFrame(update);

        analyser.getByteFrequencyData(frequencyData);
        //console.log(frequencyData);

        //analyser.getByteTimeDomainData(timeData);
        makePrettyHolidayFromData(frequencyData);

        bars.each(function (index, bar) {
            bar.style.height = frequencyData[index] + 'px';
        });
    };

    // Hook up the audio routing...
    // player -> analyser -> speakers
  // (Do this after the player is ready to play - https://code.google.com/p/chromium/issues/detail?id=112368#c4)
  $("#player").bind('canplay', function() {
    var source = context.createMediaElementSource(this);
    source.connect(analyser);
    analyser.connect(context.destination);
  });

    // Kick it off...
    update();
});

// OK, instance the Holiday
var hol = null;

// Start Demo 
function demoStart() {
  
  console.log("demoStart");
  hol = new Holiday($('#selector').val())
  $('#thebutton').val('Stop');
  return;

}
  
// Stop Demo 
function demoStop() {
  
  //
  // Insert IoTAS Code
  //
  console.log("demoStop");
  hol.closeSocket();
  hol = null;
  $('#thebutton').val('Start');
  return;
  
}

function dobutton() {
  console.log("dobutton");
  return;
}

var buttonState = false;

// Lordy, this is one of the reasons I hate Javascript
// And it's not Javascript's fault.  It's the DOM.
// We need to wait until the DOM has loaded before we can fire off all this.
// 
$( document ).ready( function() {
  console.log("Doing the ready");
  // And here's the stuff we do.
  $("#thebutton").click(function () {
    if (buttonState == false) {
      buttonState = true;
      demoStart();
    } else {
      buttonState = false;
      demoStop();
    }
    console.log(buttonState);
    console.log($('#selector').val())
  });
});

var BAR_BLUE = 0x10;
var BAR_CYAN = 0x40;
var BAR_GREEN = 0x80;
var BAR_YELLOW = 0xc0;
