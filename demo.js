window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

var canvasEl = document.getElementById('waveform');
canvasEl.width = $(canvasEl).width();
canvasEl.height = $(canvasEl).height();
var ctx      = canvasEl.getContext( '2d' );

var g = new Graph(ctx);
g.marginX = 30;
g.marginY = 30;

g.make('OUT', context.destination);

var pet = new PUA(context);
var tuna = new Tuna(context);
tuna.defaultVisual = pet.Waveform;
tuna.eventHandler = function(event) { g.swallow(event) };
pet.eventHandler = function(event) { g.swallow(event) };

g.make('soundCloud', new pet.SoundCloud('https://soundcloud.com/lordemusic/royals'));

g.make('speech', new pet.Speaker(meSpeak));
// g.speaker.connect(context.destination);
// g.soundCloud.commentsEmitter.connect(g.speaker);

g.make('phaser', new tuna.Phaser({
                 rate: 1.2,                     //0.01 to 8 is a decent range, but higher values are possible
                 depth: 0.7,                    //0 to 1
                 feedback: 0.2,                 //0 to 1+
                 stereoPhase: 30,               //0 to 180
                 baseModulationFrequency: 700,  //500 to 1500
                 bypass: 0
             }));

// g.sc.connect(g.chorus);
// g.chorus.connect(context.destination);

//g.e.play()
//g.e.pause()

g.start()

function setup(){
	g.soundCloud.connect(g.phaser);
	g.soundCloud.commentsEmitter.connect(g.speech);
	g.speech.connect(g.OUT);
	g.phaser.connect(g.OUT);
}
