import os from 'os';

// ================= 配置区（从环境变量读取）=================
const CONFIG = {
    TOKEN: process.env.CLOUDFLARE_TOKEN || '',
    INTERVAL: parseInt(process.env.INTERVAL || '300000'),
    DOMAINS: JSON.parse(process.env.DOMAINS || '[]') as Array<{
        ZONE_ID: string;
        RECORD_ID: string;
        DOMAIN_NAME: string;
    }>
};

// 配置验证
if (!CONFIG.TOKEN) {
    console.error('[错误] 未设置 CLOUDFLARE_TOKEN 环境变量');
    process.exit(1);
}
if (CONFIG.DOMAINS.length === 0) {
    console.error('[错误] 未配置任何域名（DOMAINS 环境变量为空）');
    process.exit(1);
}

const lastKnownIPs = new Map<string, string>();

/**
 * 获取本机真实 IPv6 (只取 2xxx 或 3xxx 开头的公网地址)
 */
function getLocalIPv6(): string | null {
    const interfaces = os.networkInterfaces();
    const candidates: string[] = [];

    for (const name in interfaces) {
        const iface = interfaces[name];
        if (!iface) continue;

        for (const alias of iface) {
            if (alias.family === 'IPv6' && !alias.internal &&
                !alias.address.startsWith('fe80') &&
                /^[23]/.test(alias.address)
            ) {
                candidates.push(alias.address);
            }
        }
    }

    // 优先选择静态地址（包含 :: 的较短地址）
    return candidates.find(ip => ip.includes('::')) ?? candidates[0] ?? null;
}

/**
 * 使用原生 fetch 更新 Cloudflare
 */
async function updateDNS(domain: typeof CONFIG.DOMAINS[0], ip: string) {
    console.log(`[更新] 正尝试将 ${domain.DOMAIN_NAME} 更新为 -> ${ip}`);

    const url = `https://api.cloudflare.com/client/v4/zones/${domain.ZONE_ID}/dns_records/${domain.RECORD_ID}`;

    // 自动处理 Bearer 前缀
    const authHeader = CONFIG.TOKEN.startsWith('Bearer') ? CONFIG.TOKEN : `Bearer ${CONFIG.TOKEN}`;

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: "AAAA",
                name: domain.DOMAIN_NAME,
                content: ip,
                ttl: 600,
                proxied: false
            })
        });

        const data = await response.json() as any;

        if (response.ok && data.success) {
            console.log(`[成功] ${domain.DOMAIN_NAME} 记录已更新！当前 IP: ${ip}`);
            lastKnownIPs.set(domain.DOMAIN_NAME, ip);
        } else {
            console.error(`[API 拒绝] ${domain.DOMAIN_NAME} 状态码: ${response.status}`);
            console.error(`[错误详情]`, JSON.stringify(data.errors));
        }

    } catch (error: any) {
        console.error(`[网络异常] ${domain.DOMAIN_NAME} 请求失败: ${error.message}`);
    }
}

/**
 * 主循环
 */
async function task() {
    const currentIP = getLocalIPv6();

    if (!currentIP) {
        console.warn(`[警告] 未检测到有效的 IPv6 地址`);
        return;
    }

    for (const domain of CONFIG.DOMAINS) {
        if (currentIP !== lastKnownIPs.get(domain.DOMAIN_NAME)) {
            await updateDNS(domain, currentIP);
        }
    }
}

// ================= 启动 =================
console.log("=== 原生 Fetch DDNS 服务启动 ===");
console.log(`Node 版本: ${process.version}`);
console.log(`目标域名: ${CONFIG.DOMAINS.map(d => d.DOMAIN_NAME).join(', ')}`);
console.log(`当前 IPv6: ${getLocalIPv6() ?? '未检测到'}`);

task();
setInterval(task, CONFIG.INTERVAL);