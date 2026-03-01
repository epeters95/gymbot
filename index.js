const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const dotenv = require('dotenv');
dotenv.config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');

const TEST_MODE = true;

// User registry

const GYMRATS_PATH = "gymrats.json";

const gymrats = Object.create(null);
try {
	fs.writeFile(GYMRATS_PATH, "{}", { flag: 'wx' }, () => {});
	Object.assign(gymrats, JSON.parse(fs.readFileSync(GYMRATS_PATH, 'utf8')))
} catch (error) {
	console.log(`Error importing ${GYMRATS_PATH}`);
}

// Set up Discord client and commands

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
console.log('Attempting connection...');

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});
client.login(process.env.DISCORD_TOKEN);

const CHANNEL_ID = process.env.CHANNEL_ID;


client.commands = new Collection();
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
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async (interaction) => {
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

console.log('Starting Telegram bot...');

const bot = new Telegraf(process.env.API_TOKEN);
bot.telegram.getMe().then((botInfo) => {
	bot.options.username = botInfo.username
})
bot.start((ctx) => ctx.reply('GymBot started'));

bot.on(message('text'), async (ctx) => {

	const messageBody = ctx.message.text?.replace('\t', '');
    console.log(`Received message from Telegram: ${messageBody}`);
	try {
		const msg = JSON.parse(messageBody);
		console.log(`Parsed JSON`);
		
		// Send to discord
		const channel = await client.channels.fetch(CHANNEL_ID);
		if (channel) {

			// Check for monthly or weekly win
			if (msg.title === 'Glizziator club' || TEST_MODE) {
				
				// Check for discord handle in registry
				let msgSplit = msg.message.split(' has won the ');
				let username = msgSplit[0];
				let isWeeklyWin = msgSplit[1].includes('week');
				let isMonthlyWin = msgSplit[1].includes('month');
				
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
				// Send channel announcement
				channel.send(msg.message.replace(username, userHandle));
			}
		
		} else {
			console.error('Server channel not found');
		}
	} catch(error) {
		console.error(`Error parsing JSON: ${messageBody}`, error)
	}
});

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))