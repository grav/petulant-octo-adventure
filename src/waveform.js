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
        noop = function() {},
      Super = Object.create(null, {
        callback: {
          get: function () {
            return userInstance.callback || this._callback || noop;
          },
          set: function (value) {
            this._callback = value;
          }
        },
        connect: {
          value: function (target) {
            var input = target;
            if(typeof(target.input) !== "undefined")
              input = target.input;
            this.callback({type:'connecting', self:this, target:target});
            this.output.connect(input);
            this.callback({type:'connected', self:this, target:target});
            if(this.visual && !this.visual.connected)
              this.output.connect(this.visual.input);
          }
        },
        disconnect: {
          value: function (target) {
            this.callback({type:'disconnecting', self:this, target:target});
            this.output.disconnect(target);
            this.callback({type:'disconnected', self:this, target:target});
            if(this.visual)
              this.visual.connected = false;
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
        ready: true,
        connected: false
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
      value: function(ctx, path, h) {
        var w        = path.length(),
            size     = this.size,
            wavedata = new Uint8Array(size);

        if(!h) h=100;
        this.input.getByteTimeDomainData(wavedata);
        ctx.beginPath();
        for ( var i = 0, l = wavedata.length; i < l; i++ ) {
          var x = i/l,
              y = h * (wavedata[i]-128)/256,
              p = path.point(x),
              a = path.angle(x),
              p2 = geometry.rotate(p.x, p.y+y, p.x, p.y, a);
          //console.log(y, x, w, l, p.x, p.y+y);
          if(i === 0)
            ctx.moveTo( p2.x, p2.y);
          else
            ctx.lineTo( p2.x, p2.y);
        }
        ctx.stroke();
      }
    }
  });
  PUA.prototype.ExternalSound = function (url, properties) {
    if(!properties) {
      properties = this.getDefaults();
    }
    this.visual = new userInstance.Waveform();
    this.input = userContext.createAnalyser();
    this.audio = new Audio();
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
  
  
  /*
  Speaker (meSpeak wrapper)
  */
  
  PUA.prototype.Speaker = function(meSpeak){
	// Super.call(this);
	this.meSpeak = meSpeak;
	meSpeak.loadConfig("tuna/mespeak_config.json");
	meSpeak.loadVoice('tuna/voices/en/en-us.json');
	meSpeak.setAudioContext(userContext);
	this.output = meSpeak.getMasterGain();
  };
  
  PUA.prototype.Speaker.prototype = Object.create(Super, {
      name: {
        value: "Speaker"
      },
	  speak: {
		  value: function(text){
			  this.meSpeak.speak(text)
	  	}
	}
  	
  });
  
  /* 
  SoundCloud
  */
  
  // todo - maybe move out of module?
  CommentsEmitter = function(audio){
	  this.p = 0;
	  var self = this;
	  audio.addEventListener('timeupdate', function(){
		  var comment = self._comments[self.p];
		  if(comment.timestamp < audio.currentTime * 1000 ){
			  if(self.speaker){
				  self.speaker.speak(comment.body);			  	
			  }
  			  self.p+=1;
		  }
	  });
  };
  
  CommentsEmitter.prototype = Object.create(Super, {
      name: {
        value: "CommentsEmitter"
      },
	  comments: {
		  set: function(comments){
			  comments.sort(function(a,b){			
				return a["timestamp"] - b["timestamp"];
			  });
			  console.log("got "+ comments.length + " comments!");
			  this._comments = comments;
		  }
	  },
	  connect: {
		  value: function(node){
			  // if(node instanceof PUA.Speaker){
				  this.speaker = node;
			  // }
		  }
	  },
      defaults: {	
  }});
  
  
  
  PUA.prototype.SoundCloud = function(url){
	  PUA.prototype.ExternalSound.call(this);
	  this.track_url = url;
	  this.commentsEmitter = new CommentsEmitter(this.audio);
	  
  };
  
  var client_id = '&client_id=a2f0745a136883f33e1b299b90381703';
  
  PUA.prototype.SoundCloud.prototype = Object.create(PUA.prototype.ExternalSound.prototype, {
      name: {
        value: "SoundCloud"
      },
	  track_url: {
		  enumarable: true,
		  get: function(){
			  return this._track_url
		  },
		  set: function(value){
			  var self = this;
			  this._track_url = value;
			  console.log('Setting track url to ',value);
			  this.ready = false;
			  $.get('http://api.soundcloud.com/resolve.json?url='+value+client_id, function (result) {
			    self.audio.src = result.stream_url+"?true&"+client_id;
				self.audio.load();
				$.get(result.uri+'/comments.json?true'+client_id, function(comments){
					self.commentsEmitter.comments = comments;
				});
			  });
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
