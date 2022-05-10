// Gebruik een Express server om je PWA te hosten.
var express = require('express');
var app = express();

// Gebruik NeDB als in memory database.
// zie: https://github.com/louischatriot/nedb#creatingloading-a-database
var Datastore = require('nedb');
var db = new Datastore();

// Gebruik web-push om push berichten te verzenden.
var webpush = require('web-push');

// VAPID-keys genereren: https://web-push-codelab.glitch.me/.
const vapidKeys = {
    publicKey: "BOe8_sGgicW6dm8zm2yj9ErTCC0ucs4rgIiXTkpM3QLrRPtijiT4RvPb3f_tQLuS0k6i6zaOTVdE-XWQAsN_Ryw",
    privateKey: "JWnU7eueLyK2NXA3PmiukpYrjplVBhuRPRzbzhgeFbw"
};

webpush.setVapidDetails(
    'mailto:yuran.loones@student.vives.be',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// Alle bestand in de map public beschikbaar maken op het 'www'.
app.use(express.static('public'));

// JSON-pakketten parsen mogelijk maken.
app.use(express.json());

// Maak een route om een subscription op te slaan.
app.post("/api/save-subscription/", function(request, response){
    console.log("POST info arrived...");
    console.log(request.body);

    // Als de data niet ok is, keer terug met foutmelding.
    if(!request.body || !request.body.endpoint){
        // Info HTPP response status codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status.
        response.status(400);
        response.setHeader('Content-type','application/json');
        response.send(JSON.stringify({
            error: {
                id: 'no endpoint',
                message: 'Subscription must have an endpoint.'
            }
        }));
    }
    else
    {
        // Als data wel ok is, sla op in lokale database (in memory)...
        saveSubscriptionToDatabase(request.body)
        .then(function(subscriptionId) {
            console.log("Saved _id: ", subscriptionId);
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({ data: { success: true } }));
        })
        .catch(function(err) {
            console.log(err);
            response.status(500);
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({
                error: {
                            id: 'unable-to-save-subscription',
                            message: 'The subscription was received but we were unable to save it to our database.'
                        }
            }));
        });
    }
});

// Maak een tweede route voor het triggeren van een push message.
app.post("/api/trigger-push-message/", function(request, response){
    console.log("Trigger push at backend received...");
    console.log(request.body);    

    // Antwoorden aan aanvrager.
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify({ data: { success: true } }));

    // Alle abonnementen opvragen in de database en daarnaar een berichtje pushen.
    // Info over opvragen gegevens in een NeDB, zie: https://github.com/louischatriot/nedb/wiki/Finding-documents.
    db.find({}, function (err, subscriptions) {
        console.log(subscriptions);

        if(err)
            console.log("Error during searching in NeDB: ", err);
        else
        {            
            // Er is reeds een pagina die push berichtjes kan aanvragen/versturen... Maar het kan ook via Postman.
            // Moet onderstaande meer asynchroon? Met Promises?
            for (let i = 0; i < subscriptions.length; i++)
            {
                console.log("Try to push message.", subscriptions[i]);
                triggerPushMessage(subscriptions[i], request.body.message);
            }
        }
    });
});

// Gebruik een 'in memory' NeDB database om de abonnementen in op te slaan.
// Telkens dit script (server.js) wordt afgesloten, aan de gegevens ook verloren.
// Dit zou ook in een MySQL-database opgeslaan kunnen worden.
function saveSubscriptionToDatabase(subscription) {
    return new Promise(function(resolve, reject) {
        // Item toevoegen aan de NeDB, zie: https://github.com/louischatriot/nedb/wiki/Inserting-documents
        db.insert(subscription, function(err, newDoc) {
            if (err)
                reject(err);
            else
                // Ter info het automatisch aangemaakte _id terug meegeven.
                resolve(newDoc._id);
        });
    });
};

// Functie die effectief de berichten pusht.
function triggerPushMessage (subscription, dataToSend)
{
    // Zie: https://www.npmjs.com/package/web-push#sendnotificationpushsubscription-payload-options.
    // Deze functie return't een Promise die resulteert in een object of error.
    return webpush.sendNotification(subscription, dataToSend)
        .catch((err) => {
            if (err.statusCode === 404 || err.statusCode === 410) 
            {
                console.log('Subscription has expired or is no longer valid: ', err);

                // Het bewuste abonnement verwijderen. Nog verder testen.
                db.remove({_id: subscription._id},{}, function(){
                    console.log("Subscription removed with _id: ", subscription._id);
                });
            }
            else
            {
                throw err;
            }
        });
};

// Start effectief de server en luister op poort 3000.
app.listen(3000);
console.log("Express server gestart op http://localhost:3000.");