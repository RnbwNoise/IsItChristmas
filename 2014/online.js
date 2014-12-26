// In the developer's console:
// 1. Paste the contents of lib/sparkly.js.
// 2. Paste the contents of this file.

var IICOnline = {
    getCurrentMeasurement: function() { return IIC.getConnectedIds().length; },
    measurementInterval: 1000 * 60 * 5, // ms
    
    displayPoints: (60 / 5) * 24,
    displayBlocks: 20,
    
    requestMatch: /online/,
    requestRatelimit: 1000 * 60 * 5, // ms
    
    _isRunning: false,
    _dataPoints: [],
    _monitoringTimer: null,
    _requestListener: null,
    _requestsRatelimited: false,
    
    // Starts the bot.
    start: function() {
        // The bot is already running
        if(this._isRunning)
            return;
        
        // Start monitoring the room size
        this._dataPoints = [ this.getCurrentMeasurement() ];
        this._monitoringTimer = setInterval(function() {
            this._dataPoints.push(this.getCurrentMeasurement());
        }.bind(this), this.measurementInterval);
        
        // And listening for graph requests
        this._requestListener = IIC.onChat(function(userId, name, message) {
            // Not a graph request, or too little time have passed since the previous one
            if(this._requestsRatelimited || !message.match(this.requestMatch))
                return;
            
            // Post the output.
            say(this._getOutput());
            
            // Ignore graph requests for the next requestRatelimit ms
            this._requestsRatelimited = true;
            setInterval(function() { this._requestsRatelimited = false; }.bind(this), this.requestRatelimit);
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
    },
    
    // Returns our response to a graph request.
    _getOutput: function() {
        // Remove too old data points.
        var data = this._dataPoints.slice(-this.displayPoints);
        
        // Stretch/compress all data points into a sparkline.
        var blockSize = data.length / this.displayBlocks;
        var blocks = [];
        for(var i = 0; i < this.displayBlocks; i++)
            blocks.push(this._sliceAverage(data, i * blockSize, (i + 1) * blockSize));
        
        // Display the sparkline.
        var min = Math.min.apply(null, data);
        var max = Math.max.apply(null, data);
        var now = this.getCurrentMeasurement();
        return 'Online: ' + sparkly(blocks) + ' (min: ' + min + ', max: ' + max + ', now: ' + now + ')';
    },
    
    // Returns the average of a slice of array between two non-integer indices. Data points partially covered by these
    // indices will be weighted according to the amount of coverage. For example, indices [2.2, 4.5] would give elements
    // the following weights: #2 - 0.8, #3 - 1.0, #4 - 0.5.
    _sliceAverage: function(data, start, end) {
        var weightedSum = 0;
        var totalWeight = 0;
        
        // Include the first value.
        var startValueIndex = Math.floor(start);
        var startValueWeight = Math.floor(start + 1) - start;
        weightedSum += data[startValueIndex] * startValueWeight;
        totalWeight += startValueWeight;
        
        // Include the last value if its index is not an integer.
        var endValueIndex = Math.min(Math.floor(end), data.length);
        var endValueWeight = end - Math.floor(end);
        if(endValueWeight !== 0) {
            weightedSum += data[endValueIndex] * endValueWeight;
            totalWeight += endValueWeight;
        }
        
        // Include all values in between.
        for(var i = startValueIndex + 1; i < endValueIndex; i++) {
            weightedSum += data[i];
            totalWeight++;
        }
        
        return weightedSum / totalWeight;
    }
};

IICOnline.start();