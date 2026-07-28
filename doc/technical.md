# 技术文档

## 1. 技术栈

- Vite 6 + 原生 JavaScript/TypeScript，`base: './'`，构建输出 `dist/`。
- Three.js 0.80.1 WebGL 渲染，保留上游 Geometry API、FlatShading、球面跑道、程序化兔子和狼；共享角色以静态 GLB 2.0 载入同一个旧版 Three runtime。
- GSAP 3.15，通过本地 `TweenMax` 兼容薄层复用原作的时序与 easing 调用。
- CSS 响应式 UI、本地 Creepster v13 WOFF2 距离字形、Pointer Events、Web Audio API 合成反馈、IntersectionObserver/Visibility API 生命周期管理。
- Aigram canonical bridge：`src/shared/runtime/bridge.ts`；当前用户资料通过 `/note/telegram/user/get/info/by/telegram_id` 获取，角色进度使用 game save/list 接口。排行榜读取在 AlterU 内所有模式可用，rank save 仍只接受无尽模式距离。
- 永久游戏 UUID：`c4489aba-61f1-45f4-aea6-c217e798462a`，由 `index.html` 的 `game-uuid` meta 注入。

### 上游接收与许可

| Reference | Source available | License | Core effect | Mobile risk | Decision |
|---|---|---|---|---|---|
| [CodePen YGxYej](https://codepen.io/Yakudoo/pen/YGxYej) | Canonical editor source + complete public mirror snapshot | MIT；CodePen 公开 Pen 默认许可 | 旋转球面跑道、程序化低多边形角色、追逐距离与弹性跑跳动画 | 旧 Three.js/GSAP、前景树遮挡、竖屏相机放大、加载即启动 GPU/音频 | Proceed；保留基线并做有界触屏适配 |

`upstream/` 保存 2026-07-27 获取的 HTML、SCSS、JS、外部依赖清单与来源记录。原作 MP3 录音许可无法独立确认，因此未分发，替换为 Web Audio 合成音。

### 已知依赖审计例外

`npm audit --omit=dev` 会报告 Three.js `<0.125.0` 的 `CVE-2020-28496`。该漏洞只在解析外部传入的超长 `rgb()/hsl()` 字符串时触发；本作所有 Three.js 颜色均为源码内数字常量，游戏没有远程颜色、模型、材质或 shader 输入，因此攻击路径不可达。升级到 0.125 会移除原作依赖的 Geometry API并破坏机械视觉对照；后续若迁移到 BufferGeometry，必须同时升级 Three.js 并移除此例外。

## 2. 目录结构

```text
index.html                         # 移动 viewport、UUID、首屏关键底色、Guest Shell
src/main.js                        # i18n、状态/UI、触控、身份、排行榜、通知、音频与首帧握手
src/rabbit-world.js                # 上游 Three.js 场景、角色、碰撞、追逐与渲染循环
src/rabbit-portrait-entry.js       # 复用真实游戏模型的勇兔透明缩略图渲染入口
src/character-roster.js            # 53 角色、53 关目标、价格、朝向与穷举动作映射
src/portable-glb-loader.js         # 旧 Three.js 共运行时的静态 GLB 2.0 适配器
src/assets/character-inventory.json # 从实时 ASSETS.json 生成的 52 角色清单快照
src/assets/characters/             # 52 个正式共享 GLB 与 52 张商店透明 sprite
src/assets/original-rabbit.png     # 从原作程序化 Hero 实际渲染的透明商店缩略图
rabbit-portrait.html               # 512×512 离屏截图用辅助页面，不进入产品导航
scripts/sync-character-library.mjs # 动态筛选、复制并清理共享角色资产
src/style.css                      # 视觉系统、Guest Shell 安全区与双尺寸响应式
src/fonts/creepster-latin-v13.woff2 # Get Off My Grave 同款距离展示字体
src/shared/runtime/                # Aigram canonical bridge 与 UUID resolution
public/poster.png                  # Aigram transit 生成的 1024×1024 正式海报
public/THIRD_PARTY_NOTICES.txt     # 上游、依赖、图标与字体署名
public/LICENSES/Apache-2.0.txt     # Material touch_app 图标完整许可证
public/LICENSES/OFL-1.1-Creepster.txt # Creepster 完整 OFL 1.1 许可证
upstream/                          # 未改动的上游快照和获取说明
doc/                               # 需求、视觉、技术文档
_qa/reference/                     # 原作桌面/手机与本地 baseline 证据
_qa/ui/                            # 390×844、320×568 首轮与复验截图
_qa/platform-harness.html          # Aigram iframe bridge + 无 CORS 头像模拟
```

## 3. 核心模块

### 状态、主循环与渲染

`main.js` 维护 `loading → guided idle → running → result/error` 主状态，以及独立的 `shop open/closed`、`endless/campaign` 与 `stage 1…53` 子状态；未带参数时固定选择 `endless`，只有显式 `?mode=campaign` 才进入主线，避免关卡目标截断默认排行榜跑分。`rabbit-world.js` 维护 `play → gameOver/levelComplete → readyToReplay` 场景状态。页面打开后立即通过动态 `import()` 下载场景模块并调用异步 `createRabbitWorld()`；当前 GLB、球面、灯光与障碍创建完成且 renderer 实际完成一帧后，`onReady` 显示场景并暂停玩法，等待第一次真实操作。

渲染循环沿用原作公式：球面每帧旋转 `delta × 0.03 × speed`，距离累加 `delta × speed`。主线狼以 `monsterAcceleration=0.0011` 追随目标位置，无尽模式为 `0.004`；速度每 3 秒增加 2、上限 48。主线每帧同时检查目标时长与任务胡萝卜，二者都完成后触发 `levelComplete`。页面隐藏、可见比例低于 25% 或角色商店打开时，同时暂停逻辑更新和 GSAP global timeline；恢复时丢弃暂停期间的 delta。

### 角色资产与动作

`npm run sync:characters` 读取 `_lowpoly_lab/assets/ASSETS.json`，动态筛选 `categories[*].kind === "character"`，复制正式 GLB/sprite，并生成带真实名称、footprint、rig 节点和 `category/id` 的 inventory 快照。`character-roster.js` 以该快照为需求真源，产品排序只把已批准的 11 个垂直切片角色放在前部；`import.meta.glob` 只负责把清单文件转为构建 URL，不承担库存发现。原作兔子继续使用程序化 `Hero`，其余 52 名角色使用正式 GLB。`portable-glb-loader.js` 解析 GLB 2.0 JSON/BIN、节点层级、TRS、材质、交错 accessor 与索引，构建旧版 Three `BufferGeometry`，避免为了 GLTFLoader 引入第二套 Three runtime。

`ImportedHero` 加载后用 `Box3` 同时限制高度 27、宽度 22、深度 22 个世界单位，按模型底面落地并保留命名 rig。`rig_legL / rig_legR / rig_armL / rig_armR` 的初始 position/rotation/scale 分别缓存为 rest pose；每帧动作只叠加在各自 rest pose 上。`MOTION_BY_CHARACTER` 穷举 52 个共享身份并映射到 30 种动作语义，构建时同时检查 missing 与 extra，不存在通用 fallback。每名角色覆盖 run、jump anticipation、land recovery、hit recoil 与 caught pose；无四肢 rig 的幽灵和动物使用显式 root motion。动物类统一应用 `facingYaw = π` 校正库模型前向轴，保证青蛙等角色的脸而非背面朝向观众。

### 屏幕适配与输入

Three.js renderer 跟随 `.vr-world` 的 ResizeObserver。产品竖屏相机 z=205，baseline 保持 z=160；产品模式移除原作 5% 的前景树分支，避免树干覆盖核心动作，背景树、薄雾与球面仍使用原作代码。Guest Shell 存在时通过 `body:has(#alteru-guest-banner)` 把 HUD 再下移 72 px。

跳跃和重试使用 Pointer Events；Space/ArrowUp 跳跃、Enter 重试。Material `touch_app` ghost finger 在首帧后循环演示按压；第一次真实轻触会在同一帧移除引导、恢复世界更新、解锁 Web Audio 并执行 `world.jump()`，不会由教程替玩家自动操作。

### 碰撞、反馈与音频

胡萝卜半径 20，触发原作 20 个方块粒子、把狼推远并立即把 1 根胡萝卜写入永久钱包；刺猬半径 10，飞出并拉近狼。主线失败不回滚已拾取胡萝卜；通关立即把当关试用角色加入已解锁 roster。主线程触控确认不依赖网络。Web Audio 在首次用户手势后创建，分别合成起跳、奖励、撞击、关卡完成与购买/解锁音；音频失败不阻塞游戏。`prefers-reduced-motion` 关闭撞击闪屏并缩小角色根弹跳与倾斜。

### 身份、多语言与平台

`?user_name=` 只用于调试覆盖；AlterU 内通过 canonical `callAigramAPI()` 获取 `data.name`，旧 `data.user_name` 仅兼容；平台外使用 `AlterU`。用户名只进入无尽结算排版，不把源码作者当玩家。`_qa/platform-harness.html` 返回不同源、无 `Access-Control-Allow-Origin` 的头像 URL 与长用户名；由于本效果不是图像驱动，不读取或替换头像，断言 `data-identity-source="player"`。

中英文所有用户可见文案由 `t()` 映射；`localStorage.game_locale` 可强制 `zh/en`。

### 进度、商店与云同步

本地镜像 `valorous_rabbit_cast_v1` 是运行期唯一可变真源，字段为 `stage / wallet / unlocked / selected / _lastActive`。拾取、购买、装备和过关先同步写入 localStorage；AlterU 内再以 1 秒 debounce 调用 `/note/aigram/ai/game/save/data`。首次加载通过 `/note/aigram/ai/game/get/data/list` 读取自己的记录，只在云端 `_lastActive` 更新时替换本地镜像，避免连续操作用一次性旧快照覆盖刚写入的角色。

商店使用 2 列可滚动 DOM 网格显示 53 张角色卡，卡片采用 `click`，不在触摸滚动起点触发购买；sprite 使用 lazy loading。原作勇兔没有外部 sprite，因此 `rabbit-portrait.html` 以 `portraitMode` 启动同一个 `createRabbitWorld()`，只创建 Hero 与灯光，并把透明 renderer 的 512×512 实际输出保存为 `original-rabbit.png`；商店卡和左上当前角色入口共同引用该构建资源。重绘卡片前后保存并恢复 `scrollTop`，所以在长列表底部购买不会跳回顶部。当前关角色显示“本关试用”，通关直接解锁；也可提前按 60/120/220/360/560 五档价格购买。模式入口从第 1 局起始终可见：默认无尽使用 `selected` 角色，显式主线继续固定使用当关试用角色；从主线返回无尽时删除 `mode` 参数，确保正常入口仍是无尽。

### 排行榜与跨用户交互

排行榜拆分为两个独立能力：`canViewLeaderboard` 只要求 AlterU 身份、Telegram ID、游戏 UUID 且非 baseline，因此主线第 1 关也可通过右上皇冠读取 `/note/aigram/ai/game/rank/score/list/by/session_id`；`canRank` 额外要求当前为无尽模式，只有它能调用 `/note/aigram/ai/game/rank/score/save` 提交整数距离，主线关卡不会污染全局距离排名。打开完整榜单时设置 `leaderboardOpen` 并接入统一暂停合同，关闭后恢复追逐。无尽结算继续保留紧凑冠军入口；完整榜单显示名次、头像、截断后的用户名和距离。自己的行不显示头像，只显示强调色“你 / YOU”；其他玩家行使用 `click` 触发 `openAigramProfile(user_id)`，榜单滚动容器使用 `touch-action: pan-y`。`?leaderboard=1` 可用于直接打开榜单的调试与验收。

每轮首次操作或重试前，从已成功加载的榜单快照当前玩家旧最佳成绩。提交刷新后，仅当新距离高于旧最佳时，从 `(旧最佳, 新距离)` 区间里选分数最高且非自己的一个玩家，通过 `/note/aigram/ai/game/record/play` 发送一次 `score_beat` 通知。榜单尚未成功加载时跳过该轮通知，避免把未知旧最佳误判为 0。平台外不请求榜单，主动打开入口时显示 AlterU 下载提示。

## 4. 扩展点

- 同步共享角色库：运行 `npm run sync:characters`，再补齐 `src/character-roster.js` 的显式动作映射与朝向规则；必须通过 `validate-consumer.mjs --all-characters`。
- 调整关卡时长、任务数量、产品排序、价格或动作 profile：修改 `src/character-roster.js`。
- 调整追逐速度、球面半径、碰撞距离、角色尺寸带和狼位置：修改 `src/rabbit-world.js`。
- 更换触控闭环、角色商店、解锁规则、结算内容、身份文案和音频：修改 `src/main.js`。
- 调整颜色、相机安全区、窄屏布局和动效：修改 `src/style.css` 与 `doc/visual.md`。
- 替换 3D 模型：共享角色保持 `<category>__<id>` 身份、正式 inventory GLB 与命名 rig；升级 Three.js 前先把原作程序化 Geometry 迁移到 BufferGeometry，再删除 `portable-glb-loader.js`。
- 修改排行榜字段、冠军入口、资料点击或 `score_beat` 通知：修改 `src/main.js` 的 leaderboard state、`submitRunScore()` 与 `sendBeatNotify()`；视觉规则位于 `src/style.css` 的 `.vr-champion` / `.vr-leaderboard`。
- 发布元数据：`meta.json`、`public/poster.png`、`games/games.json` 和 `games/posters/valorous-rabbit.png`。

### 独立 Skill 判断

当前结论为 **one-off composition，不创建独立 Skill**。值得记录的机制是“旋转球面代替平移世界”的径向跑酷构图，但本实现仍把球面、角色 Geometry、障碍角度、追逐状态和 GSAP 时序耦合在单一上游模块中，且只有一个真实游戏消费者。现在抽成 Skill 会把兔子、狼与旧 Three.js 合同一起打包，违反效果 Skill 只描述算法和最小接口的要求。

若未来完成以下三项，可重新评估 `spherical-runner-field` 候选：迁移到现代 BufferGeometry；提取 `radius/speed/spawnAngle/cameraBand` 最小接口；在第二个真实游戏中通过 390×844 与 320×568 验证。当前知识保留在本文件和上游快照，不把研究候选登记为已可用能力。
