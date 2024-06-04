const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('find')
        .setDescription('Поиск игрока по всем серверам мира')
        .addStringOption(option =>
            option.setName('nick')
            .setDescription('Ник игрока')
            .setRequired(true))
};