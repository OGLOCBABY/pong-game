# Research — Metal Slug 2 Mission 2 / Monument of Depression

> 日期：2026-10-09。阶段：**Research 完成；未开始新一轮实现、运行测试或视觉验收**。目标仓库仅限 `OGLOCBABY/pong-game`。
>
> 审计基线：`main@1bcb7163f9a5af12376e644d54866accfdcdbeda`；既有游戏原型 `feature/ruins-of-second-sun@9b0e55b6ca7abf634048de6d9e9637e3ac5a625a`。本文及相邻 `plan.md` 在独立文档分支 `docs/monument-mission2-audit-20261009` 上修订，**不会在本阶段合并或修改游戏源码**。
>
> 术语：**核实** = 来源或已读取代码明确支持；**推定** = 需参考完整游玩视频逐段验证；**设计建议** = 尚待批注，并非原作事实。

## 0. 核心结论

1. **不是从零开始。** 本仓库已有一个功能分支包含 `metal-slug-2/` 原型（独立 HTML/Canvas 游戏、确定性引擎、原创 Canvas 美术、合成音效和 Node 测试）。应审阅并迭代此分支，而不是覆盖根目录 Pong 或复制另一套引擎。
2. **原型不等于原关。** 目前世界按单一 X 坐标推进，镜头只有水平跟随；原版 Mission 2 最显著的后半段是多层平台与**纵向滚屏爬升**。现有 `Slug` 仅是枪械拾取，不是可驾驶的 Slugnoid；Boss 模式和木乃伊状态也需重做。
3. **验收存在断口。** 分支包声明 `npm run smoke`，但缺少它调用的 `tests/browser-smoke.mjs`；Python 验证脚本用固定 `/usr/bin/chromium` 路径和临时拼接的内联 JS，不能替代真实网页 ES Module 的跨浏览器回归。
4. **版权边界。** 尽可能还原地图逻辑、机制、速度感、镜头、敌人组合与节奏；素材默认使用原创绘制/有明示许可的素材，**不导入无授权 SNK ROM、sprite rip、录音、原版配乐或商标**。即使是无偿公开仓库也不自动取得这些资产的使用权。
5. **现有 Pong 是硬约束。** `main` 的首页、引擎、UI、测试和发布路径必须保留且运行正常；第二关作为独立 `/metal-slug-2/index.html` 入口。

## 1. 仓库审计与证据

### 1.1 目录与分支

| 项目 | 已核实的状态 | 影响 |
| --- | --- | --- |
| `main` | 完整 STRIKELINE Pong，根目录 `index.html` / `styles.css` / `src/*.js` / `tests/*.mjs` | 不可替换首页或侵入 Pong 引擎 |
| Pong 引擎 | `src/engine.js` 导出 `WIDTH, HEIGHT, WIN_SCORE, MAX_SCORE, DIFFICULTIES, clamp, reflectY, PongGame`；纯物理，`step(dt)` 单位为秒 | 后续必须保持接口和行为不变 |
| Pong 浏览器契约 | `window.__STRIKELINE_DIAGNOSTICS__.snapshot()`；键盘/指针/触屏/手柄；已有 Chromium/Firefox/WebKit 测试 | 不得破坏可观察性和脚本路径 |
| 根质量工作流 | `.github/workflows/quality.yml`：运行 `npm test`、`npm run smoke` | 当前**没有**覆盖第二关测试 |
| 根 Pages 工作流 | `.github/workflows/pages.yml` 仅复制 `index.html`、`styles.css`、`favicon.svg`、`src/*.js` | 当前**不会发布** `metal-slug-2/` |
| 第二关原型 | `feature/ruins-of-second-sun` 比 `main` 多两次提交；新增文件全部在 `metal-slug-2/` | 应在原型基础上工作 |
| 第二关运行入口 | `metal-slug-2/index.html` → `main.js` → `engine.js` / `art.js` / `audio.js` | 可独立静态服务，依赖相对路径 |
| 第二关引擎 | `RuinsGame`、960×540、`FIXED_DT=1/120`、种子、事件、碰撞、生命/武器/Boss | 可保留主循环外部契约，内部重构 |
| 第二关测试 | `tests/engine.test.mjs` 具有多个 Node 测试（含输入驱动完整通关）；还有 `tests/browser-visual.py` | **阅读到代码**不意味着本轮已经执行或通过 |
| 项目状态 | `metal-slug-2/plan.md` 原写“Implementation pending”，但源码和测试已经存在 | 必须纠正状态台账 |
| 发布状态 | 当前 GitHub Repo API 报 `has_pages: true`；曾有成功的 Pages workflow | 是否有可玩的公网第二关 URL **尚未实测** |

根仓库质量历史：[STRIKELINE quality run #37814781401](https://github.com/OGLOCBABY/pong-game/actions/runs/37814781401)；已有第二关功能分支：[feature/ruins-of-second-sun](https://github.com/OGLOCBABY/pong-game/tree/feature/ruins-of-second-sun/metal-slug-2)。本轮未运行本地 Node、浏览器或性能基准；保留原有 `qa.md` 的历史记录，但不挪作新游戏合格证据。

### 1.2 已有原型的实测范围：静态审读，不等于运行验证

- `metal-slug-2/engine.js`：`WORLD_END=6640`、`BOSS_START=5480`；`actAt(x)` 四段阈值：1650 / 3480 / 5480。`camera` 为**一个数值（水平 X）**，平台顶面多数落在 278–387 的屏幕 Y 上，地面为 456；没有 y 方向追踪世界、竖直出口锁、塔层攀登或纵向追击镜头。
- 敌人出生表包括 rifle/mummy/bat/turret/spawner；掉落包含 heavy/spread/antidote/pow/gem/slug。已有场景以原生 Canvas 实现：沙漠、狮身人面像、古墓、柱廊、木乃伊、机械 Boss 和粒子，不依赖外部图片。
- `collect('slug')` 设置 `player.weapon='slug'` / 弹药 240 / 补血；它**不产生乘坐状态、载具移动、载具血量、两门 Vulcan 或向下重炮**。
- 木乃伊攻击调用 `damagePlayer(1,'curse')`，设置 `curse=7.5` 秒，计时自动减少；感染期间再次诅咒被忽略，与原作二次感染致死机制不一致。
- Boss 在 x=6100 一带、y≈335 以水平同屏枪战进行，HP 58，阈值改变射击频率、扇形弹。原作大 Boss 在纵向路段后从下方接近，横向战台、可击落飞弹、闪电球、冲锋和重型炮等决定战斗布局（细节必须按版本录像复核）。
- `sweptHit(a,b)` 仅在**子步终点**计算圆形弹丸与 AABB 的最近点，并未使用前一点 (px,py) 的线段/TOI；名字虽含 swept，快速弹丸仍有穿透隐患。
- `tests/engine.test.mjs` 中自动通关循环持续 `{right:true, fire:true, grenade:..., jump:...}`；证明某个脚本在特定种子、规则下可达到 `won`，**不证明原关路线、操作手感、难度或 Boss 躲避机制正确**。
- `metal-slug-2/package.json` 把 `smoke` 指向不存在的 `tests/browser-smoke.mjs`，`browser-visual.py` 硬编码 Chromium 可执行路径且拼接 JS，未通过静态服务加载实际模块路径。
- 根流程无第二关关卡门控和 Pages 打包。当前分支的最终 Git 树中**没有追踪 ROM/原版 sprites/audio 文件**；但名为 “Install original arcade sources” 的历史 Actions 运行不构成任何素材授权证明，后续要做来源审计。

## 2. 原作 Mission 2 的关卡剖面

目标必须锁定 **Metal Slug 2（1998）原版 Mission 2**，而不是将 Metal Slug X 的昼景、变更敌人/速度等差异混入。SNK 的历史介绍和 1998 游玩指南支持这一识别；对未经逐帧验证的帧数、精准距离和每个隐藏战俘坐标，不伪称测量完成。

| 顺序 | 原作体验 / 主要遭遇 | 核心玩法及忠实度验收 |
| --- | --- | --- |
| A. 夜间沙漠入口 | 暮夜中的埃及沙丘、狮身人面像/遗迹、士兵、碎石/木箱、发掘者/矿工、救战俘和秘密奖分 | 起始就可自由移动、上/下瞄准、卧倒和开火；打出前景碎片、撞击效果、秘密点 |
| B. 金字塔入口与下行 | 发掘区域、通道/坡道、蝙蝠、初次木乃伊与毒气、武器/解毒、石材火把 | 环境与战斗逐步变暗，敌种有识别度；木乃伊感染既影响角色外观又影响性能 |
| C. 棺木/祭室 | 墓内木乃伊、生成源（棺/门）、战俘、宝石与探索秘密、障碍/陷阱 | 关卡不是随机无限生成；伏击、火力配置和恢复资源应构成可重复体验 |
| D. 塔楼垂直攀登 | 狭窄平台、上升镜头、交错立足点、更多木乃伊、雕像秘密与物品 | **实质纵向世界坐标与纵向滚屏**；无绕开所有平台的水平捷径；落下和重试规则稳定 |
| E. Slugnoid 出场与载具战 | 可驾驶的跳跃式机甲，双机关炮及朝下攻击，塔顶狭窄平台 | 进入/离开载具明确；操作手感、武器方向、受击反馈与战斗地形相互配合 |
| F. Aeshi Nero / Iron Claw | 机械 Boss 从下方切入；飞弹/能量弹、冲锋及重炮，大量可阅读的攻击前摇 | 能纯靠可见前摇学习并规避；有真实受击窗口；打败 Boss 才算关卡通关，之后胜利与分数面板 |

**来源与置信度**：
- 一手开发者访谈明确指出第二关设计了**纵向滚屏**，Slugnoid 的悬浮能力被移除以保留重复跳跃的要求，并讨论了多人纵向镜头设计难点：[Metal Slug 2 developer interview](https://shmuplations.com/metalslug2/)。
- 1998 游戏路线指南对沙漠、木乃伊、解毒、隐藏宝物、垂直攀登、Slugnoid 和 Iron Claw 的描述：[GameFAQs Metal Slug 2 Guide](https://gamefaqs.gamespot.com/arcade/564313-metal-slug-2/faqs/174)。
- 关卡与 Boss 命名：[Monument of Depression — Metal Slug Wiki](https://metalslug.fandom.com/wiki/Monument_of_Depression)（粉丝维护，细节需交叉验证）。
- SNK 游戏历程：[METAL SLUG 30th Anniversary History](https://www.snk-corp.co.jp/us/anniversary/metalslug30th/history/)。
- 录像复核基准：[Metal Slug 2 full playthrough（第二关约 03:55 起）](https://www.youtube.com/watch?v=t3Jqo1OBqh8&t=235s)。视频可作为镜头/节奏/地形目测比较，不可直接截取并重新发布为游戏资产。

**未完成的原作实测**：尚未对整关录像进行逐段时间轴、坐标、攻击帧、掉落数、死亡重生、双人屏幕行为的结构化标定；上述是**文献与代码层面研究**，在实施前期须将观察清单补成录像证据和时间戳。不能据此宣称已经做到帧级还原。

## 3. 原型与目标差距矩阵

| 项 | 现状证据 | 目标 / 未完成工作 | 等级 |
| --- | --- | --- | --- |
| 关卡空间 | `camera` 单数字、`FLOOR=456`、4 个 X 区间 | 真 2D 场景拓扑、上下层/洞窟、屏幕纵向跟随 | P0 |
| 关卡进度 | 单向持续右移即可触发 Boss | 有意设计的进入/下行/攀爬门槛，不可跳过路径 | P0 |
| Slugnoid | 一类提升枪械属性的拾取 | 独立载具实体、上下驾驶、双枪/向下炮、受击与爆炸 | P0 |
| Boss | 固定 x≈6100、右侧单屏瞄准枪战 | Aeshi Nero 从下接近、多模式、前摇、阶段与位置互动 | P0 |
| 僵尸诅咒 | 7.5 秒自动痊愈，再中毒无效 | 持续到解药/明确恢复，重复感染致死规则 | P1 |
| 玩家死亡 | 3 HP×3 lives | 街机原版的受伤/一击死亡规则作为可选忠实模式，难度可配置 | P1 |
| 枪械/瞄准 | 高射速枪 + 重炮/散弹，只有基本上向射击 | 站立、蹲射、跳射、向上/空中向下、近战、投掷弹道与节奏 | P1 |
| 敌人/生成 | rifle/mummy/bat/spawner/turret | 明确敌人状态机、生成器条件、视野和投射物判定 | P1 |
| 美术 | 过程式矢量/像素混合，场景变化已可见 | 高密度逐帧姿态、精确视觉轮廓、多层背景、场景差异与爆炸反馈 | P1 |
| 弹道 | `sweptHit` 名不符实 | 线段 vs 扩大 AABB 最早撞击时间/子步受限 | P1 |
| 相机/死亡 | X 轴摄像机、三个存档点 | 纵向视差、限制滚回、掉落处理、重生位置无软锁 | P0 |
| 浏览器 QA | npm smoke 缺文件；Python 仅内联拼接 | 真 URL + ES 模块 Playwright，三大浏览器、桌面/触屏截图 | P0 |
| CI / 部署 | 根 CI 只测 Pong，Pages 只复制 Pong | 双游戏门控、兼容旧首页、Pages 拷贝第二关静态产物 | P0 |
| 测量与评分 | 只有静态审查、本地参考测试代码 | 原版基准 + 可复现的输入视频/日志 + 主客观门槛 | P0 |

P0 = 未闭合不可声称“完整第二关”；P1 = 影响忠实度与 10/10 质量水平。现有实现不评“0分”，但**不能据现有静态证据评级 10/10**。

## 4. 技术与版权评估

### 保留 / 可复用

- 零生产依赖的 HTML、CSS、Canvas 2D、原生 ES modules；本仓库已经有可用的工程模板。
- `RuinsGame` 有界确定性时间步、输入、事件与快照；`ArtDirector` 的原创建筑绘制和粒子；`SoundDeck` 的浏览器合成音色。
- 960×540 逻辑视窗可保留，世界需要升级为 2D 坐标图，而非简单增加 X 长度。
- 复用现有 Playwright 工具链；优先在已有 `metal-slug-2/` 下扩展测试。

### 不引入的东西

- 未授权 ROM/反编译代码、SNK sprites/音效/音乐、未经证实许可的网络图片包；不因“能下载”就认为可合法再发布。
- CDN、遥测、账号、支付系统、游戏内交易、在线多人/服务端同步、额外重型框架（除非有针对性能/可测性的具体证据推翻）。
- 仅增加“Boss HP 条 / 更多怪 / 特效数”来代替关卡结构真实性。

### 可选开放素材（须按文件核实）

- [Kenney 官方 FAQ（部分官方资源 CC0）](https://kenney.nl/support) 可作为非原作材质候选；每次采集记录**作品名、具体版本、原始 URL、许可文本、修改说明和 SHA-256**，否则不合入。
- 默认更适合直接手绘原创低色深纹理/可证实的程序生成图像；这样不会让新游戏视觉语言和原版像素复制混为一谈。
- 静态像素效果：Canvas `imageSmoothingEnabled=false` 与整数像素缩放（[MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled)）。

## 5. 风险与研究验证待办（均不等于已执行）

- [x] 审计 `main` 及现有游戏源码、测试与 Pages/CI 发布脚本。
- [x] 发现并阅读 `feature/ruins-of-second-sun` 完整目录与核心源码。
- [x] 交叉核对关卡身份、原作流程、纵向滚屏与 Slugnoid/Boss 特征。
- [x] 确认实现方向：沿用原型，但在地图与 Boss 上做结构性改造。
- [ ] 逐段标注**原版 Metal Slug 2（非 X）**录像时间戳、行动类型、敌人/战俘/拾取、垂直路段镜头和 boss 模式。
- [ ] 核实录像与文献中的重生、二次木乃伊感染、载具炮台/倒射控制、Boss 弹道、伤害数值；将“推定”升级为“核实”。
- [ ] 建立所有将导入仓库的艺术/声音资产清单及许可核对；不允许无来源 sprite rip。
- [ ] 量测目标设备（桌面宽屏、320–390 px 手机、低性能端）绘图帧时和输入延迟。
- [ ] 实机脚本化游玩：覆盖每个场景、Boss、失误/重试、暂停/焦点、触屏，记录截图和控制台日志。
- [ ] 单独验证根 Pong 回归、双游戏 Pages 分发、GitHub Actions 门控实际执行结果。

下一步详见同目录 [plan.md](plan.md)：**等待用户逐项批注和阶段批准后才进入 Implementation**。


## 6. R2 深入审阅 / 跨来源校验补充（2026-10-09）

审阅方式：逐一读取 `main` 与原型分支的完整 Git tree、原型 `engine.js`/`main.js`/`art.js`/`audio.js`、原型的测试入口和 Python 浏览器脚本、根 Pong 引擎与测试、根质量/Pages workflow；复核 GitHub Actions 的**具体 steps**，不单凭 run conclusion 绿灯。

### 6.1 权威等级与录像时间轴

| 证据 | 核实事实 | 信度 / 限制 |
| --- | --- | --- |
| [SNK 30 周年官方历史](https://www.snk-corp.co.jp/us/anniversary/metalslug30th/history/) | 1998 年二代扩展角色、载具和木乃伊转换机制 | 一级，一般规则，非逐帧 |
| [1998 开发者访谈](https://shmuplations.com/metalslug2/) | Mission 2 纵向滚屏是刻意设计；Slugnoid 不支持连续按跳悬浮，必须跳跃攀升 | 一级访谈翻译，准确度高 |
| [1998 原版关卡历史性攻略](https://www.arcade-history.com/game/1614/metal-slug-2-super-vehicle-001/ii-model-ngm-241) | Mission 2 包括狮身人面像眼睛、炸药桶、矿工、金字塔斜坡、解毒剂、Rumi 等秘密 | 二级文字攻略，奖励数值需复测 |
| [Metal Slug Wiki: Monument of Depression](https://metalslug.fandom.com/wiki/Monument_of_Depression) | 1998 原作夜间开场，X 版白昼开场；敌人包含 Arabian Infantry/bats/mummies/generator，载具 Slugnoid | 社群百科，不作为帧数依据 |
| [Metal Slug Wiki: Aeshi Nero](https://metalslug.fandom.com/wiki/Aeshi_Nero) | 巨型钻掘蛇机从塔下出现；飞弹/电球/紫色光炮/上冲伤害 | 社群百科 + 应以视频复核攻势触发 |
| [Metal Slug 2 玩法背景](https://metalslug.fandom.com/wiki/Metal_Slug_2:_Super_Vehicle-001/II) | Slugnoid 双 Vulcan、朝下主炮，受伤损失炮台；木乃伊二次毒命中致死，解毒剂解除 | 社群资料，需在录像上取典型画面 |
| [LongplayArchive（Neo Geo CD）](https://www.youtube.com/watch?v=FY4XlenEtog) | 视频**描述**标注 Mission 2 04:48 开始、Aeshi Nero 09:47、Mission 3 10:31 | 视频时长标记已核对；具体场景分界和输入帧 **NOT_VERIFIED** |
| [MobyGames MVS / Neo Geo 截图](https://www.mobygames.com/game/16852/metal-slug-2-super-vehicle-001ii/screenshots/) | 墓室、木乃伊形态、原始画面密度与 UI 样式的参考 | 图像仅作比较，不能下载成发布资产 |

**重要修正**：上版 `research.md` 使用的“第二关约 03:55”视频参考仅是另一个候选录像，缺乏核对；正式参考采用上表明确标注时间轴的长视频，**04:48–10:31 只是公开视频描述中可确认的 Mission 2/Boss 时段，绝非逐帧校准结果**。又因 Neo Geo CD 与 MVS 可能在加载/帧率方面有差异，精确输入判定必须标识平台并做容忍区间。

**原作核心路线核对的优先级**：夜沙漠 → 狮身人面像眼睛隐藏奖励/战俘 → 士兵把守的 Danger 炸药桶入口 → 金字塔斜坡、矿工、木乃伊和棺/门生成源、解毒 → 多层塔与纵向爬升 → Slugnoid → 竖向 Aeshi Nero 争夺高处。S0–S5 的代号只是**工程分镜，不是宣称原版恰有六区**；从录像验证的事件优先于预设段数。

### 6.2 GitHub Pages/CI 状态的交叉验证

- 现行仓库元数据 `has_pages: true`（纠正旧 Pong 文档的 `has_pages: false`；那是旧快照）。
- [Pages run 37818224792](https://github.com/OGLOCBABY/pong-game/actions/runs/37818224792) 的真实 steps：“Check out only this repository”、“Assemble dependency-free static site”、“Upload only runtime site files”、“Deploy”均执行为 success；日志给出 environment URL `https://oglocbaby.github.io/pong-game/`。
- [Pong quality run 37814781401](https://github.com/OGLOCBABY/pong-game/actions/runs/37814781401) 的日志列出 21/21 Node tests 与 Chromium/Firefox/WebKit smoke 成功；这是**旧 Pong 的历史证据**。
- [Pages run 37815110012](https://github.com/OGLOCBABY/pong-game/actions/runs/37815110012) 虽显示 run success，但内部 checkout/build/deploy 均 skipped；证明**不能仅用 workflow_run.conclusion 判定实际已发布**。
- 当前 `pages.yml` 仅同步根 Pong 的静态资源，**不含** `metal-slug-2/`；当前 `quality.yml` 未运行第二关测试。
- 当前 `workflow_dispatch` 分支允许即使前置质量流程未过仍运行 deploy；下一阶段必须加同步测试 gate 或禁止发布。成功部署工作流必须验证 **JS/CSS 请求成功+浏览器真实可玩**。
- 外部网页工具目前未能读取 Pages 实际站点，**因此不能称已完成公网访问测试**；后续在 CI 通过 `curl` 和 Playwright 打开公网 URL 检查。任何访问失败都须记录错误类型，而不是假称 404 或成功。

### 6.3 严格代码审计发现的新风险

| 代码事实 | 风险与可验证修复 |
| --- | --- |
| 原型 `sweptHit` 实际只判断终点；弹丸有 `px,py` 但未用于 swept | 写线段-AABB 进入时间和方向测试，高速弹丸、边界掠过、两敌遮挡至少各一个 fixture |
| `player.health=3` 且 `lives=3`（普通受击未即死） | 将 Practice 和 Faithful 伤害模型隔离，不用这种保血默认去伪称原版难度 |
| 当前 `player.curse=7.5` 秒自动减至 0，再中毒无死亡逻辑 | 真正 mummified 状态直到解毒；二次有效中毒致死、首次感染和 invulnerability 次序用单测验证 |
| `camera` 只是一个浮点 X；`WORLD_END` 大水平场景，塔平台 Y 全在一个屏高内 | 新场景必须有 >= 2 屏高可探索区，有真实相机 y 变化、纵向下落/上爬/相机死区 |
| Boss 只用 HP 阈值/向左子弹扇射且角色仅在右侧平台对攻 | 必须竖向开战，飞弹、电球、范围光炮和从下方冲锋，敌弹可躲、部分可摧毁，效果基于载具状态 |
| Slug pickup 改 `weapon` 不改 player shape/vehicle | 载具需要单独碰撞体、运动/跳跃、耐久、炮台损坏、乘坐退出/重生逻辑 |
| 持续按右+射击 + 若干跳跃的固定输入 bot 完整胜利 | 不能作为忠实度证明；必须测“只右走”无法绕过塔与 Boss，必须证明输入经过真实路由 |
| 原型 `package.json` 的 `smoke` 指向不存在的 `tests/browser-smoke.mjs` | 必须补真正 HTTP/ESM 版 Playwright 脚本并装入根 CI；旧 Python 脚本的本地 Chrome 路径不具可移植性 |
| 根 Pages 构建固定 copy 列表 | 部署第二关时必须维护完整清单、正确嵌套路径、白名单和静态资源审计 |
| 现有技术路线偏原创 Canvas，而用户要求“尽可能忠实” | 关键差距不是简单增加粒子；严格以路线/相机/手感/载具和 Boss 为前置验收 |

### 6.4 研究阶段判定

- **研究证据覆盖：PASS_WITH_LIMITATIONS** —— 已审计所有本轮新增文档及工程原型，识别全部主要 P0/P1 和素材/发布风险；引用分级、时间轴和不确定性如上。
- **原版逐帧拆图/输入帧采样：NOT_RUN** —— 当前参考资源有版权且公开视频无法证明源代码级帧匹配，作为实现对照任务，不是伪造“已复现”的条件。
- **第二关新运行时测试：NOT_RUN** —— 在代码未改阶段没有新通过证明。
- **下一 Gate 判定**：只要 Planning 将每项缺口映射到文件、实装步骤、失败判定、证据和回滚动作，且得到本次用户预授权覆盖，便可进入工程实施；“研究覆盖”并非“功能已闭合”。
