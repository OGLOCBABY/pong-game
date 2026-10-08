# Plan — Metal Slug 2 Mission 2 / Monument of Depression

> 状态：**R1 已完成逐行审阅；R2 方案闭合核对中**。当前版本记录预授权：只有当各阶段入口的执行路径与验证证据全部覆盖时，用户授权自动进入实施；**此文档仍不代表代码或发布已经通过测试**。
>
> 研究依据：[research.md](research.md)。
> 原型来源：`feature/ruins-of-second-sun@9b0e55b6ca7abf634048de6d9e9637e3ac5a625a`。
> 文档审阅分支：`docs/monument-mission2-audit-20261009`，基础是上述原型分支。计划评审后在**同一个**原型功能分支实施，未经同意不合并 `main`，不破坏 Pong。
>
> 交付物目标：**从现有 RUINS OF THE SECOND SUN 原型进化为《合金弹头2》（1998）第二关的高忠实度、可从开局打到胜利的完整浏览器关卡**。保留玩法、结构和节奏层面的还原；原版音乐、sprite、ROM 仅在明确授权后使用，否则由原创表现替代。绝不把“10/10”作为自我宣称而非验收结果。

## 1. 阶段门控

| Gate | 内容 | 状态 | 进入下一关条件 |
| --- | --- | --- | --- |
| A Research | 仓库/原型静态审查，关卡文献交叉核对，缺陷矩阵 | **已完成** | [research.md](research.md) 可追溯 |
| B Planning + Annotation | 精确架构、保护契约、优先级、分步 checklist、用户批注与修订 | **本轮完成首稿，等待批注** | 用户明确批准计划和范围 |
| C Implementation | 分步代码修改、真实浏览器游玩、迭代评分和提交 | **NOT_STARTED** | Gate B 批准；先复核分支最新 SHA |
| D Acceptance | 原版对照、全路线可玩、无 P0、回归/发布证据、评分 | **NOT_STARTED** | 各项证据公开，未闭合项如实列出 |

**阶段授权规则（2026-10-09 用户修订）**：Gate B 由逐项交叉审阅＋完整执行/验收方案闭合判定自动获批，无需二次口头确认；在 Gate B 正式盖章前不得改代码。发布本身只能在真实 CI/Pages/公网可玩门槛通过后认定完成。

## 2. 不可触碰的接口与外部副作用

1. **严格工作边界**：所有变动仅 `OGLOCBABY/pong-game`；不读取/更改其他仓库、个人文件、外部项目、私密连接或密钥。不运行用户未批准的外部平台发布动作。
2. **Pong 原样保留**：根 `index.html` / `styles.css` / `src/engine.js` / `src/main.js` / `src/audio.js`、根 `tests/*`、根 `package.json` 的现有脚本与已发布入口和 `window.__STRIKELINE_DIAGNOSTICS__.snapshot()` 均为不变式。`PongGame` 公开构造器、方法、坐标/得分、AI 以及事件契约不能悄然更改。
3. **第二关稳定入口**：`/metal-slug-2/index.html` 静态 HTML 和相对资源路径、`main.js` ES module、`ArtDirector(canvas).render(game,dt)`、`SoundDeck.play(event)`、DOM 上已有游戏按钮及 HUD ID。可以扩充，不得无兼容方案地移除。
4. **第二关公共引擎**：保留 `export class RuinsGame`、`WIDTH=960`、`HEIGHT=540`、`FIXED_DT=1/120` 和 `new RuinsGame({seed})`、`start()`、`reset()`、`togglePause()`、`setInput(partial)`、`step(dt seconds)`、`snapshot()`。既有 input 名称 `left/right/up/down/jump/fire/grenade` 保留；新增字段可扩展。
5. **状态与旧测试**：`phase` 仍具 `ready, playing, paused, won, lost`；`player`、`boss`、`events`、`score` 等供 UI 和测试查询。需要把 `camera` 从 number 升级为对象 `{x,y}` 时，须**同一个可回滚提交**同步适配渲染器和断言；先新增兼容快照或迁移断言，不允许中间出现不可玩的无兼容半成品。`WORLD_END` / `BOSS_START` 和 `actAt` 当前仅代表旧 X 门槛，必须以版本化关卡进度语义取代，不作为未来兼容标准。
6. **无未授权内容**：不可提交 SNK 原版图片、Sprite rip、SFX、配乐、游戏程序、ROM 或有不明授权的素材；没有书面许可则以独立原创画面复现机制。不得把 SNK 标志当项目商标。
7. **无静默破坏**：每次 PR 比较文件清单，仅在同仓库；不 force push `main`、不合并未经确认的 PR、不删除 Pong，不改他人设置，Pages 不由本计划擅自启停。

## 3. 目标关卡的可执行设计合同

### 3.1 场景图而非无限跑酷

不要直接沿用 `actAt(player.x)` 判进度。建议固定 authored scene graph：

| Scene ID | 入口/出口与方向 | 必须体现的环境/遭遇 | 可验收证据 |
| --- | --- | --- | --- |
| S0 DESERT | 夜沙漠，右行，雕像与发掘工地 | 入口士兵、障碍/爆炸、狮身人面像秘密、POW | 开局截图 + 输入通关 |
| S1 DESCENT | 金字塔口，下行/坡面/内层转场 | 矿工与蝙蝠、火光变暗、首次木乃伊/毒雾 | 镜头迁移截图 + 毒雾录像 |
| S2 TOMB | 地下横纵混合房间，棺木/门 | 木乃伊生成器、可救 POW、解毒、宝物 | 生成器上限/拾取断言 |
| S3 ASCENT | **多层跳台，沿 Y 升高的路线** | 场景高度超过一屏，塔内机关、隐藏点、失足/重试 | 摄像机 `y` 变化、不能靠纯右移到顶 |
| S4 SLUGNOID | 接近塔顶，载具专门战斗区 | Slugnoid 可乘坐、双武器、受击、路面平台匹配 | 进入/驾驶/退出/炮台断言 |
| S5 AESHI_NERO | 垂直终点 + 地形战台 | Boss 从下方进入，多攻击模式、预警、核心窗口 | Boss 全攻势视频 + 击败才赢 |

各场景必须有：`id`、世界坐标 bounds、入口触发/出口门槛、平台/碰撞体、刷新表、背景层、出口状态、复活位置、音乐氛围事件（原创）、验收截图定位。用**固定场景数据**，禁止仅用随机 x 阈值刷怪制造关卡相似性。

**逻辑路径约束**：无 Debug 权限的一名普通玩家，必须实际完成 S0→S1→S2→S3→S4→S5。仅持住“右+射击”不可跳过攀登路线。每段都能从可验证 checkpoint 继续；未能走完所有 scene 不得声称整关通关。

### 3.2 物理、控制与相机

保留当前稳定的**120 Hz 固定时间步 + 渲染插值**；浏览器后台暂停、恢复清积累时间、步数上限，绝不因掉帧增加运动距离。引擎不读取 DOM、时间、音频、网络。

采用按比例归一化的世界坐标 `(x,y)`，Y 向下；关卡支持负世界 Y（高塔），相机双轴限制、垂直死区/区间锁和横向视差。举例：

```js
const FIXED_DT = 1 / 120;
const { x: cameraX, y: cameraY } = game.camera;
const screenPoint = ({ x, y }) => ({ x: x - cameraX, y: y - cameraY });
while (accumulator >= FIXED_DT && substeps < MAX_SUBSTEPS) {
  for (const event of game.step(FIXED_DT)) dispatch(event);
  accumulator -= FIXED_DT;
  substeps++;
}
```

- 玩家状态：速度、加速度/减速、方向、贴地、行走/卧倒/跳跃/空中朝下射击、瞄准方向、近战、生命/无敌帧、木乃伊转换、武器/弹药、投弹、载具。
- 输入：`A/D` 或左右方向移动；`W/↑` 上射；`S/↓` 蹲/向下；`Space` 跳；`J/Z` 连射；`K/X` 投弹；`P/Escape` 暂停；`R` 重试；`M` 静音。交互按键焦点检查，不抢夺输入框/按钮的原生行为。
- 手机：方向/瞄准、射击、跳跃、手雷至少支持多指**同步长按**，并有按下/释放/取消/失焦的完整 reset；窄屏横竖屏文字可读，默认提示横屏但不禁用竖屏。
- 需要明确三种模式：**Faithful Arcade**（尽量接近 1998 受伤规则，一击阵亡、有限 lives/continue）；**Practice**（可容错并选择 checkpoint）；**Automated QA**（外部输入可复现但无不可见游戏特权）。默认难度由用户批注决定，见 §8。
- 不能在默认玩家体验里给 Boss 额外隐藏血量、自动送胜利或后台“跳关”，也不能为了通过机器人测试放宽攻击命中。

### 3.3 子系统、敌人与物品

| 系统 | 需要实装的规则与验收 |
| --- | --- |
| 碰撞 | 实体 vs 地形 AABB/多段线；弹丸采用线段连续碰撞或 TOI earliest hit，命中多个目标只消耗一次；投弹抛物线/爆炸半径/遮挡关系有明确规则 |
| Rifle/miner/bat/mummy | 有独立感知、移速、射击/扑袭前摇、受击与死亡帧；敌种设计需与 1998 原关观测矩阵一一对应 |
| Mummy generator | 有实际可破坏源、有限/节律刷怪和视觉反馈；死亡后不再生成；保证 CPU/内存有界 |
| Mummy transformation | 毒雾命中角色外形/速度/武器状态变化，**维持到解药/明确规则恢复**；二次感染按原版规则死亡；转换与重生可单测 |
| Weapons | Pistol/H/Shotgun/可确认的原关装备 + grenades；弹药上限、正面/向上/空中朝下/近战有效性与音画同步 |
| POW/treasure | POW 解救后存在可见动作、计分与奖励；拾取后不可再取；秘密不应要求猜测无限小像素 |
| Slugnoid | `vehicle={mounted,hp,x,y,weaponState}`，进入/退出真实触发；双 Vulcan+下射主炮、跳台移动、击毁后角色回到普通状态 |
| Checkpoints | 分场景重生，不穿地、不进敌人实体、不掉出相机；命中反馈与无敌帧符合难度合同 |
| Events | `{type,x,y,...}` 只发状态变化，防重复播放音效与判分；辅助 HUD 和诊断通过快照读取 |

**不依赖第三方整关“ROM 回放”来决定物理**：原始 ROM/街机画面只作观察证据；模拟器代码、原始引擎不复制到本仓库。

### 3.4 Aeshi Nero 的可检验 Boss 战

- 状态机候选：`dormant → enter-from-below → track → telegraph → rocket-volley/lightning-orb → recovery → close-charge/heavy-plasma → repeat → destroyed`。
- 攻击全部带**视觉可见的前摇与规避窗口**；弹幕存在位置/时间模式，而非纯随机散射；相机与两侧落脚平台协同；进入 Boss 竞技场后避免软锁且允许合理命中核心。
- 第一阶段建立动作语言，后续改变攻击组合与频率而非抹去预警；被破坏的部件、爆炸画面、战斗结束镜头和成绩板必须可单独验证。
- 以原版录像确定最终攻击名称、次数、时间窗；以上是**候选**状态机，非声称逐帧还原。

## 4. 视觉、音频与性能设计

- **视觉目标**：16-bit 原版美术可读性和流畅的枪战动画、厚重古墓空间感与多层 parallax。沿用已有 `art.js` 原创雕像/沙漠/洞穴方向，但拆分环境、sprites、effects 与 scene 层；以可重复采样的 2D 手绘/程序画面构建关键帧，纹理对比须经过截图审查。
- 精细状态动画：角色 idle/run/jump/crouch/fire/up-fire/curse/death/vehicle、木乃伊步态/吐息/死亡、蝙蝠扇动、火光、投弹/爆炸、地形震动、Boss 分解与受击可辨识。统一锚点、包围盒、帧率，避免人物穿插地形。
- **不直接嵌入视频截图、原版 HUD、原版标题、音乐文件**。原创、授权素材清单录入 `metal-slug-2/ASSET_PROVENANCE.md`（仅获批准后）。
- Web Audio 可根据帧事件播放原创 synth/采样（有许可才引用）；静音时不唤醒 AudioContext；浏览器手势解锁与失焦处理；声音可独立禁用。
- 渲染：独立逻辑尺寸 960×540，按 DPR 与容器适配，像素风使用最近邻缩放；UI DOM 层负责计分与可访问提示，粒子数上限、可配置弱效、用户 `prefers-reduced-motion`。
- 性能门槛：目标桌面稳定 60 FPS、输入不丢、卡帧不上演“快进”；以**实际浏览器采样**公布 1% slow frames / frame-time p95 / 最大场景实体数量，不能在无测量条件下认定达到目标。

## 5. 变更文件与小步提交设计

| 文件 | 拟操作 | 原因 |
| --- | --- | --- |
| `metal-slug-2/engine.js` | 内部重构，保留主导出/输入/相位 API | 物理、状态机、纵向空间、载具、Boss |
| `metal-slug-2/level.js`（新增） | 新增数据模块 | 6 个手工场景、spawns、平台、checkpoint、触发 |
| `metal-slug-2/art.js` | 模块化、增加原创动画 | 双轴摄像机、地形与高帧率 poses |
| `metal-slug-2/main.js` | 适配新引擎，增强控件/诊断 | 防崩溃状态、纵向相机、输入与观测 |
| `metal-slug-2/audio.js` | 视测试结论小改 | 音画分层、解锁/静音 |
| `metal-slug-2/index.html` / `style.css` | 增量修改 | 关卡 HUD、控制提示、移动端 |
| `metal-slug-2/tests/*.mjs` | 修正旧场景断言，新增专项测试 | 反回归 + 质量硬门槛 |
| `metal-slug-2/tests/browser-smoke.mjs`（新增） | Playwright 真浏览器 | 修复 `package.json` 缺失 smoke 入口 |
| `metal-slug-2/tests/browser-visual.py` | 删除或降级辅助脚本（须记录理由） | 不再把拼接内联 JS 当实际线上运行证据 |
| `metal-slug-2/qa.md`（新增） | 测试证据与自评 | 未测、失败与修复历史真实记账 |
| `metal-slug-2/ASSET_PROVENANCE.md`（新增） | 可审计素材来源 | 著作权边界和许可证 |
| `.github/workflows/quality.yml` | **仅追加**第二关检测 | Pong 旧 QA 完整保留 |
| `.github/workflows/pages.yml` | **仅追加** `metal-slug-2/` 静态拷贝 | 旧 Pong 仍然作为首页公开 |
| 根 `README.md`（可选） | 增加第二关链接，待批注 | 用户是否想保留单一 Pong 首页 |

**回滚单位**：每个 PR/提交保持应用可运行；如新地图系统路线错误，回滚整个引入提交而非继续补救错误模型。禁止 force push、删除或混淆根 Pong 的测试。第二关所有独立文件置于 `metal-slug-2/`。

## 6. Implementation granular checklist（全部尚未执行）

### C0 — 冻结范围 / 先取得用户批准

- [ ] 审阅本计划 §8 批注，记录哪些约束被接受/否决。
- [ ] 完成用户授权的 R1/R2 审阅与批注覆盖，记录自动批准判定，无需等待另一条口头指令。
- [ ] 抓取功能分支最新 SHA 和文件 diff；若比研究基线新增提交，先审查冲突，不盲覆。
- [ ] 记录当前 Pong CI 基线，并做第二关旧测试基线，**真实跑一次**；标记不通过项。
- [ ] 记录原版 MS2 Mission 2 录像逐段时间戳/敌人/视频帧观测索引，避免混入 MSX 变更版。
- [ ] 对候选第三方素材按授权/出处逐一过门，未经授权绝不下载或提交入库。

### C1 — 核心架构与关卡路径（P0）

- [ ] 将 `level.js` 中的场景/平台/入口/出口/刷怪信息定稿并做 schema 检查。
- [ ] 将摄像机升级为双轴对象 `{x,y}`，同步引擎、渲染、快照、测试；一次性可回滚。
- [ ] 实装竖直攀爬段：没有跳跃与平台导航无法抵达顶层，镜头沿 Y 实际移动。
- [ ] 实装世界/场景边界、门触发、路线上锁、掉落重试、无软锁检查。
- [ ] 替换 `actAt(x)` 式的剧情推进，保留只读阶段标题接口或提供明确兼容适配。
- [ ] Playwright 基准记录 S0/S1/S2/S3/S4/S5 到达状态，每段有唯一 screenshot anchor。

### C2 — 武器与精确碰撞（P1）

- [ ] 分离 player movement、hitbox、combat 和输入响应，确定追踪 frame step 不影响不同 FPS。
- [ ] 加入 crouch、近战、向上/空中向下射击、跑射/跳射姿态与重生表现。
- [ ] 连续/扫掠弹丸碰撞和反穿透断言（超高速、狭窄目标、超大 dt）。
- [ ] 手雷轨迹、爆炸/连锁伤害/冲击反馈的完整事件与测试。
- [ ] 原作拟合武器伤害/弹速/连发/弹药上限，标注模拟估计和录像证据。
- [ ] Faithful Arcade / Practice 难度逻辑明确并对分数通关判定一致。

### C3 — 木乃伊与敌群（P1）

- [ ] 分敌种状态机：步行士兵、矿工、蝙蝠、木乃伊、生成源等。
- [ ] 木乃伊感染动作/移速/禁止部分装备/恢复药/二次感染死亡全部测试。
- [ ] 生成源数量/事件时序/上限限制/可破坏性，不允许无限堆积造成冻结。
- [ ] 隐藏点与 POW 计分、拾取、不会重复、恢复/重开正确性。
- [ ] 敌人投射物可预警、避让，不允许在关卡加载第 1 帧重叠造成必死。

### C4 — Slugnoid + Boss（P0）

- [ ] 制作真正 Slugnoid 实体（可驾驶、跳跃、损伤、进出）、分离步兵与载具武器状态。
- [ ] 双 Vulcan 与向下主炮：射击方向、频率、范围、视效及触屏输入有测试。
- [ ] Boss 从下进入，核心位置/地形平台/镜头锁定符合可玩路线。
- [ ] 飞弹、闪电球、冲锋与重炮至少各一种可分辨攻击模式、预警和恢复窗口。
- [ ] Boss 多阶段/打断/爆炸/唯一胜利条件/重试复现、无人机连续游戏测试。
- [ ] 在 Faithful 模式下无载具亦可用合理操作完成，或明确记录必要载具条件。

### C5 — 画面、声音、UI 与无障碍（P1）

- [ ] 原创场景细节/纹理/视差；关键角色和敌人帧序列全姿态绘制。
- [ ] 命中停顿、弹壳、爆炸、屏幕震动、暗室灯光统一事件路径。
- [ ] UI 弹药、血量、分数、战俘、关卡、Boss 状态与 `snapshot` 一致；对变化及时可访问播报。
- [ ] 音频原创与 mute/autoplay/焦点/低端设备测试。
- [ ] 320、390、768、1440 宽度和手机横屏截图；有效触控区域、双指/多指稳定。
- [ ] Reduced motion、可键盘操控菜单、可见聚焦、axe 自动审计。

### C6 — Playthrough、压力测试、CI 和发布（P0）

- [ ] 新建真实 Playwright `browser-smoke.mjs`，使用静态 HTTP 加载原样 ES modules；不拼接 JS 以假装生产环境。
- [ ] Node 检查：种子可重复、120 Hz/60 Hz 等价近似、坐标非 NaN、有界实体、无弹丸穿透。
- [ ] **操作驱动**机器人从 S0 到 S5 真通关，不得直接赋值 `player.x` / `boss.hp` 或调用 `damageBoss` 来模拟通关。
- [ ] 至少测试“完全不射击”“只右行”“低血/丢载具”“关卡边界”“半途死亡”“boss 能打但会死”等反例。
- [ ] 真实 Chromium 桌面+触屏完成 start/fire/jump/crouch/vehicle/pause/restart/boss/lose/win；Firefox/WebKit 核心路径。
- [ ] 截图/录像：封面、夜沙漠、金字塔、棺室、竖塔、Slugnoid、Boss 全攻击、胜利与失败状态；人工逐张比对参考录像。
- [ ] 控制台错误、外部网络请求、响应式布局与高 DPI 验证，性能测量留档。
- [ ] 根 Pong 原有 `npm test` 与 `npm run smoke` 保持绿灯；新增第二关 `test` + `smoke`。
- [ ] CI 中串联两套门控且失败即阻止 Pages 发布；Pages 静态上传同时包含 Pong 首页和 `metal-slug-2/`（仅版本库内资源）。
- [ ] 任何实际 Pages URL 用浏览器打开回归，不因 GitHub 报“部署成功”就推断资源路径正确。
- [ ] 撰写 `metal-slug-2/qa.md`：全部执行命令/退出码/浏览器版本/截图/失败与风险/版本。
- [ ] 独立检查文件清单：不得触碰其他仓库；Pong 原文件无意外修改。

### C7 — 质量评分 / 再迭代

- [ ] 第一次完整机器和人工观察后依 §7 给出**有证据分数**；P0 未清除即标记 NOT_READY。
- [ ] 为每个失分点定位具体 scene/输入/参考录像时间戳/代码问题，按优先级修复。
- [ ] 每轮修改重新跑双游戏回归 + screenshot diff + 操作驱动通关；保留评估历史。
- [ ] “10/10”仅在所有可测门槛、目标场景和关键体验都达成并有可审查第三方/人类评价时使用；否则说明未达标，绝不暗改评分。
- [ ] 提交最终设计、QA、原版对照日志和清单；用户批准后再决定是否合并到 `main`。

## 7. 验收标准与非自我认证评分

**硬门槛（任一失败即不能发布为完整关卡）**：

- A. 从开局经 S0-S5 完整路线可玩、场景可辨、**真纵向爬升**。
- B. Slugnoid 为可操控**载具**；Boss 有可识别分阶段和可躲攻击，无作弊通关。
- C. 普通玩家能在正常速度用键鼠或触屏开始、存档点重试、死去和胜利，没有严重穿模、必死软锁或冻结。
- D. 所有 Node/浏览器测试实际通过，且根 Pong 回归完好；报告实测失败不做“跳过算通过”。
- E. 游戏资产来源可追溯、无未授权原始 ROM/audio/sprite。
- F. 真正发布的 URL 如有则亲自检查；对还没发布的内容不编造网址。
- G. 可实际审阅至少一套从入口到胜利的可复现录像/截图/输入日志。

**综合主观 + 客观评分**（单项 0–10）：

| 维度 | 权重 | 满分需要的证据 |
| --- | ---: | --- |
| 原版任务结构与节奏 | 25% | 双向/纵向路线、场景顺序、载具、Boss、秘密点与原版对照 |
| 操作手感和战斗公平性 | 25% | 真实键鼠/触屏/手柄输入，敌人与弹道平衡，成功/死亡回放 |
| 原创视觉、动画和声音质量 | 20% | 高密度逐帧画面审阅、多场景/角色状态、音画协调 |
| 功能可靠、稳定、无软锁 | 15% | 自动全关与故障注入、三浏览器、原 Pong 零回归 |
| 可访问与移动端操控 | 10% | 多指、布局、设置、焦点及机器审计 |
| 性能、维护性、资源来源 | 5% | 帧时间测量、确定性、接口/文档、许可证清单 |

`overall = 0.25*structure + 0.25*feel + 0.20*presentation + 0.15*reliability + 0.10*accessibility + 0.05*performance`。

**关于 10/10 与“Opus 5.5 水平”**：不能用一个模型自我给分证明胜过其他模型；必须有**相同任务、相同测试与同样人类评审**才可比较。如果没有独立对照，可只提交清晰的质量量表、可复现数据和待测维度，不声称模型实力同级。评分越高，证据必须越强。

## 8. 供用户直接批注的决策点

> 以下仅是**默认建议**，不是自动取得授权。可在文档相应行直接标 `[APPROVE]` / `[CHANGE]` / `[REJECT]` 并写替代方案；修改后重开 Gate B 审核。

**A1 — 地图忠实度**：建议：原版 1998 Metal Slug 2 的环境和遭遇**高相似但原创像素素材**；不承诺逐像素拷贝 SNK 美术。是否接受？  
批注：

**A2 — 现有原型承接**：建议：在现有 `metal-slug-2/` 升级，不新建第二套引擎，不替换 Pong。是否接受？  
批注：

**A3 — 玩家受伤规则**：建议：默认 Faithful Arcade 贴近原版（击中丢一命，有限 continues），另给 Practice 容错/检查点，所有模式的通关证据分开统计。是否接受？  
批注：

**A4 — 双人**：建议：优先将**单人全关、纵向摄像机、载具与 Boss**做完整；本地双人作为下一阶段独立计划，避免双人摄像机迫使首版架构妥协。是否接受？  
批注：

**A5 — 导航入口 / 部署**：建议：根 Pong 为首页，新增 `/metal-slug-2/` 直达入口；根 README 最多新增导航链接；Pages 静态同步双游戏。是否接受？  
批注：

**A6 — 素材授权**：建议：只用原创自制或**逐文件审查 CC0/兼容许可**素材，单独记 `ASSET_PROVENANCE.md`；不使用任何来源不明的 ROM rip。是否接受？  
批注：

**A7 — 视觉基准与交付门槛**：建议：每个 Scene 均保留参考录像时间戳与**原始浏览器截图**、完整输入通关日志；没有人类实际手感复核时满分保持未认证。是否接受？  
批注：

**A8 — 关卡规模与优先级**：建议：以六段**整关可通关**优先，不把资源花在复杂在线系统、角色皮肤与单点像素炫技；P0 > P1；实现路线错误即回滚独立提交。是否接受？  
批注：

---

## 9. 计划之后的执行提示词（待用户批准才可使用）

> 仅在 Gate B 明确批准且审查最新分支 SHA 后使用；此段不是开始实施的指令。

```text
任务：仅在 GitHub OGLOCBABY/pong-game 的 feature/ruins-of-second-sun 分支实现已批准的 metal-slug-2/plan.md，绝不修改其他仓库。
先读 research.md、plan.md 及全部用户 A1–A8 批注；列出当前 Git SHA 和与研究基线的 diff。
保护根 STRIKELINE Pong 的代码、测试、接口及已有可玩入口。逐个执行 C0–C7 checklist，完成一个里程碑即测试、记录 QA 证据并提交小步变更。
先建 2D 关卡/纵向相机，随后实际载具、Boss、精确碰撞、动画/声音。运行输入驱动整关通关和根 Pong 回归。任何架构方向错误回滚单独提交，不在错的方向叠加补丁。
不得导入无明确许可的原版 sprites、音乐、ROM。不得假称跑过浏览器、真实人类试玩或 10/10。
向用户报告每项未闭合的 P0、实际评分和可浏览的 GitHub 证据；不要自行合并 main。
```

**执行状态以本计划最新的 Gate B Closure Record 为准。** 若记录 `APPROVED_FOR_IMPLEMENTATION`，无需另行口头批准；但实际测试和发布门槛绝不可自动假定通过。


## 10. R1 批注裁决记录（全部 A1–A8）

| ID | 原建议 | 裁决 | 强制改动 / 收敛条件 | 批注来源 |
| --- | --- | --- | --- | --- |
| A1 | 高相似的原作关卡、原创视觉 | **APPROVE_WITH_CONDITIONS** | 原版 MS2 / MSX 必须分开，保留夜间开场、炸药桶、矿工、木乃伊、纵塔、Slugnoid、Aeshi Nero；只用自主创作或逐项授权资产 | [PR #2 Review R1](https://github.com/OGLOCBABY/pong-game/pull/2) |
| A2 | 在原型上扩展 | **APPROVE** | 保持相容的 RuinsGame 与 Pong 接口；不可覆盖根首页；提交与回滚以可运行单元为界 | 同上 |
| A3 | Faithful + Practice | **CHANGE → CLOSED_IN_PLAN** | 默认 Faithful 1-hit；Practice 允许有界 HP/关卡检查点；两套统计与 UI 标记，不能把 Practice 成功误报为原版通关 | 同上 |
| A4 | 单人先行，双人延期 | **APPROVE_DEFER** | 单人完整可玩属 P0；不要无端引入联网多人；多人 camera 协议只留演进接口，首发明确“单人” | 同上 |
| A5 | Pong 首页 + /metal-slug-2/ + Pages | **APPROVE_WITH_RELEASE_GATE** | 现有 Pages 工作流继续使用，必须加双游戏构建与不可绕过的质量门槛，发布后的实际 JS/HTML/游戏交互另行验证 | 同上 |
| A6 | 合法素材 | **APPROVE** | 原创或可逐文件审计许可的素材；无 ROM/sprite rip/SNK 音乐；记录来源、版本、hash、是否修改、授权 | 同上 |
| A7 | 证据型 10/10 | **CHANGE → CLOSED_IN_PLAN** | 黑盒浏览器操控、原版参照、画面/音效可审查，真人手感未完成时禁止 10/10 认证 | 同上 |
| A8 | P0 优先，全路线 | **APPROVE** | 先完成真实纵塔/载具/Boss/全关通关/CI Pages；方向性错误 rollback；不做额外联网系统 | 同上 |

**A1–A8 待执行风险均有明确实施清单与退出条件，**不再存在“必须先问用户才能确定的架构决策”。技术细节由具体测试结果迭代，但不得超出已批准合同。

## 11. R2 可执行完整验收规格：需求 → 证据 → 失败修复

各条在实施前属于 `PLAN_COVERED`（有执行路径），**不是 `TEST_PASSED`**。具体数值是本项目自定验收阈值，非声称原作真实帧数据。

| ID | 前置输入 | 必须交付/可观察证据 | PASS 条件 | FAIL 时强制措施 |
| --- | --- | --- | --- | --- |
| G01 Baseline | main、feature SHA、原始代码 & test | 两分支文件清单、保护契约/现有测试结果 | 版本锁定且未越界 | 停止提交、复审 ref |
| G02 Refs | SNK 官方 + 1998 访谈 + 原版夜景录像 | `reference-map.md`（video 04:48–10:31、片段置信度） | 主要六关卡事件与机制均有来源和例证；不强求像素拷贝 | 调整 scene 实施而非发明原版事实 |
| G03 Route | S0–S5，真实二维世界 | `level.js` 全场景状态、进入出口、sceneId 和 progress gates | 从 start→boss 完整通过；“只右走”无法绕过 climb | 更换 scene graph，回滚错误 level commit |
| G04 Camera | 至少 >=1080 px 可攀爬 y 区间 | 自动脚本跟踪 game.camera.y、game.player.worldY 和截图 | 攀爬时 camera.y 变化 >=400 world px，视野不会遗失主角或强迫盲跳 | 修复纵向 deadzone/平台图 |
| G05 Player | Faithful(1-hit) + Practice 可选 | player 步态、普通死亡/复活、iframe、诅咒状态 | 输入一致、不会无敌不死、出生无软锁、分模式证据 | 修正 player FSM，重测 |
| G06 Weapons | 固定 seed / 极端 dt / 复数 hitboxes | 扫掠弹道测试、枪械/炸弹/近战/上射/下射 | 无穿透/多计数/非法子弹存活，手感在帧率变化下稳定 | 重写碰撞 TOI |
| G07 Mummy | 紫毒第一次/第二次、解毒 | 首中毒降速降武器、再中毒死亡、解药还原测试 + 截图 | 所有状态迁移唯一、正确；死亡清理状态 | 修正 infection FSM |
| G08 Enemy/Secrets | 关卡 spawner/POW/矿工/秘密/危险桶 | 窗口加载/敌群上限、场景奖分、源可销毁 | 无无限刷怪卡死，可寻宝，通路真实可解锁 | 修改触发和 spawn quotas |
| G09 Slugnoid | 真实 Slugnoid 实体 | enter/exit/jump/2 vulcans/down cannon/受损撤炮/炸毁 | 游戏内有可见载具、可用控制与无载具回退策略 | 重构 vehicle 层 |
| G10 Boss | 高塔 S5 + Aeshi Nero | 入场/火箭/电球/激光/上冲/预警/阶段/击破追踪 | 实际操作可躲、可伤、Boss死才 win；至少一局从 S0 打到 S5 | 调整 Boss FSM、重新测平衡 |
| G11 UI/Audio | 原创 assets、键/触/手柄/系统 reduce motion | 桌面/320/390/横屏、多指、合成音效、本地静音 | 无 console error/严重遮挡、真实多指不卡死，自动可访问审计 | 修 UI/controls |
| G12 Node | seeded 120Hz + adversarial | `node --test` 完整日志、超时/数值 invariant / 交错状态 | 0 fail，跑批可复现，所有冒烟 fixture 通过 | 回滚到最后绿灯 |
| G13 Browser | 本地 HTTP 真 ESM，Chromium/Firefox/WebKit | Playwright 原始页面输入、错误、截图、video、trace | 真正完整一局、Boss 失败/胜利、恢复和触控，浏览器无未处理错误 | 修 bug 并重跑 |
| G14 Legacy | root Pong CI/QA | 根旧 21 test + 三浏览器 smoke 全过 | 保持 Pong 行为及已有 Pages 首页 | 不合并、回滚侵入 |
| G15 Assets | 仓库原图/第三方逐文件许可证 | `ASSET_PROVENANCE.md`，无不明授权资源清单 | 每一发布图/音资源可证明来源 | 移除或原创重制 |
| G16 Pages Gate | QA 全成功的 main sha | Pages workflow 复用，打包 Pong 和第二关，manual dispatch 需 QA 前置 | 构建只含白名单，路径正确，未绿质量结果不能部署 | 阻断 deployment |
| G17 Live URL | GitHub Pages 成功部署后访问 | curl HTTP 状态、静态资源 URL、Playwright 公网开局+真实移动射击、截图和发布时间 | HTTP 200、JS/CSS 全加载、无错误，可打开即可游玩 | 重新构建/部署，无通过声明 |
| G18 Scoring | 分项场景对照、证据和 UX | `qa.md` 每轮分数及缺陷/视频/CI URL | 所有 P0 绿灯、打分有依据；真人审查缺失标 UNVERIFIED | 继续迭代/降评级 |
| G19 Repo Boundary | 最终 PR diff 与 base sha | 改动只此仓库，Pong 修改仅 additive CI、Pages、可选 README | main 旧逻辑不变，文件白名单满足 | 撤销违规文件/停止合并 |
| G20 Operations | QA 通过、部署失败/重试/回滚 | 确定性 checksum、部署后重试方案和 rollback commit | 可快退至上一版且旧 Pong 不受损 | rollback 整段工程提交 |

**相互依赖**：
G01/G02 → G03/G04 → G05/G06/G07/G08 → G09/G10 → G11/G12/G13 → G14/G15/G16 → G17/G18/G19/G20。  
实际执行允许小步穿插写测试，但所有 P0（G03/G04/G09/G10/G12/G13/G14/G16/G17/G19）必须关闭方可声称上线。  
**不允许**因为已制定了测试而标记测试通过。

## 12. 阻断条件的严格关闭定义

### 12.1 固化原版观测与可证伪点

建立 `metal-slug-2/reference-map.md`，每个 section 记录 `source/timecode/observable/baselineVersion/confidence/sceneId/testId`。第一条为公开视频长玩 `Mission2 @04:48`；Boss `@09:47`；Mission3 `@10:31`。**不得编造场景切换精确时刻**，暂缺时标记 `UNOBSERVED`。

关键差异优先采用文献共识：夜景→藏 Sphinx 眼宝物→爆 Danger 桶开通→墓室木乃伊/解毒→真正爬塔→载具→Boss。开发者访谈证明纵轴存在。面对相冲突二级来源时记录 `CONFLICT` 与截图参考，而不是无根据二选一。用户请求“尽可能忠实”，关卡结构先于 HUD 风格。

### 12.2 场景和相机架构

不重做第三方引擎；扩展现有确定性 `RuinsGame`。采用二维 world space（水平段逻辑 + 负 Y 高塔），render 统一 (worldX-camera.x, worldY-camera.y)，场景切换只通过出口条件，入口/出口或 gate 与碰撞物可查。

- S0–S2 可以主要水平行进，但入口 Danger 桶爆破是真正触发 S1 的门槛；不能按距离直接传送。
- S3：至少 4 个以上玩家必须真实跳上的横向错落平台，并有分层相机运动 ≥400 px；不跳不能上顶，不允许凭右行绕过。
- S4：真实载具与塔顶平台共享碰撞世界；相机不因乘坐视角发生跳动。
- S5：Boss 在玩家下方，必须存在可明确判断的下射攻击和危险纵向空隙。
- 游戏不应以计时自动通关；可以 Practice 下调整容错，不能绕过路径和 Boss。
- 新建测试 fixtures 序列可复现相机、到达点及交互；只读 diagnostics 可公布 scene/position/boss，不能暴露默认用户可调用的“赢游戏”方法。

### 12.3 Slugnoid 与 Boss 不可降低标准

载具模型单独维护 durability、gunsLeft、canMount、mounted、jumpEnergy（若需要），原版确切 HP 若无依据不标“1:1”；受击损失炮台，装甲耗尽爆炸；死亡/重生状态一致。测试两枪分别计弹事件，Down+Fire 发射下方主炮；玩家离开载具后可下射 Boss，胜利依 Boss HP 或可观察的可靠击杀路径。

Aeshi Nero Boss：用状态表固定**入场、飞弹可击毁、电球/载具条件、短冲锋、电光主炮长前摇、爆炸、胜利**；记录攻击时序/有效区域/预警动画、撞击伤害与冷却。敌弹难度不因脚本有作弊路径；至少两种策略通关（Slugnoid/步兵），失败案例也能发生。逃避空间必须存在并在真实浏览器操作中可利用。

### 12.4 真浏览器测试定义

- 禁止通过 `window.__ruins.game.player.x=...`、`game.damageBoss(...)`、跳 clock、内联拼接 JS 或 mock `won` 作为通关证明。
- Playwright 用页面原样 HTML/CSS/ES module，通过真实 keyboard/pointer/gamepad 分别覆盖；可以通过只读 `window.__ruins.snapshot()` 观测进度。
- Playthrough bot 可以计算 next action，但只能通过浏览器合法动作，且走完整地图，不允许绕过空气墙/碰撞物。
- 失败测试：不跳只右、站定、被感染后第二次命中、载具被毁、丢失焦点、暂停、重试、低帧率（模拟）、restart 清零。
- 符合 §7 要求的 screenshot evidence 存本仓库 `metal-slug-2/test-results/`（未追踪生成物），作为 Actions artifact 保存 14 天，链接写进 QA；严格报告帧截图是否人眼实际检查。
- 播放在原生网站而非 CSS JS 拼接实验台；Python `browser-visual.py` 不作为主门槛。

### 12.5 GitHub Pages 工作流复用并消除手动绕门

现有 `.github/workflows/pages.yml` 保留工作流 ID / 触发；在原有 `pages` 检查及静态 copy 流程中 **追加**第二关目录。重要：现有手动 `workflow_dispatch` 可无 QA 发布，因此改为：

- 发布工作流根据触发类型识别审核提交 SHA；`workflow_run` 必须 `conclusion == success` 且 `head_branch == main`，且发布确切审核 SHA。
- 对 `workflow_dispatch`，**同步完整执行** `npm test && npm run smoke`（根）和 `cd metal-slug-2 && npm test && npm run smoke`（子项目）；任何失败则禁止部署。为减少双倍 CI 可改为调用可重用 QA 工作流，但不能省略门槛。
- 保护部署输入：构建只用当前 repo 静态文件，不允额外下载源 ROM、使用第三方部署 tokens 或跳过授权脚本。
- 原 `pages.yml` 保留配置检查、upload-pages-artifact 和 deploy-pages 语义，网站根保持 Pong；静态站拷贝 `metal-slug-2/index.html`、JS/CSS/JSON 与合法 assets，路径与 JS import 一致。
- 验收分离：Actions `conclusion=success` 仅是“构建/传输完成”；**公网 URL 必须再次验证 HTTP/JS/runtime/bot**，若机器人可用，还做开局键鼠实测。
- 发布后用户一键打开目标 URL 预计为 `https://oglocbaby.github.io/pong-game/metal-slug-2/`；但未真实请求成功前只称“待验证目标 URL”。

### 12.6 量化性能、观测与自评

- 数值：确定性同 seed 同输入一致；坐标不得 NaN；弹体和可见实体上限；循环不得发生无限碰撞；连续 1000s 失焦/恢复不时间跳跃。
- 冒烟：至少 Chromium desktop 1365×768，Chromium mobile 390×844 与 844×390，320px 小屏；Firefox/WebKit 完整加载+控制/至少一小段战斗；单人完整实测路线重点 Chromium。
- 性能：主力桌面跑 1 分钟实际游戏帧统计，目标 p95 <20ms；若 CI 虚拟浏览器性能不足，必须报告测量平台、原始时长与性能不确定，不以虚拟环境冒充真实硬件。
- 体验：地图画面、玩家姿态、载具、Boss 攻击需逐场景截图比对。代码行数/单测数量不能独立用于 10 分评价。
- 评分事件：每个领域 0–10 + 已知失败 + 证据 URL；修复后重新评分，最高认证依据为真实验收和明确外部评价。自动化操作属于机器人测试，不是人类游戏评审。

## 13. 安全 / 运行 / 回滚闭合说明

- GitHub Actions artifacts **不会**自动当作应用运行资产；二者分离，部署只能使用 repo 追踪的自创或合法资源。
- 不提交任何 token、秘密、身份数据、外部连接凭证；不启用 Work/Codex 或跨项目云端浏览器。只用本仓库 GitHub 连接器/Actions 和必要的运行时验证。
- 读取原版参考网络资料仅做研究，对那些网站不执行写入。公开参考图像不得拷入产品。
- 每次实现时复核分支 HEAD，写冲突必须 stop/rebase 审查；不要 force 更新。
- 正确失败路径：Gate 未过 → 保留原 Pong 首页可用 → 不触发 deploy；仅成功测试后提交、构建、上线。如果合并后旧 Pong 变坏，回滚发布对应的**整个变更提交**到上个 QA 绿灯 SHA，不在错误架构上增量修修补补。

## 14. Gate B closure record — R2 逐项评审总结

| 条件 | 文档层面 | 工程实际层面 | 负责实施/checklist |
| --- | --- | --- | --- |
| 用户批注 A1–A8 | **COVERED，全部裁决** | 未实施 | §10、C0 |
| 受保护接口 | **COVERED** | 待验证 | §2、G01/G14 |
| 原作参考一致性 | **COVERED，有来源分级及未测标记** | 原版逐帧未做 | research §6、G02 |
| 全路线和真纵轴 | **COVERED，可测阈值** | 原型不满足 | G03/G04、C1 |
| 主角、碰撞、敌人、木乃伊 | **COVERED** | 原型存在缺陷 | G05–G08、C2/C3 |
| 真 Slugnoid + Aeshi Nero | **COVERED** | 原型不满足 | G09/G10、C4 |
| 画面、声音、移动、可访问 | **COVERED** | 尚需测试 | G11、C5 |
| 自动化真实操作/旧 Pong 回归 | **COVERED，反作弊定义** | 新测试尚未执行 | G12–G14、C6 |
| 版权资源证据 | **COVERED** | 按实施追踪 | G15、C0/C5 |
| Pages 现有流程门控和公网验证 | **COVERED，包括 manual 防绕过** | 未发布新游戏 | G16/G17、C6 |
| QA 自评、全程 Git 范围与回滚 | **COVERED** | 实际评分未完成 | G18–G20、C7 |

**阶段判定（Planning）**：`PLANNING_REQUIREMENTS_COVERED` = 有针对所有验收条件的执行方法、实现位置、风险/回滚、可证伪验收和来源；不等于 `IMPLEMENTED` 或 `LIVE_PLAYABLE`。用户 2026-10-09 明确给出**满足计划完整条件后自动批准实施**的授权，无需再索取确认。

**Gate B = APPROVED_FOR_IMPLEMENTATION（以此审核意见为准）**；后续只按 C0–C7 执行，凡真实实现或测试失败如实状态 `FAIL / NOT_RUN`。发布门槛永远以实际通过为准，无法自行通过批准来代替。
