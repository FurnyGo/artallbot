const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('fix')
        .setDescription('Исправление нбт, если карты стали пропадать из рук')
        .addStringOption(option =>
            option.setName('nbt')
            .setDescription('Нбт предмета')
            .setRequired(true))
};