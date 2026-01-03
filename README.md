# IPv6 DDNS for Cloudflare

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

轻量级 IPv6 DDNS 服务，自动检测本机 IPv6 地址变化并更新 Cloudflare DNS AAAA 记录。

## ✨ 特性

- 🚀 **轻量级**：单文件架构，使用 Node.js 原生 API（fetch、os）
- 🔄 **自动更新**：每 5 分钟检测 IPv6 地址变化，仅在变化时更新 DNS
- 🌐 **多域名支持**：同时管理多个域名的 DNS 记录
- 🔒 **安全配置**：敏感信息存储在 `.env` 文件，不会泄露到代码仓库
- 📊 **智能选择**：优先选择静态 IPv6 地址（压缩格式地址）
- 🛡️ **错误处理**：完善的 API 错误和网络异常处理

## 📋 环境要求

- Node.js >= 18（需支持原生 fetch）
- pnpm（推荐）或 npm
- Cloudflare 账户和 API Token

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/MrSeven590/ipv6-ddns-cf.git
cd ipv6-ddns-cf
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

复制 `.env.example` 并重命名为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入您的配置：

```env
# Cloudflare API Token
CLOUDFLARE_TOKEN=your_cloudflare_api_token_here

# 检查间隔（毫秒，默认 5 分钟）
INTERVAL=300000

# 域名配置（JSON 格式）
DOMAINS=[{"ZONE_ID":"your_zone_id","RECORD_ID":"your_record_id","DOMAIN_NAME":"your.domain.com"}]
```

### 4. 运行服务

**开发模式**：
```bash
pnpm dev
```

**生产模式**：
```bash
pnpm build
pnpm start
```

## ⚙️ 配置说明

### 获取 Cloudflare 配置

#### 1. 获取 API Token

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)
2. 进入 **My Profile** → **API Tokens**
3. 点击 **Create Token**
4. 使用 **Edit zone DNS** 模板
5. 权限设置：
   - **Zone** → **DNS** → **Edit**
6. 复制生成的 Token

#### 2. 获取 Zone ID

1. 在 Cloudflare 控制台选择您的域名
2. 在右侧栏找到 **Zone ID**

#### 3. 获取 Record ID

（前提是dns记录存在，否则返回空，无法获取到Record ID）
使用以下命令查询（替换 `{ZONE_ID}` 和 `{TOKEN}`）：

```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/dns_records" \
  -H "Authorization: Bearer {TOKEN}"
```

从返回的 JSON 中找到对应记录的 `id` 字段。

### 多域名配置示例

在 `.env` 文件中配置多个域名：

```env
DOMAINS=[{"ZONE_ID":"zone_id_1","RECORD_ID":"record_id_1","DOMAIN_NAME":"home.example.com"},{"ZONE_ID":"zone_id_2","RECORD_ID":"record_id_2","DOMAIN_NAME":"nas.example.com"}]
```

## 🔧 PM2 后台运行

### 启动服务

```bash
# 编译项目
pnpm build

# 使用 PM2 启动（需要指定 --env-file 参数）
pm2 start dist/index.js --name ipv6-ddns-cf --node-args="--env-file=.env"

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

### 常用命令

```bash
pm2 logs ipv6-ddns-cf      # 实时日志
pm2 status                  # 进程状态
pm2 restart ipv6-ddns-cf    # 重启服务
pm2 stop ipv6-ddns-cf       # 停止服务
pm2 delete ipv6-ddns-cf     # 删除进程
```

## 📝 日志示例

**启动日志**：
```
=== 原生 Fetch DDNS 服务启动 ===
Node 版本: v22.20.0
目标域名: home.example.com, nas.example.com
当前 IPv6: 2408:xxxx::xxx
```

**更新日志**：
```
[更新] 正尝试将 home.example.com 更新为 -> 2408:xxxx::xxx
[成功] home.example.com 记录已更新！当前 IP: 2408:xxxx::xxx
[更新] 正尝试将 nas.example.com 更新为 -> 2408:xxxx::xxx
[成功] nas.example.com 记录已更新！当前 IP: 2408:xxxx::xxx
```

**错误日志**：
```
[警告] 未检测到有效的 IPv6 地址
[API 拒绝] home.example.com 状态码: 403
[网络异常] nas.example.com 请求失败: fetch failed
```

## 🔍 工作原理

1. **IPv6 检测**：遍历网络接口，过滤出公网 IPv6 地址（以 `2` 或 `3` 开头）
2. **智能选择**：优先选择包含 `::` 的压缩格式地址（通常是��态地址）
3. **变化检测**：为每个域名独立跟踪 IP 变化，仅在变化时调用 API
4. **定时任务**：每 5 分钟执行一次检测（可配置）

## 📚 项目结构

```
ipv6-ddns-cf/
├── index.ts           # 主程序（唯一源文件）
├── package.json       # 项目配置
├── tsconfig.json      # TypeScript 配置
├── .env               # 环境变量（不提交到 Git）
├── .env.example       # 环境变量模板
├── .gitignore         # Git 忽略规则
├── README.md          # 用户文档
├── CLAUDE.md          # 架构文档
├── LICENSE            # MIT 许可证
└── dist/              # 编译输出目录
    └── index.js       # 编译后的 JS 文件
```

## ⚠️ 注意事项

- **代码修改**：修改代码后需重新编译：`pnpm build && pm2 restart ipv6-ddns-cf`
- **API 限流**：Cloudflare API 有限流，但本服务仅在 IP 变化时调用，频率很低
- **IPv6 环境**：需要本机有公网 IPv6 地址才能正常工作

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](LICENSE)

## 🙏 致谢

- [Cloudflare API](https://api.cloudflare.com/) - DNS 管理
- [Node.js](https://nodejs.org/) - 运行时环境
