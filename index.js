const tdl = require('tdl');
tdl.configure({ tdjson: '/usr/local/lib/libtdjson.so' })
const dotenv = require('dotenv');
dotenv.config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');

// When test mode is enabled, all GymRats notifications will be sent to the channel
const TEST_MODE = true;

// User registry setup

const GYMRATS_PATH = "gymrats.json";

const gymrats = Object.create(null);
try {
	fs.writeFile(GYMRATS_PATH, "{}", { flag: 'wx' }, () => {});
	Object.assign(gymrats, JSON.parse(fs.readFileSync(GYMRATS_PATH, 'utf8')))
} catch (error) {
	console.log(`Error importing ${GYMRATS_PATH}`);
}

// Set up Discord client and commands

const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });
console.log('Attempting connection...');

discordClient.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});
discordClient.login(process.env.DISCORD_TOKEN);

const CHANNEL_ID = process.env.CHANNEL_ID;


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
			messageBody = messageBody.replace('\t', '');
			const msg = JSON.parse(messageBody);
			console.log(`Parsed message from Telegram: ${JSON.stringify(msg)}`);

			// Send to discord
			const channel = await discordClient.channels.fetch(CHANNEL_ID);
			if (channel) {

				let username;
				let isWeeklyWin = false;
				let isMonthlyWin = false;
				let messageText = msg.message;
				let isAnnouncement = (msg.title === DEFAULT_NOTIF_TITLE);

				// TODO: track workout occurrence in regular posts

				if (isAnnouncement) {

					// Check for monthly or weekly win
					// Check for discord handle in registry
					let msgSplit = msg.message.split(' has won the ');
					username = msgSplit[0];
					isWeeklyWin = msgSplit[1].includes('week');
					isMonthlyWin = msgSplit[1].includes('month');
				}
				else {

					// Regular workout posts include username as title
					username = msg.title;

				}

				// Replace the username with the @ handle
				if (isAnnouncement || TEST_MODE) {
					let userHandle = username;
					
					for (const userId in gymrats) {

						if (gymrats[userId].gymratsName === username) {
							
							// Use @ mention and track stats
							userHandle = `<@${userId}>`;
							if (isWeeklyWin) {
								gymrats[userId].wins_weekly += 1;
							}
							if (isMonthlyWin) {
								gymrats[userId].wins_monthly += 1;
							}

							// save json
							try {
								await fs.promises.writeFile(
									GYMRATS_PATH,
									JSON.stringify(gymrats, null, 4),
									'utf8'
								);
							} catch(error) {
								console.error(`Error saving JSON: `, error);
							}						
							break;
						}
					}
					messageText = messageText.replace(username, userHandle);
					
					// Username in title, add to message text
					if (!isAnnouncement) {
						messageText = `${userHandle} - ${messageText}`;
					}
					// Send channel announcement
					channel.send(messageText);
				}

				
			} else {
				// TODO: re-check in case of throttling or bad response
				console.error('Server channel not found');
			}
		} catch(error) {
			console.log(`Skipping telegram message without JSON: ${messageBody}`)
		}
	}

}

runTgApp().catch(console.error);

process.once('SIGINT',  () => tdlClient.close())
process.once('SIGTERM', () => tdlClient.close())