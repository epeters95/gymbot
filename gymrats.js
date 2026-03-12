const fs = require('node:fs');

const GYMRATS_PATH = "gymrats.json";

const gymrats = Object.create(null);

// Note: Session 'gymrats' object will overwrite existing JSON-
// avoid reading/writing to it with other instances



function importJson () {

	// Initialize file with empty object

	if (!fs.existsSync(GYMRATS_PATH)) {
		fs.writeFileSync(GYMRATS_PATH, "{}", 'utf8');
	}

	// Load object from file

	try {
		Object.assign(gymrats, JSON.parse(fs.readFileSync(GYMRATS_PATH, 'utf8')));
	} catch (error) {
		console.log(`Error importing ${GYMRATS_PATH}`);
	}
}

function getKeyFor(username) {
	for (const key in gymrats) {
		if (gymrats[key].gymratsName === username) {
			return key;
		}
	}
	// Unregistered user — use username as key
	return username;
}



function registerGymrat(userId, discordName, gymratsName) {

	const isClaimed = getKeyFor(gymratsName) !== gymratsName;
	if (isClaimed) {
		console.error("Can't assign to name, already claimed")
		return false;
	}
	
	const isRegistered = gymrats[userId] !== undefined;
	const existingUnclaimed = gymrats[gymratsName];

	// Check if there's an existing entry keyed by username
	// If so, assign it to the existing tag (overwrites, should be empty)
	if (existingUnclaimed !== undefined) {
		delete gymrats[gymratsName];
		gymrats[userId] = existingUnclaimed;
		gymrats[userId].discordName = discordName;
	}
	else {
		if (isRegistered) {
			// Exists with ID, simply update name
			gymrats[userId].gymratsName = gymratsName;
		}
		else {
			gymrats[userId] = newGymratEntry(gymratsName, discordName);
		}
	}

	exportJson();

	return true;
}
function ensureEntry(key) {
	// In the case where no entry exists, key will be the gymrats name
	if (!gymrats[key]) {
		gymrats[key] = newGymratEntry(key);
	}
}

function newGymratEntry(gymratsName, discordName=null) {
	let entry = {
		added: new Date().toDateString(),
		gymratsName: gymratsName,
		wins_monthly: 0,
		wins_weekly: 0,
		workouts: []
	}
	if (discordName) {
		entry.discordName = discordName;
	}
	return entry;
}

function addWorkoutToGymrat(key, workout, received='', success=()=>{}) {

	ensureEntry(key);

	gymrats[key].workouts.push({
		received: received,
		workout: workout
	});

	exportJson();
	success();
}

function addWinToGymrat(key, isWeeklyWin, isMonthlyWin, received='', success=()=>{} ) {

	ensureEntry(key);

	if (isWeeklyWin) {
		gymrats[key].wins_weekly += 1;
	}
	if (isMonthlyWin) {
		gymrats[key].wins_monthly += 1;
	}

	exportJson();

	if (!isWeeklyWin && !isMonthlyWin) {
		console.error('Unexpected announcement message');
	} else {
		success();
	}
}

function exportJson() {
	try {
		fs.writeFileSync(
			GYMRATS_PATH,
			JSON.stringify(gymrats, null, 4),
			'utf8'
		);
	} catch(error) {
		console.error(`Error saving JSON: `, error);
	}
}

importJson();

module.exports = { addWinToGymrat, addWorkoutToGymrat, getKeyFor, registerGymrat, gymrats, importJson, exportJson };
