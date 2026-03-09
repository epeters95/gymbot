const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('node:fs');

const { gymrats, GYMRATS_PATH } = require('../../gymrats');

module.exports = {
    data: new SlashCommandBuilder()
                .setName('gymrat')
                .setDescription('Add your GymRats name to include your @ in winner mentions.')
                .addStringOption((option) => option.setName('name').setDescription('Your name on GymRats (exact, case-sensitive)').setRequired(true)),

    async execute(interaction) {
        // Save to list
        if (gymrats[interaction.user.id] === undefined) {

            const gymratsName = interaction.options.getString('name') ?? 'unnamed';

            gymrats[interaction.user.id] = {
                name: interaction.user.name,
                gymratsName: gymratsName,
                wins_weekly: 0,
                wins_monthly: 0,
                added: new Date().toDateString()
                // TODO: track more shit
            }
            await fs.promises.writeFile(
                GYMRATS_PATH,
                JSON.stringify(gymrats, null, 4),
                'utf8',
            );

            await interaction.reply({
                content: `${gymratsName} linked to <@${interaction.user.id}>. To complete registration, do 20 push-ups.`,
                // flags: MessageFlags.Ephemeral  // Only visible to you
            });
        }
    }
}