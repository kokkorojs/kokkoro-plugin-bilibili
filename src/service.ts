import axios from 'axios';
import { scheduleJob, Job } from 'node-schedule';
import { getAllUin } from '.';

const all_uin = getAllUin();
// 动态更新任务
const update_job: Job = scheduleJob('0 0 5 * * ?', () => {

});

// 销毁更新任务
function cancelUpdateSchedule() {
  update_job.cancel();
}

function updateDynamic() {

}