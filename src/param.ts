import biliAPI from 'bili-api';
import schedule from 'node-schedule';
import { Bot } from 'kokkoro-core';

// 定时发送任务
export let send_job: schedule.Job;

// 销毁定时任务
export function cancelSchedule() {
  send_job.cancel();
}