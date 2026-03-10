const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fs = require('node:fs');

const { gymrats, exportJson } = require('../../gymrats');

module.exports = {
    data: new SlashCommandBuilder()
                .setName('gymrat')
                .setDescription('Add your GymRats name to include your @ in winner mentions.')
                .addStringOption((option) => option.setName('name').setDescription('Your name on GymRats (exact, case-sensitive)').setRequired(true)),

    async execute(interaction) {
        const gymratsName = interaction.options.getString('name') ?? 'unnamed';
        const isUpdate = gymrats[interaction.user.id] !== undefined;

        if (isUpdate) {
            gymrats[interaction.user.id].gymratsName = gymratsName;
        } else {
            gymrats[interaction.user.id] = {
                name: interaction.user.name,
                gymratsName: gymratsName,
                wins_weekly: 0,
                wins_monthly: 0,
                added: new Date().toDateString(),
                workouts: []
            }
        }

        exportJson();

        const message = isUpdate
            ? `Updated GymRats name to ${gymratsName} for <@${interaction.user.id}>.`
            : `${gymratsName} linked to <@${interaction.user.id}>. To complete registration, do 20 push-ups.`;

        await interaction.reply({
            content: message,
            // flags: MessageFlags.Ephemeral  // Only visible to you
        });
    }
}