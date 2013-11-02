window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

var tuna = new Tuna(context);
var pet = new PUA(context);

var track_url = 'https://soundcloud.com/lordemusic/royals';

var e = new pet.ExternalSound();

$.get('http://api.soundcloud.com/resolve.json?url='+track_url+'&client_id=a2f0745a136883f33e1b299b90381703', function (result) {
  console.log('Result', result);
  e.src = result.stream_url+'?client_id=a2f0745a136883f33e1b299b90381703';
});

var chorus = new tuna.Chorus({
                 rate: 10.5,
                 feedback: 0.2,
                 delay: 0.0045,
                 bypass: 0
             });

e.connect(chorus.input);
chorus.connect(context.destination);
e.play()
e.pause()

var w = new pet.Waveform();
var canvasEl = document.getElementById('waveform');
chorus.connect(w.input)
var inID = setInterval(function(){
  w.draw(canvasEl);
}, 1000/20);

