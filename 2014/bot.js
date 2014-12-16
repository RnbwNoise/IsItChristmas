var IIC = {
    setCountry: function(countryCode) {
        me.country = countryCode;
        
        // Delete the old cursor, if necessary.
        var isFlagVisible = me.flag && me.flag.parentElement;
        if(isFlagVisible)
            me.flag.parentElement.removeChild(me.flag);
        
        // Create a new cursor.
        setCursor(me.country);
        
        // Flag was visible: put it back (code is from mouseMove() in IIC)
        if(isFlagVisible) {
            document.body.appendChild(me.flag);
            document.body.style.cursor = "none";
            document.getElementById("answer").style.cursor = "none";
            me.flag._new = false;
        }
    },
    
    setPosition: function(x, y) {
        // Pretend we moved the mouse to a given location.
        mouseMove({ clientX: x, clientY: y });
    },
    
    setAngle: function(angle /* radians */) {
        // Set the rotation of the cursor.
        me.angle = angle / Math.PI * 180;
        setRotate(me.flag, me.angle);
        
        // And broadcast it to everyone else.
        emit('scroll', { id: me.id, angle: me.angle });
    },
    
    makeWave: function(x, y) {
        // Pretend we made a left mouse click.
        mouseClick({ clientX: x, clientY: y, button: 0 });
    },
    
    makeGhost: function(x, y) {
        // Pretend we made a right mouse click.
        mouseClick({ clientX: x, clientY: y, button: 2 });
    }
};

var IICBot = {
    delayPerPoint: 200, // ms
    
    shape: {
        x: [], // position (x)
        y: [], // position (y)
        a: [], // rotation (radians)
    },
    
    runTimer: null,
    
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
        
        this.shape.x = [];
        this.shape.y = [];
        for(var i = 0; i < count; i++) {
            var point = curve(params[i]);
            this.shape.x.push(point[0]);
            this.shape.y.push(point[1]);
        }
        
        this.shape.a = [];
        for(var i = 0; i < count; i++) {
            var prevX = this.shape.x[((i - 1) + count) % count];
            var prevY = this.shape.y[((i - 1) + count) % count];
            var nextX = this.shape.x[((i + 1) + count) % count];
            var nextY = this.shape.y[((i + 1) + count) % count];
            var angle = Math.atan2(nextY - prevY, nextX - prevX);
            
            // Keep the flag right-side up.
            if(Math.abs(angle) > Math.PI / 2) // assuming the value is in the range of arctan
                angle -= Math.PI;
            
            this.shape.a.push(angle);
        }
    },
    
    // Draws the shape over and over again.
    run: function() {
        var time = 0;
        for(var i = 0; i < this.shape.x.length; i++) {
            setTimeout(function(x, y, a) {
                IIC.setAngle(a);
                IIC.makeGhost(x, y);
            }.bind(null, this.shape.x[i], this.shape.y[i], this.shape.a[i]), time);
            time += this.delayPerPoint;
        }
        this.runTimer = setTimeout(this.run.bind(this), time);
    },
    
    // Ends the shape drawing cycle.
    stop: function() {
        clearTimeout(this.runTimer);
        this.runTimer = null;
    }
};

IICBot.setCurve(function(t) {
    var scale = 40;
    var tx = 400;
    var ty = 400;
    
    t *= 2 * Math.PI;
    // Madeloid formula is from http://johnthemathguy.blogspot.com/2013/02/the-function-of-heart.html
    var n = Math.PI - Math.abs(Math.PI - t);
    var p = 2.0 * (1 - n / Math.PI) + 0.3 * n * (Math.PI - n) + 0.6 * n * (Math.PI - n) * (n - Math.PI / 2);
    return [ -p * Math.sin(t) * scale + tx, p * Math.cos(t) * scale + ty ];
}, 20, 100);

IICBot.run();