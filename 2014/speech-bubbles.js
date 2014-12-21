IIC.onChat(function(userId, name, message) {
    var position = IIC.getPosition(userId);
    if(!position)
        return;
    var elementId = IIC.debugText(position.x, position.y, name + ': ' + message);
    setTimeout(function() {
        IIC.debugErase(elementId);
    }, 5000);
});