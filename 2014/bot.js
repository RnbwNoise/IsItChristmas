var IICBot = {
    shape: {
        x: [], // position (x)
        y: [], // position (y)
        a: [], // rotation (radians)
    },
    delayPerPoint: 200, // ms
    waveProbabiliy: 0.3,
    runTimer: null,
    
    // Normalizes the angle to [0, 2*M_PI].
    _normalizeAngle: function(angle) {
        var TWO_PI = 2 * Math.PI;
        while(angle < 0)
            angle += TWO_PI;
        while(angle > TWO_PI)
            angle -= TWO_PI;
        return angle;
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
        var FLAG_HEIGHT = 20;
        var flagAngle = this._normalizeAngle(Math.atan2(flagWidth(me.country) / 2, FLAG_HEIGHT / 2) * 2);
        
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
    
    // Draws the shape over and over again.
    run: function() {
        var time = 0;
        
        for(var i = 0; i < this.shape.x.length; i++) {
            setTimeout(function(x, y, a) {
                IIC.setAngle(a);
                IIC.makeGhost(x, y);
                if(Math.random() < this.waveProbabiliy)
                    IIC.makeWave(x, y);
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
    var ty = 300;
    
    t *= 2 * Math.PI;
    // Madeloid formula is from http://johnthemathguy.blogspot.com/2013/02/the-function-of-heart.html
    var n = Math.PI - Math.abs(Math.PI - t);
    var p = 2.0 * (1 - n / Math.PI) + 0.3 * n * (Math.PI - n) + 0.6 * n * (Math.PI - n) * (n - Math.PI / 2);
    return [ -p * Math.sin(t) * scale + tx, p * Math.cos(t) * scale + ty ];
}, 20, 50);

IICBot.run();