var userNames = {};
IIC.onChat(function(userId, name, message) {
    if(userNames[userId] && userNames[userId] !== name) {
        log.system('↑ %c' + name + ' %cwas previously known as %c' + userNames[userId] + '%c.',
                   styles.chat_my_name, styles.system, styles.chat_my_name, styles.system);
    }
    userNames[userId] = name;
});