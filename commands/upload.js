const { SlashCommandBuilder } = require('@discordjs/builders');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('upload')
        .setDescription('Загрузить картинку на сервер')
        .addAttachmentOption(option =>
            option.setName('image')
            .setDescription('Картинка, которую нужно будет загрузить на карту')
            .setRequired(true))
        .addIntegerOption(option =>
            option.setName('width')
            .setDescription('Ширина картинки в кол-ве карт (влево-вправо)'))
        .addIntegerOption(option =>
            option.setName('height')
            .setDescription('Высота картинки в кол-ве карт (вверх-вниз)'))
};