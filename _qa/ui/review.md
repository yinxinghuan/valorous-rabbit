# 视觉 QA 报告

## 证据矩阵

| 状态 | 390×844 | 320×568 |
|---|---|---|
| 原作参考 | `../reference/original-390x844.png` | — |
| 旧唤醒入口（已删除） | `recheck-wake-390x844.png` | `first-pass-wake-320x568.png` |
| 直接入场引导 | `direct-entry-guide-390x844.png` | `direct-entry-guide-320x568.png` |
| 首次轻触后运行 | `direct-entry-running-390x844.png` | `direct-entry-running-320x568.png` |
| 上一版距离字形（已替换） | `direct-entry-guide-display-type-390x844.png`、`direct-entry-running-display-type-390x844.png` | — |
| Creepster 距离字形 | `direct-entry-guide-creepster-390x844.png`、`direct-entry-running-creepster-390x844.png` | — |
| 游戏首轮 | `first-pass-gameplay-390x844.png` | `first-pass-gameplay-320x568.png` |
| 游戏复验 | `recheck-gameplay-safe-hud-390x844.png` | `first-pass-gameplay-320x568.png` |
| 结算首轮 | — | `first-pass-result-320x568.png` |
| 结算复验 | — | `recheck-result-320x568.png` |
| 排行榜版透明结算 | `leaderboard-result-390x844.png` | `leaderboard-result-320x568.png` |
| 完整排行榜（长用户名/本人/他人） | `leaderboard-overlay-390x844.png` | — |
| 角色商店购买后 | `cast-shop-purchased-390x844.png` | `cast-shop-purchased-320x568.png` |
| 七类角色运行 | `cast-people__kid-390x844.png`、`cast-monsters__zombie-390x844.png`、`cast-monsters__werewolf-390x844.png`、`cast-monsters__ghost-390x844.png`、`cast-mechs__combatMech-390x844.png`、`cast-animals__frog-recheck-390x844.png`、`cast-animals__duck-390x844.png` | — |
| 七类动作四帧矩阵 | `cast-motion-sheet-390x844.png` | — |
| 关卡完成 | `cast-stage-complete-390x844.png` | `cast-stage-complete-final-320x568.png` |
| 下一角色入场 | `cast-next-granny-390x844.png` | — |
| 狼咬角色定格 | `cast-caught-people__kid-recheck-390x844.png`、`cast-caught-animals__frog-final-390x844.png` | — |
| 全量 52 角色运行轮播 | `full-roster-contact-390x844.png`、`full-roster/*.png` | — |
| 极端比例与材质 | — | `full-mobile-archetypes__punk-320x568.png`、`full-mobile-mechs__combatMech-320x568.png`、`full-mobile-mythic__minotaur-320x568.png`、`full-mobile-animals__fox-320x568.png`、`full-mobile-animals__frog-320x568.png`、`full-mobile-monsters__ghost-320x568.png` |
| 完整 53 卡商店底部 | `full-shop-bottom-390x844.png` | `full-shop-top-320x568.png`、`full-shop-bottom-320x568.png` |
| 精修角色入口 | `refined-hud-390x844.png` | `refined-hud-320x568.png` |
| 精修商店顶部/底部 | `refined-shop-top-390x844.png`、`refined-shop-bottom-390x844.png` | `refined-shop-top-320x568.png`、`refined-shop-bottom-320x568.png` |
| 第 53 关主线完成 | `final-campaign-clear-390x844.png` | — |
| 本地基线 | `../reference/local-baseline-1200x800.png` | — |

## 首轮发现与修复

1. **P1 / 游戏画面 / 前景树遮挡主体**：原作 5% 的前景树分支在窄视野里会产生巨型黑色树干，遮住兔子与狼。产品模式保留背景树公式但不生成该前景分支；baseline 不变。复验中兔子、胡萝卜/刺猬和狼边缘都可读。
2. **P1 / HUD / Guest Shell 覆盖距离**：远程 Guest Shell 使游戏内容视觉坐标上移约 72 px，距离与静音按钮被横幅遮挡。通过稳定 marker `#alteru-guest-banner` 下移 HUD；390 和 320 复验均清楚。
3. **P2 / 结算 / 静音图标压到长用户名**：结算时隐藏 HUD、ghost finger 与静音按钮，长英文名可在 320 px 内换行。
4. **P2 / 结算 / 署名落在深色狼身上**：署名链接改为深砖红底白字的小型可聚焦标签，仍保持 44 px 触控高度。

## 直接入场改版复验

1. **P1 / 入口 / 独立启动页遮住真实场景**：删除标题、静态兔狼剪影和开始按钮；页面打开即加载 WebGL，首个可交互帧直接显示兔子与球面原野。
2. **P1 / 首次操作 / 自动教程替玩家跳跃**：改为暂停中的真实场景与循环幽灵手；教程不再调用 `jump()`。第一次真实轻触同帧隐藏引导、恢复世界并起跳。
3. **P1 / 暂停合同 / 可见性监听提前恢复世界**：首触前的暂停状态并入统一 `updatePauseState()`，等待 1.4 秒后 390×844 与 320×568 的距离均保持为 0。
4. **P2 / 引导辨识度**：幽灵手改为 54 px Material `touch_app`，增加白色光晕、按压缩放与扩散环；文字保留双语且不拦截画布操作。
5. **P2 / HUD / 距离数字过于普通**：常规 Arial Narrow 与过渡版 Impact 都未达到目标，最终与《Get Off My Grave》一致改用本地打包的 Creepster，并保留 2 px 淡桃硬边错位。
6. **P2 / HUD / 字体加载与双位数**：确认 `document.fonts.check()` 返回 Creepster 已加载；`0` 与双位数 `12` 均在 390×844 实际运行画面复验，未与静音按钮重叠。

## 排行榜与结算精修复验

1. **方向修正 / 结算 / 实体成绩牌遮挡追上定格**：否决实体成绩牌方案，恢复透明开放式纵向排版；仅精修 Creepster 距离、窄体信息文字、淡桃主按钮和紧凑冠军入口。390×844 与 320×568 中狼咬兔子的构图仍完整可见。
2. **P0 / 输入 / 隐藏排行榜遮罩截获首触**：作者层 `display:grid` 覆盖了浏览器 `[hidden]` 默认样式；补充 `.vr-leaderboard[hidden]{display:none}` 后，首触恢复世界并起跳。
3. **P2 / 榜单 / 本人仍显示头像**：本人行移除头像，只保留强调色“你 / YOU”；其他玩家继续显示真实头像或首字母回退。
4. **P2 / 长用户名与资料点击**：冠军条和完整榜单都使用 `min-width:0` + ellipsis；模拟三名平台数据验证榜单行等宽，点击第三名只发出一次 `AW.PROFILE.OPEN`。
5. **状态覆盖**：平台内加载、成功、空榜、失败文案均不阻塞重试；平台外入口不请求 rank API，显示 AlterU CTA。

## 角色主线与商店垂直切片复验

1. **P1 / 角色尺寸 / 青蛙压过狼与场景**：初版仅按模型高度缩放，扁宽动物在透视相机中显得巨大。改为 `Box3` 同时限制高度 27、宽度 22、深度 22 个世界单位；青蛙复验后与兔子处在同一视觉带。
2. **P1 / 被捕定格 / 导入角色直立卡在狼嘴边**：缓存角色缩放后的视觉中心，被捕时先以中心归零，再旋转约 83° 并移入 `heroHolder`。孩子和青蛙复验均呈现被横向叼住，结算文字与按钮没有遮挡咬住的主体。
3. **P1 / 动作同质化 / GLB 看起来像移动模型**：首发 11 个共享角色全部显式绑定 motion profile；孩子快步、僵尸前倾不对称、狼人低身、幽灵漂浮、机甲重踏、青蛙压缩弹跳、鸭子摇摆的四帧矩阵剪影可区分。无命名四肢 rig 的角色也使用显式 root motion，不存在人形 fallback。
4. **P1 / 进度 / 主线成绩污染排行榜**：排行榜保存、读取与冠军入口只在第 3 关开放的无尽模式启用；主线结算使用关卡秒数和任务胡萝卜，不提交距离。
5. **P2 / 商店 / 购买与滚动冲突**：两列角色卡使用 `click`，滚动区 `touch-action: pan-y`。390×844 的 `scrollHeight/clientHeight` 为 `904/616`，320×568 为 `796/394`，两种尺寸 `scrollWidth` 都等于 viewport；购买孩子后钱包从 150 正确降至 90。
6. **P2 / 小屏结算 / 秒数显示成米且署名压住角色**：关卡完成改用独立 `s/秒` 单位；短屏结果整体上移到 4% 安全区。320×568 最终按钮为 240×50，署名位于按钮下方，无横向溢出。
7. **剩余角色运行审计**：老奶奶、牛头人、鸡和消防员分别加载、启动并运行 900 ms；四项均有 390×844 canvas、无错误态、无 console/page error、body 宽度等于 viewport。
8. **无尽入口审计**：模拟第 3 关进度后，商店显示“无尽追逐”；切换后 URL 为 `mode=endless`、HUD 为距离、任务行为空，且 390 px 无横向溢出。

## 全量角色扩展复验

1. **P1 / 青蛙朝向 / 背面朝向观众**：导入模型的前向轴与原作人形轴不同，初版青蛙只显示背部。角色合同增加显式 `facingYaw`，全部 11 个动物统一校正 `π`；复验中青蛙双眼、猪鼻、鸡喙、鸭喙与其他物种识别特征均朝向观众。
2. **P1 / 全量完整性 / 仅接入垂直切片**：同步工具从实时 inventory 动态筛选所有角色；consumer absence audit 报告 `expectedCharacters 52 / presentCharacters 52 / missing 0 / extra 0 / problems 0`。
3. **P1 / 动作配置缺口 / 新角色回退通用步态**：52 个共享 `category/id` 全部进入穷举动作映射，构建同时检查 missing 与 extra。人物、老人、重装、职业角色、六种怪物、机甲、神话角色与动物分别进入 30 种动作语义；漏配会直接阻断构建。
4. **P1 / 全量运行 / 只验证静态 sprite**：逐个启动 52 个真实 WebGL 场景并各运行 1.05 秒；得到 52 个唯一身份、52 张运行截图、0 console/page error、0 canvas 失败、0 横向溢出。
5. **P1 / 极端体型与材质 / 窄屏裁切风险**：在 320×568 复验最高 punk、宽体机甲、深体牛头人、最长狐狸、最矮青蛙与透明幽灵；六项 canvas 正常、错误态隐藏、`body.scrollWidth === 320`。
6. **P2 / 长商店 / 底部购买后跳回顶部**：53 张卡把 320×568 的网格拉到 `scrollHeight 3568`。重绘前后保存 `scrollTop`；在底部购买鸭子后余额 `999 → 879`、状态变为 Owned，并保持 `scrollTop 3226`。
7. **P2 / 长商店 / 完整性与响应式**：320×568 显示 53 张唯一角色卡、52 张正式 sprite 加 1 个程序化勇兔标记；网格宽 `298/298`、body 宽 `320/320`。390×844 底部可达且 body 宽 `390/390`。
8. **关卡边界**：第 12 关完成后保存 stage 13 并切换 HUD；第 53 关显示 Campaign clear、解锁 Bear，重跑保持第 53 关。两条路径均无应用错误。

## 角色商店与入口精修复验

1. **P1 / 勇兔缩略图 / 手绘标记与原角色不一致**：删除独立 SVG 兔子标记；用 `rabbit-world.js` 的同一个程序化 Hero、材质与灯光直接生成 512×512 RGBA 缩略图。首张卡与当前角色入口均读取 `original-rabbit.png`，实测自然尺寸 `512×512`。
2. **P2 / 商店入口 / 图标与余额彼此游离**：左上入口改为当前角色真实缩略图、切换徽标和附属胡萝卜余额组成的档案 dock；390×844 与 320×568 均保持完整 44 px 以上触控目标，未与距离 HUD 重叠。
3. **P2 / 商店 / 通用网页卡片感**：面板改为暖纸登记册，卡片增加关卡编号、薄荷展台、切角与实体边框；标题、53 位逃亡者、余额、关闭和模式切换形成稳定层级，未使用玻璃模糊或 Emoji。
4. **长列表与响应式**：两种尺寸均显示 53 张卡；模式说明精修后，390×844 网格 `scrollHeight/clientHeight = 4497/543`，320×568 为 `3957/329`，底部可达；两者页面横向溢出均为 0。底部购买 Bear 后余额 `820 → 260`、状态变为 Equipped，两种尺寸的 `scrollTop` 分别保持 `3954` 与 `3628`。卡片仍使用 `click`，列表保持 `touch-action: pan-y`。
5. **P2 / 模式入口 / 无意义折角被误认为粗糙图标**：移除薄荷渐变折角，改为一笔略有错位的双线手绘路线、起点、终点旗和排行榜皇冠。按钮同时写出“模式切换”、目标模式与结果；主线状态明确显示“进入距离排行榜”，无尽状态明确显示“继续逐关解锁角色”。320×568 中图形、三层文字和箭头均未裁切。

## 最终评分

| 类别 | 分数 | 结论 |
|---|---:|---|
| Hierarchy | 5 | 当前角色与即将到达的道具为第一焦点，UI 明显退后。 |
| Coherence | 5 | 原作兔子与共享角色处在同一薄荷低多边形世界，商店和结算沿用同一砖红系统。 |
| Readability | 4 | 长用户名、双语、Guest Shell 与窄屏均可读。 |
| Game feel | 4 | 首次输入同帧恢复世界并跳跃；52 个共享角色有穷举动作语义与跑、跳、落地、受击和被捕状态。 |
| Asset quality | 4 | 52 个正式 GLB 保留材质、比例、朝向和 rig；角色剪影清楚，但程序化兔子仍是细节质量上限。 |
| Responsive UX | 4 | 390×844、320×568 无横向溢出或不可达控件。 |
| Polish | 4 | 首帧握手、错误态、重试、减少动态和暂停合同完整。 |

平均分 4.29；原作勇兔与共享库全部 52 名角色均进入产品 roster，无 P0/P1 遗留项。
