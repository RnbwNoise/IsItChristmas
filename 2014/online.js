// In the developer's console:
// 1. Paste the contents of lib/sparkly.js.
// 2. Paste the contents of this file.

var IICOnline = {
    monitoringInterval: 1000 * 60 * 5, // ms
    displayPoints: 20,
    requestMatch: /online/,
    requestRatelimit: 1000 * 60 * 5, // ms
    
    _isRunning: false,
    _onlineData: [],
    _monitoringTimer: null,
    _requestListener: null,
    _ignoreRequests: false,
    
    // Starts the bot.
    start: function() {
        // The bot is already running
        if(this._isRunning)
            return;
        
        // Start monitoring the room size
        this._onlineData = [ IIC.getConnectedIds().length ];
        this._monitoringTimer = setInterval(function() {
            this._onlineData.push(IIC.getConnectedIds().length);
        }.bind(this), this.monitoringInterval);
        
        // And listening for graph requests
        this._requestListener = IIC.onChat(function(userId, name, message) {
            // Not a graph request, or too little time have passed since the previous one
            if(this._ignoreRequests || !message.match(this.requestMatch))
                return;
            
            // Display the data we have
            var data = this._onlineData.slice(-this.displayPoints);
            var min = Math.min.apply(null, data);
            var max = Math.max.apply(null, data);
            say('Online: ' + sparkly(data) + ' (min: ' + min + ', max: ' + max + ')');
            
            // Ignore graph requests for the next requestRatelimit ms
            this._ignoreRequests = true;
            setInterval(function() { this._ignoreRequests = false; }.bind(this), this.requestRatelimit);
        }.bind(this));
        
        // The bot is now running
        this._isRunning = true;
    },
    
    // Stops the bot.
    stop: function() {
        // The bot is not running
        if(!this._isRunning)
            return;
        
        // Remove all timers and listeners.
        clearInterval(this._monitoringTimer);
        IIC.removeEventListener(this._requestListener);
        this._monitoringTimer = null;
        this._requestListener = null;
        
        // The bot is not running anymore
        this._isRunning = false;
    }
};

IICOnline.start();