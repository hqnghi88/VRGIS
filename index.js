var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
const PORT = process.env.PORT || 80
var app = express();
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use('/examples', express.static(path.join(__dirname, 'examples')))
app.use('/models', express.static(path.join(__dirname, 'examples/models')))


app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname + '/examples/20-game.html'));
});
 

app.get('/home', function(request, response) {
    if (request.session.loggedin) {
        response.sendFile(__dirname + '/examples/20-game.html');
    } else {
        //response.send('Please login to view this page!');
        response.redirect('/');
        response.end();
    }
});


app.listen(PORT, () => console.log(`Listening on ${ PORT }`))