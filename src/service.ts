import axios from 'axios';
import biliAPI from 'bili-api';
import { logger, section } from 'kokkoro-core';
import { scheduleJob, Job } from 'node-schedule';

import { bilibili_dynamic, getAllMid } from '.';

// declare module 'bili-api' {

// }
interface Dynamics {
  dynamicsRaw: DynamicsRaw;
}

interface Dynamic {
  desc: {
    uid: number;
    type: DynamicType;
    dynamic_id: number;
  };
  card: string;
}

type DynamicsRaw = Dynamic[];
type DynamicType = 1 | 2 | 4 | 64;

interface Picture {
  img_src: string;
}
interface CardObject {
  user: {
    uid: number;
    uname: string;
    face: string;
  }
  item: {
    rp_id: number;
    uid: number;
    content: string;

    pictures: Picture[];
    description: string;
  };
  // 转发
  origin?: string;

  // 专栏
  summary: string;
  image_urls: string[];
}


// 获取动态
async function getDynamics(mid: number) {
  const dynamics: Dynamics = await biliAPI({ mid }, ['dynamics']);

  return dynamics;
}

// 动态更新任务
const update_job: Job = scheduleJob('0 0 5 * * ?', async () => {
  const all_mid = getAllMid();

  for (let i = 0; i < all_mid.length; i++) {
    const mid = all_mid[i];
    // const dynamic_list = [];
    // const old_dynamic = await getProfile(val.toString(), './data/dynamic');

    logger.mark(`正在获取 ${mid} 动态...`);

    try {
      const dynamics = await getDynamics(mid);
      
    } catch (error) {
      const { message } = error as Error;
      logger.error(`获取 bilibili 动态失败，${message}`)
    }

    const { dynamicsRaw } = dynamics;

    for (const dynamic of dynamicsRaw) {
      const message = [];
      // let dynamic_content: string;

      const { desc, card } = dynamic;
      const { type, dynamic_id } = desc;
      const card_object: CardObject = JSON.parse(card);



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
              const image = section.image(img_src);
              message.push(image);
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
            if (!origin_object.item) { continue; }

            const { item: { pictures = [] } } = origin_object;

            for (const { img_src } of pictures) {
              const image = section.image(img_src);
              message.push(image);
            }
          })();
          break;
        case 64:
          (() => {
            const { summary, image_urls } = card_object;

            // 添加省略号，专栏内容过长，summary 仅显示前半部分
            message.push(summary + '...');
            for (const img_src of image_urls) {
              const image = section.image(img_src);
              message.push(image);
            };
          })();
          break;
        default:
          // 投稿动态不会收录
          break;
      }

      // 存储前 5 条动态
      if (dynamic_list.length > 4) { break; }
      if (message.length) {
        const dynamic = [dynamic_id, message];
        dynamic_list.push(dynamic);
      }
    }

    bilibili_dynamic
    // if (!old_dynamic[0] || old_dynamic[0][0] !== new_dynamic[0][0]) {
    //   setProfile(val.toString(), new_dynamic, './data/dynamic')
    //     .then(() => {
    //       logger.mark(`${key} 动态更新完毕`);
    //     })
    // } else {
    //   logger.mark(`未检测到 ${key} 有新动态`);
    // }
  }
});

// 销毁更新任务
function cancelUpdateSchedule() {
  update_job.cancel();
}

function updateDynamic() {

}