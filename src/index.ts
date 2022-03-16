import { join } from 'path';
import { stringify, parse } from 'yaml';
import { writeFile, readFile } from 'fs/promises';
import { Job, scheduleJob } from 'node-schedule';
import { Extension, Bot, deepMerge, deepClone, section } from 'kokkoro';

import { addMid, bilibili_path, cancelUpdateSchedule, getDynamicInfo, getNickname } from './service';

// Map<mid, dynamic_id>
const dynamicInfo: Map<number, number> = new Map();

export default class Bilibili implements Extension {
  bot: Bot;
  path: string;
  send_job: Job;
  dynamic_info: DynamicInfo;
  dynamic_config!: DynamicConfig;

  constructor(bot: Bot) {
    this.bot = bot;
    this.send_job = this.autoSend();
    this.dynamic_info = getDynamicInfo();
    this.path = join(bilibili_path, `${bot.uin}.yml`);
  }

  autoSend() {
    return scheduleJob('30 0/5 * * * ?', async () => {
      const dynamic_info = getDynamicInfo();
      const keys = Object.keys(dynamic_info).map(Number);

      for (const mid of keys) {
        const dynamic = dynamic_info[mid];

        if (this.dynamic_info[mid] && (dynamic.dynamic_id === this.dynamic_info[mid].dynamic_id)) continue;

        this.dynamic_info[mid] = dynamic;
        this.bot.getGroupList().forEach(async group => {
          const { group_id } = group;

          // 该群是否订阅动态推送
          if (this.dynamic_config[group_id]?.mid_list[mid].subscribe) {
            const message: any[] = [`动态更新：${this.dynamic_config[group_id]?.mid_list[mid].nickname}\n\n`];

            for (const segment of dynamic.content) {
              if (!segment.startsWith('http')) {
                message.push(segment);
              } else {
                const image = await section.image(segment);
                message.push(image);
              }
            }
            this.bot.sendGroupMsg(group_id, message);
          }
        })
      }
    })
  }

  // 销毁定时任务
  cancelSendSchedule() {
    this.send_job.cancel();
    cancelUpdateSchedule();
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

    try {
      const config_data = await readFile(this.path, 'utf8');
      this.dynamic_config = parse(config_data);
    } catch (error) {
      const mids = [
        353840826,  // 公主连结ReDive
        1731293061, // PCR公主连结日服情报站
      ];

      this.dynamic_config = { mids };
    }

    const mids = this.dynamic_config.mids;
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
      default_config[group_id] = { group_name, mid_list: deepClone(mid_list) };
    }

    this.dynamic_config = deepMerge(default_config, this.dynamic_config);

    for (const mid of this.dynamic_config.mids) {
      addMid(mid);
    }

    return await writeFile(this.path, stringify(this.dynamic_config));
  }
}
