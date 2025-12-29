import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

// --- 配置区域 START ---

// 1. API 基础域名 (必须修改)
// 请将此处修改为实际的 API 域名，例如: https://oms.example.com
// 如果您不知道域名，请联系开发人员或查看接口文档完整地址
const API_BASE_URL = 'CHANGE_ME_TO_REAL_DOMAIN'; 

// 2. 接口路径
const API_PATH = '/webApi/userSkuStock/v1/queryInventory';

// 3. 认证信息
const CONFIG = {
    // Bearer Token
    token: '0dabff46-0492-44bc-9283-64163dc8a995',
    
    // App Key
    appKey: '7289ded35b198243883151876eaf3213',
    
    // Admin Secret (用于跳过签名，测试环境专用)
    // 如果是生产环境，请设为空字符串 ''，并实现下方的 calculateSign 函数
    adminSecret: '72cd7d920649332050b284a36e0ed6a1',
    
    // 分页大小 (最大 500)
    pageSize: 500,
    
    // 导出文件保存目录 (相对于脚本运行目录)
    outputDir: './inventory_exports',
    
    // 定时任务间隔 (毫秒), 默认 1 小时 = 3600000 毫秒
    // 如果设置为 0，则只运行一次并退出
    interval: 3600000
};

// --- 配置区域 END ---

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 计算签名 (Sign)
 * 如果需要在生产环境运行且 adminSecret 不可用，请在此处实现签名算法
 */
function calculateSign(params, appKey, secret) {
    // TODO: 如果需要签名，请在此处实现
    // 通常涉及参数排序、拼接密钥、MD5/SHA256 加密等
    // console.warn('警告: 未实现签名算法，仅依赖 adminSecret 跳过签名验证');
    return '056F32EE5CF49404607E368BD8D3F2AF'; // 返回示例值或计算结果
}

/**
 * 获取单页库存数据
 */
async function fetchInventoryPage(pageNum) {
    if (API_BASE_URL === 'CHANGE_ME_TO_REAL_DOMAIN') {
        throw new Error('请先修改脚本中的 API_BASE_URL 为实际的 API 域名！');
    }

    const url = `${API_BASE_URL}${API_PATH}`;
    const timestamp = Date.now().toString();

    // 构造请求头
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.token}`,
        'timestamp': timestamp,
        'appKey': CONFIG.appKey,
        'sign': calculateSign({}, CONFIG.appKey, ''), // 此时尚未实现真实签名
    };

    // 如果有 adminSecret，添加到 header 跳过签名
    if (CONFIG.adminSecret) {
        headers['openApiAdminSecret'] = CONFIG.adminSecret;
    }

    // 构造请求体
    const body = {
        pageNum: pageNum,
        pageSize: CONFIG.pageSize,
        // skuCodeList: ["ybtest"], // 如果需要过滤 SKU，可取消注释
        // warehouseIdList: [2],    // 如果需要过滤仓库，可取消注释
        totalStockGreaterThanZero: true
    };

    try {
        console.log(`正在获取第 ${pageNum} 页数据...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.code !== 200) {
            throw new Error(`API Error: ${result.code} - ${result.msg}`);
        }

        return result;
    } catch (error) {
        console.error(`请求第 ${pageNum} 页失败:`, error.message);
        throw error;
    }
}

/**
 * 获取所有库存数据
 */
async function fetchAllInventory() {
    let allRows = [];
    let pageNum = 1;
    let total = 0;
    let hasMore = true;

    console.log('开始全量拉取库存数据...');
    const startTime = Date.now();

    while (hasMore) {
        const result = await fetchInventoryPage(pageNum);
        const rows = result.rows || [];
        total = result.total || 0;

        allRows = allRows.concat(rows);

        console.log(`已获取 ${allRows.length} / ${total} 条数据`);

        // 判断是否还有下一页
        // 如果当前页获取的数据少于 pageSize，或者总数已达到 total，则停止
        if (rows.length < CONFIG.pageSize || allRows.length >= total) {
            hasMore = false;
        } else {
            pageNum++;
            // 简单限速，避免请求过快
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`拉取完成！共 ${allRows.length} 条数据，耗时 ${duration} 秒。`);
    return allRows;
}

/**
 * 保存数据到 Excel
 */
function saveToExcel(data) {
    if (!data || data.length === 0) {
        console.warn('没有数据可导出。');
        return;
    }

    // 确保输出目录存在
    const outputDir = path.resolve(process.cwd(), CONFIG.outputDir);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // 生成文件名 (带时间戳)
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `inventory_export_${timestamp}.xlsx`;
    const filepath = path.join(outputDir, filename);

    // 转换数据为 Sheet
    // 假设数据是扁平对象，可以直接转换
    // 如果需要自定义表头，可以在 json_to_sheet 第二个参数传 header: [...]
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");

    // 写入文件
    XLSX.writeFile(wb, filepath);
    console.log(`文件已保存至: ${filepath}`);
}

/**
 * 主任务函数
 */
async function runTask() {
    console.log('='.repeat(50));
    console.log(`任务开始时间: ${new Date().toLocaleString()}`);
    
    try {
        const data = await fetchAllInventory();
        saveToExcel(data);
        console.log('任务执行成功。');
    } catch (error) {
        console.error('任务执行失败:', error);
    }
    
    console.log('='.repeat(50));
}

/**
 * 启动入口
 */
function start() {
    // 立即执行一次
    runTask();

    // 如果配置了间隔，启动定时器
    if (CONFIG.interval > 0) {
        console.log(`定时任务已启动，每 ${CONFIG.interval / 1000 / 60} 分钟执行一次。`);
        console.log('请保持此窗口开启，按 Ctrl+C 停止。');
        setInterval(runTask, CONFIG.interval);
    }
}

// 启动脚本
start();
