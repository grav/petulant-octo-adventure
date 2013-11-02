(function(window){
  var Graph = function(ctx) {
    this.g = new dagre.Digraph();
    this.lastId = 1;
    this._ctx = ctx;
  }
  Graph.prototype = Object.create({}, {
    nextId: {
      value: function(){
        return this.lastId++;
      }
    },
    visualHeight: {
      enumerable: true,
      writable:true,
      value:50
    },
    marginX: {
      enumerable: true,
      get: function() {
        return this._marginX || 10;
      },
      set: function(value) {
        this._marginX = value;
        this._layout = null;
      }
    },
    marginY: {
      enumerable: true,
      get: function() {
        return this._marginY || 10;
      },
      set: function(value) {
        this._marginY = value;
        this._layout = null;
      }
    },
    font: {
      enumerable: true,
      get: function() {
        return "" + this.fontSize + "px " + this.fontFamily;
      }
    },
    fontFamily: {
      enumerable: true,
      get: function() {
        return this._fontFamily || "sans-serif";
      },
      set: function(value) {
        this._fontFamily = value;
      }
    },
    fontSize: {
      enumerable: true,
      get: function() {
        return this._fontSize || 10;
      },
      set: function(value) {
        this._fontSize = value;
        this._layout = null;
      }
    },
    nodeSep: {
      enumerable: true,
      get: function() {
        return this._nodeSep;
      },
      set: function(value) {
        this._nodeSep = value;
        this._layout = null;
      }
    },
    edgeSep: {
      enumerable: true,
      get: function() {
        return this._edgeSep;
      },
      set: function(value) {
        this._edgeSep = value;
        this._layout = null;
      }
    },
    rankSep: {
      enumerable: true,
      get: function() {
        return this._rankSep;
      },
      set: function(value) {
        this._rankSep = value;
        this._layout = null;
      }
    },
    rankDir: {
      enumerable: true,
      get: function() {
        return this._rankDir || "TB";
      },
      set: function(value) {
        this._rankDir = value;
        this._layout = null;
      }
    },
    frameRate: {
      enumerable: true,
      get: function() {
        return this._frameRate || 20;
      },
      set: function(value) {
        this._frameRate = value;
      }
    },
    refresh: {
      enumerable: true,
      value: function() {
        this.clear();
        this.render();
      }
    },
    start: {
      enumerable: true,
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
      enumerable: true,
      value: function() {
        clearTimeout(self._timer);
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
              self._layout = null;
            }
          } else if(event.type === "disconnected") {
            var out = g.outEdges(nodeId);
            console.log(out);
            self._layout = null;
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
              copy = self.g.copy(),
              marginX = self.marginX,
              marginY = self.marginY
              fontSize = self.fontSize,
              height = fontSize + marginY*2;
          ctx.font = self.font;
          copy.eachNode(function(u, value){
            var c = jQuery.extend({}, value),
                width = ctx.measureText(value.label).width + marginX*2;

            c.width = width;
            c.height = height;
            copy.node(u, c);
          });
          var l = dagre.layout();
          if(self.nodeSep)
            l = l.nodeSep(self.nodeSep);
          if(self.edgeSep)
            l = l.edgeSep(self.edgeSep);
          if(self.rankSep)
            l = l.rankSep(self.rankSep);
          var layout = l.rankDir(self.rankDir).run(copy);
          layout.eachEdge(function(e, sId, dId, v){
            var s = layout.node(sId),
                d = layout.node(dId),
                p = new BezierPath(),
                points = v.points;
            if(points.length === 0)
              return;
            var p0 = geometry.intersectRect(s, points[0]),
                pN = geometry.intersectRect(d, points[points.length-1]);


            p.moveTo(p0.x, p0.y);
            for ( var i = 0, l = points.length; i < l; i++ ) {
              var point = v.points[i],
                  x = point.x,
                  y = point.y;
              p.lineTo(x, y);
            }
            p.lineTo(pN.x, pN.y);
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
            layout = this.layout,
            fontSize = this.fontSize,
            visualHeight = this.visualHeight;
        ctx.textAlign = 'center';
        ctx.font = this.font;
        layout.eachNode(function(u, v) {
          ctx.strokeRect(v.x-v.width/2, v.y-v.height/2, v.width, v.height);
          ctx.fillText(g.node(u).label, v.x, v.y+fontSize/2.6 );
        });
		var oldStroke = ctx.strokeStyle;
		ctx.strokeStyle="#0033DD";
        layout.eachEdge(function(e, sId, dId, v){
          var s = g.node(sId),
              visual = s.value.visual;
          if(visual){
            visual.draw(ctx, v.path, visualHeight);
          } else {
            v.path.draw(ctx);
          }
        })
		ctx.strokeStyle=oldStroke;
      }
    },
    make: {
      enumerable: true,
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
