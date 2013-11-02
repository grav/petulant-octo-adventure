(function(window){
  var Graph = function(ctx) {
    this.g = new dagre.Digraph();
    this.lastId = 1;
    this._ctx = ctx;
  }
  Graph.prototype = Object.create(null, {
    nextId: {
      value: function(){
        return this.lastId++;
      }
    },
    font: {
      get: function() {
        return "" + this.fontSize + "px";
      }
    },
    frameRate: {
      get: function() {
        return this._frameRate || 20;
      },
      set: function(value) {
        this._frameRate = value;
      }
    },
    refresh: {
      value: function() {
        this.clear();
        this.render();
      }
    },
    start: {
      value: function() {
        var self = this,
            fun  = function() {
          self.refresh();
          self._timer = setTimeout(fun, 1000/self.frameRate);
        };
        fun();
      }
    },
    stop: {
      value: function() {
        clearTimeout(self._timer);
      }
    },
    fontSize: {
      get: function() {
        return this._fontSize || 10;
      },
      set: function(value) {
        this._fontSize = value;
        this._layout = null;
      }
    },
    swallow: {
      value: function(event) {
        var self = this,
            g = self.g,
          nodeId = event.self._nodeId;
        if(nodeId && g.hasNode(nodeId)) {
          if(event.type === "connected") {
            var target = event.target._nodeId;
            if(target && g.hasNode(target)) {
              g.addEdge(null, nodeId, target);
            }
          } else if(event.type === "disconnected") {
            var out = g.outEdges(nodeId);
            console.log(out);
          }
        }
      }
    },
    clear: {
      value: function() {
        var w = ctx.canvas.width,
            h = ctx.canvas.height;
        this._ctx.clearRect(0, 0, w, h);
      }
    },
    layout: {
      get: function() {
        if(!this._layout) {
          var self = this,
              copy = self.g.copy();
          ctx.font = self.font;
          copy.eachNode(function(u, value){
            var c = jQuery.extend({}, value),
                marginX = 10,
                marginY = 10,
                width = ctx.measureText(value.label).width + marginX*2,
                height = self.fontSize + marginY*2;

            c.width = width;
            c.height = height;
            copy.node(u, c);
          });
          var layout = dagre.layout().run(copy);
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
          this._layout = layout;
        }
        return this._layout;
      }
    },
    render: {
      value: function(){
        var ctx = this._ctx,
            g = this.g,
            layout = this.layout;
        ctx.textAlign = 'center';
        ctx.font = this.font;
        layout.eachNode(function(u, v) {
          ctx.strokeRect(v.x-v.width/2, v.y-v.height/2, v.width, v.height);
          ctx.fillText(g.node(u).label, v.x, v.y);
        });
        layout.eachEdge(function(e, sId, dId, v){
          var s = g.node(sId),
              visual = s.value.visual;
          if(visual){
            visual.draw(ctx, v.path);
          } else {
            v.path.draw(ctx);
          }
        });
      }
    },
    make: {
      value: function(name, value){
        if(!value._nodeId)
          value._nodeId = this.nextId();
        this.g.addNode(value._nodeId, {label:name, value: value});
        this[name] = value;
        this._layout = null;
      }
    }
  });
  window.Graph = Graph;

})(this);
