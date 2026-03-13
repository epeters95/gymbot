const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { gymrats, getKeyFor, addWorkoutToGymrat, addWinToGymrat, registerGymrat, exportJson } = require('./gymrats');

// Clear gymrats between tests
function clearGymrats() {
	for (const key in gymrats) {
		delete gymrats[key];
	}
}

describe('getKeyFor', () => {
	beforeEach(clearGymrats);

	it('returns userId for registered user', () => {
		gymrats['123'] = { gymratsName: 'Mike' };
		assert.strictEqual(getKeyFor('Mike'), '123');
	});

	it('returns username for unregistered user', () => {
		assert.strictEqual(getKeyFor('Unknown'), 'Unknown');
	});
});

describe('addWorkoutToGymrat', () => {
	beforeEach(clearGymrats);

	it('creates entry and adds workout for new user', () => {
		addWorkoutToGymrat('Mike', 'Push-ups', '2026-03-10');
		assert.strictEqual(gymrats['Mike'].workouts.length, 1);
		assert.strictEqual(gymrats['Mike'].workouts[0].workout, 'Push-ups');
		assert.strictEqual(gymrats['Mike'].workouts[0].received, '2026-03-10');
	});

	it('appends to existing workouts', () => {
		addWorkoutToGymrat('Mike', 'Push-ups', '2026-03-10');
		addWorkoutToGymrat('Mike', 'Squats', '2026-03-11');
		assert.strictEqual(gymrats['Mike'].workouts.length, 2);
	});
});

describe('addWinToGymrat', () => {
	beforeEach(clearGymrats);

	it('increments weekly win', () => {
		addWinToGymrat('Mike', true, false);
		assert.strictEqual(gymrats['Mike'].wins_weekly, 1);
		assert.strictEqual(gymrats['Mike'].wins_monthly, 0);
	});

	it('increments monthly win', () => {
		addWinToGymrat('Mike', false, true);
		assert.strictEqual(gymrats['Mike'].wins_weekly, 0);
		assert.strictEqual(gymrats['Mike'].wins_monthly, 1);
	});
});

describe('registerGymrat', () => {
	beforeEach(clearGymrats);

	it('creates new entry for fresh user', () => {
		const result = registerGymrat('456', 'mike_discord', 'Mike');
		assert.strictEqual(result, true);
		assert.strictEqual(gymrats['456'].gymratsName, 'Mike');
		assert.strictEqual(gymrats['456'].discordName, 'mike_discord');
		assert.strictEqual(gymrats['456'].wins_weekly, 0);
	});

	it('migrates unregistered user stats to userId key', () => {
		addWorkoutToGymrat('Mike', 'Push-ups', '2026-03-10');
		addWinToGymrat('Mike', true, false);

		const result = registerGymrat('456', 'mike_discord', 'Mike');

		assert.strictEqual(result, true);
		assert.strictEqual(gymrats['Mike'], undefined);
		assert.strictEqual(gymrats['456'].gymratsName, 'Mike');
		assert.strictEqual(gymrats['456'].discordName, 'mike_discord');
		assert.strictEqual(gymrats['456'].workouts.length, 1);
		assert.strictEqual(gymrats['456'].wins_weekly, 1);
	});

	it('allows updating gymrats name', () => {
		registerGymrat('456', 'mike_discord', 'Mike');
		registerGymrat('456', 'mike_discord', 'MikeG');
		assert.strictEqual(gymrats['456'].gymratsName, 'MikeG');
	});

	it('rejects name already claimed by another user', () => {
		registerGymrat('456', 'mike_discord', 'Mike');
		const result = registerGymrat('789', 'other_discord', 'Mike');
		assert.strictEqual(result, false);
		assert.strictEqual(gymrats['789'], undefined);
	});

	it('preserves data when updating name', () => {
		registerGymrat('456', 'mike_discord', 'Mike');
		addWorkoutToGymrat('456', 'Push-ups', '2026-03-10');
		addWinToGymrat('456', true, false);

		registerGymrat('456', 'mike_discord', 'MikeG');
		assert.strictEqual(gymrats['456'].gymratsName, 'MikeG');
		assert.strictEqual(gymrats['456'].workouts.length, 1);
		assert.strictEqual(gymrats['456'].wins_weekly, 1);
	});
});
