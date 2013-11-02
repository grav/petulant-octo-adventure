
(function() {
    var initialized = false;
    var has_super = /xyz/.test(function() { xyz; }) ? /\b_super\b/ : /.*/;
    this.Class = function(){};
    Class.extend = function(properties) {
        // Instantiate base class (create the instance, don't run the init constructor).
        var _super = this.prototype;
        initialized = true; var p = new this();
        initialized = false;
        // Copy the properties onto the new prototype.
        for (var k in properties) {
            p[k] = typeof properties[k] == "function"
                && typeof _super[k] == "function"
                && has_super.test(properties[k]) ? (function(k, f) { return function() {
                    // If properties[k] is actually a method,
                    // add a _super() method (= same method but on the superclass).
                    var s, r;
                    s = this._super;
                    this._super = _super[k]; r = f.apply(this, arguments);
                    this._super = s;
                    return r;
                };
            })(k, properties[k]) : properties[k];
        }
        function Class() {
            if (!initialized && this.init) {
                this.init.apply(this, arguments);
            }
        }
        Class.constructor = Class;
        Class.prototype = p;
        // Make the class extendable.
        Class.extend = arguments.callee;
        return Class;
    };
})();

Array.sum = function(array) {
    for (var i=0, sum=0; i < array.length; sum+=array[i++]){}; return sum;
};

Array.map = function(array, callback) {
    /* Returns a new array with callback(value) for each value in the given array.
     */
    var a = [];
    for (var i=0; i < array.length; i++) {
        a.push(callback(array[i]));
    }
    return a;
};

Math.degrees = function(radians) {
    return radians * 180 / Math.PI;
};

Math.radians = function(degrees) {
    return degrees / 180 * Math.PI;
};

var Point = Class.extend({
    init: function(x, y) {
        this.x = x;
        this.y = y;
    },
    copy: function() {
        return new Point(this.x, this.y);
    }
});

var Geometry = Class.extend({

  intersectRect: function(rect, point) {
    var x = rect.x;
    var y = rect.y;

    // For now we only support rectangles

    // Rectangle intersection algorithm from:
    // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
    var dx = point.x - x;
    var dy = point.y - y;
    var w = rect.width / 2;
    var h = rect.height / 2;

    var sx, sy;
    if (Math.abs(dy) * w > Math.abs(dx) * h) {
      // Intersection is top or bottom of rect.
      if (dy < 0) {
        h = -h;
      }
      sx = dy === 0 ? 0 : h * dx / dy;
      sy = h;
    } else {
      // Intersection is left or right of rect.
      if (dx < 0) {
        w = -w;
      }
      sx = w;
      sy = dx === 0 ? 0 : w * dy / dx;
    }

    return {x: x + sx, y: y + sy};
  },

    // ROTATION:

    angle: function(x0, y0, x1, y1) {
        /* Returns the angle between two points.
         */
        return Math.degrees(Math.atan2(y1-y0, x1-x0));
    },

    distance: function(x0, y0, x1, y1) {
        /* Returns the distance between two points.
         */
        return Math.sqrt(Math.pow(x1-x0, 2) + Math.pow(y1-y0, 2));
    },

    coordinates: function(x0, y0, distance, angle) {
        /* Returns the location of a point by rotating around origin (x0,y0).
         */
        var x1 = x0 + Math.cos(Math.radians(angle)) * distance;
        var y1 = y0 + Math.sin(Math.radians(angle)) * distance;
        return new Point(x1, y1);
    },

    rotate: function(x, y, x0, y0, angle) {
        /* Returns the coordinates of (x,y) rotated clockwise around origin (x0,y0).
         */
        x -= x0;
        y -= y0;
        var a = Math.cos(Math.radians(angle));
        var b = Math.sin(Math.radians(angle));
        return new Point(
            x*a - y*b + x0,
            y*a + x*b + y0
        );
    },

    reflect: function(x0, y0, x1, y1, d, a) {
        // Returns the reflection of a point through origin (x0,y0).
        if (d === undefined ) d = 1.0;
        if (a === undefined) a = 180;
        d *= this.distance(x0, y0, x1, y1);
        a += this.angle(x0, y0, x1, y1);
        return this.coordinates(x0, y0, d, a);
    },

    // INTERPOLATION:

    lerp: function(a, b, t) {
        /* Returns the linear interpolation between a and b for time t between 0.0-1.0.
         * For example: lerp(100, 200, 0.5) => 150.
         */
        if (t < 0.0) return a;
        if (t > 1.0) return b;
        return a + (b-a)*t;
    },

    smoothstep: function(a, b, x) {
        /* Returns a smooth transition between 0.0 and 1.0 using Hermite interpolation (cubic spline),
         * where x is a number between a and b. The return value will ease (slow down) as x nears a or b.
         * For x smaller than a, returns 0.0. For x bigger than b, returns 1.0.
         */
        if (x < a) return 0.0;
        if (x >=b) return 1.0;
        x = (x-a) / (b-a);
        return x*x * (3-2*x);
    },

    bounce: function(x) {
        /* Returns a bouncing value between 0.0 and 1.0 (e.g. Mac OS X Dock) for a value between 0.0-1.0.
         */
        return Math.abs(Math.sin(2 * Math.PI * (x+1) * (x+1)) * (1-x));
    },

    // ELLIPSES:

    superformula: function(m, n1, n2, n3, phi) {
        /* A generalization of the superellipse (Gielis, 2003).
         * that can be used to describe many complex shapes and curves found in nature.
         */
        if (n1 == 0) return (0, 0);
        var a = 1.0;
        var b = 1.0;
        var r = Math.pow(Math.pow(Math.abs(Math.cos(m * phi/4) / a), n2) +
                         Math.pow(Math.abs(Math.sin(m * phi/4) / b), n3), 1/n1);
        if (Math.abs(r) == 0)
            return (0, 0);
        r = 1 / r;
        return [r * Math.cos(phi), r * Math.sin(phi)];
    },

    // INTERSECTION:

    lineIntersection: function(x1, y1, x2, y2, x3, y3, x4, y4, infinite) {
        /* Determines the intersection point of two lines, or two finite line segments if infinite=False.
         * When the lines do not intersect, returns null.
         */
        // Based on: P. Bourke, 1989, http://paulbourke.net/geometry/pointlineplane/
        if (infinite === undefined) infinite = false;
        var ua = (x4-x3) * (y1-y3) - (y4-y3) * (x1-x3);
        var ub = (x2-x1) * (y1-y3) - (y2-y1) * (x1-x3);
        var d  = (y4-y3) * (x2-x1) - (x4-x3) * (y2-y1);
        // The lines are coincident if (ua == ub && ub == 0).
        // The lines are parallel otherwise.
        if (d == 0) return null;
        ua /= d;
        ub /= d;
        // Intersection point is within both finite line segments?
        if (!infinite && !(0 <= ua && ua <= 1 && 0 <= ub && ub <= 1)) return null;
        return new Point(
            x1 + ua * (x2-x1),
            y1 + ua * (y2-y1)
        );
    },

    pointInPolygon: function(points, x, y) {
        /* Ray casting algorithm.
         * Determines how many times a horizontal ray starting from the point
         * intersects with the sides of the polygon.
         * If it is an even number of times, the point is outside, if odd, inside.
         * The algorithm does not always report correctly when the point is very close to the boundary.
         * The polygon is passed as an array of Points.
         */
        // Based on: W. Randolph Franklin, 1970, http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
        var odd = false;
        var n = points.length;
        for (var i=0; i < n; i++) {
            var j = (i<n-1)? i+1 : 0;
            var x0 = points[i].x;
            var y0 = points[i].y;
            var x1 = points[j].x;
            var y1 = points[j].y;
            if ((y0 < y && y1 >= y) || (y1 < y && y0 >= y)) {
                if (x0 + (y-y0) / (y1-y0) * (x1-x0) < x) {
                    odd = !odd;
                }
            }
        }
        return odd;
    },

    Bounds: Class.extend({
        init: function(x, y, width, height) {
            /* Creates a bounding box.
             * The bounding box is an untransformed rectangle that encompasses a shape or group of shapes.
             */
            if (width === undefined) width = Infinity;
            if (height === undefined) height = Infinity;
            // Normalize if width or height is negative:
            if (width < 0) {
                 x+=width; width=-width;
            }
            if (height < 0) {
                y+=height; height=-height;
            }
            this.x = x;
            this.y = y;
            this.width = width ;
            this.height = height;
        },

        copy: function() {
            return new geometry.Bounds(this.x, this.y, this.width, this.height);
        },

        intersects: function(b) {
            /* Return True if a part of the two bounds overlaps.
             */
            return Math.max(this.x, b.x) < Math.min(this.x + this.width, b.x + b.width)
                && Math.max(this.y, b.y) < Math.min(this.y + this.height, b.y + b.height);
        },

        intersection: function(b) {
            /* Returns bounds that encompass the intersection of the two.
             * If there is no overlap between the two, null is returned.
             */
            if (!this.intersects(b)) {
                return null;
            }
            var mx = Math.max(this.x, b.x);
            var my = Math.max(this.y, b.y);
            return new geometry.Bounds(mx, my,
                Math.min(this.x + this.width, b.x+b.width) - mx,
                Math.min(this.y + this.height, b.y+b.height) - my
            );
        },

        union: function(b) {
            /* Returns bounds that encompass the union of the two.
             */
            var mx = Math.min(this.x, b.x);
            var my = Math.min(this.y, b.y);
            return new geometry.Bounds(mx, my,
                Math.max(this.x + this.width, b.x+b.width) - mx,
                Math.max(this.y + this.height, b.y+b.height) - my
            );
        },

        contains: function(pt) {
            /* Returns True if the given point or rectangle falls within the bounds.
             */
            if (pt instanceof Point) {
                return pt.x >= this.x && pt.x <= this.x + this.width
                    && pt.y >= this.y && pt.y <= this.y + this.height
            }
            if (pt instanceof Bounds) {
                return pt.x >= this.x && pt.x + pt.width <= this.x + this.width
                    && pt.y >= this.y && pt.y + pt.height <= this.y + this.height
            }

        }
    })
});

var geometry = new Geometry();

/*##################################################################################################*/

/*--- BEZIER MATH ----------------------------------------------------------------------------------*/
// Thanks to Prof. F. De Smedt at the Vrije Universiteit Brussel, 2006.

var Bezier = Class.extend({

    // BEZIER MATH:

    linePoint: function(t, x0, y0, x1, y1) {
        /* Returns coordinates for the point at t (0.0-1.0) on the line.
         */
        return [
            x0 + t * (x1-x0),
            y0 + t * (y1-y0)
        ];
    },

    lineLength: function(x0, y0, x1, y1) {
        /* Returns the length of the line.
         */
        var a = Math.pow(Math.abs(x0-x1), 2);
        var b = Math.pow(Math.abs(y0-y1), 2);
        return Math.sqrt(a + b);
    },

    curvePoint: function(t, x0, y0, x1, y1, x2, y2, x3, y3, handles) {
        /* Returns coordinates for the point at t (0.0-1.0) on the curve
         * (de Casteljau interpolation algorithm).
         */
        var dt = 1 - t;
        var x01 = x0*dt + x1*t;
        var y01 = y0*dt + y1*t;
        var x12 = x1*dt + x2*t;
        var y12 = y1*dt + y2*t;
        var x23 = x2*dt + x3*t;
        var y23 = y2*dt + y3*t;
        var h1x = x01*dt + x12*t;
        var h1y = y01*dt + y12*t;
        var h2x = x12*dt + x23*t;
        var h2y = y12*dt + y23*t;
        var x = h1x*dt + h2x*t;
        var y = h1y*dt + h2y*t;
        if (!handles) {
            return [x, y, h1x, h1y, h2x, h2y];
        } else {
            // Include the new handles of pt0 and pt3 (see Bezier.insert_point()).
            return [x, y, h1x, h1y, h2x, h2y, x01, y01, x23, y23];
        }
    },

    curvelength: function(x0, y0, x1, y1, x2, y2, x3, y3, n) {
        /* Returns the length of the curve.
         * Integrates the estimated length of the cubic bezier spline defined by x0, y0, ... x3, y3,
         * by adding up the length of n linear lines along the curve.
         */
        if (n === undefined) n = 20;
        var length = 0;
        var xi = x0;
        var yi = y0;
        for (var i=0; i < n; i++) {
            var t = (i+1) / n;
            var pt = this.curvePoint(t, x0, y0, x1, y1, x2, y2, x3, y3);
            length += Math.sqrt(
                Math.pow(Math.abs(xi-pt[0]), 2) +
                Math.pow(Math.abs(yi-pt[1]), 2)
            );
            xi = pt[0];
            yi = pt[1];
        }
        return length;
    },

    // BEZIER PATH LENGTH:

    segmentLengths: function(path, relative, n) {
        /* Returns an array with the length of each segment in the path.
         * With relative=true, the total length of all segments is 1.0.
         */
        if (n === undefined) n = 20;
        var lengths = [];
        for (var i=0; i < path.array.length; i++) {
            var pt = path.array[i];
            if (i == 0) {
                var close_x = pt.x;
                var close_y = pt.y;
            } else if (pt.cmd == MOVETO) {
                var close_x = pt.x;
                var close_y = pt.y;
                lengths.push(0.0);
            } else if (pt.cmd == CLOSE) {
                lengths.push(this.lineLength(x0, y0, close_x, close_y));
            } else if (pt.cmd == LINETO) {
                lengths.push(this.lineLength(x0, y0, pt.x, pt.y));
            } else if (pt.cmd == CURVETO) {
                lengths.push(this.curvelength(x0, y0, pt.ctrl1.x, pt.ctrl1.y, pt.ctrl2.x, pt.ctrl2.y, pt.x, pt.y, n));
            }
            if (pt.cmd != CLOSE) {
                var x0 = pt.x;
                var y0 = pt.y;
            }
        }
        if (relative == true) {
            var s = Array.sum(lengths);
            if (s > 0) {
                return Array.map(lengths, function(v) { return v/s; });
            } else {
                return Array.map(lengths, function(v) { return 0.0; });
            }
        }
        return lengths;
    },

    length: function(path, segmented, n) {
        /* Returns the approximate length of the path.
         * Calculates the length of each curve in the path using n linear samples.
         * With segmented=true, returns an array with the relative length of each segment (sum=1.0).
         */
        if (n === undefined) n = 20;
        if (!segmented) {
            return Array.sum(this.segmentLengths(path, false, n));
        } else {
            return this.segmentLengths(path, true, n);
        }
    },

    // BEZIER PATH POINT:

    _locate : function(path, t, segments) {
        /* For a given relative t on the path (0.0-1.0), returns an array [index, t, PathElement],
         * with the index of the PathElement before t,
         * the absolute time on this segment,
         * the last MOVETO or any subsequent CLOSETO after i.
         */
        // Note: during iteration, supplying segmentLengths() yourself is 30x faster.
        if (segments === undefined) segments = this.segmentLengths(path, true);
        for (var i=0; i < path.array.length; i++) {
            var pt = path.array[i];
            if (i == 0 || pt.cmd == MOVETO) {
                var closeto = new Point(pt.x, pt.y);
            }
            if (t <= segments[i] || i == segments.length-1) {
                break;
            }
            t -= segments[i];
        }
        if (segments[i] != 0) t /= segments[i];
        if (i == segments.length-1 && segments[i] == 0) i -= 1;
        return [i, t, closeto];
    },

    point: function(path, t, segments) {
        /* Returns the DynamicPathElement at time t on the path.
         * Note: in PathElement, ctrl1 is how the curve started, and ctrl2 how it arrives in this point.
         * Here, ctrl1 is how the curve arrives, and ctrl2 how it continues to the next point.
         */
        var _, i, closeto; _=this._locate(path, t, segments); i=_[0]; t=_[1]; closeto=_[2];
        var x0 = path.array[i].x;
        var y0 = path.array[i].y;
        var pt = path.array[i+1];
        if (pt.cmd == LINETO || pt.cmd == CLOSE) {
            var _pt = (pt.cmd == CLOSE)?
                 this.linePoint(t, x0, y0, closeto.x, closeto.y) :
                 this.linePoint(t, x0, y0, pt.x, pt.y);
            pt = new DynamicPathElement(_pt[0], _pt[1], LINETO);
            pt.ctrl1 = new Point(pt.x, pt.y);
            pt.ctrl2 = new Point(pt.x, pt.y);
        } else if (pt.cmd == CURVETO) {
            var _pt = this.curvePoint(t, x0, y0, pt.ctrl1.x, pt.ctrl1.y, pt.ctrl2.x, pt.ctrl2.y, pt.x, pt.y);
            pt = new DynamicPathElement(_pt[0], _pt[1], CURVETO);
            pt.ctrl1 = new Point(_pt[2], _pt[3]);
            pt.ctrl2 = new Point(_pt[4], _pt[5]);
        }
        return pt;
    },

    findPath: function(points, curvature) {
        if (curvature === undefined) curvature = 1.0;
        // Don't crash on something straightforward such as a list of [x,y]-arrays.
        if (points instanceof Path) {
            points = points.array;
        }
        for (var i=0; i < points.length; i++) {
            if (points[i] instanceof Array) {
                points[i] = new Point(points[i][0], points[i][1]);
            }
        }
        var path = new Path();
        //  No points: return nothing.
        //  One point: return a path with a single MOVETO-point.
        // Two points: return a path with a single straight line.
        if (points.length == 0) {
            return null;
        }
        if (points.length == 1) {
            path.moveto(points[0].x, points[0].y);
            return path;
        }
        if (points.length == 2) {
            path.moveto(points[0].x, points[0].y);
            path.lineto(points[1].x, points[1].y);
            return path;
        }
        // Zero curvature means path with straight lines.
        if (curvature <= 0) {
            path.moveto(points[0].x, points[0].y)
            for (var i=1; i < points.length; i++) {
                path.lineto(points[i].x, points[i].y);
            }
            return path;
        }
        // Construct the path with curves.
        curvature = Math.min(1.0, curvature);
        curvature = 4 + (1.0 - curvature) * 40;
        // The first point's ctrl1 and ctrl2 and last point's ctrl2
        // will be the same as that point's location;
        // we cannot infer how the path curvature started or will continue.
        var dx = {0: 0}; dx[points.length-1] = 0;
        var dy = {0: 0}; dy[points.length-1] = 0;
        var bi = {1: 1 / curvature};
        var ax = {1: (points[2].x - points[0].x - dx[0]) * bi[1]};
        var ay = {1: (points[2].y - points[0].y - dy[0]) * bi[1]};
        for (var i=2; i < points.length-1; i++) {
            bi[i] = -1 / (curvature + bi[i-1]);
            ax[i] = -(points[i+1].x - points[i-1].x - ax[i-1]) * bi[i];
            ay[i] = -(points[i+1].y - points[i-1].y - ay[i-1]) * bi[i];
        }
        var r = Array.reversed(Array.range(1, points.length-1));
        for (var i=points.length-2; i > 0; i--) {
            dx[i] = ax[i] + dx[i+1] * bi[i];
            dy[i] = ay[i] + dy[i+1] * bi[i];
        }
        path.moveto(points[0].x, points[0].y);
        for (var i=0; i < points.length-1; i++) {
            path.curveto(
                points[i].x + dx[i],
                points[i].y + dy[i],
                points[i+1].x - dx[i+1],
                points[i+1].y - dy[i+1],
                points[i+1].x,
                points[i+1].y
            );
        }
        return path;
    }
});

bezier = new Bezier();

/*--- BEZIER PATH ----------------------------------------------------------------------------------*/
// A Path class with lineto(), curveto() and moveto() methods.

var MOVETO  = "moveto";
var LINETO  = "lineto";
var CURVETO = "curveto";
var CLOSE   = "close";

var PathElement = Class.extend({

    init: function(x, y, cmd) {
        /* A point in the path, optionally with control handles.
         */
        this.x = x;
        this.y = y;
        this.ctrl1 = new Point(0, 0);
        this.ctrl2 = new Point(0, 0);
        this.radius = 0;
        this.cmd = cmd;
    },

    copy: function() {
        var pt = new PathElement(this.x, this.y, this.cmd);
        pt.ctrl1 = this.ctrl1.copy();
        pt.ctrl2 = this.ctrl2.copy();
        return pt;
    }
});

var DynamicPathElement = PathElement.extend({
    // Not a "fixed" point in the Path, but calculated with Path.point().
});

var Path = BezierPath = Class.extend({

    init: function(path) {
        /* A list of PathElements describing the curves and lines that make up the path.
         */
        if (path === undefined) {
            this.array = []; // We can't subclass Array.
        } else if (path instanceof Path) {
            this.array = Array.map(path.array, function(pt) { return pt.copy(); });
        } else if (path instanceof Array) {
            this.array = Array.map(path, function(pt) { return pt.copy(); });
        }
        this._clip = false;
        this._update();
    },

    _update: function() {
        this._segments = null;
        this._polygon = null;
    },

    copy: function() {
        return new Path(this);
    },

    moveto: function(x, y) {
        /* Adds a new point to the path at x, y.
         */
        var pt = new PathElement(x, y, MOVETO);
        pt.ctrl1 = new Point(x, y);
        pt.ctrl2 = new Point(x, y);
        this.array.push(pt);
        this._update();
    },

    lineto: function(x, y) {
        /* Adds a line from the previous point to x, y.
         */
        var pt = new PathElement(x, y, LINETO);
        pt.ctrl1 = new Point(x, y);
        pt.ctrl2 = new Point(x, y);
        this.array.push(pt);
        this._update();
    },

    curveto: function(x1, y1, x2, y2, x3, y3) {
        /* Adds a Bezier-curve from the previous point to x3, y3.
         * The curvature is determined by control handles x1, y1 and x2, y2.
         */
        var pt = new PathElement(x3, y3, CURVETO);
        pt.ctrl1 = new Point(x1, y1);
        pt.ctrl2 = new Point(x2, y2);
        this.array.push(pt);
        this._update();
    },

    moveTo: function(x, y) {
        this.moveto(x, y);
    },
    lineTo: function(x, y) {
        this.lineto(x, y);
    },
    curveTo: function(x1, y1, x2, y2, x3, y3) {
        this.curveto(x1, y1, x2, y2, x3, y3);
    },

    closepath: function() {
        /* Adds a line from the previous point to the last MOVETO.
         */
        this.array.push(new PathElement(0, 0, CLOSE));
        this._update();
    },

    closePath: function() {
        this.closepath();
    },

    rect: function(x, y, width, height, options) {
        /* Adds a rectangle to the path.
         */
        if (!options || options.roundness === undefined) {
            this.moveto(x, y);
            this.lineto(x+width, y);
            this.lineto(x+width, y+height);
            this.lineto(x, y+height);
            this.lineto(x, y);
        } else {
            var curve = Math.min(width * options.roundness, height * options.roundness);
            this.moveto(x, y+curve);
            this.curveto(x, y, x, y, x+curve, y);
            this.lineto(x+width-curve, y);
            this.curveto(x+width, y, x+width, y, x+width, y+curve);
            this.lineto(x+width, y+height-curve);
            this.curveto(x+width, y+height, x+width, y+height, x+width-curve, y+height);
            this.lineto(x+curve, y+height);
            this.curveto(x, y+height, x, y+height, x, y+height-curve);
            this.closepath();
        }
    },

    ellipse: function(x, y, width, height) {
        /* Adds an ellipse to the path.
         */
        x -= 0.5 * width; // Center origin.
        y -= 0.5 * height;
        var k = 0.55; // kappa = (-1 + sqrt(2)) / 3 * 4
        var dx = k * 0.5 * width;
        var dy = k * 0.5 * height;
        var x0 = x + 0.5 * width;
        var y0 = y + 0.5 * height;
        var x1 = x + width;
        var y1 = y + height;
        this.moveto(x, y0);
        this.curveto(x, y0-dy, x0-dx, y, x0, y);
        this.curveto(x0+dx, y, x1, y0-dy, x1, y0);
        this.curveto(x1, y0+dy, x0+dx, y1, x0, y1);
        this.curveto(x0-dx, y1, x, y0+dy, x, y0);
        this.closepath();
    },

//  draw: function({fill: Color(), stroke: Color(), strokewidth: 1.0, strokestyle: SOLID})
    draw: function(_ctx, options) {
        /* Draws the path.
         */
        _ctx.beginPath();
        if (this.array.length > 0 && this.array[0].cmd != MOVETO) {
            throw "No current point for path (first point must be MOVETO)."
        }
        for (var i=0; i < this.array.length; i++) {
            var pt = this.array[i];
            switch(pt.cmd) {
                case MOVETO:
                    _ctx.moveTo(pt.x, pt.y);
                    break;
                case LINETO:
                    _ctx.lineTo(pt.x, pt.y);
                    break;
                case CURVETO:
                    _ctx.bezierCurveTo(pt.ctrl1.x, pt.ctrl1.y, pt.ctrl2.x, pt.ctrl2.y, pt.x, pt.y);
                    break;
                case CLOSE:
                    _ctx.closePath();
                    break;
            }
        }
        if (!this._clip) {
            _ctx.stroke();
        } else {
            _ctx.clip();
        }
    },

    angle: function(t) {
        /* Returns the directional angle at time t (0.0-1.0) on the path.
         */
        // The derive() enumerator is much faster but less precise.
        if (t == 0) {
            var pt0 = this.point(t);
            var pt1 = this.point(t+0.001);
        } else {
            var pt0 = this.point(t-0.001);
            var pt1 = this.point(t);
        }
        return geometry.angle(pt0.x, pt0.y, pt1.x, pt1.y);
    },

    point: function(t) {
        /* Returns the DynamicPathElement at time t (0.0-1.0) on the path.
         */
        if (this._segments == null) {
            // Cache the segment lengths for performace.
            this._segments = bezier.length(this, true, 10);
        }
        return bezier.point(this, t, this._segments);
    },

    points: function(amount, options) {
        /* Returns an array of DynamicPathElements along the path.
         * To omit the last point on closed paths: {end: 1-1.0/amount}
         */
        var start = (options && options.start !== undefined)? options.start : 0.0;
        var end = (options && options.end !== undefined)? options.end : 1.0;
        if (this.array.length == 0) {
            // Otherwise bezier.point() will raise an error for empty paths.
            return [];
        }
        amount = Math.round(amount);
        // The delta value is divided by amount-1, because we also want the last point (t=1.0)
        // If we don't use amount-1, we fall one point short of the end.
        // If amount=4, we want the point at t 0.0, 0.33, 0.66 and 1.0.
        // If amount=2, we want the point at t 0.0 and 1.0.
        var d = (amount > 1)? (end-start) / (amount-1) : (end-start);
        var a = [];
        for (var i=0; i < amount; i++) {
            a.push(this.point(start + d*i));
        }
        return a;
    },

    length: function(precision) {
        /* Returns an approximation of the total length of the path.
         */
        if (precision === undefined) precision = 10;
        return bezier.length(this, false, precision);
    },

    contains: function(x, y, precision) {
        /* Returns true when point (x,y) falls within the contours of the path.
         */
        if (precision === undefined) precision = 100;
        if (this._polygon == null ||
            this._polygon[1] != precision) {
            this._polygon = [this.points(precision), precision];
        }
        return geometry.pointInPolygon(this._polygon[0], x, y);
    }
});
