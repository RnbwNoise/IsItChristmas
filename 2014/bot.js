IIC.userListeners = {};

// Sets a handler (function(data)) for a given event. Returns the handler's "identifier".
IIC.addEventListener = function(event, listener) {
    // We aren't calling user listeners for this event: start doing so.
    if(!this.userListeners[event]) {
        this.userListeners[event] = [];
        
        var defaultListener = events[event];
        events[event] = function(data) {
            // Call the system's listener.
            defaultListener(data);
            
            // And then all of the user-defined ones.
            for(var i = 0; i < this.userListeners[event].length; i++) {
                if(this.userListeners[event][i])
                    this.userListeners[event][i](data);
            }
        }.bind(this);
    }
    
    // Add user's listener.
    return [ event, this.userListeners[event].push(listener) - 1 ];
};

// Removes an event handler with a given identifier. Returns true if the listener was successfully removed.
IIC.removeEventListener = function(listenerId) {
    // Make sure the id is valid and the listener exists.
    if(!listenerId || !listenerId[0] || (typeof listenerId[1]) === 'undefined'
       || !this.userListeners[listenerId[0]] || !this.userListeners[listenerId[0]][listenerId[1]])
        return false;

    // Delete the listener.
    this.userListeners[listenerId[0]][listenerId[1]] = null;
    return true;
};


// Returns true if a user with given id is connected.
IIC.isConnected = function(userId) {
    return !!others[userId];
};

// Returns ids of all connected users.
IIC.getConnectedIds = function() {
    return Object.getOwnPropertyNames(others);
};

// Returns our own id.
IIC.getId = function() {
    return me.id;
};


// Sets a chat message handler with the following signature: function(userId, message).
IIC.onChat = function(listener) {
    return this.addEventListener('chat', function(data) {
        if(data.id !== me.id)
            listener(data.id, data.message);
    });
};


// Returns the current country, or that of another user if his id is provided. If the user is disconnected,
// returns null.
IIC.getCountry = function(userId) {
    if(userId)
        return others[userId] ? others[userId].country : null;
    return me.country;
};


// Returns the current position, or that of another user if his id is provided. If the flag does not exist, returns null.
IIC.getPosition = function(userId) {
    var flag;
    if(userId)
        flag = others[userId] ? others[userId].flag : null;
    else
        flag = me.flag;
    
    if(!flag || !flag.style.left || !flag.style.top)
        return null;
    
    return { x: parseInt(flag.style.left), y: parseInt(flag.style.top) };
};

// Sets a flag movement handler with the following signature: function(userId, newX, newY).
IIC.onMovement = function(listener) {
    return this.addEventListener('motion', function(data) { listener(data.id, data.x, data.y); });
};


// Returns the current angle, or that of another user if his id is provided.
IIC.getAngle = function(userId) {
    return (userId ? others[userId].angle : me.angle) / 180 * Math.PI;
};

// Sets a flag rotation handler with the following signature: function(userId, newAngle). newAngle is in radians.
IIC.onRotation = function(listener) {
    return this.addEventListener('scroll', function(data) { listener(data.id, data.angle / 180 * Math.PI); });
};


// Sets a wave handler with the following signature: function(userId, waveX, waveY).
IIC.onWave = function(listener) {
    return this.addEventListener('click', function(data) {
        if(data.button === 'left')
            listener(data.id, data.x, data.y);
    });
};

// Sets a ghost handler with the following signature: function(userId, ghostX, ghostY).
IIC.onGhost = function(listener) {
    return this.addEventListener('click', function(data) {
        if(data.button === 'right')
            listener(data.id, data.x, data.y);
    });
};


var IICBot = {
    shape: {
        x: [], // position (x)
        y: [], // position (y)
        a: [], // rotation (radians)
    },

    delayPerPoint: 200, // ms
    hitTestRadius: 25, // px
    waveProbabiliy: 0.3,
    
    runTimer: null,
    listeners: [],
    
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
    
    // Starts the bot.
    run: function() {
        // We just started the cycle: set event listeners.
        if(!this.runTimer) {
            this.listeners.push(IIC.onWave(this._clickHandler.bind(this)));
            this.listeners.push(IIC.onGhost(this._clickHandler.bind(this)));
        }
        
        var time = 0;
        
        // Schedule the processing of all points.
        for(var i = 0; i < this.shape.x.length; i++) {
            setTimeout(function(x, y, a) {
                IIC.setAngle(a);
                IIC.makeGhost(x, y);
                if(Math.random() < this.waveProbabiliy)
                    IIC.makeWave(x, y);
            }.bind(this, this.shape.x[i], this.shape.y[i], this.shape.a[i]), time);
            time += this.delayPerPoint;
        }
        
        // Schedule the next iteration of the loop.
        this.runTimer = setTimeout(this.run.bind(this), time);
    },
    
    // Stops the bot.
    stop: function() {
        // Cancel the next iteration of the cycle.
        clearTimeout(this.runTimer);
        this.runTimer = null;
        
        // Remove all event listeners.
        for(var i = 0; i < this.listeners.length; i++)
            IIC.removeEventListener(this.listeners[i]);
        this.listeners = [];
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