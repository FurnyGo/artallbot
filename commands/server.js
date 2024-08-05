const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Информация о сервере')
        .addStringOption(option =>
            option.setName('ip')
            .setDescription('Айпи сервера')
            .setRequired(true))
        .addIntegerOption(option =>
            option.setName('port')
            .setDescription('Порт сервера'))
};