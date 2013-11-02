function getName(o) { 
	if(o.input!==undefined){
		return o.name;
	}
   var funcNameRegex = /function (.{1,})\(/;
   var results = (funcNameRegex).exec((o).constructor.toString());
   return (results && results.length > 1) ? results[1] : "";
};

function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}
function bufferSound(event) {
	var request = event.target;
	var source = context.createBufferSource();
	source.buffer = context.createBuffer(request.response, false);
	mySource = source;
	safeAdd(g,mySource);
}

function safeAdd(g,n){
	
	if(n._nodeId===undefined){
		lastId += 1;
		n._nodeId = lastId;
		g.addNode(n._nodeId,{label: getName(n)})
		console.log("no id for " + getName(n) + ", giving it "+ n._nodeId);
	}
	renderGraph();
	
}

function renderGraph(){
	var foo = document.getElementById('graph-root');
	while (foo.firstChild) foo.removeChild(foo.firstChild);
	renderer.run(g, d3.select("svg g"));
}

function connect(n,m){
	if(m.input!==undefined){
		n.connect(m.input);
	// } else if(m.destination!==undefined){
	// 	n.connect(m.destination)
	} else {
		n.connect(m);
	}
	console.log("connected " + getName(n) + " to " + getName(m));
	safeAdd(g,n);
	safeAdd(g,m);
	// TODO: only supports one outgoing edge
	if(n._edgeIds===undefined){
		n._edgeIds = [];
	}
	n._edgeIds.push(g.addEdge(null,n._nodeId,m._nodeId))
	
	renderGraph();
}

function disconnect(n){
	var output = 0;
	console.log("disconnected output " + output + " of " + getName(n));
	n.disconnect(output);
	// TODO: only supports one outgoing edge
	if(n._edgeIds!==undefined){
		for(var i=0;i<n._edgeIds.length;i++){
			g.delEdge(n._edgeIds[i]);
		}
	}

	renderGraph();
}

// --- GLOBAL VARS (*gulp*)

var renderer = 0; // graph renderer
var g = 0; // graph

var context = 0; // audio

// audio nodes
var gain = 0; 
var tuna = 0; 
var delay = 0;
var phaser = 0;
var mySource;

var request = 0;

var lastId = -1;

function init(){
	
	console.log("init()")
	
	renderer = new dagreD3.Renderer();
	g = new dagreD3.Digraph();
 
	context = new webkitAudioContext();
	gain = context.createGain();

	// speech
	meSpeak.loadConfig("mespeak_config.json");
	meSpeak.loadVoice('voices/en/en-us.json');
	

	// setup tuna
	tuna = new Tuna(context);

	delay = new tuna.Delay({
	                feedback: 0.45,    //0 to 1+
	                delayTime: 150,    //how many milliseconds should the wet signal be delayed? 
	                wetLevel: 0.7,    //0 to 1+
	                dryLevel: 1,       //0 to 1+
	                cutoff: 20,        //cutoff frequency of the built in highpass-filter. 20 to 22050
	                bypass: 0
	            });


	phaser = new tuna.Phaser({
	                 rate: 1.2,                     //0.01 to 8 is a decent range, but higher values are possible
	                 depth: 0.7,                    //0 to 1
	                 feedback: 0.2,                 //0 to 1+
	                 stereoPhase: 30,               //0 to 180
	                 baseModulationFrequency: 700,  //500 to 1500
	                 bypass: 0
	             });
			 
	// load resource
	var nodes = [phaser,delay,gain,context.destination];
	for(var i=0; i < nodes.length; i++){
		safeAdd(g,nodes[i]);
	}
 
	request = new XMLHttpRequest();
	request.open('GET', 'misty.wav', true);
	request.responseType = 'arraybuffer';
	request.addEventListener('load', bufferSound, false);
	request.send();
}
