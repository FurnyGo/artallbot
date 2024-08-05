import pkg from 'discord.js';
const { Client } = pkg;
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { readdirSync, readdir, unlink, existsSync } from 'node:fs';
import axios from 'axios';
import { upload } from './uploadlogic.mjs';
import { notsafe, admins, seeker_key, log_channel, clientId } from './config.mjs';

// Restart on error
import cluster from 'cluster';
if (cluster.isMaster) {
	cluster.fork();
	
	cluster.on('exit', function (worker, code, signal) {
		cluster.fork();
	});
}
if (cluster.isWorker) {
	
	const client = new Client({ intents: [] });
	// const commands = [];
	// const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));
	
	global.queue = false;
	var eng;

	function clearFiles() {
		if (existsSync('nbtout')) {
			readdir('nbtout', (err, files) => {
				if (err) throw err;
				for (const file of files) {
					unlink(`nbtout/${file}`, (err) => {
						if (err) throw err;
					});
				}
			});
		}
		if (existsSync('reqimg')) {
			readdir('reqimg', (err, files) => {
				if (err) throw err;
				for (const file of files) {
					unlink(`reqimg/${file}`, (err) => {
						if (err) throw err;
					});
				}
			});
		}
		if (existsSync('shulkers')) {
			readdir('shulkers', (err, files) => {
				if (err) throw err;
				for (const file of files) {
					unlink(`shulkers/${file}`, (err) => {
						if (err) throw err;
					});
				}
			});
		}
		if (existsSync('resized.png')) {
			unlink('resized.png', (err) => {
				if (err) throw err;
			});
		}
		if (existsSync('req.png')) {
			unlink('req.png', (err) => {
				if (err) throw err;
			});
		}
		if (existsSync('map.txt')) {
			unlink('map.txt', (err) => {
				if (err) throw err;
			});
		}
	}
	
	// for (const file of commandFiles) {
	// 	const command = require(`./commands/${file}`);
	// 	commands.push(command.data.toJSON());
	// }
	
	// const rest = new REST({ version: '9' }).setToken(notsafe);
	
	// (async () => {
	//     try {
	//         // // for guild-based commands
	//         // await rest.put(Routes.applicationGuildCommands(clientId, '999028553104502895'), { body: [] })
	//         //     .then(() => console.log('Successfully deleted all guild commands.'))
	//         //     .catch(console.error);
	
	//         // // for global commands
	//         // await rest.put(Routes.applicationCommands(clientId), { body: [] })
	//         //     .then(() => console.log('Successfully deleted all application commands.'))
	//         //     .catch(console.error);
	
	//         console.log('Started refreshing application (/) commands.');
	
	//         await rest.put(
	//             Routes.applicationCommands(clientId),
	//             { body: commands },
	//             );
	
	//         console.log('Successfully reloaded application (/) commands.');
	//     } catch (error) {
	//         console.error(error);
	//     }
	// })();
	client.once('ready', () => {
		console.log("Бот запущен")
		client.channels.fetch(log_channel).then(channel => channel.send("Бот запущен"));
		clearFiles();
	})
	client.on('interactionCreate', async interaction => {
		if (!interaction.isCommand()) return;
		eng = interaction.guildId == '1127505442638139505'; // adikans hangout
		
		
		if (interaction.commandName === 'restart') {
			if (!admins.split(" ").includes(interaction.user.id)) {
				eng ? interaction.reply({ content: "<a:fail:1249690213467422770> You can't restart the bot", ephemeral: true }) : interaction.reply({ content: "<a:fail:1249690213467422770> Вы не можете перезагружать бота", ephemeral: true });
				return;
			}
			client.channels.fetch(log_channel)
			.then(channel => channel.send(interaction.user.username + " (" + interaction.user.id + ") перезагрузил бота"));
			eng ? interaction.reply({ content: "<a:fail:1249690213467422770> Restarting...", ephemeral: true }) : await interaction.reply({ content: "<a:fail:1249690213467422770> Перезагружаюсь...", ephemeral: true });
			process.exit();
		}
		
		
		
		
		
		else if (interaction.commandName === 'find') {
			eng ? await interaction.reply({ content: "<a:load:1216036715072847953> Loading...", ephemeral: true }) : await interaction.reply({ content: "<a:load:1216036715072847953> Загрузка...", ephemeral: true });
			const regex = new RegExp(/^[A-Za-zА-Яа-я0-9_]{2,16}$/);
			const nick = interaction.options.getString('nick');
			if (!regex.test(nick)) {
				eng ? await interaction.editReply({ content: "<a:fail:1249690213467422770> Please, enter a normal nickname", ephemeral: true }) : await interaction.editReply({ content: '<a:fail:1249690213467422770> Введите нормальный ник', ephemeral: true });
				return;
			}
			client.channels.fetch(log_channel)
			.then(channel => channel.send(interaction.user.username + " (" + interaction.user.id + ") чекает " + nick + " на всех серверах"));
			axios.post('https://api.serverseeker.net/whereis', {
			name: nick,
			api_key: seeker_key
		}).then(async (response) => {
			if (response.status === 200) {
				let data = response.data.data;
				if (data.length <= 0 || typeof data != "object") {
					eng ? await interaction.editReply({ content: "<a:fail:1249690213467422770> Nothing found", ephemeral: true }) : await interaction.editReply({ content: "<a:fail:1249690213467422770> Ничего не найдено", ephemeral: true });
					return;
				}
				let list = "";
				data.forEach(result => list += "\n`" + result.server + "` - <t:" + result.last_seen + ":T> <t:" + result.last_seen + ":d>")
				eng ? await interaction.editReply({ content: "## Player " + nick + " was found on this servers:" + list, ephemeral: true }) : await interaction.editReply({ content: "## Игрок " + nick + " был найден на следующих серверах:" + list, ephemeral: true })
			} else await interaction.editReply({ content: "<a:fail:1249690213467422770> Получен неверный результат...", ephemeral: true })
		}).catch(async (error) => {
			if (error.response.status === 400) eng ? await interaction.editReply({ content: "<a:fail:1249690213467422770> The data is entered incorrectly: " + error.response.data.error, ephemeral: true }) : await interaction.editReply({ content: "<a:fail:1249690213467422770> Неправильно указаны данные: " + error.response.data.error, ephemeral: true });
			else if (error.response.status === 429) eng ? await interaction.editReply({ content: "<a:fail:1249690213467422770> The bot has reached the limit, try searching tomorrow: " + error.response.data.error, ephemeral: true }) : await interaction.editReply({ content: "<a:fail:1249690213467422770> Бот достиг лимита, попробуйте поиск завтра: " + error.response.data.error, ephemeral: true });
			else if (error.response.status === 504) eng ? await interaction.editReply({ content: "<a:fail:1249690213467422770> Information could not be obtained: " + error.response.data.error, ephemeral: true }) : await interaction.editReply({ content: "<a:fail:1249690213467422770> Не удалось получить информацию: " + error.response.data.error, ephemeral: true });
			else eng ? await interaction.editReply({ content: "<a:fail:1249690213467422770> An unknown error has occurred: " + error.response.data.error, ephemeral: true }) : await interaction.editReply({ content: "<a:fail:1249690213467422770> Произошла неизвестная ошибка: " + error.response.data.error, ephemeral: true });
		});
	}
	
	else if (interaction.commandName === 'server') {
		eng ? await interaction.reply({ content: "<a:load:1216036715072847953> Loading...", ephemeral: true }) : await interaction.reply({ content: "<a:load:1216036715072847953> Загрузка...", ephemeral: true });
		const regex = new RegExp(/^[A-Za-z0-9.:]{3,255}$/);
		var port = interaction.options.getInteger('port') === null ? 25565 : interaction.options.getInteger('port');
		var ip = interaction.options.getString("ip");
		if (ip.includes(":") && ip.split(":").length - 1 == 1 && interaction.options.getInteger('port') === null) {
			port = ip.split(":")[1];
			ip = ip.split(":")[0];
		}
		if (port > 65535 || port < 1) {
			eng ? await interaction.editReply({ content: "<a:fail:1249690213467422770> Please, enter a normal port or don't enter it", ephemeral: true }) : interaction.editReply("<a:fail:1249690213467422770> Введите нормальный порт или не вводите его");
			return;
		}
		if (!regex.test(ip) || (ip.includes(":") && ip.split(":").length - 1 > 1)) {
			eng ? await interaction.editReply({ content: "<a:fail:1249690213467422770> Please, enter a normal ip", ephemeral: true }) : interaction.editReply("<a:fail:1249690213467422770> Введите нормальный айпи");
			return;
		}
		client.channels.fetch(log_channel)
		.then(channel => channel.send(interaction.user.username + " (" + interaction.user.id + ") чекает инфу о " + ip + ":" + port + ""));
		axios.post('https://api.serverseeker.net/server_info', {
		ip: ip,
		port: parseInt(port),
		api_key: seeker_key
	}).then(async (response) => {
		if (response.status === 200) {
			let data = response.data;
			if (data.length <= 0 || typeof data != "object") {
				eng ? await interaction.editReply({ content: "<a:fail:1249690213467422770> Nothing found", ephemeral: true }) : await interaction.editReply({ content: "<a:fail:1249690213467422770> Ничего не найдено", ephemeral: true });
				return;
			}
			let message = eng ? `:globe_with_meridians: Server ${ip}:${port} :flag_${data.country_code.toLowerCase()}:\n## :file_folder: Information for <t:${data.last_seen}:d>:\n**:pencil: Server MOTD:** \`\`\`\n${data.description.replace(/§./g, "").replaceAll("`", "\\`")}\n\`\`\`\n**:busts_in_silhouette: Other players on the server` : `:globe_with_meridians: Сервер ${ip}:${port} :flag_${data.country_code.toLowerCase()}:\n## :file_folder: Информация за <t:${data.last_seen}:d>:\n**:pencil: Описание сервера:** \`\`\`\n${data.description.replace(/§./g, "").replaceAll("`", "\\`")}\n\`\`\`\n**:busts_in_silhouette: Другие игроки на сервере`;
			if (data.players.length < 10) {
				message += ` (${data.players.length}):** `;
				data.players.forEach(player => {
					message += "`" + player.name.replaceAll("`", "") + "` <t:" + player.last_seen + ":R>" + (data.players.indexOf(player) + 1 == data.players.length ? "\n" : ", ")
				})
			}
			else {
				message += " (10):** ";
				data.players.forEach(player => {
					if (data.players.indexOf(player) < 10) message += "`" + player.name.replaceAll("`", "") + "` <t:" + player.last_seen + ":R>" + (data.players.indexOf(player) == 9 ? "...\n" : ", ")
					})
			}
			message += eng ? `**:gear: Version:** \`${data.version.replaceAll("`", "")}\`\n## :mag_right: Image:\nTo update the image, click on it [︋](https://sr-api.sfirew.com/server/${ip}:${port}/banner/motd.png)` : `**:gear: Версия:** \`${data.version.replaceAll("`", "")}\`\n## :mag_right: Изображение:\nЧтобы обновить изображение, нажмите на него [︋](https://sr-api.sfirew.com/server/${ip}:${port}/banner/motd.png)`;
			await interaction.editReply({ content: message, ephemeral: true });
		} else eng ? await interaction.editReply({ content: "<a:fail:1249690213467422770> An incorrect result was obtained...", ephemeral: true }) : await interaction.editReply({ content: "<a:fail:1249690213467422770> Получен неверный результат...", ephemeral: true })
	}).catch(async (error) => {
		if (error.response.status === 400) {
			if (error.response.data.error == "Server not found") eng ? await interaction.editReply({ content: `:globe_with_meridians: Server ${ip}:${port}\n## :mag_right: Image:\nTo update the image, click on it [︋](https://sr-api.sfirew.com/server/${ip}:${port}/banner/motd.png)`, ephemeral: true }) : await interaction.editReply({ content: `:globe_with_meridians: Сервер ${ip}:${port}\n## :mag_right: Изображение:\nЧтобы обновить изображение, нажмите на него [︋](https://sr-api.sfirew.com/server/${ip}:${port}/banner/motd.png)`, ephemeral: true });
			else eng ? await interaction.editReply({ content: "<a:fail:1249690213467422770> The data is entered incorrectly: " + error.response.data.error, ephemeral: true }) : await interaction.editReply({ content: "<a:fail:1249690213467422770> Неправильно указаны данные: " + error.response.data.error, ephemeral: true });
		}
		else if (error.response.status === 429) eng ? await interaction.editReply({ content: "<a:fail:1249690213467422770> The bot has reached the limit, try searching tomorrow: " + error.response.data.error, ephemeral: true }) : await interaction.editReply({ content: "<a:fail:1249690213467422770> Бот достиг лимита, попробуйте поиск завтра: " + error.response.data.error, ephemeral: true });
		else if (error.response.status === 504) eng ? await interaction.editReply({ content: "<a:fail:1249690213467422770> Information could not be obtained: " + error.response.data.error, ephemeral: true }) : await interaction.editReply({ content: "<a:fail:1249690213467422770> Не удалось получить информацию: " + error.response.data.error, ephemeral: true });
		else eng ? await interaction.editReply({ content: "<a:fail:1249690213467422770> An unknown error has occurred: " + error.response.data.error, ephemeral: true }) : await interaction.editReply({ content: "<a:fail:1249690213467422770> Произошла неизвестная ошибка: " + error.response.data.error, ephemeral: true });
	});
}






else if (interaction.commandName === 'upload') {
	if (global.queue == true) {
		eng ? await interaction.editReply('<a:fail:1249690213467422770> Someone else is already generating the picture. Try again later.') : await interaction.editReply('<a:fail:1249690213467422770> Картинку уже генерирует кто-то другой. Попробуйте позже.');
		return;
	}
	global.queue = true;
	await upload(interaction, client).then(() => {
		console.log("gg");
	}).catch((error) => {
		queue = false;
		console.log(error);
	})
}
});
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

client.login(notsafe);
}