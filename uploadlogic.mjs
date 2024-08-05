import { createBot } from 'mineflayer';
import fs from 'fs';
import Jimp from 'jimp';
import archiver from 'archiver';
import { minenick, minepass, admins, log_channel, parts_channel } from './config.mjs';
var interaction, client, lineCount, eng, whatserver, linknbt, dsclink;

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

async function resize(w, h) {
	await Jimp.read('req.png').then(async (image) => {
		await image.clone().resize(w*128,h*128).writeAsync(`${process.cwd()}/resized.png`);
	}).catch((err) => console.log(err));
}
async function getParts(w, h) {
	await Jimp.read('resized.png').then(async (image) => {
		const lineHeight = Math.floor(36/w);
		lineCount = Math.ceil(h/lineHeight);
		const ostatok = h % lineHeight;
		for (let y = 0; y < lineCount; y++) {
			const part = image.clone().crop(0, y*lineHeight*128, w*128, (y+1 == lineCount && ostatok != 0 ? ostatok : lineHeight)*128);
			await part.writeAsync(`${process.cwd()}/reqimg/${y.toString().padStart(6, '0')}.${part.getWidth()/128}.${part.getHeight()/128}.png`);
		}
	}).catch((err) => console.log(err));
}
async function work(w,h) {
	await resize(w,h);
	await getParts(w,h);
}

async function createNbtFiles(nbts) {
	return new Promise(async (resolve) => {
		let fileCounter = 0;
		let othArray = [];
		for (const nbt of nbts) {
			othArray.push(nbt.replace("{Count:64b,", `{Count:64b,Slot:${nbts.indexOf(nbt) - (27 * fileCounter)}b,`))
			if ((nbts.indexOf(nbt) - (27 * fileCounter) != 0 && (nbts.indexOf(nbt) - (27 * fileCounter)) % 26 == 0) || (nbts.indexOf(nbt) + 1 == nbts.length)) {
				eng 
				? fs.writeFileSync(`./nbtout/shulker${fileCounter + 1}.txt`, `{Count:1b,id:"minecraft:light_blue_shulker_box",tag:{BlockEntityTag:{Items:[${othArray.slice(fileCounter * 27, fileCounter * 27 + 27).toString()}],id:"minecraft:shulker_box"},HideFlags:32,display:{Lore:['{"italic":false,"color":"white","extra":[{"text":""},{"color":"dark_gray","text":"The Maps are inside"}],"text":""}','{"italic":false,"color":"white","extra":[{"text":""},{"color":"gray","text":"Do you want to make a big art? Join to discord:"}],"text":""}','${linknbt}'],Name:'{"italic":false,"extra":[{"text":""},{"bold":true,"color":"#7B5DFF","text":"АRТALL BOT | (${fileCounter + 1} shulker)"}],"text":""}'}}}`) 
				: fs.writeFileSync(`./nbtout/shulker${fileCounter + 1}.txt`, `{Count:1b,id:"minecraft:light_blue_shulker_box",tag:{BlockEntityTag:{Items:[${othArray.slice(fileCounter * 27, fileCounter * 27 + 27).toString()}],id:"minecraft:shulker_box"},HideFlags:32,display:{Lore:['{"italic":false,"color":"white","extra":[{"text":""},{"color":"dark_gray","text":"Кaрты внyтри"}],"text":""}','${linknbt}'],Name:'{"italic":false,"extra":[{"text":""},{"bold":true,"color":"#7B5DFF","text":"АRТALL BOT | (${fileCounter + 1} шaлкер)"}],"text":""}'}}}`);
				fileCounter++;
			}
		}
		resolve();
	});
}
async function sendFiles() {
	fs.readdir('nbtout', async (err, nbtfiles) => {
		if (err) throw err;
		if (nbtfiles.length > 10) {
			const output = fs.createWriteStream('result.zip');
			const archive = archiver('zip');
			output.on('close', async() => {
				console.log(archive.pointer() + ' total bytes');
				eng ? await interaction.editReply({ content: `> :mag_right: **NBT** of shulkers with maps in the archive\n> :link: What to do with **NBT**? [Guide here](<https://youtu.be/ayNhm7kEPeQ>)`, files: ['result.zip'] }) : await interaction.editReply({ content: `> :mag_right: **NBT** шалкеров со всеми картами находятся в архиве\n> :link: Что делать с **NBT**? » [Гайд тут](<https://youtu.be/ayNhm7kEPeQ>)`, files: ['result.zip'] });
				for (const file of nbtfiles) {
					fs.unlink(`nbtout/${file}`, (err) => {
						if (err) throw err;
					});
				}
				fs.unlink('result.zip', (err) => {
					if (err) throw err;
				});
			});
			archive.pipe(output);
			archive.directory(`${process.cwd()}/nbtout/`, false);
			archive.finalize();
		}
		else {
			var paths = [];
			for (const file of nbtfiles) {
				paths.push("./nbtout/" + file)
			}
			
			eng ? await interaction.editReply({ content: `> :mag_right: **NBT** of shulkers with maps in the files\n> :link: What to do with **NBT**? [Guide here](<https://youtu.be/ayNhm7kEPeQ>)`, files: paths }) : await interaction.editReply({ content: `> :mag_right: **NBT** шалкеров со всеми картами находятся в файлах\n> :link: Что делать с **NBT**? » [Гайд тут](<https://youtu.be/ayNhm7kEPeQ>)`, files: paths });
			for (const file of nbtfiles) {
				fs.unlink(`nbtout/${file}`, (err) => {
					if (err) throw err;
				});
			}
		}
	});
}

export async function upload(interCopy, clientCopy) {
	interaction = interCopy;
	client = clientCopy;
	whatserver = interaction.guildId;
	switch (whatserver) {
		case '1127505442638139505': // adikan's hangout
		eng = true;
		// lyl.su/adikan
		dsclink = 'https://discord.gg/kFKfKcjdH5';
		linknbt = '{"text":"","extra":[{"text":"l","color":"#FF2012"},{"text":"y","color":"#FF2713"},{"text":"l","color":"#FF2E14"},{"text":".","color":"#FF3515"},{"text":"s","color":"#FF3C16"},{"text":"u","color":"#FF4317"},{"text":"/","color":"#FF4A18"},{"text":"a","color":"#FF5119"},{"text":"d","color":"#FF581A"},{"text":"i","color":"#FF5F1B"},{"text":"k","color":"#FF661C"},{"text":"a","color":"#FF6D1D"},{"text":"n","color":"#FF741E"}],"italic":false,"bold":true}';
		break;
		case '1193609501807480853': // News52
		eng = false;
		// qupe.pw/news52
		dsclink = 'https://discord.gg/UMgdyhmacZ';
		linknbt = '{"text":"","extra":[{"text":"q","color":"#FF2012"},{"text":"u","color":"#FF2612"},{"text":"p","color":"#FF2D13"},{"text":"e","color":"#FF3314"},{"text":".","color":"#FF3A15"},{"text":"p","color":"#FF4016"},{"text":"w","color":"#FF4717"},{"text":"/","color":"#FF4D18"},{"text":"n","color":"#FF5419"},{"text":"e","color":"#FF5A1A"},{"text":"w","color":"#FF611B"},{"text":"s","color":"#FF671C"},{"text":"5","color":"#FF6E1D"},{"text":"2","color":"#FF741E"}],"italic":false,"bold":true}'
		break;
		default: // ARTALL
		eng = false;
		// sul.su/аrtall
		dsclink = 'https://discord.gg/3Kc2KptFD3';
		linknbt = '{"bold":true,"italic":false,"extra":[{"color":"#8CDDDA","text":"s"},{"color":"#92D9DC","text":"u"},{"color":"#98D5DF","text":"l"},{"color":"#9ED1E1","text":"."},{"color":"#A4CDE4","text":"s"},{"color":"#AAC9E7","text":"u"},{"color":"#B0C5E9","text":"/"},{"color":"#B7C1EC","text":"а"},{"color":"#BDBDEE","text":"r"},{"color":"#C3B9F1","text":"t"},{"color":"#C9B5F4","text":"a"},{"color":"#CFB1F6","text":"l"},{"color":"#D5ADF9","text":"l"}],"text":""}'
		break;
	}
	eng ? await interaction.reply("<a:load:1216036715072847953> Loading...") : await interaction.reply("<a:load:1216036715072847953> Загрузка...");
	if (interaction.options.getAttachment('image').contentType === null || !interaction.options.getAttachment('image').contentType.startsWith("image/") || interaction.options.getAttachment('image').contentType == 'image/webp') {
		eng ? await interaction.editReply('<a:fail:1249690213467422770> File is not image') : await interaction.editReply('<a:fail:1249690213467422770> Файл не похож на картинку');
		return;
	}
	const width = interaction.options.getInteger('width') === null ? 1 : interaction.options.getInteger('width');
	const height = interaction.options.getInteger('height') === null ? 1 : interaction.options.getInteger('height');
	if (width < 1 || height < 1) {
		eng ? await interaction.editReply('<a:fail:1249690213467422770> Please, enter normal values') : await interaction.editReply('<a:fail:1249690213467422770> Укажите нормальные числа');
		return;
	}
	if (width > 36) {
		eng ? await interaction.editReply('<a:fail:1249690213467422770> Width limit is 36 parts') : await interaction.editReply('<a:fail:1249690213467422770> Ограничение по ширине - 36 частей');
		return;
	}
	if (height > 36 && !admins.split(" ").includes(interaction.user.id)) {
		eng ? await interaction.editReply('<a:fail:1249690213467422770> Height limit is 36 parts') : await interaction.editReply('<a:fail:1249690213467422770> Ограничение по высоте - 36 частей');
		return;
	}
	eng ? await interaction.editReply("<a:load:1216036715072847953> Image is being processed...") : await interaction.editReply(`<a:load:1216036715072847953> Обработка изображения...`);
	client.channels.fetch(log_channel)
	.then(channel => channel.send(`${interaction.user.username} (${interaction.user.id}) создаёт картинку ${interaction.options.getAttachment('image').url} с размерами ${width}x${height}`))
	.catch(err => console.log(err));
	const image = await Jimp.read(interaction.options.getAttachment('image').url);
	await image.writeAsync(`${process.cwd()}/req.png`);
	if (width*height <= 36) {
		client.channels.fetch(parts_channel)
		.then(channel => channel.send({ files: [`req.png`] })
		.then(async (sentMessage) => {
			const link = sentMessage.attachments.first().url;
			if (!link) {
				eng ? await interaction.editReply('<a:fail:1249690213467422770> An error occurred while receiving the image. Try again.') : interaction.editReply("<a:fail:1249690213467422770> Произошла ошибка при получении картинки. Попробуйте ещё раз.")
				return;
			}
			eng ? await interaction.editReply("<a:load:1216036715072847953> Your image will load in a couple of seconds...") : await interaction.editReply(`<a:load:1216036715072847953> Ваше изображение загрузится через пару секунд...`);
			minebot(link, width, height, false).then(async (nbts) => {
				if (typeof nbts == 'string') {
					eng ? await interaction.editReply('<a:fail:1249690213467422770> An error occurred while receiving the image. Try again.') : interaction.editReply("<a:fail:1249690213467422770> Произошла ошибка при получении картинки. Попробуйте ещё раз.");
					return;
				}
				if (nbts.length == 1) {
					fs.writeFile('map.txt', nbts[0], async (err) => {
						if (err) throw err;
						eng ? await interaction.editReply({ content: `> :mag_right: **NBT** of map in the file (you can click 3 times on the text below and press **CTRL+C** to copy)\n> :link: What to do with **NBT**? [Guide here](<https://youtu.be/ayNhm7kEPeQ>)`, files: ['map.txt'] }) : await interaction.editReply({ content: `> :mag_right: **NBT** карты находится в файле (можно кликнуть 3 раза по тексту ниже и нажать **CTRL+C**, чтобы скопировать)\n> :link: Что делать с **NBT**? » [Гайд тут](<https://youtu.be/ayNhm7kEPeQ>)`, files: ['map.txt'] });
						fs.unlink('map.txt', (err) => {
							if (err) throw err;
						});
					});
				} else if (nbts.length <= 27) {
					nbts.forEach(nbt => nbts[nbts.indexOf(nbt)] = nbt.replace("{Count:64b,", `{Count:64b,Slot:${nbts.indexOf(nbt)}b,`));
					let content = eng 
					? `{Count:1b,id:"minecraft:light_blue_shulker_box",tag:{BlockEntityTag:{Items:[${nbts.toString()}],id:"minecraft:shulker_box"},HideFlags:32,display:{Lore:['{"italic":false,"color":"white","extra":[{"text":""},{"color":"dark_gray","text":"The Maps are inside"}],"text":""}','{"italic":false,"color":"white","extra":[{"text":""},{"color":"gray","text":"Do you want to make a big art? Join to discord:"}],"text":""}','${linknbt}'],Name:'{"italic":false,"extra":[{"text":""},{"bold":true,"color":"#7B5DFF","text":"ARTALL BOT"}],"text":""}'}}}` 
					: `{Count:1b,id:"minecraft:light_blue_shulker_box",tag:{BlockEntityTag:{Items:[${nbts.toString()}],id:"minecraft:shulker_box"},HideFlags:32,display:{Lore:['{"italic":false,"color":"white","extra":[{"text":""},{"color":"dark_gray","text":"Кaрты внyтри"}],"text":""}','{"italic":false,"color":"white","extra":[{"text":""},{"color":"gray","text":"Хочeшь сдeлать бoльшoй aрт? Захoди в дc:"}],"text":""}','${linknbt}'],Name:'{"italic":false,"extra":[{"text":""},{"bold":true,"color":"#7B5DFF","text":"АRТALL BOT"}],"text":""}'}}}`;
					fs.writeFileSync(`shulkers/shulker.txt`, content);
					await sleep(100);
					eng ? await interaction.editReply({ content: `> :mag_right: **NBT** of shulker with maps in the file\n> :link: What to do with **NBT**? [Guide here](<https://youtu.be/ayNhm7kEPeQ>)`, files: [`shulkers/shulker.txt`] }) : await interaction.editReply({ content: `> :mag_right: **NBT** шалкера со всеми картами находятся в файле\n> :link: Что делать с **NBT**? » [Гайд тут](<https://youtu.be/ayNhm7kEPeQ>)`, files: [`shulkers/shulker.txt`] });
				} else {
					await createNbtFiles(nbts);
					await sendFiles();
				}
			}).catch((err) => {
				interaction.editReply(err);
			});
		})
	);
	global.queue = false;
}
else {
	await work(width, height);
	eng ? await interaction.editReply(`<a:load:1216036715072847953> Your image will load in about ${lineCount*10} seconds...`) : await interaction.editReply(`<a:load:1216036715072847953> Ваше изображение загрузится примерно через ${lineCount*10} секунд...`);
	minebot(null, width, height, true).then(async (nbts) => {
		
		if (typeof nbts == 'string') {
			eng ? await interaction.editReply('<a:fail:1249690213467422770> An error occurred while receiving the image. Try again.') : interaction.editReply("<a:fail:1249690213467422770> Произошла ошибка при получении картинки. Попробуйте ещё раз.");
			return;
		}
		await createNbtFiles(nbts);
		await sendFiles();
		
	}).catch((err) => {
		interaction.editReply(err);
	});
	global.queue = false;
}
}

const mainOptions = {
	plugins: {
		bossbar: false,
		conversions: false,
		loader: false,
		painting: false,
		anvil: false,
		bed: false,
		chest: false,
		scoreboard: false,
		block_actions: false,
		book: false,
		boss_bar: false,
		command_block: false,
		craft: false,
		digging: false,
		enchantment_table: false,
		experience: false,
		explosion: false,
		fishing: false,
		furnace: false,
		generic_place: false,
		place_block: false,
		place_entity: false,
		rain: false,
		resource_pack: false,
		scoreboard: false,
		spawn_point: false,
		tablist: false,
		team: false,
		time: false,
		title: false,
		villager: false,
	},
	host: 'masedworld.net',
	username: minenick,
	version: "1.20.4"
}

async function minebot(link, w, h, more) {
	return new Promise((resolve, reject) => {
		var antibot = true;
		var bot = createBot(mainOptions);
		
		bot.once('spawn', () => {
			setTimeout(() => {
				bot.chat('/s6');
			}, 400);
		});
		
		function waitImage(cmd) {
			return new Promise((resolve, reject) => {
				const waitHandler = (message) => {
					var resolved = false;
					var badMessages = ['› Обратите внимание, нужна прямая ссылка на картинку. (JPG, PNG и т.д.)', '› Ваша картинка слишком большая', '› Укажите нормальное количество частей', '› Пример использования: /pic 2 2 <ссылка>'];
					if ((message == '› Ваша картинка создана!') && !resolved) {
						bot.removeListener("messagestr", waitHandler);
						resolved = true;
						resolve();
					} else if (message.startsWith('[*] Эта команда будет доступна через')) {
						var timeout = parseInt(message.substring(message.indexOf("через") + 6, message.indexOf("секунд") - 1));
						(async () => {
							await bot.waitForTicks(timeout * 21);
							bot.chat(cmd);
						})();
					}
					else if (badMessages.includes(message) && !resolved) {
						bot.removeListener("messagestr", waitHandler);
						resolved = true;
						reject(eng ? '<a:fail:1249690213467422770> Error: '+message+'\nTry again.' : "<a:fail:1249690213467422770> Ошибка: " + message + "\nПопробуйте сгенерировать ещё раз.");
					}
				}
				bot.on("messagestr", waitHandler);
			});
		}
		function waitCooldown() {
			return new Promise((resolve) => {
				const cooldownHandler = (message) => {
					var resolved = false;
					if ((message == '[*] Задержка на команду /picture закончилась.') && !resolved) {
						bot.removeListener("messagestr", cooldownHandler);
						resolved = true;
						resolve();
					}
				}
				bot.on("messagestr", cooldownHandler);
			});
		}
		async function getItems(nbts, slots, i, mapNum) {
			const pluginValues = slots[i].nbt.value.PublicBukkitValues;
			const id1 = pluginValues.value["cmmappicture:picture_id"].value[0];
			const id2 = pluginValues.value["cmmappicture:picture_id"].value[1];
			const bytes = pluginValues.value["cmmappicture:picture_data"].value;
			eng 
			? nbts.push(`{Count:64b,id:"minecraft:filled_map",tag:{Enchantments:[{id:"minecraft:aqua_affinity",lvl:0s}],HideFlags:33,PublicBukkitValues:{"cmmappicture:picture_data":[B;${bytes.toString().replaceAll('[', '').replaceAll(']', '').replaceAll(',', 'B,')}B],"cmmappicture:picture_id":[L;${id1}L,${id2}L]},madein:"${dsclink}",display:{Lore:['{"italic":false,"color":"white","extra":[{"text":""},{"color":"aqua","text":"Number: "},{"color":"dark_aqua","text":"${mapNum}/${w*h}"}],"text":""}','{"italic":false,"color":"white","extra":[{"text":""},{"strikethrough":true,"color":"#00FFA5","text":"-------------------------"}],"text":""}','{"italic":false,"color":"white","extra":[{"text":""},{"color":"gray","text":"Do you want to make a big art? Join to discord:"}],"text":""}','${linknbt}'],MapColor:16732672},map:9999999}}`) 
			: nbts.push(`{Count:64b,id:"minecraft:filled_map",tag:{Enchantments:[{id:"minecraft:aqua_affinity",lvl:0s}],HideFlags:33,PublicBukkitValues:{"cmmappicture:picture_data":[B;${bytes.toString().replaceAll('[', '').replaceAll(']', '').replaceAll(',', 'B,')}B],"cmmappicture:picture_id":[L;${id1}L,${id2}L]},madein:"${dsclink}",display:{Lore:['{"italic":false,"color":"white","extra":[{"text":""},{"color":"aqua","text":"Номер: "},{"color":"dark_aqua","text":"${mapNum}/${w*h}"}],"text":""}','{"italic":false,"color":"white","extra":[{"text":""},{"strikethrough":true,"color":"#00FFA5","text":"-------------------------"}],"text":""}','{"italic":false,"color":"white","extra":[{"text":""},{"color":"gray","text":"Хочешь сделать большой арт? Заходи в дс:"}],"text":""}','${linknbt}'],MapColor:16732672},map:9999999}}`);
			return nbts;
		}
		async function getMaps(nbts, mapNum) {
			// Порядок выдачи: 36-44 (хотбар), 9-35 (инвентарь)
			const slots = bot.inventory.slots;
			// С хотбара
			for (let i = 36; i <= 44; i++) {
				if (slots[i] && slots[i].name == 'filled_map' && slots[i].nbt.value.PublicBukkitValues) {
					mapNum++
					nbts = await getItems(nbts, slots, i, mapNum);
				}
			}
			// С инвентаря
			for (let i = 9; i <= 35; i++) {
				if (slots[i] && slots[i].name == 'filled_map' && slots[i].nbt.value.PublicBukkitValues) {
					mapNum++
					nbts = await getItems(nbts, slots, i, mapNum);
				}
			}
			return [nbts, mapNum];
		}
		bot.on('messagestr', async (message) => {
			if (message == "      Добро пожаловать на проект MasedWorld") {
				let mapNum = 0;
				let nbts = [];
				await sleep(2000);
				bot.chat("/ci");
				await sleep(350);
				if (more) {
					fs.readdir('reqimg', async (err, imagefiles) => {
						if (err) throw err;
						for (const file of imagefiles) {
							const partW = file.split(".")[1];
							const partH = file.split(".")[2];
							const partSent = await client.channels.fetch(parts_channel).then(channel => channel.send({ files: [`./reqimg/${file}`] }));
							const partL = partSent.attachments.first().url;
							bot.chat(`/pic ${partW} ${partH} ${partL}`);
							await waitImage();
							const result = await getMaps(nbts, mapNum);
							nbts = result[0];
							mapNum = result[1];
							await sleep(300);
							bot.chat(`/ci`);
							await waitCooldown();
						}
						bot.quit();
						for (const file of imagefiles) {
							fs.unlink(`reqimg/${file}`, (err) => {
								if (err) throw err;
							});
						}
						fs.unlink(`req.png`, (err) => {
							if (err) throw err;
						});
						fs.unlink(`resized.png`, (err) => {
							if (err) throw err;
						});
						resolve(nbts);
					});
				} else {
					bot.chat(`/pic ${w} ${h} ${link}`);
					await waitImage();
					const result = await getMaps(nbts, mapNum);
					nbts = result[0];
					mapNum = result[1];
					bot.quit();
					resolve(nbts);
				}
			}
			else if (message.includes("/reg")) {
				bot.chat("/reg " + minepass);
			}
			else if (message.includes("/login")) {
				bot.chat("/login " + minepass);
			}
			else if (message == "Сервер, на котором вы играли, выключился, вы были перемещены в лобби." || message.startsWith("Вы перемещены в лобби >")) {
				bot.quit();
				reject(eng ? "<a:fail:1249690213467422770> Bot can't join on the server "+message : "<a:fail:1249690213467422770> Бот не может зайти на портал " + message);
			}
		})
		bot.on('end', (reason) => {
			reject(eng ? '<a:fail:1249690213467422770> Error: '+reason+'\nTry again.' : "<a:fail:1249690213467422770> Ошибка: " + reason + "\nПопробуйте сгенерировать ещё раз.");
		})
		
		bot.on('error', (err) => {
			bot.quit();
			reject(eng ? '<a:fail:1249690213467422770> Error: '+err+'\nTry again.' : "<a:fail:1249690213467422770> Ошибка: " + err + "\nПопробуйте сгенерировать ещё раз.");
		})
		
		bot.on('kicked', (reason) => {
			bot.quit();
			reject(eng ? '<a:fail:1249690213467422770> Connection error (maybe someone is already generating a map): '+reason+'\nTry again.' : "<a:fail:1249690213467422770> Ошибка при подключении (возможно кто-то уже генерирует карту): " + reason + "\nПопробуйте сгенерировать ещё раз.");
		})
		
	})
}