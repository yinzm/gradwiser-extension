# GradWiser 浏览器扩展

继承工作区 [AGENTS.md](../AGENTS.md)。本目录是独立 Git 仓库，维护 Chrome Manifest V3 扩展，不是主应用的子包。用户要求或文档存在歧义时先询问，不猜测产品决策、权限、环境或发布流程。

## 工作入口

- 开始前检查 `git status --short --branch` 和 `git -C ../gradwiser status --short --branch`；修改前查看目标文件 diff，保留无关用户改动。
- 先读 [README.md](README.md) 与 [首发约定](docs/first-release.md)，以当前代码和用户要求确认实现状态，不把计划当作已实现功能。
- `manifest.json`：匹配页面、资源顺序与扩展版本；`src/paper-link.js`：身份解析、公共地址与语言规则；`src/content.js`：页面注入与动态生命周期；`src/content.css`：arXiv 链接与 Google 标题行网格样式。Google 链接自身样式位于 Shadow DOM。
- 运行时是无构建、无依赖的原生 JS，直接加载本目录。Node 22+ 与 pnpm 仅用于开发测试，命令以本仓库 `package.json` 为准；jsdom 不随扩展发布。不照搬主应用的框架、别名或 CI，不为普通修改附带迁移工具链。
- 涉及主应用时先读其 [AGENTS.md](../gradwiser/AGENTS.md)，分别检查和验证两个仓库；只改扩展时不要求主应用构建。

## 产品与仓库边界

- 扩展为受支持的 arXiv 摘要页与 Google 搜索结果提供“与论文 AI 对话 / AI Chat with Paper”入口；识别新版、旧版 arXiv ID，并保留显式版本。提示明确 GradWiser 与摘要落地，文案和辅助标签不添加登录提醒；不暗示点击会直接发送 AI 请求。
- 当前注入范围为 `arxiv.org/abs/*`、`www.arxiv.org/abs/*` 和 `www.google.com/search*` 的 HTTPS 页面，以 manifest 为准。
- 扩展只构造当前公共摘要地址：英文 `https://gradwiser.com/abs/<id>`，中文 `https://gradwiser.com/zh/abs/<id>`。不使用或维护旧导入协议、source/UTM 参数或 fallback；不登录、不调用 API、不自动创建私人阅读状态。论文解析、PDF 阅读及私人操作认证由主应用负责。
- 不擅自加入 PDF 查看器注入、其他论文来源或 Google 域名、AI 问答、书签、笔记、账户读取或持久化阅读功能。扩大范围先询问用户，并同步对应文档。
- 公共路由与身份规则变更需核对当前主应用实现，不受历史接口约束；不得仅通过静态检查就宣称端到端可用。不因扩展废弃旧协议而删除主应用仍在使用的私人 API。

## 安全与隐私

- 用户主动点击前不向 GradWiser 或其他服务传输页面数据，不预取、自动导入或后台请求。只处理识别入口所需的链接和 DOM，不收集周围正文、Google 查询或账户信息。
- 保持最小权限；不擅自增加广泛 host permissions、账户/cookie 读取、后台能力或遥测。扩展代码是客户端公开代码，禁止放入 API key、provider 密钥或其他秘密。
- 外部链接、页面 DOM 和 query 参数均不可信。对齐主应用公共 `src/modules/refactor/arxiv-id.ts` 的协议、主机、ID 和版本规则，再构造固定站点的公共摘要地址。保留显式版本，无版本保持无版本；拒绝畸形编码、路径穿越、凭证和不受支持的来源。
- Google 跳转链接限制长度与解包层数，只提取并验证目标身份；不得转发跳转 URL、查询词或任意外部参数。识别 export.arxiv.org 的搜索结果链接不代表扩大注入权限。
- 使用安全 DOM API 写入文本，不将页面内容拼接成 HTML 或执行。新标签页保留 `noopener` 隔离，不暴露原页 window 引用。
- 不记录或输出凭证、会话、私人内容或完整用户页面数据；不提交真实环境配置、用户数据、构建产物或 QA 截图。
- 未经用户明确要求，不提交、推送、部署、上传商店或执行远程数据库操作。版本、商店资产与发布说明只在相关任务中维护，不凭空制定发布流程。

## DOM 与交互约定

- 注入非侵入式入口，不替换原站链接、不阻止原站操作、不污染原站全局样式。使用 `gradwiser-` 命名和明确的注入标记，重复扫描不得产生重复入口。
- arXiv 入口放在 `Access Paper` 列表首位；Google 紧凑入口与标题首行同排，仍处于结果正常文档流中。仅对安全的单内容标题容器应用可撤销网格，不重排原有标题/来源子树；长标题自然折行，窄屏换到标题下方，删除入口时恢复原布局。
- Google 入口沿用 Shadow DOM 样式隔离，注意祖先 transform 不受 Shadow DOM 隔离保护。选择器和布局变化需核对真实页面，不能仅凭固定类名猜测成功。
- 动态页面处理需检查重复注入、搜索结果变化、旧链接残留和 MutationObserver 自触发；ResizeObserver、resize 与换语言需更新对齐，移除结果和 pagehide 时释放观察。避免无界递归、重复监听与不必要的全页扫描。
- 使用语义化 button/link，保留键盘操作、可见焦点与可理解的 accessible name；文案调整同步检查页面文本和辅助标签。
- 使用浏览器首选语言选择文案、辅助标签和目的路径：`navigator.language` 为 `zh`/`zh-*` 时使用中文与 `/zh/abs/`，其他或缺失时使用英文与 `/abs/`；仅当 language 缺失时回退到 languages[0]。不根据页面语言或搜索 query 猜测语言，不照搬主应用的国际化框架。

## 验证与交付

按改动风险执行可运行的检查，说明实际结果与未运行项，不用 mock 代替真实来源验收：

- 文档：核对链接、路径、命令与当前代码，运行 `git diff --check`。
- JS/manifest：运行 `pnpm check`、`pnpm test`；确认合法 JSON、Manifest V3、资源顺序、匹配范围及引用文件存在。Node/jsdom 回归不等于真实 Chrome 功能验收。
- URL 解析：覆盖新版/旧版 ID、显式版本、abs/pdf/html 链接、Google 跳转链接、非 arXiv 主机和畸形输入。PDF/html 链接可作为搜索结果来源解析，不表示支持在 PDF/html 页面注入。
- DOM/UI：使用支持加载扩展的 Chrome/Chromium 在 `chrome://extensions` 加载本目录；修改后重新加载扩展并刷新目标页。自行验证真实 arXiv 摘要页和 Google 结果页、键盘焦点、缩放/窄视口、滚动、动态更新、重复扫描及无匹配结果。
- 点击验证：确认点击前无扩展主动数据传输；点击后直接打开对应语言的公共摘要页，无 source/追踪参数、不丢版本、无强制登录绕路。验证中文/英文文案、辅助标签、键盘/中键及复制链接；浏览器语言模拟与原生安装验收分别说明。
- 不以已登录会话代替匿名验收；不擅自使用用户会话执行私人操作或创建数据。仅当任务确实涉及主应用改动时运行其针对性检查。
- 若浏览器无法加载扩展或缺少授权环境，明确报告限制；不要把 DOM 模拟、静态检查或主应用构建当作扩展端到端验收。

行为变化同步更新 README 或首发约定。交付列出修改文件、验证结果、未验证项及原因；有待用户决定的问题直接提出，不自行补全。
