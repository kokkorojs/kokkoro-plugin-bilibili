import { join } from 'path';
import { stringify } from 'yaml';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { Extension, Bot } from 'kokkoro-core';

export default class implements Extension {
  bot: Bot;
  path: string;

  constructor(bot: Bot) {
    this.bot = bot;
    this.path = join(__workname, `/data/bilibili/${bot.uin}.json`);
  }

  async onInit() {
    try {

    } catch (error) {
      const dynamic = {
        all_uin: [
          353840826, 1731293061,
        ],
      }
      !existsSync(join(__workname, `/data`)) && await mkdir(join(__workname, `/data`));

      await mkdir(join(__workname, `/data/bilibili`));
      await writeFile(this.path, stringify(dynamic));
    }
  }

  onDestroy() {
  }

  initBili() {

  }
}