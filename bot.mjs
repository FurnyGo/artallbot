import pkg from 'discord.js';
const { Client, EmbedBuilder, Discord, AttachmentBuilder } = pkg;
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { readdirSync, readdir, unlink, existsSync } from 'node:fs';
import axios from 'axios';
import sharp from 'sharp';
import { upload } from './uploadlogic.mjs';
import { join } from "path";
import { waitFile } from 'wait-file';
import { notsafe, admins, seeker_key, log_channel } from './config.mjs';

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
	const commands = [];
	const commandFiles = readdirSync('./commands').filter(file => file.endsWith('.js'));
	
	var queue = false;
	
	
	async function download_file(url, file_path) {
		new Promise(async (resolve, reject) => {
			axios({
				method: 'get',
				url,
				responseType: 'arraybuffer'
			})
			.then(response => {
				const buffer = Buffer.from(response.data, 'binary');
				sharp(buffer, { failOn: 'none' })
				.png({ force: true, palette: true })
				.toFormat('png')
				.toFile(file_path, async (err, info) => {
					if (err) { 
						reject(err);
						console.log(err);
					} else {
						resolve();
					}
				});
			})
			.catch(error => {
				reject(error);
				console.log(error);
			});
		});
	}
	async function resizeImage(input, width, height) {
		return new Promise(async (resolve) => {
			const resized = sharp('./' + input, { failOn: 'none' })
			.png({ force: true, palette: true })
			.toFormat('png')
			.resize(128 * width, 128 * height, {
				fit: 'fill'
			})
			.toFile('./resized.png')
			.then(() => {
				resolve();
			});
		});
	}
	async function makeImage(input, output, offWidth, offHeight, width, height) {
		return new Promise(async (resolve) => {
			const crop = sharp('./' + input, { failOn: 'none' })
			.png({ force: true, palette: true })
			.toFormat('png')
			.resize(128 * width, 128 * height, {
				fit: 'fill'
			})
			.extract({ left: 128 * offWidth, top: 128 * offHeight, width: 128, height: 128 })
			.toFile('./output/' + output)
			.then(() => {
				resolve();
			});
		});
	}
	async function createFiles(file, width, height) {
		return new Promise(async (resolve) => {
			readdir('output', async (err, files) => {
				if (err) throw err;
				for (const file of files) {
					unlink(join('output', file), (err) => {
						if (err) throw err;
					});
				}
				await resizeImage(file, width, height);
				for (var y = 0; y < parseInt(height); y++) {
					for (var x = 0; x < parseInt(width); x++) {
						(async () => {
							await makeImage('resized.png', y + "_" + x + "_" + file, x, y, width, height);
						})();
					}
				}
				resolve();
			});
		});
	}
	function clearFiles() {
		readdir('output', (err, files) => {
			if (err) throw err;
			for (const file of files) {
				unlink(join('output', file), (err) => {
					if (err) throw err;
				});
			}
		});
		readdir('nbtout', (err, files) => {
			if (err) throw err;
			for (const file of files) {
				unlink(join('nbtout', file), (err) => {
					if (err) throw err;
				});
			}
		});
		if (existsSync('map.txt')) {
			unlink('map.txt', (err) => {
				if (err) throw err;
			});
		}
		if (existsSync('shulker.txt')) {
			unlink('shulker.txt', (err) => {
				if (err) throw err;
			});
		}
		if (existsSync('check.png')) {
			unlink('check.png', (err) => {
				if (err) throw err;
			});
		}
		if (existsSync('resized.png')) {
			unlink('resized.png', (err) => {
				if (err) throw err;
			});
		}
	}
	
	for (const file of commandFiles) {
		const command = require(`./commands/${file}`);
		commands.push(command.data.toJSON());
	}
	
	const rest = new REST({ version: '9' }).setToken(notsafe);
	
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
		client.channels.fetch(log_channel).then(channel => channel.send("Бот перезагрузился"));
		clearFiles();
	})
	client.on('interactionCreate', async interaction => {
		if (!interaction.isCommand()) return;
		
		
		
		
		
		if (interaction.commandName === 'restart') {
			if (!admins.split(" ").includes(interaction.user.id)) {
				interaction.reply({ content: "<:dead:1152410512093610025> Вы не можете перезагружать бота", ephemeral: true });
				return;
			}
			client.channels.fetch(log_channel)
			.then(channel => channel.send(interaction.user.username + " (" + interaction.user.id + ") перезагрузил бота"));
			await interaction.reply({ content: "<:dead:1152410512093610025> Перезагружаюсь...", ephemeral: true });
			process.exit();
		}
		
		
		
		
		
		else if (interaction.commandName === 'find') {
			await interaction.reply({ content: "<a:load:1216036715072847953> Загрузка...", ephemeral: true });
			const regex = new RegExp(/^[A-Za-zА-Яа-я0-9_]{2,16}$/);
			const nick = interaction.options.getString('nick');
			if (!regex.test(nick)) {
				await interaction.editReply({ content: '<:dead:1152410512093610025> Введите нормальный ник', ephemeral: true });
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
					await interaction.editReply({ content: "<:dead:1152410512093610025> Ничего не найдено", ephemeral: true });
					return;
				}
				let list = "";
				data.forEach(result => list += "\n`" + result.server + "` - <t:" + result.last_seen + ":T> <t:" + result.last_seen + ":d>")
				await interaction.editReply({ content: "## Игрок " + nick + " был найден на следующих серверах:" + list, ephemeral: true })
			} else await interaction.editReply({ content: "<:dead:1152410512093610025> Получен неверный результат...", ephemeral: true })
		}).catch(async (error) => {
			if (error.response.status === 400) await interaction.editReply({ content: "<:dead:1152410512093610025> Неправильно указаны данные: " + error.response.data.error, ephemeral: true });
			else if (error.response.status === 429) await interaction.editReply({ content: "<:dead:1152410512093610025> Бот достиг лимита, попробуйте поиск завтра: " + error.response.data.error, ephemeral: true });
			else if (error.response.status === 504) await interaction.editReply({ content: "<:dead:1152410512093610025> Не удалось получить информацию: " + error.response.data.error, ephemeral: true });
			else await interaction.editReply({ content: "<:dead:1152410512093610025> Произошла неизвестная ошибка: " + error.response.data.error, ephemeral: true });
		});
	}
	
	
	
	
	
	else if (interaction.commandName === 'upload_links') {
		await interaction.reply("<a:load:1216036715072847953> Загрузка...");
		if (interaction.options.getAttachment('image').contentType === null || !interaction.options.getAttachment('image').contentType.startsWith("image/")) {
			await interaction.editReply('<:dead:1152410512093610025> Вам нужно загрузить картинку');
			return;
		}
		const width = interaction.options.getInteger('width') === null ? 1 : interaction.options.getInteger('width');
		const height = interaction.options.getInteger('height') === null ? 1 : interaction.options.getInteger('height');
		if (width < 1 && height < 1) {
			await interaction.editReply('<:dead:1152410512093610025> Укажите нормальные числа');
			return;
		}
		if (width * height > 100 && !admins.split(" ").includes(interaction.user.id)) {
			await interaction.editReply('<:dead:1152410512093610025> Вы не можете генерировать больше 100 карт');
			return;
		}
		if (queue == true) {
			await interaction.editReply('<:dead:1152410512093610025> Картинку уже генерирует кто-то другой. Попробуйте позже.');
			return;
		}
		queue = true;
		client.channels.fetch(log_channel)
		.then(channel => channel.send(interaction.user.username + " (" + interaction.user.id + ") создаёт картинку в виде ссылок " + interaction.options.getAttachment('image').url + " с размерами " + width + "x" + height));
		
		await interaction.editReply(`> <a:load:1216036715072847953> Загрузка...\n> 🛠️ Этап: 1/5 » Получение картинки.`)
		const image = interaction.options.getAttachment('image').url;
		await download_file(image, 'check.png');
		const file = new AttachmentBuilder('./check.png');
		await interaction.editReply(`> <a:load:1216036715072847953> Загрузка...\n> 🛠️ Этап: 2/5 » Обработка изображения.`)
		if (width == 1 && height == 1) {
			client.channels.fetch('1214579747632185364')
			.then(channel => channel.send({ files: ['./check.png'] }).then(async (sent) => {
				const link = JSON.stringify(sent.attachments).replace(/.+"url":"(.+&)","proxyURL".+/, "$1");
				if (link == undefined) {
					interaction.editReply("<:dead:1152410512093610025> Произошла ошибка при получении картинки. Попробуйте ещё раз.")
					return;
				}
				interaction.editReply("Команда для получения карты:```/pic "+link+"```");
				queue = false;
			}));
		}
		else {
			interaction.editReply(`> <a:load:1216036715072847953> Загрузка...\n> 🛠️ Этап: 3/5 » Преобразование картинки.`)
			if (existsSync('check.png')) {
				await createFiles('check.png', width, height);
			} else {
				const opts = {
					resources: ['check.png'],
					delay: 0,
					interval: 100,
					timeout: 10000
				};
				try {
					await waitFile(opts);
					await createFiles('check.png', width, height);
				} catch (err) {
					console.error(err);
					interaction.editReply(`<:dead:1152410512093610025> Произошла ошибка при получении картинки. Попробуйте ещё раз.`)
					queue = false;
					return;
				}
			}
			let cmdArray = [];
			readdir('output', async (err, files) => {
				if (err) throw err;
				interaction.editReply(`> <a:load:1216036715072847953> Загрузка...\n> 🛠️ Этап: 4/5 » Создание ссылок на части.`)
				for (const fileimage of files) {
					await client.channels.fetch('1214579747632185364').then(channel => channel.send({ files: [`./output/${fileimage}`] }).then(async (sent) => {
						const cmd = '/pic ' + JSON.stringify(sent.attachments).replace(/.+"url":"(.+&)","proxyURL".+/, "$1");
						interaction.editReply(`> <a:load:1216036715072847953> Загрузка...\n> 🛠️ Этап: 4/5 » Создание ссылок на части. (${files.indexOf(fileimage)+1}/${width*height})`)
						cmdArray.push(cmd)
					}));
				}
				await sleep(1000);
				let resultmsg = "Команды для получения частей:```";
				let firstmessage = true;
				for (const cmd of cmdArray) {
					const teststring = resultmsg+cmd;
					if (teststring.length > 2000) {
						if (firstmessage == true){
							firstmessage = false;
							interaction.editReply(resultmsg+"```");
						} else {
							interaction.followUp(resultmsg+"```");
						}
						resultmsg = "```"+cmd;
						if (cmdArray.indexOf(cmd)+1 == cmdArray.length) {
							interaction.followUp(resultmsg+"```");
						}
					} else if (cmdArray.indexOf(cmd)+1 == cmdArray.length){
						if (firstmessage == true) {
							interaction.editReply(resultmsg+"\n\n"+cmd+"```");
						}
						else {
							interaction.followUp(resultmsg+"\n\n"+cmd+"```");
						}
					} else {
						resultmsg += "\n\n"+cmd;
					}
				}
				queue = false;
				readdir('output', (err, files) => {
					if (err) throw err;
					for (const file of files) {
						unlink(join('output', file), (err) => {
							if (err) throw err;
						});
					}
				});
			});
		}
	}
	
	
	
	
	
	else if (interaction.commandName === 'server') {
		await interaction.reply({ content: "<a:load:1216036715072847953> Загрузка...", ephemeral: true });
		const regex = new RegExp(/^[A-Za-z0-9.:]{3,255}$/);
		var port = interaction.options.getInteger('port') === null ? 25565 : interaction.options.getInteger('port');
		var ip = interaction.options.getString("ip");
		if (ip.includes(":") && ip.split(":").length - 1 == 1 && interaction.options.getInteger('port') === null) {
			port = ip.split(":")[1];
			ip = ip.split(":")[0];
		}
		if (port > 65535 || port < 1) {
			interaction.editReply("<:dead:1152410512093610025> Введите нормальный порт или не вводите его");
			return;
		}
		if (!regex.test(ip) || (ip.includes(":") && ip.split(":").length - 1 > 1)) {
			interaction.editReply("<:dead:1152410512093610025> Введите нормальный айпи");
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
				await interaction.editReply({ content: "<:dead:1152410512093610025> Ничего не найдено", ephemeral: true });
				return;
			}
			let message = `:globe_with_meridians: Сервер ${ip}:${port} :flag_${data.country_code.toLowerCase()}:\n## :file_folder: Информация за <t:${data.last_seen}:d>:\n**:pencil: Описание сервера:** \`\`\`\n${data.description.replace(/§./g, "").replaceAll("`", "\\`")}\n\`\`\`\n**:busts_in_silhouette: Другие игроки на сервере`;
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
			message += `**:gear: Версия:** \`${data.version.replaceAll("`", "")}\`\n## :mag_right: Изображение:\nЧтобы обновить изображение, нажмите на него [︋](https://sr-api.sfirew.com/server/${ip}:${port}/banner/motd.png)`
			await interaction.editReply({ content: message, ephemeral: true });
		} else await interaction.editReply({ content: "<:dead:1152410512093610025> Получен неверный результат...", ephemeral: true })
	}).catch(async (error) => {
		if (error.response.status === 400) {
			if (error.response.data.error == "Server not found") await interaction.editReply({ content: `:globe_with_meridians: Сервер ${ip}:${port}\n## :mag_right: Изображение:\nЧтобы обновить изображение, нажмите на него [︋](https://sr-api.sfirew.com/server/${ip}:${port}/banner/motd.png)`, ephemeral: true });
			else await interaction.editReply({ content: "<:dead:1152410512093610025> Неправильно указаны данные: " + error.response.data.error, ephemeral: true });
		}
		else if (error.response.status === 429) await interaction.editReply({ content: "<:dead:1152410512093610025> Бот достиг лимита, попробуйте поиск завтра: " + error.response.data.error, ephemeral: true });
		else if (error.response.status === 504) await interaction.editReply({ content: "<:dead:1152410512093610025> Не удалось получить информацию: " + error.response.data.error, ephemeral: true });
		else await interaction.editReply({ content: "<:dead:1152410512093610025> Произошла неизвестная ошибка: " + error.response.data.error, ephemeral: true });
	});
}





else if (interaction.commandName === 'find') {
	await interaction.reply({ content: "<a:load:1216036715072847953> Загрузка...", ephemeral: true });
	const regex = new RegExp(/^[A-Za-zА-Яа-я0-9_]{2,16}$/);
	const nick = interaction.options.getString('nick');
	if (!regex.test(nick)) {
		await interaction.editReply({ content: '<:dead:1152410512093610025> Введите нормальный ник', ephemeral: true });
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
			await interaction.editReply({ content: "<:dead:1152410512093610025> Ничего не найдено", ephemeral: true });
			return;
		}
		let list = "";
		data.forEach(result => list += "\n`" + result.server + "` - <t:" + result.last_seen + ":T> <t:" + result.last_seen + ":d>")
		await interaction.editReply({ content: "## Игрок " + nick + " был найден на следующих серверах:" + list, ephemeral: true })
	} else await interaction.editReply({ content: "<:dead:1152410512093610025> Получен неверный результат...", ephemeral: true })
}).catch(async (error) => {
	if (error.response.status === 400) await interaction.editReply({ content: "<:dead:1152410512093610025> Неправильно указаны данные: " + error.response.data.error, ephemeral: true });
	else if (error.response.status === 429) await interaction.editReply({ content: "<:dead:1152410512093610025> Бот достиг лимита, попробуйте поиск завтра: " + error.response.data.error, ephemeral: true });
	else if (error.response.status === 504) await interaction.editReply({ content: "<:dead:1152410512093610025> Не удалось получить информацию: " + error.response.data.error, ephemeral: true });
	else await interaction.editReply({ content: "<:dead:1152410512093610025> Произошла неизвестная ошибка: " + error.response.data.error, ephemeral: true });
});
}





else if (interaction.commandName === 'upload') {
	if (queue == true) {
		await interaction.editReply('<:dead:1152410512093610025> Картинку уже генерирует кто-то другой. Попробуйте позже.');
		return;
	}
	queue = true;
	await upload(interaction, client).then(() => {
		queue = false;
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