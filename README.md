# My DDNS

自动更新 Cloudflare DNS AAAA 记录的 IPv6 DDNS 服务。

## 功能

- 每 5 分钟检测本机 IPv6 地址
- IP 变化时自动更新 Cloudflare DNS 记录
- 优先选择静态 IPv6 地址（包含 `::` 的地址）
- 使用 PM2 后台运行

## 环境要求

- Node.js >= 18
- pnpm

## 配置

编辑 `index.ts` 中的 CONFIG：

```typescript
const CONFIG = {
    ZONE_ID: "你的 Zone ID",
    RECORD_ID: "你的 Record ID",
    TOKEN: "你的 Cloudflare API Token",
    DOMAIN_NAME: "你的域名",
    INTERVAL: 1000 * 60 * 5,  // 检查间隔（毫秒）
};
```

### 获取 Cloudflare 配置

1. **ZONE_ID**: Cloudflare 控制台 → 域名概览页右侧
2. **RECORD_ID**:
   ```bash
   curl -X GET "https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/dns_records" \
     -H "Authorization: Bearer {TOKEN}"
   ```
3. **TOKEN**: Cloudflare 控制台 → My Profile → API Tokens → Create Token

## 使用

```bash
# 安装依赖
pnpm install

# 开发运行
pnpm dev

# 编译
pnpm build

# 生产运行
pnpm start
```

## PM2 后台运行

```bash
# 编译并启动
pnpm build
pm2 start dist/index.js --name my-ddns

# 常用命令
pm2 logs my-ddns      # 查看日志
pm2 status            # 查看状态
pm2 restart my-ddns   # 重启（修改代码后需先 pnpm build）
pm2 stop my-ddns      # 停止
pm2 delete my-ddns    # 删除
```

## 日志示例

```
=== 原生 Fetch DDNS 服务启动 ===
Node 版本: v22.20.0
目标域名: example.com
当前 IPv6: 2408:xxxx::xxx
[更新] 正尝试将 example.com 更新为 -> 2408:xxxx::xxx
[成功] Cloudflare 记录已更新！当前 IP: 2408:xxxx::xxx
```

## 注意事项

- 修改代码后需重新编译：`pnpm build && pm2 restart my-ddns`
- Token 不要提交到公开仓库
