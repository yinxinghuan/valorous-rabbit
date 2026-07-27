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

## 最终评分

| 类别 | 分数 | 结论 |
|---|---:|---|
| Hierarchy | 5 | 兔子与即将到达的道具为第一焦点，UI 明显退后。 |
| Coherence | 5 | 引导直接叠在真实低多边形场景内，游戏与结算沿用同一薄荷/砖红系统。 |
| Readability | 4 | 长用户名、双语、Guest Shell 与窄屏均可读。 |
| Game feel | 4 | 首次输入同帧恢复世界并跳跃，幽灵手不替玩家操作；粒子、声音与触觉分级明确。 |
| Asset quality | 4 | 原作模型可识别；海报与运行画面同属低多边形世界。 |
| Responsive UX | 4 | 390×844、320×568 无横向溢出或不可达控件。 |
| Polish | 4 | 首帧握手、错误态、重试、减少动态和暂停合同完整。 |

平均分 4.29；无 P0/P1 遗留项。
