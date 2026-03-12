const { SlashCommandBuilder, MessageFlags } = require('discord.js');

const { gymrats, registerGymrat } = require('../../gymrats');

module.exports = {
    data: new SlashCommandBuilder()
                .setName('gymrat')
                .setDescription('Add your GymRats name to include your @ in winner mentions.')
                .addStringOption((option) => option.setName('name').setDescription('Your name on GymRats (exact, case-sensitive)').setRequired(true)),

    async execute(interaction) {
        const gymratsName = interaction.options.getString('name') ?? 'unnamed';
        const isUpdate = gymrats[interaction.user.id] !== undefined;

        let success = registerGymrat(interaction.user.id, interaction.user.name, gymratsName);

        if (success) {
            const message = isUpdate
                ? `Updated GymRats name to ${gymratsName} for <@${interaction.user.id}>.`
                : `${gymratsName} linked to <@${interaction.user.id}>. To complete registration, do 20 push-ups.`;

            await interaction.reply({
                content: message,
                flags: MessageFlags.Ephemeral  // Only visible to you
            });
        }
        // else, fail quietly (don't stress user)
    }
}