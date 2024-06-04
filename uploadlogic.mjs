import { createBot } from 'mineflayer';
import fs from 'fs';
import Jimp from 'jimp';
import path from 'path';
import { waitFile } from 'wait-file';
import { minenick, minepass, admins, log_channel, parts_channel } from './config.mjs';
var client;

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}
async function makeImage(input, output, offWidth, offHeight, width, height) {
	await Jimp.read(input, async (err, image) => {
		if (err) console.log(err);
		await image.clone().crop(128*offWidth,128*offHeight,128,128).writeAsync('./output/'+output);
	});
}
async function createFiles(file, width, height) {
	return new Promise(async (resolve) => {
		fs.readdir('output', async (err, files) => {
			if (err) throw err;
			for (const file of files) {
				fs.unlink(path.join('output', file), (err) => {
					if (err) throw err;
				});
			}
			await Jimp.read('check.png').then(async (image) => {
				if (err) console.log(err);
				await image.clone().resize(128*width,128*height).writeAsync('resized.png');
			}).catch((err) => console.log(err));
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

export async function upload(interaction, clientcopy) {
client = clientcopy;
await interaction.reply("<a:load:1216036715072847953> Загрузка...");
if (interaction.options.getAttachment('image').contentType === null || !interaction.options.getAttachment('image').contentType.startsWith("image/") || interaction.options.getAttachment('image').contentType == 'image/webp') {
    await interaction.editReply('<:dead:1152410512093610025> Файл не похож на картинку');
    return;
}
const width = interaction.options.getInteger('width') === null ? 1 : interaction.options.getInteger('width');
const height = interaction.options.getInteger('height') === null ? 1 : interaction.options.getInteger('height');
if (width < 1 && height < 1) {
    await interaction.editReply('<:dead:1152410512093610025> Укажите нормальные числа');
    return;
}
if (width * height > 25 && !admins.split(" ").includes(interaction.user.id)) {
    await interaction.editReply('<:dead:1152410512093610025> Вы не можете генерировать больше 25 карт');
    return;
}
const timenum = (width * height - 1) * 11 + 10 + width * height >= 60 ? (((width * height - 1) * 11 + 10 + width * height) / 60).toFixed(1) + " минут" : ((width * height - 1) * 11 + 10 + width * height) + " секунд";
const stages = width == 1 && height == 1 ? 0 : 1;
client.channels.fetch(log_channel)
.then(channel => channel.send(interaction.user.username + " (" + interaction.user.id + ") создаёт картинку " + interaction.options.getAttachment('image').url + " с размерами " + width + "x" + height));

await interaction.editReply(`> <a:load:1216036715072847953> Загрузка...\n> 🛠️ Этап: 1/${5 + stages} » Получение картинки.\n> 📂 Загружено: 0/${width * height}\n> \n> \n> ⏳(Примерное время: ${timenum})`)
await Jimp.read(interaction.options.getAttachment('image').url)
	.then((image) => {
		image.write('check.png');
	})
	.catch((err) => {
		console.log(err)
	});
await interaction.editReply(`> <a:load:1216036715072847953> Загрузка...\n> 🛠️ Этап: 2/${5 + stages} » Обработка изображения.\n> 📂 Загружено: 0/${width * height}\n> \n> \n> ⏳(Примерное время: ${timenum})`)
if (width * height > 85) {
    await interaction.followUp('Скорее всего бот не успеет сгенерировать все карты до лимита времени команд от дискорда, поэтому все нбт выгрузятся на отдельный дискорд сервер');
}
if (width == 1 && height == 1) {
    client.channels.fetch(parts_channel)
    .then(channel => channel.send({ files: ['./check.png'] }).then(async (sent) => {
        const link = JSON.stringify(sent.attachments).replace(/.+"url":"(.+&)","proxyURL".+/, "$1");
        if (link == undefined) {
            interaction.editReply("<:dead:1152410512093610025> Произошла ошибка при получении картинки. Попробуйте ещё раз.")
            return;
        }
        initBot(minenick, minepass, link, interaction, stages, width, height, timenum).then(async (nbts) => {
            fs.writeFile('map.txt', nbts[0], async (err) => {
                if (err) throw err;
                await interaction.editReply({ content: `> :mag_right: **NBT** карты находится в файле (можно кликнуть 3 раза по тексту ниже и нажать **CTRL+C**, чтобы скопировать)\n> :link: Что делать с **NBT**? » https://discord.com/channels/999028553104502895/1218594165508542484`, files: ['map.txt'] });
                fs.unlink('map.txt', (err) => {
                    if (err) throw err;
                });
            });
        }).catch(err => {
            interaction.editReply(err)
        });
    }));
}
else {
    interaction.editReply(`> <a:load:1216036715072847953> Загрузка...\n> 🛠️ Этап: 3/${5 + stages} » Преобразование картинки\n> 📂 Загружено: 0/${width * height}\n> \n> \n> ⏳(Примерное время: ${timenum})`)
    if (fs.existsSync('check.png')) {
        await createFiles('check.png', width, height);
    } else {
        const opts = {
            resources: ['check.png'],
            delay: 0,
            interval: 100,
            log: true,
            timeout: 10000
        };
        try {
            await waitFile(opts);
            await createFiles('check.png', width, height);
        } catch (err) {
            console.error(err);
            interaction.editReply(`<:dead:1152410512093610025> Произошла ошибка при получении картинки. Попробуйте ещё раз.`)
            return;
        }
    }
    await initBot(minenick, minepass, "mnogo", interaction, stages, width, height, timenum).then(async (nbts) => {
        fs.readdir('output', (err, files) => {
            if (err) throw err;
            for (const file of files) {
                fs.unlink(path.join('output', file), (err) => {
                    if (err) throw err;
                });
            }
        });
        if (width * height <= 85) {
            interaction.editReply(`> <a:load:1216036715072847953> Загрузка...\n> 🛠️ Этап: 6/6 » Загрузка файлов в дискорд.\n> 📂 Загружено: ${width * height}/${width * height}\n> \n> \n> ⏳(Примерное время: ${timenum})`)
        }
        if (nbts.length > 27) {
            async function createNbtFiles(nbts) {
                return new Promise(async (resolve) => {
                    var fileCounter = 0;
                    var othArray = [];
                    for (const nbt of nbts) {
                        othArray.push(nbt.replace("{Count:64b,", `{Count:64b,Slot:${nbts.indexOf(nbt) - (27 * fileCounter)}b,`))
                        if ((nbts.indexOf(nbt) - (27 * fileCounter) != 0 && (nbts.indexOf(nbt) - (27 * fileCounter)) % 26 == 0) || (nbts.indexOf(nbt) + 1 == nbts.length)) {
                            // https://sul.su/аrtall
                            await fs.writeFileSync(`./nbtout/shulker${fileCounter + 1}.txt`, `{Count:1b,id:"minecraft:white_shulker_box",tag:{BlockEntityTag:{Items:[${othArray.slice(fileCounter * 27, fileCounter * 27 + 27).toString()}],id:"minecraft:shulker_box"},HideFlags:32,display:{Lore:['{"italic":false,"color":"white","extra":[{"text":""},{"color":"dark_gray","text":"Кaрты внyтри"}],"text":""}','{"bold":true,"italic":false,"extra":[{"color":"#8CDDDA","text":"s"},{"color":"#92D9DC","text":"u"},{"color":"#98D5DF","text":"l"},{"color":"#9ED1E1","text":"."},{"color":"#A4CDE4","text":"s"},{"color":"#AAC9E7","text":"u"},{"color":"#B0C5E9","text":"/"},{"color":"#B7C1EC","text":"а"},{"color":"#BDBDEE","text":"r"},{"color":"#C3B9F1","text":"t"},{"color":"#C9B5F4","text":"a"},{"color":"#CFB1F6","text":"l"},{"color":"#D5ADF9","text":"l"}],"text":""}'],Name:'{"italic":false,"extra":[{"text":""},{"bold":true,"color":"#7B5DFF","text":"АRТALL (${fileCounter + 1} шaлкер)"}],"text":""}'}}}`);
                            fileCounter++;
                        }
                    }
                    resolve();
                });
            }
            await createNbtFiles(nbts);
            fs.readdir('nbtout', async (err, nbtfiles) => {
                if (err) throw err;
                if (nbtfiles.length > 10) {
                    var shulkerCounter = 0;
                    for (const file of nbtfiles) {
                        nbtfiles[nbtfiles.indexOf(file)] = "./nbtout/" + file;
                        if ((nbtfiles.indexOf(file) - (10 * shulkerCounter)) % 9 == 0 || nbtfiles + 1 == nbtfiles.length) {
                            if (width * height > 85) {
                                client.channels.fetch(log_channel)
                                .then(channel => channel.send({ files: nbtfiles.slice(shulkerCounter * 10, (shulkerCounter * 10) + 9) }));
                            }
                            else {
                                if (shulkerCounter == 0) {
                                    await interaction.editReply({ content: `> :mag_right: **NBT** шалкеров со всеми картами находятся в файлах\n> :link: Что делать с **NBT**? » ⁠https://discord.com/channels/999028553104502895/1218594165508542484`, files: nbtfiles.slice(shulkerCounter * 10, (shulkerCounter * 10) + 9) });
                                }
                                else {
                                    await interaction.followUp({ files: nbtfiles.slice(shulkerCounter * 10, (shulkerCounter * 10) + 9) });
                                }
                            }
                            shulkerCounter++;
                            
                        }
                    }
                    for (const file of nbtfiles) {
                        fs.unlink(file, (err) => {
                            if (err) throw err;
                        });
                    }
                    
                }
                else {
                    var paths = [];
                    for (const file of nbtfiles) {
                        paths.push("./nbtout/" + file)
                    }
                    
                    await interaction.editReply({ content: `> :mag_right: **NBT** шалкеров со всеми картами находятся в файлах\n> :link: Что делать с **NBT**? » ⁠https://discord.com/channels/999028553104502895/1218594165508542484`, files: paths });
                    for (const file of nbtfiles) {
                        fs.unlink(path.join('nbtout', file), (err) => {
                            if (err) throw err;
                        });
                    }
                }
            });
        }
        else {
            nbts.forEach(nbt => nbts[nbts.indexOf(nbt)] = nbt.replace("{Count:64b,", `{Count:64b,Slot:${nbts.indexOf(nbt)}b,`));
            // https://sul.su/аrtall
            var content = `{Count:1b,id:"minecraft:white_shulker_box",tag:{BlockEntityTag:{Items:[${nbts.toString()}],id:"minecraft:shulker_box"},HideFlags:32,display:{Lore:['{"italic":false,"color":"white","extra":[{"text":""},{"color":"dark_gray","text":"Кaрты внyтри"}],"text":""}','{"italic":false,"color":"white","extra":[{"text":""},{"color":"gray","text":"Хочeшь сдeлать бoльшoй aрт? Захoди в дc:"}],"text":""}','{"bold":true,"italic":false,"extra":[{"color":"#8CDDDA","text":"s"},{"color":"#92D9DC","text":"u"},{"color":"#98D5DF","text":"l"},{"color":"#9ED1E1","text":"."},{"color":"#A4CDE4","text":"s"},{"color":"#AAC9E7","text":"u"},{"color":"#B0C5E9","text":"/"},{"color":"#B7C1EC","text":"а"},{"color":"#BDBDEE","text":"r"},{"color":"#C3B9F1","text":"t"},{"color":"#C9B5F4","text":"a"},{"color":"#CFB1F6","text":"l"},{"color":"#D5ADF9","text":"l"}],"text":""}'],Name:'{"italic":false,"extra":[{"text":""},{"bold":true,"color":"#7B5DFF","text":"АRТALL"}],"text":""}'}}}`;
            
            await fs.writeFileSync('shulker.txt', content);
            
            await interaction.editReply({ content: `> :mag_right: **NBT** шалкера со всеми картами находятся в файле\n> :link: Что делать с **NBT**? » ⁠https://discord.com/channels/999028553104502895/1218594165508542484`, files: ['shulker.txt'] });
            fs.unlink('shulker.txt', (err) => {
                if (err) throw err;
            });
        }
    }).catch(err => {
        interaction.editReply(err)
    });
}
}


















async function initBot(nick, pass, image, interaction, stages, width, height, timenum) {
	return new Promise((resolve, reject) => {
		interaction.editReply(`> <a:load:1216036715072847953> Загрузка...\n> 🛠️ Этап: ${3 + stages}/${5 + stages} » Подключение к серверу.\n> 📂 Загружено: 0/${width * height}\n> \n> \n> ⏳(Примерное время: ${timenum})`)
		var antibot = true;
		var options = {
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
			username: nick,
			version: "1.20.4"
		}
		var bot = createBot(options);
		
		bot.once('spawn', () => {
			setTimeout(() => {
				bot.chat('/s6');
			}, 400);
		});
		
		function waitImage(cmd) {
			return new Promise((resolve, reject) => {
				const messageHandler = (message) => {
					var resolved = false;
					if ((message.toString() == '› Ваша картинка создана!') && !resolved) {
						bot.removeListener("message", messageHandler);
						resolved = true;
						resolve();
					} else if (message.toString().startsWith('[*] Эта команда будет доступна через')) {
						var timeout = parseInt(message.toString().substring(message.toString().indexOf("через") + 6, message.toString().indexOf("секунд") - 1));
						(async () => {
							await bot.waitForTicks(timeout * 21);
							bot.chat(cmd);
						})();
					}
					else if ((message.toString() == '› Обратите внимание, нужна прямая ссылка на картинку. (JPG, PNG и т.д.)' || message.toString() == '› Ваша картинка слишком большая') && !resolved) {
						bot.removeListener("message", messageHandler);
						resolved = true;
						reject("<:dead:1152410512093610025> Ошибка: " + message + "\nПопробуйте сгенерировать ещё раз.");
					}
				}
				bot.on("message", messageHandler);
			});
		}
		function waitCooldown() {
			return new Promise((resolve) => {
				const messageHandler = (message) => {
					var resolved = false;
					if ((message.toString() == '[*] Задержка на команду /picture закончилась.') && !resolved) {
						bot.removeListener("message", messageHandler);
						resolved = true;
						resolve();
					}
				}
				bot.on("message", messageHandler);
			});
		}
		bot.on('messagestr', (message) => {
			if (message.includes("Пожалуйста подтвердите, что вы не бот")) {
				if (antibot == true) {
					antibot = false;
					var nachalo = message.indexOf("'Да':") + 6;
					var konec = message.length;
					var link = message.substring(nachalo, konec);
					interinstance.editReply(`Пожалуйста, пройдите по ссылке, чтобы бот смог загрузить картинку: ${link}`)
				}
			}
			else if (message == "      Добро пожаловать на проект MasedWorld") {
				(async () => {
					await sleep(2000);
					if (bot.game.gameMode != 'creative') {
						bot.chat("/gm 1")
						await sleep(500);
					}
					var mapNbts = [];
					if (image == "mnogo") {
						var imageFiles = fs.readdirSync('./output');
						interaction.editReply(`> <a:load:1216036715072847953> Загрузка...\n> 🛠️ Этап: 5/6 » Загрузка частей изображения на сервер.\n> 📂 Загружено: ?/${width * height}\n> \n> \n> ⏳(Примерное время: ${timenum})`)
						for (var imageFile of imageFiles) {
							if (width * height <= 85) {
								interaction.editReply(`> <a:load:1216036715072847953> Загрузка...\n> 🛠️ Этап: 5/6 » Загрузка частей изображения на сервер.\n> 📂 Загружено: ${imageFiles.indexOf(imageFile)}/${width * height}\n> \n> \n> ⏳(Примерное время: ${timenum})`)
							}
							await client.channels.fetch(parts_channel).then(channel => channel.send({ files: [`./output/${imageFile}`] }).then(async (sent) => {
								await bot.creative.clearSlot(36);
								await bot.setQuickBarSlot(0);
								var command = '/pic ' + JSON.stringify(sent.attachments).replace(/.+"url":"(.+&)","proxyURL".+/, "$1");
								bot.chat(command);
								await waitImage(command).catch(err => {
									console.log(err);
									reject(err);
								});
								var id1 = bot.heldItem.nbt.value.PublicBukkitValues.value["cmmappicture:picture_id"].value[0];
								var id2 = bot.heldItem.nbt.value.PublicBukkitValues.value["cmmappicture:picture_id"].value[1];
								var bytes = bot.heldItem.nbt.value.PublicBukkitValues.value["cmmappicture:picture_data"].value;
								// https://sul.su/аrtall
								mapNbts.push(`{Count:64b,id:"minecraft:filled_map",tag:{Enchantments:[{id:"minecraft:aqua_affinity",lvl:0s}],HideFlags:33,PublicBukkitValues:{"cmmappicture:picture_data":[B;${bytes.toString().replaceAll('[', '').replaceAll(']', '').replaceAll(',', 'B,')}B],"cmmappicture:picture_id":[L;${id1}L,${id2}L]},madein:"https://discord.gg/3Kc2KptFD3",display:{Lore:['{"italic":false,"color":"white","extra":[{"text":""},{"color":"aqua","text":"Номер: "},{"color":"dark_aqua","text":"${imageFiles.indexOf(imageFile) + 1}/${imageFiles.length}"}],"text":""}','{"italic":false,"color":"white","extra":[{"text":""},{"strikethrough":true,"color":"#00FFA5","text":"-------------------------"}],"text":""}','{"italic":false,"color":"white","extra":[{"text":""},{"color":"gray","text":"Хочешь сделать большой арт? Заходи в дс:"}],"text":""}','{"bold":true,"italic":false,"extra":[{"color":"#8CDDDA","text":"s"},{"color":"#92D9DC","text":"u"},{"color":"#98D5DF","text":"l"},{"color":"#9ED1E1","text":"."},{"color":"#A4CDE4","text":"s"},{"color":"#AAC9E7","text":"u"},{"color":"#B0C5E9","text":"/"},{"color":"#B7C1EC","text":"а"},{"color":"#BDBDEE","text":"r"},{"color":"#C3B9F1","text":"t"},{"color":"#C9B5F4","text":"a"},{"color":"#CFB1F6","text":"l"},{"color":"#D5ADF9","text":"l"}],"text":""}'],MapColor:65419},map:9999999}}`);
								if (width * height <= 85) {
									interaction.editReply(`> <a:load:1216036715072847953> Загрузка...\n> 🛠️ Этап: 5/6 » Загрузка частей изображения на сервер.\n> 📂 Загружено: ${imageFiles.indexOf(imageFile) + 1}/${width * height}\n> \n> \n> ⏳(Примерное время: ${timenum})`)
								}
								if (imageFiles.indexOf(imageFile) + 1 != imageFiles.length) {
									await waitCooldown();
								}
							}));
						}
						bot.quit();
						resolve(mapNbts);
					}
					else {
						interaction.editReply(`> <a:load:1216036715072847953> Загрузка...\n> 🛠️ Этап: 4/5 » Загрузка изображения на сервер.\n> 📂 Загружено: 0/1\n> \n> \n> ⏳(Примерное время: ${timenum})`)
						bot.creative.clearSlot(36);
						bot.setQuickBarSlot(0);
						bot.chat('/pic ' + image);
						await waitImage().catch(err => {
							console.log(err);
							reject(err);
						});
						var id1 = bot.heldItem.nbt.value.PublicBukkitValues.value["cmmappicture:picture_id"].value[0];
						var id2 = bot.heldItem.nbt.value.PublicBukkitValues.value["cmmappicture:picture_id"].value[1];
						var bytes = bot.heldItem.nbt.value.PublicBukkitValues.value["cmmappicture:picture_data"].value;
						bot.creative.clearSlot(36);
						// https://sul.su/аrtall
						mapNbts.push(`{Count:64b,id:"minecraft:filled_map",tag:{Enchantments:[{id:"minecraft:aqua_affinity",lvl:0s}],HideFlags:33,PublicBukkitValues:{"cmmappicture:picture_data":[B;${bytes.toString().replaceAll('[', '').replaceAll(']', '').replaceAll(',', 'B,')}B],"cmmappicture:picture_id":[L;${id1}L,${id2}L]},madein:"https://discord.gg/3Kc2KptFD3",display:{Lore:['{"italic":false,"color":"white","extra":[{"text":""},{"color":"gray","text":"Хочешь сделать свой арт? Заходи в дс:"}],"text":""}','{"bold":true,"italic":false,"extra":[{"color":"#8CDDDA","text":"s"},{"color":"#92D9DC","text":"u"},{"color":"#98D5DF","text":"l"},{"color":"#9ED1E1","text":"."},{"color":"#A4CDE4","text":"s"},{"color":"#AAC9E7","text":"u"},{"color":"#B0C5E9","text":"/"},{"color":"#B7C1EC","text":"а"},{"color":"#BDBDEE","text":"r"},{"color":"#C3B9F1","text":"t"},{"color":"#C9B5F4","text":"a"},{"color":"#CFB1F6","text":"l"},{"color":"#D5ADF9","text":"l"}],"text":""}'],MapColor:65419},map:9999999}}`);
						interaction.editReply(`> <a:load:1216036715072847953> Загрузка...\n> 🛠️ Этап: 5/5 » Загрузка файла\n> 📂 Загружено: 1/1\n> \n> \n> ⏳(Примерное время: ${timenum})`)
						//await waitCooldown();
						bot.quit();
						resolve(mapNbts);
					}
				})();
			}
			else if (message.includes("/reg")) {
				bot.chat("/reg " + pass);
			}
			else if (message.includes("/login")) {
				bot.chat("/login " + pass);
			}
			else if (message == "Сервер, на котором вы играли, выключился, вы были перемещены в лобби." || message.startsWith("Вы перемещены в лобби >")) {
				bot.quit();
				reject("<:dead:1152410512093610025> Бот не может зайти на портал " + message);
			}
		})
		bot.on('end', (reason) => {
			reject("<:dead:1152410512093610025> Ошибка: " + reason + "\nПопробуйте сгенерировать ещё раз.");
		})
		
		bot.on('error', (err) => {
			bot.quit();
			reject("<:dead:1152410512093610025> Ошибка: " + err + "\nПопробуйте сгенерировать ещё раз.");
		})
		
		bot.on('kicked', (reason) => {
			bot.quit();
			reject("<:dead:1152410512093610025> Ошибка при подключении (возможно кто-то уже генерирует карту): " + reason + "\nПопробуйте сгенерировать ещё раз.");
		})
		
	})
}