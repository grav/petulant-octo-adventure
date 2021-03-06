window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

var canvasEl = document.getElementById('waveform');
canvasEl.width = $(canvasEl).width();
canvasEl.height = $(canvasEl).height();
var ctx      = canvasEl.getContext( '2d' );

var g = new Graph(ctx);
g.nodeSep = 100;
g.rankSep = 100;
g.marginX = 30;
g.marginY = 30;

g.make('OUT', context.destination);

var pet = new PUA(context);
var tuna = new Tuna(context);
tuna.defaultVisual = pet.Waveform;
tuna.eventHandler = function(event) { g.swallow(event) };
pet.eventHandler = function(event) { g.swallow(event) };

g.make('speech', new pet.Speaker());

g.make('phaser', new tuna.Phaser({
                 rate: 1.2,                     //0.01 to 8 is a decent range, but higher values are possible
                 depth: 0.7,                    //0 to 1
                 feedback: 0.2,                 //0 to 1+
                 stereoPhase: 30,               //0 to 180
                 baseModulationFrequency: 700,  //500 to 1500
                 bypass: 0
             }));


g.start()

function setup(){
	g.make('soundCloud', new pet.SoundCloud('https://soundcloud.com/madonna/mdna-preview-beautiful-killer'));
	g.soundCloud.connect(g.phaser);
	g.soundCloud.commentsEmitter.connect(g.speech);
	g.speech.output.gain.value=3
	g.speech.connect(g.OUT);
	g.phaser.connect(g.OUT);
}
