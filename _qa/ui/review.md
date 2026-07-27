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

## 最终评分

| 类别 | 分数 | 结论 |
|---|---:|---|
| Hierarchy | 5 | 当前角色与即将到达的道具为第一焦点，UI 明显退后。 |
| Coherence | 5 | 原作兔子与共享角色处在同一薄荷低多边形世界，商店和结算沿用同一砖红系统。 |
| Readability | 4 | 长用户名、双语、Guest Shell 与窄屏均可读。 |
| Game feel | 4 | 首次输入同帧恢复世界并跳跃；11 个共享角色有显式跑、跳、落地、受击和被捕动作。 |
| Asset quality | 4 | 11 个正式 GLB 保留材质、比例和 rig；角色剪影清楚，但程序化兔子仍是细节质量上限。 |
| Responsive UX | 4 | 390×844、320×568 无横向溢出或不可达控件。 |
| Polish | 4 | 首帧握手、错误态、重试、减少动态和暂停合同完整。 |

平均分 4.29；12 角色首发切片无 P0/P1 遗留项。共享库其余 41 名角色尚未进入产品 roster，必须逐个补齐动作 profile 后再扩展。
