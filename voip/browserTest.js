"use strict";
console.log("Loading browser sdk");
var BASE_URL = "https://matrix.org";
var TOKEN = "MDAxOGxvY2F0aW9uIG1hdHJpeC5vcmcKMDAxM2lkZW50aWZpZXIga2V5CjAwMTBjaWQgZ2VuID0gMQowMDI3Y2lkIHVzZXJfaWQgPSBARG9vckJlbGw6bWF0cml4Lm9yZwowMDE2Y2lkIHR5cGUgPSBhY2Nlc3MKMDAyMWNpZCBub25jZSA9IFdmZ2NiRTFmUHl1cDtsQ1cKMDAyZnNpZ25hdHVyZSA0snBrzu8BYCFa1dQzwXpZZseSFolmGeEYLjmzjkhXDAo";
var USER_ID = "@DoorBell:matrix.org";
var ROOM_ID = "!GwJdOwNIRGeSElIrIY:matrix.org";

var audio = new Audio('doorbell.mp3');
var alarm = new Audio('alarm.mp3');
var alarmOn = false;

var client = matrixcs.createClient({
    baseUrl: BASE_URL,
    accessToken: TOKEN,
    userId: USER_ID
});
var call;

function disableButtons(place, answer, hangup) {
    document.getElementById("call").disabled = place;
}

function addListeners(call) {
    var lastError = "";
    call.on("hangup", function() {
        disableButtons(false, true, true);
        document.getElementById("result").innerHTML = (
            "<p>Call ended. Last error: "+lastError+"</p>"
        );
    });
    call.on("error", function(err) {
        lastError = err.message;
        call.hangup();
        disableButtons(false, true, true);
    });
}

window.onload = function() {
    disableButtons(true, true, true);
};

client.on("sync", function(state, prevState, data) {
    switch (state) {
        case "PREPARED":
          syncComplete();
        break;
   }
});

client.on("event", function(event) {
    if (event.event.type == "m.room.message") {
        if (event.event.content.body == "!lock") {
           document.getElementById("lockIndicator").style.backgroundColor="red";
        }
        else if (event.event.content.body == "!unlock") {
            document.getElementById("lockIndicator").style.backgroundColor="green";
        }
        else if (event.event.content.body == "!alarm") {
            if(alarmOn) {
                alarm.play();
                alarmOn = false;
            }
            else {
                alarm.pause();
                alarmOn = true;
            }
        }
    }
});

function syncComplete() {
    disableButtons(false, true, true);

    document.getElementById("call").onclick = function() {
        audio.play();
        sleep(1000);
        console.log("Placing call...");
        call = matrixcs.createNewMatrixCall(
            client, ROOM_ID
        );
        console.log("Call => %s", call);
        addListeners(call);
        call.placeVideoCall(
            document.getElementById("remote"),
            document.getElementById("local")
        );
        disableButtons(true, true, false);
    };

    client.on("Call.incoming", function(c) {
        console.log("Call ringing");
        disableButtons(true, false, false);
        document.getElementById("result").innerHTML = "<p>Incoming call...</p>";
        call = c;
        addListeners(call);
    });
}
client.startClient();

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}
