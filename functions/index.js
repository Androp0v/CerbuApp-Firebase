// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

exports.recountCapacities = functions.pubsub.schedule('every 2 minutes').onRun(async (context) => {
    
    // Grab the current (.after) value of what was written to the Realtime Database.
    const checkinsRef = admin.database().ref('Capacities/Check-ins/');
    const countsRef = admin.database().ref('Capacities/Count/');
    const capacitiesRef = admin.database().ref('Capacities/');

    // Define a bunch of variables
    var comedorCount = 0;
    var salaDeLecturaCount = 0;
    var bibliotecaCount = 0;

    const comedorTimeout = 20*60; //20 minutos
    const salaDeLecturaTimeout = 6*60*60; //6 horas
    const bibliotecaTimeout = 6*60*60; //6 horas

    // Seconds since UNIX epoch (not miliseconds, hence the /1000)
    const timeNow = Date.now()/1000;

    // Save all node updates inside a single dictionary
    const updates = {};

    // Retrieve all check-ins and classify them, delete the old ones
    const checkins = await checkinsRef.once('value');

    checkins.forEach((child) => {
        if (child.key !== "Placeholder"){
            if (child.child("Room").val() === "Comedor") {
                if (timeNow - child.child("Time").val() >= comedorTimeout){
                    updates["Check-ins/" + child.key] = null;
                }else{
                    comedorCount += 1;
                }
            } else if (child.child("Room").val() === "SalaDeLectura"){
                if (timeNow - child.child("Time").val() >= salaDeLecturaTimeout){
                    updates["Check-ins/" + child.key] = null;
                }else{
                    salaDeLecturaCount += 1;
                }
            } else if (child.child("Room").val() === "Biblioteca"){
                if (timeNow - child.child("Time").val() >= bibliotecaTimeout){
                    updates["Check-ins/" + child.key] = null;
                }else{
                    bibliotecaCount += 1;
                }
            }
        }
    });

    // Update child nodes "Count" with freshly counted data
    const counts = await countsRef.once('value');
    
    updates["Count/Comedor/Current"] = comedorCount;
    updates["Count/SalaDeLectura/Current"] = salaDeLecturaCount;
    updates["Count/Biblioteca/Current"] = bibliotecaCount;

    return capacitiesRef.update(updates);
});