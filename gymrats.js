const fs = require('node:fs');

const GYMRATS_PATH = "gymrats.json";

if (!fs.existsSync(GYMRATS_PATH)) {
	fs.writeFileSync(GYMRATS_PATH, "{}", 'utf8');
}

const gymrats = Object.create(null);
try {
	Object.assign(gymrats, JSON.parse(fs.readFileSync(GYMRATS_PATH, 'utf8')));
} catch (error) {
	console.log(`Error importing ${GYMRATS_PATH}`);
}

module.exports = { gymrats, GYMRATS_PATH };
