import biliAPI from 'bili-api';
import { Bot } from 'kokkoro-core';

declare module 'bili-api' {

}

// 定时发送任务
export let send_job: schedule.Job;

// 销毁定时任务
export function cancelSendSchedule() {
  send_job.cancel();
}