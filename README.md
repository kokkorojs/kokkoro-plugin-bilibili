# kokkoro-bilibili

> 哔哩哔哩 (゜-゜)つロ 干杯~-bilibili

## 安装

``` shell
# 切换至 bot 目录
cd bot

# 安装 npm 包
npm i kokkoro-plugin-bilibili
```

在 [kokkoro](https://github.com/kokkorojs/kokkoro) 成功运行并登录后，发送 `>enable bilibili` 即可启用插件
使用 `>bilibili <key> <value>` 可修改当前群聊的插件参数，例如关闭群聊推送 `>bilibili apply false`

## 使用

在启用插件后会在项目根目录生成 `bilibili` 目录，你修改该目录下的 `<uin>.yaml` 文件来配置群内订阅信息

``` yaml
# 群号
"123456789":
  # 群名称
  group_name: xxx
  # 订阅列表
  mid_list:
    # 订阅 id
    "353840826":
      # up 昵称
      nickname: 公主连结ReDive
      # 是否订阅动态
      subscribe: false
    "1731293061":
      nickname: PCR公主连结日服情报站
      subscribe: true
# 订阅列表
mids:
  - 353840826
  - 1731293061
```

`mids` 为全局参数，填写后会自定监听该 up 主的动态并存储在 `dynamic.json` 文件内  
在监听到动态更新后若群聊开启 `subscribe` 会自动推送最新的动态信息，修改配置文件后不要忘了发送 `>reload bilibili` 热更新插件

> 目前为 bate 版本，不建议研究源码，写的跟 shit 一样
