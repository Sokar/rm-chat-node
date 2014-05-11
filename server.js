var fs = require('fs');
var io = require('socket.io').listen(8085, { log: false });

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
        if (socket.nickname != null) {
           sendMessage(socket.room, "SERVER", "User @"+socket.nickname+" has disconnected.","msg_server", socket);
        
        }
        socket.leave(socket.room); 
        sendUsersRoom(socket.room);
    });

    socket.on('subscribe', function(room) { 
        socket.join(room); 
        sendUsersRoom(room);
    });

    socket.on('unsubscribe', function(room) {  
        socket.leave(room); 
        sendUsersRoom(room);
    });

    socket.on('set_nickname', function(nickname,room,callback) {
        if (nickname == null) {
            socket.emit('disconnected_user');
        } else {
            socket.join(room);
            socket.room = room;
            var isNick = isNicknameAvailable(nickname);
            if (isNick) {
                socket.nickname = nickname;
                sendMessage(socket.room, "SERVER", "User @"+nickname+" has connected.","msg_server", socket);
            }
            callback(isNick);
        }
        sendUsersRoom(room);
    });

    socket.on('message', function(message) {
        sendMessage(socket.room, socket.nickname, message,"msg_message", socket);
    });

});

var sendMessage = function(room, nickname, message, tipo, socket) {
    if (tipo == 'msg_message' && nickname == null) {
        socket.emit('disconnected_user');
     } else {
        if (tipo == 'msg_message') {
            socket.broadcast.to(room).emit('message', nickname, escapeHTML(message), tipo);
            socket.emit('message', nickname, escapeHTML(message), "msg_me");
        } else {
            io.sockets.in(room).emit('message', nickname, escapeHTML(message), tipo);
        }
     }
}

var sendUsersRoom = function(room) {
    var clients = io.sockets.clients(room);
    var clientsOut = [];
    var clientsOutNum = 0;
    for (var client in clients) {
        if (clients.hasOwnProperty(client)) {
            client = clients[client];
            if (client.nickname != null) {
                clientsOut[clientsOutNum] = client.nickname;
                clientsOutNum++;
            }
        }
    }
    io.sockets.in(room).emit('updateClients', clientsOut);

};

var isNicknameAvailable = function(nickname) {
    if (!usernameIsValid(nickname)) return false;
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

function contentValid(content) {
    return /^[¡!¿?=()%$€@#|.,-_áéíóúÁÉÍÓÚñÑ 0-9a-zA-Z_.-]+$/.test(content);
}
function usernameIsValid(content) {
    return /^[0-9a-zA-Z_.-]+$/.test(content);
}
function escapeHTML(s) { 
    return s.replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}