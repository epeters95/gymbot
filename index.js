const tdl = require('tdl');
tdl.configure({ tdjson: '/usr/local/lib/libtdjson.so' })
const dotenv = require('dotenv');
dotenv.config();
const { channelId } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');

// When test mode is enabled, all GymRats notifications will be sent to the channel
const TEST_MODE = process.env.TEST_MODE === 'true';

// User registry setup

const { addWinToGymrat, addWorkoutToGymrat, getKeyFor } = require('./gymrats');

// Set up Discord client and commands

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });
console.log('Attempting connection...');

discordClient.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});
discordClient.login(process.env.DISCORD_TOKEN);


discordClient.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			discordClient.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

discordClient.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		} else {
			await interaction.reply({
				content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		}
	}
});


// Receive notifications from Telegram

const tdlClient = tdl.createClient({
	apiId: process.env.API_ID,
	apiHash: process.env.API_HASH
});
const DEFAULT_NOTIF_TITLE = 'Glizziator club';

async function runTgApp() {

	console.log('Starting Telegram App...');


	tdlClient.on('error', console.error);

	// Receive updates from TDLib

	await tdlClient.login();

	tdlClient.on('update', handleMessageUpdate);

	async function handleMessageUpdate(update) {
		let messageBody = update.message?.content?.text?.text ?? '';
		try {
			messageBody = messageBody.trim();
			if (messageBody.length > 0) {
				const msg = JSON.parse(messageBody);
				console.log(`Parsed message from Telegram: ${JSON.stringify(msg)}`);

				// Send to discord
				const channel = await discordClient.channels.fetch(channelId);
				if (channel) {

					let username;
					let isWeeklyWin = false;
					let isMonthlyWin = false;
					let messageText = msg.message;
					let received = msg.received;
					let isAnnouncement = (msg.title === DEFAULT_NOTIF_TITLE);

					if (isAnnouncement) {

						// Check for monthly or weekly win
						// Check for discord handle in registry
						let msgSplit = msg.message.split(' has won the ');
						username = msgSplit[0];
						if (msgSplit.length > 1) {
							isWeeklyWin = msgSplit[1].includes('week');
							isMonthlyWin = msgSplit[1].includes('month');
						}
					}
					else {

						// Regular workout posts include username as title
						username = msg.title;
					}

					// Get user's key (discord userId if registered, username if not)

					let key = getKeyFor(username);
					let isRegistered = (key !== username);
					let userHandle = isRegistered ? `<@${key}>` : username;
					messageText = messageText.replace(username, userHandle);

					// Track all users (registered or not)
					if (isAnnouncement) {
						addWinToGymrat(key, isWeeklyWin, isMonthlyWin, received, () => {
							console.log(`Added ${isWeeklyWin ? 'weekly' : 'monthly'} win to user ${username} at ${received}`);
						});
					}
					else {
						let workout = msg.message;

						addWorkoutToGymrat(key, workout, received, () => {
							console.log(`Added workout ${workout} to user ${username} at ${received}`);
						});
					}

					// Send discord channel update

					if (isAnnouncement || TEST_MODE) {
						
						// Username in title, add to message text
						if (!isAnnouncement) {
							messageText = `${userHandle} - ${messageText}`;
						}
						channel.send(messageText);
					}

				} else {
					// TODO: re-check in case of throttling or bad response
					console.error('Server channel not found');
				}
			} else {
				console.log(`Skipping telegram update with no message`)
			}
		} catch(error) {
			console.error(error);
		}
	}

}

runTgApp().catch(console.error);

process.once('SIGINT',  () => tdlClient.close())
process.once('SIGTERM', () => tdlClient.close())