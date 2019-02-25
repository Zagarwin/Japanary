// Chargement des modules 
var express = require('express');
var app = express();
var server = app.listen(8000, function() {
    console.log("C'est parti ! En attente de connexion sur le port 8080...");
});

// Ecoute sur les websockets
var io = require('socket.io').listen(server);

// Configuration d'express pour utiliser le répertoire "public"
app.use(express.static('public'));
// set up to 
app.get('/', function(req, res) {  
    res.sendFile(__dirname + '/public/display.html');
});



/*** Gestion des clients et des connexions ***/
var clients = {};       // id -> socket
var games = [];
var nbSameName = 1;
var gameTest = new Game(123456);
games[gameTest.id]=gameTest;

// Quand un client se connecte, on le note dans la console
io.on('connection', function (socket) {
    
    // message de debug
    console.log("Un client s'est connecté");
    var currentID = null;
    
    /**
     *  Doit être la première action après la connexion.
     *  @param  id  string  l'identifiant saisi par le client
     */
    socket.on("login", function(id) {
        if (clients[id]) {
            id = id + "("+nbSameName+")";
            nbSameName++;   
        }
        currentID = id;
        currentPerson = new Person(currentID);
        clients[currentID] = currentPerson;
        gameTest.addPerson(currentPerson);

        
        console.log("Nouvel utilisateur : " + currentID);
        // envoi aux autres clients 
        // socket.broadcast.emit("message", { from: null, to: null, text: currentID + " a rejoint la discussion", date: Date.now() } );
        // envoi de la nouvelle liste à tous les clients connectés 
        io.sockets.emit("liste", Object.keys(clients));
    });
    
    socket.on("new_game", function(new_game) {
	console.log("game pushed");
	games.push(new_game);
    });

    socket.on("begin", function(){
        gameTest.choosePainter();
        socket.emit("initClient", gameTest);
        console.log("Game is parti");
    });

   socket.on("get_lobby", function() {
	console.log("games sended");
	socket.emit("lobby", games);
   });
   
   socket.on("command",function(command){
        socket.emit("command2clients",command);
   });
    
    
});

function Person(name){
    this.id=name;


}


function Game(number){
    this.persons=[];
    this.id = number;
    this.painter = null;
    this.numberContinue = 0;

    this.addPerson=function(p){
        this.persons.push(p);
    };

    this.hasPerson=function(name){
        for(p in this.persons){
            if(p.id == name){
                return true;
            }
        }
        return false;
    }

    this.choosePainter=function(){
        this.painter=this.persons[this.numberContinue%this.persons.size];
    }


}
