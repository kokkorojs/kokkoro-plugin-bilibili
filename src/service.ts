import axios from 'axios';
import biliAPI from 'bili-api';
import { join } from 'path';
import { parse } from 'yaml';
import { writeFile } from 'fs/promises';
import { logger, deepClone } from 'kokkoro';
import { scheduleJob, Job } from 'node-schedule';
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';

import { Dynamics, CardObject, DynamicsRaw, BiliInfo, LocalDynamic } from './type';

// declare module 'bili-api' {

// }

let bili_data = '';
let bili_dynamic: LocalDynamic = {};
const all_mid: Set<number> = new Set();

export const bilibili_path = join(__workname, 'data/bilibili');
const dynamic_path = join(bilibili_path, 'dynamic.json');

try {
  bili_data = readFileSync(dynamic_path, 'utf8');
  bili_dynamic = parse(bili_data);
} catch (error) {
  !existsSync(bilibili_path) && mkdirSync(bilibili_path);
  writeFileSync(dynamic_path, JSON.stringify(bili_dynamic));
}

// 获取所有订阅 id
export function getAllMid() {
  return [...all_mid];
}

// 添加 mid
export function addMid(mid: number) {
  all_mid.add(mid);
}

// 获取用户昵称
export function getNickname(mid: number): Promise<string> {
  return new Promise((resolve, reject) => {
    biliAPI({ mid }, ['uname'])
      .then((response: BiliInfo) => {
        const { uname } = response;
        resolve(uname);
      })
      .catch(() => {
        reject('unknown');
      })
  })
}

// 获取本地动态
function getLocalDynamic(): LocalDynamic {
  return deepClone(bili_dynamic);
}

// 获取动态
async function getDynamics(mid: number) {
  return biliAPI({ mid }, ['dynamics']);
}

// 2020 年留下来的屎山
async function writeDynamic(dynamicsRaw: DynamicsRaw) {
  let uid: number;
  let uname: string;

  const local_dynamic = getLocalDynamic();
  const dynamic_list: string[][] = [];

  for (const dynamic of dynamicsRaw) {
    const message: string[] = [];
    const { desc, card } = dynamic;
    const { type, user_profile } = desc;
    const { info } = user_profile;
    const card_object: CardObject = JSON.parse(card);

    uid = info.uid;
    uname = info.uname;

    /**
     * type 1   转发动态  item > content 文字内容 origin > item 转发动态内容
     * type 2   图片动态  item > description 文字内容 pictures 图片地址
     * type 4   文字动态  item > content 文字内容 
     * type 8   投稿视频
     * type 64  投稿专栏  summary 专栏内容 origin_image_urls 图片地址
     */
    switch (type) {
      case 2:
        (() => {
          const { item: { description, pictures } } = card_object;

          message.push(description);
          for (const { img_src } of pictures) {
            message.push(img_src);
          }
        })();
        break;
      case 1:
      case 4:
        (() => {
          const { item: { content }, origin = '{"item":{"pictures":[]}}' } = card_object;

          message.push(content);
          const origin_object = JSON.parse(origin);

          // 防止转发视频动态
          if (!origin_object.item) return;

          const { item: { pictures = [] } } = origin_object;

          for (const { img_src } of pictures) {
            message.push(img_src);
          }
        })();
        break;
      case 64:
        (() => {
          const { summary, image_urls } = card_object;

          // 添加省略号，专栏内容过长，summary 仅显示前半部分
          message.push(summary + '...');
          for (const img_src of image_urls) {
            message.push(img_src);
          };
        })();
        break;
      default:
        // 投稿动态不会收录
        break;
    }

    // 存储前 5 条动态
    if (dynamic_list.length > 4) break;
    if (message.length) {
      dynamic_list.push(message);
    }

    if (!local_dynamic[uid] || local_dynamic[uid][0] !== dynamic_list[0]) {
      local_dynamic[uid] = dynamic_list;
    }
  }

  await updateDynamic(local_dynamic)
    .then(() => {
      logger.mark(`${uname}(${uid}) 动态更新完毕`);
    })
    .catch((error?: Error) => {
      if (!error) {
        logger.mark(`${uname}(${uid}) 未检测到有新动态`);
      } else {
        logger.error(error.message);
      }
    })
}

// 动态更新任务
const update_job: Job = scheduleJob('0 0/1 * * * ?', async () => {
  const all_mid = getAllMid();

  for (let i = 0; i < all_mid.length; i++) {
    const mid = all_mid[i];

    logger.mark(`正在获取 ${mid} 动态...`);
    try {
      const dynamics = await getDynamics(mid) as Dynamics;
      const dynamicsRaw = dynamics.dynamicsRaw;

      await writeDynamic(dynamicsRaw);
    } catch (error) {
      const { message } = error as Error;
      logger.error(`获取 bilibili 动态失败，${message}`);
    }
  }
});

// 销毁更新任务
function cancelUpdateSchedule() {
  update_job.cancel();
}

function updateDynamic(dynamic: LocalDynamic) {
  Object
  const new_dynamic = JSON.stringify(local_dynamic, null, 2);
  const old_dynamic = JSON.stringify(getLocalDynamic(), null, 2);

  if (new_dynamic === old_dynamic && old_dynamic !== '{}') {
    return Promise.reject();
  }

  return writeFile(dynamic_path, new_dynamic);
}
