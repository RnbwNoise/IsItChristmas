// In the developer's console:
// 1. Paste the contents of api-extra.js
// 2. Paste the contents of this file.
// 3. To change the default heart shape, enter "IICBot.startEditor()". Left mouse
//    click will add a new point, right mouse click will delete the last point. When
//    you are finished editing the shape, enter "IICBot.stopEditor()".
// 4. To start the bot, enter "IICBot.run()".
// 5. To stop the bot, enter "IICBot.stop()".

var IICBot = {
    shape: {
        x: [], // position (x)
        y: [], // position (y)
        a: [], // rotation (radians)
    },

    delayPerPoint: 200, // ms
    hitTestRadius: 25, // px
    waveProbabiliy: 0.3,
    drawingFronts: 1,
    
    editorRayLength: 20, //px
    editorMarksColor: 'green',
    _editorOldMouseDown: null,
    _editorMarks: [],
    
    _runTimer: null,
    _listeners: [],
    _ignoreRotation: false,
    
    // Normalizes the angle to [0, 2*M_PI].
    _normalizeAngle: function(angle) {
        var TWO_PI = 2 * Math.PI;
        while(angle < 0)
            angle += TWO_PI;
        while(angle > TWO_PI)
            angle -= TWO_PI;
        return angle;
    },
    
    // Changes flag to that of a user with given id if a circle around a given point includes at least
    // one point in the shape. Used to handle click events.
    _clickHandler: function(userId, x, y) {
        if(IIC.getCountry() === IIC.getCountry(userId))
            return;
        
        var dx, dy;
        for(var i = 0; i < this.shape.x.length; i++) {
            dx = this.shape.x[i] - x;
            dy = this.shape.y[i] - y;
            if(Math.sqrt(dx*dx + dy*dy) < 2 * this.hitTestRadius) {
                IIC.setCountry(IIC.getCountry(userId));
                return;
            }
        }
    },
    
    // Returns the order of traversal of the points.
    _getTraversalOrder: function() {
        var points = [];
        for(var i = 0; i < this.shape.x.length; i++)
            points.push(i);
        this.drawingFronts = Math.floor(this.drawingFronts);
        if(this.drawingFronts > 1) {
            var interlacing = Math.floor(points.length / this.drawingFronts);
            points.sort(function(a, b) {
                if(a % interlacing !== b % interlacing) {
                    a %= interlacing;
                    b %= interlacing;
                }
                return a - b;
            });
        }
        return points;
    },
    
    // Deletes the shape.
    clearShape: function() {
        this.shape.x = [];
        this.shape.y = [];
        this.shape.a = [];
    },
    
    // Enters the shape editing mode. Left mouse click adds a point, right mouse click removes the last one.
    startEditor: function() {
        // The editor is already running...
        if(this._editorOldMouseDown)
            return;
        
        // Draw the current points.
        for(var i = 0; i < this.shape.x.length; i++) {
            var x = this.shape.x[i];
            var y = this.shape.y[i];
            var a = this.shape.a[i];
            this._editorMarks.push([
                IIC.debugRay(x, y, this.editorRayLength, a, this.editorMarksColor),
                IIC.debugPoint(x, y, this.editorMarksColor),
                IIC.debugText(x, y, i, this.editorMarksColor)
            ]);
        }
        
        // Replace the old click handler.
        this._editorOldMouseDown = document.onmousedown;
        document.onmousedown = (function(event) {
            // Left mouse button adds points.
            if(event.button === 0) {
                // Record current position/angle.
                var p = IIC.getPosition();
                var a = IIC.getAngle();
                var i = this.shape.x.push(p.x) - 1;
                this.shape.y.push(p.y);
                this.shape.a.push(a);
                
                // And draw a point on the screen.
                this._editorMarks.push([
                    IIC.debugRay(p.x, p.y, this.editorRayLength, a, this.editorMarksColor),
                    IIC.debugPoint(p.x, p.y, this.editorMarksColor),
                    IIC.debugText(p.x, p.y, i, this.editorMarksColor)
                ]);
            }
            
            // Right mouse button removes points.
            else if(event.button === 2) {
                // Remove the point.
                this.shape.x.pop();
                this.shape.y.pop();
                this.shape.a.pop();
                
                // And erase marks for it.
                var oldMarks = this._editorMarks.pop();
                if(oldMarks) {
                    for(var i = 0; i < oldMarks.length; i++)
                        IIC.debugErase(oldMarks[i]);
                }
            }
        }).bind(this);
        
        // Turn off rotation in run() to let the user adjust it by himself.
        this._ignoreRotation = true;
    },
    
    // Exists the shape editing mode.
    stopEditor: function() {
        // The editor is already stopped...
        if(!this._editorOldMouseDown)
            return;
        
        // Put the old click handler back.
        document.onmousedown = this._editorOldMouseDown;
        this._editorOldMouseDown = null;
        
        // Erase all marks.
        var oldMarks;
        while(oldMarks = this._editorMarks.pop()) {
            for(var i = 0; i < oldMarks.length; i++)
                IIC.debugErase(oldMarks[i]);
        }
        
        // Turn on rotation in run().
        this._ignoreRotation = false;
    },
    
    // Sets the shape to a parametric curve. Provided function must take in a value between 0 and 1.
    setCurve: function(curve, count, attemptsToMakePointsEquidistant) {
        var params = [];
        for(var i = 0; i < count; i++)
            params.push(i / count);
        
        // Ensures that all parameters yield points that are equal distance from one another.
        // See http://math.stackexchange.com/questions/15896/ .
        for(var i = 0; i < attemptsToMakePointsEquidistant; i++) {
            for(var j = 1; j < count - 1; j++) {
                var prev = curve(params[j - 1]);
                var curr = curve(params[j]);
                var next = curve(params[j + 1]);
                
                var distPrevCurr = Math.sqrt(Math.pow(prev[0] - curr[0], 2) + Math.pow(prev[1] - curr[1], 2));
                var distCurrNext = Math.sqrt(Math.pow(next[0] - curr[0], 2) + Math.pow(next[1] - curr[1], 2));
                
                var r = 0.5 * (distCurrNext - distPrevCurr) / (distPrevCurr + distCurrNext);
                if(r > 0)
                    params[j] += r * (params[j + 1] - params[j]);
                else if(r < 0)
                    params[j] += r * (params[j] - params[j - 1]);
            }
        }
        
        // Calculate all flag positions.
        this.shape.x = [];
        this.shape.y = [];
        for(var i = 0; i < count; i++) {
            var point = curve(params[i]);
            this.shape.x.push(point[0]);
            this.shape.y.push(point[1]);
        }
        
        // Calculate the angle AOB, where A and B are the upper corners of the flag and O is its center point.
        var flagAngle = this._normalizeAngle(Math.atan2(IIC.getFlagWidth(IIC.getCountry()) / 2,
                                                        IIC.getFlagHeight(IIC.getCountry()) / 2) * 2);
        
        // Calculate all rotation angles.
        this.shape.a = [];
        for(var i = 0; i < count; i++) {
            var prevX = this.shape.x[((i - 1) + count) % count]; // Point P
            var prevY = this.shape.y[((i - 1) + count) % count];
            var currX = this.shape.x[i]; // Point C
            var currY = this.shape.y[i];
            var nextX = this.shape.x[((i + 1) + count) % count]; // Point N
            var nextY = this.shape.y[((i + 1) + count) % count];
            
            // Make the flag parallel to the line PN.
            var angle = Math.atan2(nextY - prevY, nextX - prevX);
            
            // If the angle PCN is less than the flag's AOB angle, its a sharp turn and we have to
            // rotate the flag 90 deg to make the corner look sharp as well.
            var prevCurrAngle = Math.atan2(currY - prevY, currX - prevX);
            var nextCurrAngle = Math.atan2(currY - nextY, currX - nextX);
            var turnAngle = this._normalizeAngle(nextCurrAngle - prevCurrAngle);
            if(Math.min(turnAngle, 2 * Math.PI - turnAngle) < flagAngle)
                angle -= Math.PI / 2;
            
            // Keep the flag right-side up.
            angle = this._normalizeAngle(angle);
            if(angle > Math.PI / 2 && angle < 3 * Math.PI / 2)
                angle -= Math.PI;
            
            this.shape.a.push(angle);
        }
    },
    
    // Draws points of the current shape.
    debugDisplayShapePoints: function() {
        var points = this._getTraversalOrder();
        for(var i = 0; i < points.length; i++) {
            var pt = points[i];
            IIC.debugPoint(this.shape.x[pt], this.shape.y[pt], 'blue');
            IIC.debugText(this.shape.x[pt], this.shape.y[pt], i, 'blue');
        }
    },
    
    // Starts the bot.
    run: function() {
        // We just started the cycle: set event listeners.
        if(!this._runTimer) {
            this._listeners.push(IIC.onWave(this._clickHandler.bind(this)));
            this._listeners.push(IIC.onGhost(this._clickHandler.bind(this)));
        }
        
        var time = 0;
        
        // Process all the points.
        var points = this._getTraversalOrder();
        for(var i = 0; i < points.length; i++) {
            var pt = points[i];
            setTimeout(function(x, y, a) {
                if(!this._ignoreRotation)
                    IIC.setAngle(a);
                IIC.makeGhost(x, y);
                if(Math.random() < this.waveProbabiliy)
                    IIC.makeWave(x, y);
            }.bind(this, this.shape.x[pt], this.shape.y[pt], this.shape.a[pt]), time);
            time += this.delayPerPoint;
        }
        
        // Schedule the next iteration of the loop.
        this._runTimer = setTimeout(this.run.bind(this), time);
    },
    
    // Stops the bot.
    stop: function() {
        // Cancel the next iteration of the cycle.
        clearTimeout(this._runTimer);
        this._runTimer = null;
        
        // Remove all event listeners.
        var listener;
        while(listener = this._listeners.pop())
            IIC.removeEventListener(listener);
    }
};

// The default heart shape.
IICBot.setCurve(function(t) {
    var scale = 40;
    var tx = 400;
    var ty = 300;
    
    t *= 2 * Math.PI;
    // Madeloid formula is from http://johnthemathguy.blogspot.com/2013/02/the-function-of-heart.html
    var n = Math.PI - Math.abs(Math.PI - t);
    var p = 2.0 * (1 - n / Math.PI) + 0.3 * n * (Math.PI - n) + 0.6 * n * (Math.PI - n) * (n - Math.PI / 2);
    return [ -p * Math.sin(t) * scale + tx, p * Math.cos(t) * scale + ty ];
}, 20, 50);