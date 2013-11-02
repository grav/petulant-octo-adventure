(function (window) {
  var userContext, userInstance, PUA = function (context) {
    if (! window.AudioContext) {
      window.AudioContext = window.webkitAudioContext;
    }

    if(!context) {
      console.log("waveform.js: Missing audio context! Creating a new context for you.");
      context = window.AudioContext && (new window.AudioContext());
    }
    userContext = context;
    userInstance = this;
  },
      version = "0.1",
      Super = Object.create(null, {
        connect: {
          value: function (target) {
            this.output.connect(target);
          }
        },
            getDefaults: {
                value: function () {
                    var result = {};
                    for(var key in this.defaults) {
                        result[key] = this.defaults[key].value;
                    }
                    return result;
                }
            },

      }),
      INT = "int";

  PUA.prototype.Waveform = function (properties) {
    if(!properties) {
      properties = this.getDefaults();
    }
    this.input = userContext.createAnalyser();
    this.size = properties.size || this.defaults.size.value;
  }

  PUA.prototype.Waveform.prototype = Object.create(Super, {
    name: {
      value: "Waveform"
    },
    defaults: {
      writable:true,
      value: {
        size: {
          value: 1024,
          min: 32,
          max: 2048,
          type: INT
        },
        ready: true
      }
    },
    size: {
      enumerable: true,
      get: function () {
        return this.input.fftSize;
      },
      set: function (value) {
        this.input.fftSize = value;
      }
    },
    draw: {
      value: function(canvas) {
        var ctx      = canvas.getContext( '2d' ),
            h        = canvas.height,
            w        = canvas.width,
            size     = this.size,
            wavedata = new Uint8Array(size);

        this.input.getByteTimeDomainData(wavedata);
        ctx.clearRect( 0, 0, w, h );
        ctx.beginPath();
        for ( var i = 0, l = wavedata.length; i < l; i++ ) {
          var x = i * ( w/l ),
              y = h * wavedata[i]/256;
          if(i === 0)
            ctx.moveTo( x, y);
          else
            ctx.lineTo( x, y);
          //ctx.drawImage(imgEl,x,y);
        }
        ctx.stroke();
        ctx.closePath();
      }
    }
  });
  PUA.prototype.ExternalSound = function (url, properties) {
    if(!properties) {
      properties = this.getDefaults();
    }
    this.input = userContext.createAnalyser();
    this.audio = new Audio();
    console.log(url, properties, this.defaults);
    this.src = url || properties.src || this.defaults.src.value;
    this.output = userContext.createMediaElementSource(this.audio);
    this.audio.addEventListener('canplay', function(){
      console.log('Is ready');
      this.isReady = true;
    });
  };

  PUA.prototype.ExternalSound.prototype = Object.create(Super, {
    name: {
      value: "ExternalSound"
    },
    defaults: {
      writable:true,
      value: {
        src: {
          value: undefined
        },
        isReady: {
          value: false
        }
      }
    },
    src: {
      enumerable: true,
      get: function () {
        return this.audio.src;
      },
      set: function (value) {
        console.log('Setting url to ', value);
        this.isReady = false;
        this.audio.src = value;
        this.audio.load();
      }
    },
    play: {
      value: function() {
        this.output.mediaElement.play();
      }
    },
    pause: {
      value: function() {
        this.output.mediaElement.pause();
      }
    }
  });

  PUA.toString = PUA.prototype.toString = function () {
    return "You are running pertulant octo adventure version " + version;
  };
  if(typeof define === "function") {
    define("PUA", [], function () {
      return PUA;
    });
  } else {
    window.PUA = PUA;
  }
})(this);