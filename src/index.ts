import { join } from 'path';
import { stringify, parse } from 'yaml';
import { existsSync, readFileSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { Extension, Bot } from 'kokkoro-core';

const all_mid: Set<number> = new Set();

// 获取所有 bot 的订阅
export function getAllMid() {
  return [...all_mid];
}

function deepMerge(target: any, sources: any): any {
  const keys = Object.keys(sources);
  const keys_length = keys.length;

  for (let i = 0; i < keys_length; i++) {
    const key = keys[i];

    target[key] = typeof target[key] === 'object'
      ? deepMerge(target[key], sources[key])
      : sources[key];
  }

  return target;
}

const bilibili_path = join(__workname, '/data/bilibili');
const bilibili_data = readFileSync(bilibili_path, 'utf8');
export const bilibili_dynamic = parse(bilibili_data);

interface MidList {
  [mid: number]: {
    // b站昵称
    nickname: string;
    // 是否订阅
    subscribe: boolean;
  }
}

interface Group {
  // 群名称
  group_name: string;
  mid_list: MidList;
}

interface DynamicConfig {
  // 监听 mid 列表
  mids: number[];
  // 群聊列表
  [group_id: number]: Group | undefined;
}

export default class implements Extension {
  bot: Bot;
  path: string;
  dynamic_config!: DynamicConfig;

  constructor(bot: Bot) {
    this.bot = bot;
    this.path = join(bilibili_path, `${bot.uin}.yml`);
  }

  onInit() {
    this.initBili()
      .then(() => {
        this.bot.logger.mark(`已更新 ${this.path}.yml`)
      })
      .catch(error => {
        this.bot.logger.error(error.message);
      })
  }

  onDestroy() {

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

      mid_list[mid] = {
        nickname: 'unknown', subscribe: false,
      };
    }

    for (const [group_id, group] of gl) {
      const group_name = group.group_name;
      default_config[group_id] = { group_name, mid_list };
    }

    try {
      this.dynamic_config = parse(readFileSync(this.path, 'utf8'));
    } catch (error) {
      this.dynamic_config = { mids };

      !existsSync(join(__workname, `/data`)) && await mkdir(join(__workname, `/data`));
      await mkdir(bilibili_path);
    }

    this.dynamic_config = deepMerge(default_config, this.dynamic_config);

    for (const mid of this.dynamic_config.mids) {
      all_mid.add(mid);
    }

    return await writeFile(this.path, stringify(this.dynamic_config));
  }
}