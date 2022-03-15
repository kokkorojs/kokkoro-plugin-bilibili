import { join } from 'path';
import { stringify, parse } from 'yaml';
import { writeFile, readFile } from 'fs/promises';
import { Job, scheduleJob } from 'node-schedule';
import { Extension, Bot, deepMerge } from 'kokkoro';

import { addMid, bilibili_path, getNickname } from './service';
import { DynamicConfig, MidList } from './type';

export default class Bilibili implements Extension {
  bot: Bot;
  path: string;
  send_job: Job;
  dynamic_config!: DynamicConfig;

  constructor(bot: Bot) {
    this.bot = bot;
    this.send_job = this.autoSend();
    this.path = join(bilibili_path, `${bot.uin}.yml`);
  }

  autoSend() {
    return scheduleJob('0 0/5 * * * ?', async () => {
      console.log('自动发送')
    })
  }

  // 销毁定时任务
  cancelSendSchedule() {
    this.send_job.cancel();
  }

  onInit() {
    this.initBili()
      .then(() => {
        this.bot.logger.mark(`已更新 ${this.path}`)
      })
      .catch(error => {
        this.bot.logger.error(error.message);
      })
  }

  onDestroy() {
    this.cancelSendSchedule();
  }

  async initBili() {
    const gl = this.bot.getGroupList();
    const mids = [
      353840826,  // 公主连结ReDive
      1731293061, // PCR公主连结日服情报站
    ];
    const mids_length = mids.length;
    const default_config: DynamicConfig = { mids };
    const mid_list: MidList = {};

    for (let i = 0; i < mids_length; i++) {
      const mid = mids[i];
      const nickname = await getNickname(mid);

      mid_list[mid] = {
        nickname, subscribe: false,
      };
    }

    for (const [group_id, group] of gl) {
      const group_name = group.group_name;
      default_config[group_id] = { group_name, mid_list };
    }

    try {
      const config_data = await readFile(this.path, 'utf8');
      this.dynamic_config = parse(config_data);
    } catch (error) {
      this.dynamic_config = { mids };
    }

    this.dynamic_config = deepMerge(default_config, this.dynamic_config);

    for (const mid of this.dynamic_config.mids) {
      addMid(mid);
    }

    return await writeFile(this.path, stringify(this.dynamic_config));
  }
}
