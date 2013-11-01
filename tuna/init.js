function bufferSound(event) {
	var request = event.target;
	var source = context.createBufferSource();
	source.buffer = context.createBuffer(request.response, false);
	mySource = source;
	
}

 
var context = new webkitAudioContext();
var gain = context.createGain();
// gain.connect(context.destination);

// monkey patch connect, just for the heck of it

function addLogging(n){
	n._connect = n.connect;
	n.connect = function(m){
		console.log("connected " + n + " to " + m);
		n._connect(m);
		n._connectedTo = m;
	}
	n._disconnect = n.disconnect;
	n.disconnect = function(x){
		console.log("disconnected output " + x + " of " + n);
		n._connectedTo = null;
	}
}

addLogging(gain);


// setup tuna
var tuna = new Tuna(context);

var delay = new tuna.Delay({
                feedback: 0.45,    //0 to 1+
                delayTime: 150,    //how many milliseconds should the wet signal be delayed? 
                wetLevel: 0.7,    //0 to 1+
                dryLevel: 1,       //0 to 1+
                cutoff: 20,        //cutoff frequency of the built in highpass-filter. 20 to 22050
                bypass: 0
            });


var phaser = new tuna.Phaser({
                 rate: 1.2,                     //0.01 to 8 is a decent range, but higher values are possible
                 depth: 0.7,                    //0 to 1
                 feedback: 0.2,                 //0 to 1+
                 stereoPhase: 30,               //0 to 180
                 baseModulationFrequency: 700,  //500 to 1500
                 bypass: 0
             });
			 
// load resource
var mySource;
 
var request = new XMLHttpRequest();
request.open('GET', 'misty.wav', true);
request.responseType = 'arraybuffer';
request.addEventListener('load', bufferSound, false);
request.send();
