var analyser;
var dogBarkingBuffer = null;
var source;
var intervalID;
var canvasEl;
var imgEl;
// Fix up prefixing
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

function loadDogSound(url) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

        console.log('Muh');
  // Decode asynchronously
  request.onload = function() {
    console.log('Loaded');
    context.decodeAudioData(request.response, function(buffer) {
      dogBarkingBuffer = buffer;
      source = context.createBufferSource();
      source.buffer = buffer;
      analyser = context.createAnalyser();
      analyser.fftSize = 32;
      source.connect(analyser);
      source.connect(context.destination);
      console.log('Decoded');
    });
  }
  request.send();
}
loadDogSound('dog-bark.wav')
function play() {
  canvasEl = document.getElementById('waveform');
  imgEl = document.getElementById('muh');
  clearTimeout(intervalID);
  process();
  source.start(0);
}

function stop() {
  source.stop(0);
  clearTimeout(intervalID);
}

function process(){
  var wavedata = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(wavedata);

  var
      ctx     = canvasEl.getContext( '2d' ),
      h       = canvasEl.height,
      w       = canvasEl.width;

  //ctx.rotate(20*Math.PI/180);
  ctx.lineWidth   = 1;
  ctx.strokeStyle = "black";
  ctx.clearRect( 0, 0, w, h );

  //console.log(wavedata[ 0 ], wavedata.length, w, h);
  ctx.beginPath();
  ctx.moveTo( 0, h / 2 );
  for ( var i = 0, l = wavedata.length; i < l; i++ ) {
    var x = i * ( w/l ),
        y = h * wavedata[i]/256;
    ctx.lineTo( x, y);
    ctx.drawImage(imgEl,x,y);
  }
  ctx.stroke();
  ctx.closePath();
  //ctx.rotate(-(20*Math.PI/180));
  intervalID = setTimeout(process, 1000/20);
}
