// User-defined events

IIC._userListeners = {};

// Sets a handler (function(data)) for a given event. Returns the handler's "identifier".
IIC.addEventListener = function(event, listener) {
    // We aren't calling user listeners for this event: start doing so.
    if(!this._userListeners[event]) {
        this._userListeners[event] = [];
        
        var defaultListener = events[event];
        events[event] = function(data) {
            // Call the system's listener.
            defaultListener(data);
            
            // And then all of the user-defined ones.
            for(var i = 0; i < this._userListeners[event].length; i++) {
                if(this._userListeners[event][i])
                    this._userListeners[event][i](data);
            }
        }.bind(this);
    }
    
    // Add user's listener.
    return [ event, this._userListeners[event].push(listener) - 1 ];
};

// Removes an event handler with a given identifier. Returns true if the listener was successfully removed.
IIC.removeEventListener = function(listenerId) {
    // Make sure the id is valid and the listener exists.
    if(!listenerId || !listenerId[0] || (typeof listenerId[1]) === 'undefined'
       || !this._userListeners[listenerId[0]] || !this._userListeners[listenerId[0]][listenerId[1]])
        return false;

    // Delete the listener.
    this._userListeners[listenerId[0]][listenerId[1]] = null;
    return true;
};

// Connection

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

// Chat

// Sets a chat message handler with the following signature: function(userId, message).
// NOTE: the handler will also process our own chat messages.
IIC.onChat = function(listener) {
    return this.addEventListener('chat', function(data) {
        listener(data.id, data.message);
    });
};

// Countries

// Returns the current country, or that of another user if his id is provided. If the user is disconnected,
// returns null.
IIC.getCountry = function(userId) {
    if(userId)
        return others[userId] ? others[userId].country : null;
    return me.country;
};

// Flag dimensions

// Returns the width of a flag of a given country.
IIC.getFlagWidth = function(countryCode) {
    return flagWidth(countryCode);
};

// Returns the height of a flag of a given country.
IIC.getFlagHeight = function(countryCode) {
    return 20;
};

// Flag position

// Returns the current position, or that of another user if his id is provided. If the flag does not exist, returns null.
IIC.getPosition = function(userId) {
    var flag;
    if(userId && userId !== me.id)
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
    
// Flag rotation

// Returns the current angle, or that of another user if his id is provided.
IIC.getAngle = function(userId) {
    return (userId ? others[userId].angle : me.angle) / 180 * Math.PI;
};

// Sets a flag rotation handler with the following signature: function(userId, newAngle). newAngle is in radians.
IIC.onRotation = function(listener) {
    return this.addEventListener('scroll', function(data) { listener(data.id, data.angle / 180 * Math.PI); });
};

// Waves and ghosts

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

// Debugging

IIC._DEBUG_POINT_SIZE = 4;
IIC._DEBUG_Z_INDEX = 10000;
IIC._debugElements = [];

// Adds a div for debugging marks.
IIC._addDebugDiv = function(x, y) {
    var element = document.createElement('div');
    
    element.style.zIndex = this._DEBUG_Z_INDEX;
    
    element.style.position = 'absolute';
    element.style.left = x + 'px';
    element.style.top = y + 'px';
    
    document.body.appendChild(element);
    return { element: element, index: this._debugElements.push(element) - 1 };
};

// Draws a point at a given location for debugging purposes.
IIC.debugPoint = function(x, y, color) {
    var point = this._addDebugDiv(x - this._DEBUG_POINT_SIZE / 2, y - this._DEBUG_POINT_SIZE / 2);
    
    point.element.style.width = this._DEBUG_POINT_SIZE + 'px';
    point.element.style.height = this._DEBUG_POINT_SIZE + 'px';
    
    point.element.style.backgroundColor = color || 'black';
    
    return point.index;
};

// Draws a string at a given location for debugging purposes.
IIC.debugText = function(x, y, text, color) {
    var textbox = this._addDebugDiv(x, y);
    textbox.element.innerText = text;
    
    textbox.element.style.fontFamily = 'sans-serif';
    textbox.element.style.fontSize = '12px';
    
    if(color)
        textbox.element.style.color = color;
    
    return textbox.index;
};

// Erases a debugging mark with a given id.
IIC.debugErase = function(elementId) {
    if(!this._debugElements[elementId])
        return false;
    
    this._debugElements[elementId].parentElement.removeChild(this._debugElements[elementId]);
    this._debugElements[elementId] = null;
    return true;
};

// Erases all the debugging marks.
IIC.debugEraseAll = function() {
    for(var i = 0; i < this._debugElements.length; i++)
        this.debugErase(i);
    this._debugElements = [];
};