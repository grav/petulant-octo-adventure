window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

var canvasEl = document.getElementById('waveform');
canvasEl.width = $(canvasEl).width();
canvasEl.height = $(canvasEl).height();
var ctx      = canvasEl.getContext( '2d' );

var g = new Graph(ctx);
g.make('OUT', context.destination);

var pet = new PUA(context);
var tuna = new Tuna(context, pet);
tuna.callback = function(event) { g.swallow(event) };
pet.callback = function(event) { g.swallow(event) };

g.make('sc', new pet.SoundCloud('https://soundcloud.com/lordemusic/royals'));

g.make('speaker', new pet.Speaker(meSpeak));
g.speaker.visual = new pet.Waveform();
g.speaker.connect(context.destination);
g.sc.commentsEmitter.connect(g.speaker);

g.make('chorus', new tuna.Chorus({
                 rate: 10.5,
                 feedback: 0.2,
                 delay: 0.0045,
                 bypass: 0
             }));
g.chorus.visual = new pet.Waveform();

g.sc.connect(g.chorus);
g.chorus.connect(context.destination);

//g.e.play()
//g.e.pause()

g.start()
