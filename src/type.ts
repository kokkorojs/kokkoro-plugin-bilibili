export interface MidList {
  [mid: number]: {
    // b站昵称
    nickname: string;
    // 是否订阅
    subscribe: boolean;
  }
}

export interface Group {
  // 群名称
  group_name: string;
  mid_list: MidList;
}

export interface DynamicConfig {
  // 监听 mid 列表
  mids: number[];
  // 群聊列表
  [group_id: number]: Group | undefined;
}

export interface Dynamics {
  dynamicsRaw: DynamicsRaw;
}

export interface Dynamic {
  desc: {
    uid: number;
    type: DynamicType;
    dynamic_id: number;
    user_profile: {
      info: {
        uid: number;
        uname: string;
        face: string;
        face_nft: number;
      }
    }
  };
  card: string;
}

export type DynamicsRaw = Dynamic[];
export type DynamicType = 1 | 2 | 4 | 64;

export interface Picture {
  img_src: string;
}

export interface CardObject {
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

export interface BiliInfo {
  mid: number;
  info: {
    code: number;
    message: string;
    ttl: number;
    data: {
      mid: number;
      name: string;
      sex: string;
      face: string;
      face_nft: number;
      sign: string;
      rank: number;
      level: number;
      jointime: number;
      moral: number;
      silence: number;
      coins: number;
      fans_badge: boolean;
      fans_medal: object;
      official: object;
      vip: object;
      pendant: object;
      nameplate: object;
      user_honour_info: object;
      is_followed: boolean;
      top_photo: string;
      theme: {},
      sys_notice: {},
      live_room: object;
      birthday: string;
      school: null,
      profession: object;
      tags: any[],
      series: object;
      is_senior_member: number;
    }
  }
  uname: string;
}

export interface LocalDynamic {
  [mid: number]: string[][];
}
