IIC.onChat(function(userId, message) {
    var position = IIC.getPosition(userId);
    if(!position)
        return;
    var elementId = IIC.debugText(position.x, position.y, message);
    setTimeout(function() {
        IIC.debugErase(elementId);
    }, 5000);
});