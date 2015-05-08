var r = require('rethinkdb');
var express = require('express');
var sockio = require('socket.io');
var config = require('./config');

var app = express();
app.use(express.static(__dirname + '/public'));

var io = sockio.listen(app.listen(config.port), {log: false});
console.log('Server started on port', config.port);


// RethinkDB query for top 50 questions, ordered by points
//   -> assumes an index has been created on 'points'
topScores = r.table('questions').orderBy({index: 'points'}).limit(50)

// Open a changefeed for questions
r.connect({db: 'rtq'}).then(function(conn) {
    // Whenever there's a change to the top scores...
    topScores.changes().run(conn)
        .then(function(cursor) {
            cursor.each(function(err, change) {
                console.log('New change:', change);
                // ...emit a message to all clients with the changes
                io.sockets.emit('questions', change);
            });
        });
});


io.sockets.on('connection', function(socket) {
    // When a client first connects, send all questions already in the database to the client
    r.connect({db: 'rtq'}).then(function(conn) {
        return r.table('questions').run(conn)
            .finally(function() { conn.close(); });
    })
    .then(function(cursor) { return cursor.toArray(); })
    .then(function(result) { socket.emit('load questions', result); })
    .error(function(err) { console.log('Error retrieving questions: ', err); });
});
