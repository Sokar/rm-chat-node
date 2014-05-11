var fs = require('fs');
var io = require('socket.io').listen(8081, { log: false });

io.configure(function () { 
    io.set("origins","http://192.168.1.37:*");
    io.set('transports', [
        'websocket'
      , 'flashsocket'
      , 'xhr-polling'
      , 'htmlfile'
      , 'jsonp-polling'
      ]);
    io.set("polling duration", 10); 
    io.set('reconnect', true);
    io.set('reconnection delay', 500);
    io.set('max reconnection attempts', 10);
});

io.sockets.on('connection', function(socket) {

    socket.on('disconnect', function() {
    	sendMessage("SERVER", "User @"+socket.nickname+" has disconnected.");
    });

    socket.on('set_nickname', function(nickname,callback) {
    	
    	var isNick = isNicknameAvailable(nickname);
    	if (isNick) {
    		socket.nickname = nickname;
	    	sendMessage("SERVER", "User @"+nickname+" has connected.");
    	}

    	callback(isNick);
    });

    socket.on('message', function(message) {
    	sendMessage(socket.nickname, message);
    });

});

var sendMessage = function(nickname, message) {
	io.sockets.emit('message', nickname, message);
}

var isNicknameAvailable = function(nickname) {
	var clients = io.sockets.clients();
	for (var client in clients) {
		if (clients.hasOwnProperty(client)) {
			client = clients[client];

			if (client.nickname == nickname)
				return false;
		}
	}
	return true;
}

function usernameIsValid(username) {
    return /^[0-9a-zA-Z_.-]+$/.test(username);
}
