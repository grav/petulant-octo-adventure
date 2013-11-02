window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

var canvasEl = document.getElementById('waveform');
canvasEl.width = $(canvasEl).width();
canvasEl.height = $(canvasEl).height();
var ctx      = canvasEl.getContext( '2d' );

var g = new Graph(ctx);
g.make('OUT', context.destination);

var tuna = new Tuna(context);
tuna.callback = function(event) { g.swallow(event) };
var pet = new PUA(context);
pet.callback = function(event) { g.swallow(event) };

var track_url = 'https://soundcloud.com/lordemusic/royals';

g.make('e', new pet.ExternalSound());

$.get('http://api.soundcloud.com/resolve.json?url='+track_url+'&client_id=a2f0745a136883f33e1b299b90381703', function (result) {
  console.log('Result', result);
  g.e.src = result.stream_url+'?client_id=a2f0745a136883f33e1b299b90381703';
});

g.make('chorus', new tuna.Chorus({
                 rate: 10.5,
                 feedback: 0.2,
                 delay: 0.0045,
                 bypass: 0
             }));

g.e.connect(g.chorus);
g.e.connect(context.destination);

//e.play()
//e.pause()

/*
var g = new dagre.Digraph();
var muh = { label: "Kevin Passy",  width: 144, height: 100 };
g.addNode("muh", muh);
g.addNode("kspacey",    { label: "Kevin Spacey",  width: 144, height: 100 });
g.addNode("swilliams",  { label: "Saul Williams", width: 160, height: 100 });
g.addNode("bpitt",      { label: "Brad Pitt",     width: 108, height: 100 });
g.addNode("hford",      { label: "Harrison Ford", width: 168, height: 100 });
g.addNode("lwilson",    { label: "Luke Wilson",   width: 144, height: 100 });
g.addNode("kbacon",     { label: "Kevin Bacon",   width: 121, height: 100 });

g.addEdge(null, "kspacey",   "muh");
g.addEdge(null, "kspacey",   "swilliams");
g.addEdge(null, "swilliams", "kbacon");
g.addEdge(null, "bpitt",     "kbacon");
g.addEdge(null, "hford",     "lwilson");
g.addEdge(null, "lwilson",   "kbacon");

canvasEl.width = $(canvasEl).width();
canvasEl.height = $(canvasEl).height();

function layout(g) {
  var layout = dagre.layout().run(g);
  layout.eachEdge(function(e, sId, dId, v){
    var s = layout.node(sId),
        d = layout.node(dId),
        p = new BezierPath();
    p.moveTo(s.x, s.y);
    for ( var i = 0, l = v.points.length; i < l; i++ ) {
      var point = v.points[i],
          x = point.x,
          y = point.y;
      p.lineTo(x, y);
    }
    p.lineTo(d.x, d.y);
    v.path = p;
  });
  return layout;
};

var l = layout(g);
function draw() {
  var ctx      = canvasEl.getContext( '2d' ),
      h        = canvasEl.height,
      w        = canvasEl.width;
  ctx.clearRect(0,0,w,h);
  ctx.textAlign = 'center';
  l.eachNode(function(u, v) {
    ctx.strokeRect(v.x-v.width/2, v.y-v.height/2, v.width, v.height);
    ctx.fillText(g.node(u).label, v.x, v.y);
  });
  //wave.draw(canvasEl, l.edge("_1").path, 100);
  l.eachEdge(function(e, sId, dId, v){
    wave.draw(canvasEl, v.path, 100);
  });
}

//var inID = setInterval(draw, 1000/10);
*/
