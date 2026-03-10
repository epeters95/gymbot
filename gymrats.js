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

function getUserIdFor(username) {
	for (const userId in gymrats) {
		if (gymrats[userId].gymratsName === username) {
			return userId;
		}
	}
}

function addWorkoutToGymrat(userId, workout, received='', success=()=>{}) {

	// Initialize array and add workout

	if (!gymrats[userId].workouts) {
		gymrats[userId].workouts = [];
	}
	gymrats[userId].workouts.push({
		received: received,
		workout: workout
	});

	exportJson();
	success();
}

function addWinToGymrat(userId, isWeeklyWin, isMonthlyWin, received='', success=()=>{} ) {

	if (isWeeklyWin) {
		gymrats[userId].wins_weekly += 1;
	}
	if (isMonthlyWin) {
		gymrats[userId].wins_monthly += 1;
	}

	exportJson();
	success();
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

module.exports = { addWinToGymrat, addWorkoutToGymrat, getUserIdFor, gymrats, importJson, exportJson };
