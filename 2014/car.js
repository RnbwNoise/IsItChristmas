// In the developer's console:
// 1. Paste the contents of this file.
// 2. Enter "IICCar.start()".
// 3. Click anywhere on the stage.

var IICCar = {
    friction: 0.85, // velocity will be multiplied by this value every update
    maxVelocity: 30,
    keyAngularVelocityFactor: (Math.PI / 300), // angular velocity = this (factor exerted by a key) times velocity
    keyAcceleration: 10, // acceleration exerted by a key
    
    _UPDATE_INTERVAL: 200, // ms
    
    _KEY_SPACE: 32,
    _KEY_LEFT: 37,
    _KEY_UP: 38,
    _KEY_RIGHT: 39,
    _KEY_DOWN: 40,
    
    _VELOCITY_EPSILON: 0.5,
    
    _velocity: 0,
    _acceleration: 0,
    _angularVelocityFactor: 0,
    
    _isRunning: false,
    _oldKeyUp: null,
    _oldKeyDown: null,
    _oldMouseMove: null,
    _updateTimer: null,
    
    // Starts the script.
    start: function() {
        // The script is already running.
        if(this._isRunning)
            return;
        
        // Replace the old event handlers.
        this._oldKeyUp = document.onkeyup;
        this._oldKeyDown = document.onkeydown;
        this._oldMouseMove = document.onmousemove;
        document.onkeyup = function(event) {
            this._keyChangeHandler(event.keyCode, false);
            
            if(event.preventDefault)
                event.preventDefault();
            return false;
        }.bind(this);
        document.onkeydown = function(event) {
            this._keyChangeHandler(event.keyCode, true);
            
            if(event.preventDefault)
                event.preventDefault();
            return false;
        }.bind(this);
        document.onmousemove = null;
        
        // Start the loop.
        this._updateTimer = setInterval(this._update.bind(this), this._UPDATE_INTERVAL);
        
        // The script is now running.
        this._isRunning = true;
    },
    
    // Stops the script.
    stop: function() {
        // The script isn't running.
        if(!this._isRunning)
            return;
        
        // Put the old event handlers back.
        document.onkeyup = this._oldKeyUp;
        document.onkeydown = this._oldKeyDown;
        document.onmousemove = this._oldMouseMove;
        this._oldKeyUp = null;
        this._oldKeyDown = null;
        this._oldMouseMove = null;
        
        // Stop the loop.
        clearInterval(this._updateTimer);
        
        // The bot isn't running anymore.
        this._isRunning = false;
    },
    
    // Handles the change of a key's state.
    _keyChangeHandler: function(key, isDown) {
        switch(key) {
            case this._KEY_LEFT:
                this._angularVelocityFactor = -this.keyAngularVelocityFactor * isDown;
                break;
            case this._KEY_RIGHT:
                this._angularVelocityFactor = this.keyAngularVelocityFactor * isDown;
                break;
            case this._KEY_UP:
                this._acceleration = this.keyAcceleration * isDown;
                break;
            case this._KEY_DOWN:
                this._acceleration = -this.keyAcceleration * isDown;
                break;
            case this._KEY_SPACE:
                var p = IIC.getPosition();
                IIC.makeWave(p.x, p.y);
                break;
        }
    },
    
    // Updates the simulation.
    _update: function() {
        // Get the old location. If the flag does not exist, put it in the center of the screen.
        var p = IIC.getPosition();
        if(!p) {
            IIC.setPosition(window.innerWidth / 2, window.innerHeight / 2);
            return;
        }
        
        // Draw a ghost at the old location.
        IIC.makeGhost(p.x, p.y);
        
        // Adjust the angle based on angular velocity.
        var a = IIC.getAngle() + (this._angularVelocityFactor * this._velocity);
        
        // Adjust position based on angle and velocity.
        p.x += Math.cos(a) * this._velocity;
        p.y += Math.sin(a) * this._velocity;
        
        // Handle collisions
        if(p.x < 0 || p.x > window.innerWidth) {
            p.x = this._clamp(p.x, 0, window.innerWidth);
            a = Math.PI - a;
        }
        if(p.y < 0 || p.y > window.innerHeight) {
            p.y = this._clamp(p.y, 0, window.innerHeight);
            a *= -1;
        }
        
        // Apply acceleration and friction.
        this._velocity = this._clamp(this._velocity + this._acceleration, -this.maxVelocity, this.maxVelocity)
                         * this.friction;
        
        // Prevent infinite sliding.
        if(Math.abs(this._velocity) < this._VELOCITY_EPSILON)
            this._velocity = 0;
        
        // Update the flag.
        var currentPosition = IIC.getPosition();
        if(currentPosition.x !== p.x || currentPosition.y !== p.y)
            IIC.setPosition(p.x, p.y);
        if(IIC.getAngle() !== a)
            IIC.setAngle(a);
    },
    
    // Limits a value to a given range.
    _clamp: function(x, min, max) {
        return Math.max(min, Math.min(x, max));
    },
};