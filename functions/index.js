// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

exports.recountCapacities = functions.database.ref('/Capacities/Check-ins/{checkinid}').onWrite(async (change) => {
	
	// Grab the current (.after) value of what was written to the Realtime Database.
	const checkinsRef = change.after.ref.parent;
	const countsRef = admin.database().ref('Capacities/Count/');
	const capacitiesRef = admin.database().ref('Capacities/');

	// Define a bunch of variables
	var comedorCount = 0;
	var salaDeLecturaCount = 0;
	var bibliotecaCount = 0;

	const comedorTimeout = 20*60; //20 minutos
	const salaDeLecturaTimeout = 6*60*60; //6 horas
	const bibliotecaTimeout = 6*60*60; //6 horas

	const timeNow = Date.now();

	// Save all node updates inside a single dictionary
	const updates = {};

	// Retrieve all check-ins and classify them, delete the old ones
	const checkins = await checkinsRef.once('value');

	checkins.forEach((child) => {
		if (child.key != "Placeholder"){
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