# 技术文档

## 1. 技术栈

- Vite 6 + 原生 JavaScript/TypeScript，`base: './'`，构建输出 `dist/`。
- Three.js 0.80.1 WebGL 渲染，保留上游 Geometry API、FlatShading、球面跑道与低多边形角色结构。
- GSAP 3.15，通过本地 `TweenMax` 兼容薄层复用原作的时序与 easing 调用。
- CSS 响应式 UI、本地 Creepster v13 WOFF2 距离字形、Pointer Events、Web Audio API 合成反馈、IntersectionObserver/Visibility API 生命周期管理。
- Aigram canonical bridge：`src/shared/runtime/bridge.ts`；当前用户资料通过 `/note/telegram/user/get/info/by/telegram_id` 获取。
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
src/main.js                        # i18n、状态/UI、触控、身份、音频、暂停与首帧握手
src/rabbit-world.js                # 上游 Three.js 场景、角色、碰撞、追逐与渲染循环
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

`main.js` 维护 `loading → guided idle → running → result/error` UI 状态；`rabbit-world.js` 维护上游 `play → gameOver → readyToReplay` 场景状态。页面打开后立即通过动态 `import()` 下载 Three.js/GSAP 场景并调用 `createRabbitWorld()`；所需角色、球面、灯光与障碍创建完成且 renderer 实际完成一帧后，`onReady` 显示场景并暂停玩法，等待第一次真实操作。

渲染循环沿用原作公式：球面每帧旋转 `delta × 0.03 × speed`，距离累加 `delta × speed`，狼以 `monsterAcceleration=0.004` 追随目标位置。页面隐藏或可见比例低于 25% 时同时暂停 RAF 更新和 GSAP global timeline；恢复时丢弃暂停期间的 delta。

### 屏幕适配与输入

Three.js renderer 跟随 `.vr-world` 的 ResizeObserver。产品竖屏相机 z=205，baseline 保持 z=160；产品模式移除原作 5% 的前景树分支，避免树干覆盖核心动作，背景树、薄雾与球面仍使用原作代码。Guest Shell 存在时通过 `body:has(#alteru-guest-banner)` 把 HUD 再下移 72 px。

跳跃和重试使用 Pointer Events；Space/ArrowUp 跳跃、Enter 重试。Material `touch_app` ghost finger 在首帧后循环演示按压；第一次真实轻触会在同一帧移除引导、恢复世界更新、解锁 Web Audio 并执行 `world.jump()`，不会由教程替玩家自动操作。

### 碰撞、反馈与音频

胡萝卜半径 20，触发原作 20 个方块粒子并推远狼；刺猬半径 10，飞出并拉近狼。主线程触控确认不依赖网络。Web Audio 在首次用户手势后创建，场景加载本身不请求音频权限；分别合成起跳、奖励、撞击、结算音，音频失败不阻塞游戏。`prefers-reduced-motion` 关闭撞击闪屏并把奖励粒子降到 5 个。

### 身份、多语言与平台

`?user_name=` 只用于调试覆盖；AlterU 内通过 canonical `callAigramAPI()` 获取 `data.name`，旧 `data.user_name` 仅兼容；平台外使用 `AlterU`。用户名只进入结算排版，不把源码作者当玩家。`_qa/platform-harness.html` 返回不同源、无 `Access-Control-Allow-Origin` 的头像 URL 与长用户名；由于本效果不是图像驱动，不读取或替换头像，断言 `data-identity-source="player"`。

中英文所有用户可见文案由 `t()` 映射；`localStorage.game_locale` 可强制 `zh/en`。

## 4. 扩展点

- 调整追逐速度、球面半径、碰撞距离和狼位置：修改 `src/rabbit-world.js` 顶部常量。
- 更换触控闭环、结算内容、身份文案和音频：修改 `src/main.js`。
- 调整颜色、相机安全区、窄屏布局和动效：修改 `src/style.css` 与 `doc/visual.md`。
- 替换 3D 模型：保持 Hero/Monster/Carrot/Hedgehog/Fir 构造器边界；升级 Three.js 前先把顶点编辑迁移到 BufferGeometry。
- 增加存档、排行榜或事件：只有在出现可比较的长期指标时从 `@shared/runtime` 接入；当前视觉玩具不上传分数。
- 发布元数据：`meta.json`、`public/poster.png`、`games/games.json` 和 `games/posters/valorous-rabbit.png`。

### 独立 Skill 判断

当前结论为 **one-off composition，不创建独立 Skill**。值得记录的机制是“旋转球面代替平移世界”的径向跑酷构图，但本实现仍把球面、角色 Geometry、障碍角度、追逐状态和 GSAP 时序耦合在单一上游模块中，且只有一个真实游戏消费者。现在抽成 Skill 会把兔子、狼与旧 Three.js 合同一起打包，违反效果 Skill 只描述算法和最小接口的要求。

若未来完成以下三项，可重新评估 `spherical-runner-field` 候选：迁移到现代 BufferGeometry；提取 `radius/speed/spawnAngle/cameraBand` 最小接口；在第二个真实游戏中通过 390×844 与 320×568 验证。当前知识保留在本文件和上游快照，不把研究候选登记为已可用能力。
