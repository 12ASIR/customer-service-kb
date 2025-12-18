

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import Layout from '../../components/Layout';
import { getItems as storageGetItems, setItems as storageSetItems, getDeletedIds as storageGetDeleted, setDeletedIds as storageSetDeleted } from '../../utils/storage';
import { useTableData } from '../../hooks/useTableData';
import * as XLSX from 'xlsx';

interface KnowledgeItem {
  id: string;
  sku: string;
  category: string;
  vehicle_model: string;
  problem_level: string;
  problem_type: string;
  problem_description: string;
  standard_answer: string;
  internal_solution: string;
  common_mistakes: string;
  update_time: string;
  attachments: number;
  attachment_urls?: string[];
}

// 模拟数据
const mockData: KnowledgeItem[] = [
  {
    id: '1',
    sku: 'XBCB-014',
    category: '保险杠',
    vehicle_model: 'F150',
    problem_level: 'SKU专属',
    problem_type: '使用',
    problem_description: '后梁安装支架与保险杠孔位不适配',
    standard_answer: '您好，目前该车型的后梁安装支架与保险杠孔位不适配，我们可以提供原车安装支架的图片进行核对。',
    internal_solution: '根据图片进行区分，目前只有图片中的1号安装支架是适配的。',
    common_mistakes: '是否适配',
    update_time: '2024-01-15 14:30',
    attachments: 2
  },
  {
    id: '2',
    sku: 'XBFA-700',
    category: '叉车臂',
    vehicle_model: '通用',
    problem_level: 'SKU专属',
    problem_type: '使用',
    problem_description: '中间圆孔的孔径是多少？',
    standard_answer: 'XBFA-700叉车臂中间圆孔的孔径是4英寸。',
    internal_solution: '修图，图片增加尺寸标识',
    common_mistakes: '/',
    update_time: '2024-01-14 09:15',
    attachments: 1
  },
  {
    id: '3',
    sku: 'XBCR-0024',
    category: '皮卡车顶框',
    vehicle_model: 'Tundra CrewMax Cab',
    problem_level: 'SKU专属',
    problem_type: '使用',
    problem_description: '适配哪款LED灯？',
    standard_answer: 'XBCR-0024行李架适配W聚光LED灯。',
    internal_solution: 'SKU Bumper-Long-S',
    common_mistakes: '/',
    update_time: '2024-01-13 16:45',
    attachments: 1
  }
];

const PManagePage: React.FC = () => {
  const navigate = useNavigate();

  // 本地存储
  const loadLocalItems = (): KnowledgeItem[] => storageGetItems() as KnowledgeItem[];
  const saveLocalItems = (items: KnowledgeItem[]) => storageSetItems(items);
  const loadDeletedIds = (): string[] => storageGetDeleted();
  const saveDeletedIds = (ids: string[]) => storageSetDeleted(ids);

  const [localItems, setLocalItems] = useState<KnowledgeItem[]>(loadLocalItems());
  const [deletedIds, setDeletedIds] = useState<string[]>(loadDeletedIds());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    saveLocalItems(localItems);
  }, [localItems]);
  useEffect(() => {
    saveDeletedIds(deletedIds);
  }, [deletedIds]);

  const combinedData: KnowledgeItem[] = [...mockData, ...localItems].filter(i => !deletedIds.includes(i.id));

  const {
    currentPageData,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    sortField,
    sortOrder,
    searchText,
    handleSort,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
  } = useTableData({
    data: combinedData,
    initialPageSize: 20,
    searchFields: ['problem_description', 'sku', 'vehicle_model', 'category', 'id']
  });

  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [exportFormat, setExportFormat] = useState('excel');
  const [importPreview, setImportPreview] = useState<KnowledgeItem[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'dedupe'>('dedupe');
  const importInputRef = useRef<HTMLInputElement>(null);
  const requiredHeaders = ['序号','SKU','品类','车型','问题层级','问题类型','具体问题描述','标准回答(对外)','内部解决方案/操作步骤','常见错误规避','更新时间','附件数量'];

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '知识库明细 - 售后问题知识库';
    return () => { document.title = originalTitle; };
  }, []);

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImportErrors([]);
      setImportPreview([]);
      const isCsv = /\.csv$/i.test(file.name);
      const isExcel = /\.xlsx?$/i.test(file.name);
      const reader = new FileReader();
      setImportLoading(true);
      if (isCsv) {
        reader.onload = () => {
          try {
            const text = (reader.result as string) || '';
            const lines = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim() !== '');
            if (lines.length < 2) {
              setImportErrors(prev => [...prev, 'CSV内容为空或格式不正确']);
              setImportLoading(false);
              return;
            }
            const splitCsvLine = (line: string): string[] => {
              const result: string[] = [];
              let current = '';
              let inQuotes = false;
              for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') {
                  if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                  } else {
                    inQuotes = !inQuotes;
                  }
                } else if (ch === ',' && !inQuotes) {
                  result.push(current.trim());
                  current = '';
                } else {
                  current += ch;
                }
              }
              result.push(current.trim());
              return result;
            };
            const header = splitCsvLine(lines[0]);
            const idx = (name: string) => header.findIndex(h => h.trim() === name);
            const missing = requiredHeaders.filter(h => idx(h) === -1);
            if (missing.length > 0) {
              setImportErrors(prev => [...prev, `模板列缺失：${missing.join('、')}`]);
              setImportLoading(false);
              return;
            }
            const imported: KnowledgeItem[] = [];
            const rowErrors: string[] = [];
            for (let r = 1; r < lines.length; r++) {
              const cells = splitCsvLine(lines[r]);
              if (cells.length === 1 && cells[0] === '') continue;
              const sku = cells[idx('SKU')] || '';
              const problem_description = cells[idx('具体问题描述')] || '';
              if (!sku || !problem_description) {
                rowErrors.push(`第 ${r + 1} 行缺少必填字段 SKU 或 具体问题描述`);
                continue;
              }
              const idRaw = cells[idx('序号')] || String(r);
              const item: KnowledgeItem = {
                id: `IMP-${r}-${idRaw}`.trim(),
                sku: sku.trim(),
                category: (cells[idx('品类')] || '').trim(),
                vehicle_model: (cells[idx('车型')] || '通用').trim(),
                problem_level: (cells[idx('问题层级')] || '通用').trim(),
                problem_type: (cells[idx('问题类型')] || '').trim(),
                problem_description: problem_description.trim(),
                standard_answer: (cells[idx('标准回答(对外)')] || '').trim(),
                internal_solution: (cells[idx('内部解决方案/操作步骤')] || '').trim(),
                common_mistakes: (cells[idx('常见错误规避')] || '/').trim(),
                update_time: (cells[idx('更新时间')] || new Date().toISOString().slice(0,16).replace('T',' ')).trim(),
                attachments: parseInt((cells[idx('附件数量')] || '0').trim(), 10) || 0,
              };
              imported.push(item);
            }
            setImportPreview(imported);
            if (rowErrors.length) setImportErrors(prev => [...prev, ...rowErrors]);
          } catch {
            setImportErrors(prev => [...prev, 'CSV解析错误']);
          } finally {
            setImportLoading(false);
          }
        };
        reader.onerror = () => {
          setImportErrors(prev => [...prev, '读取文件失败']);
          setImportLoading(false);
        };
        reader.readAsText(file, 'utf-8');
      } else if (isExcel) {
        reader.onload = () => {
          try {
            const data = new Uint8Array(reader.result as ArrayBuffer);
            const wb = XLSX.read(data, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as (string | number)[][];
            if (!rows || rows.length < 2) {
              setImportErrors(prev => [...prev, 'Excel内容为空或格式不正确']);
              setImportLoading(false);
              return;
            }
            const header = (rows[0] as string[]).map(h => String(h).trim());
            const idx = (name: string) => header.findIndex(h => h.trim() === name);
            const missing = requiredHeaders.filter(h => idx(h) === -1);
            if (missing.length > 0) {
              setImportErrors(prev => [...prev, `模板列缺失：${missing.join('、')}`]);
              setImportLoading(false);
              return;
            }
            const imported: KnowledgeItem[] = [];
            const rowErrors: string[] = [];
            for (let r = 1; r < rows.length; r++) {
              const cells = rows[r].map(c => String(c ?? '').trim());
              if (cells.every(c => c === '')) continue;
              const sku = cells[idx('SKU')] || '';
              const problem_description = cells[idx('具体问题描述')] || '';
              if (!sku || !problem_description) {
                rowErrors.push(`第 ${r + 1} 行缺少必填字段 SKU 或 具体问题描述`);
                continue;
              }
              const idRaw = cells[idx('序号')] || String(r);
              const item: KnowledgeItem = {
                id: `IMP-${r}-${idRaw}`.trim(),
                sku: sku.trim(),
                category: (cells[idx('品类')] || '').trim(),
                vehicle_model: (cells[idx('车型')] || '通用').trim(),
                problem_level: (cells[idx('问题层级')] || '通用').trim(),
                problem_type: (cells[idx('问题类型')] || '').trim(),
                problem_description: problem_description.trim(),
                standard_answer: (cells[idx('标准回答(对外)')] || '').trim(),
                internal_solution: (cells[idx('内部解决方案/操作步骤')] || '').trim(),
                common_mistakes: (cells[idx('常见错误规避')] || '/').trim(),
                update_time: (cells[idx('更新时间')] || new Date().toISOString().slice(0,16).replace('T',' ')).trim(),
                attachments: parseInt((cells[idx('附件数量')] || '0').trim(), 10) || 0,
              };
              imported.push(item);
            }
            setImportPreview(imported);
            if (rowErrors.length) setImportErrors(prev => [...prev, ...rowErrors]);
          } catch {
            setImportErrors(prev => [...prev, 'Excel解析错误']);
          } finally {
            setImportLoading(false);
          }
        };
        reader.onerror = () => {
          setImportErrors(prev => [...prev, '读取文件失败']);
          setImportLoading(false);
        };
        reader.readAsArrayBuffer(file);
      } else {
        setImportErrors(prev => [...prev, '请上传Excel(.xlsx/.xls)或CSV文件']);
        setImportLoading(false);
      }
    }
  };

  // 移除选中文件
  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  // 确认导入
  const handleConfirmImport = () => {
    if (!selectedFile) {
      alert('请选择要导入的文件');
      return;
    }
    if (importPreview.length === 0) {
      alert('未解析到有效数据，请检查文件内容或模板格式');
      return;
    }
    const existingKeys = new Set(combinedData.map(i => `${i.sku}|${i.vehicle_model}|${i.problem_description}`));
    const toImport = importMode === 'dedupe'
      ? importPreview.filter(i => !existingKeys.has(`${i.sku}|${i.vehicle_model}|${i.problem_description}`))
      : importPreview;
    setLocalItems(prev => [...prev, ...toImport]);
    alert(`导入成功，解析 ${importPreview.length} 条，实际新增 ${toImport.length} 条${importMode === 'dedupe' ? '（已去重）' : ''}`);
    setShowImportModal(false);
    setSelectedFile(null);
    setImportPreview([]);
    setImportErrors([]);
    setImportMode('dedupe');
  };

  const downloadBlob = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // 确认导出
  const handleConfirmExport = () => {
    const data = combinedData;
    if (exportFormat === 'excel') {
      const header = requiredHeaders;
      const rows = data.map((item, idx) => [
        String(idx + 1),
        item.sku,
        item.category,
        item.vehicle_model,
        item.problem_level,
        item.problem_type,
        item.problem_description,
        item.standard_answer,
        item.internal_solution,
        item.common_mistakes,
        item.update_time,
        String(item.attachments ?? 0),
      ]);
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '知识库');
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      downloadBlob(`知识库导出_${new Date().toISOString().slice(0,10)}.xlsx`, blob);
    } else {
      const header = requiredHeaders;
      const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
      const rows = data.map((item, idx) => [
        esc(String(idx + 1)),
        esc(item.sku),
        esc(item.category),
        esc(item.vehicle_model),
        esc(item.problem_level),
        esc(item.problem_type),
        esc(item.problem_description),
        esc(item.standard_answer),
        esc(item.internal_solution),
        esc(item.common_mistakes),
        esc(item.update_time),
        esc(String(item.attachments ?? 0)),
      ].join(','));
      const csv = '\uFEFF' + header.join(',') + '\n' + rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(`知识库导出_${new Date().toISOString().slice(0,10)}.csv`, blob);
    }
    setShowExportModal(false);
  };

  // 处理附件点击
  const handleAttachmentClick = (questionId: string) => {
    navigate(`/detail?questionId=${questionId}`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const selectAllCurrentPage = () => {
    const ids = currentPageData.map(i => i.id);
    const allSelected = ids.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
    }
  };
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`确定删除选中的 ${selectedIds.length} 条记录吗？`)) return;
    // 从localItems中移除
    setLocalItems(prev => prev.filter(item => !selectedIds.includes(item.id)));
    // 对mock数据及本地数据均记录删除ID，列表中过滤
    setDeletedIds(prev => Array.from(new Set([...prev, ...selectedIds])));
    setSelectedIds([]);
  };

  // 计算显示范围
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // 生成页码
  const generatePageNumbers = () => {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <Layout>
      {/* 页面头部 */}
      <div className="mb-8">
        {/* 面包屑导航 */}
            <nav className="text-sm text-text-secondary mb-4">
              <span>首页</span>
              <i className="fas fa-chevron-right mx-2"></i>
              <span className="text-text-primary font-medium">知识库明细</span>
            </nav>
            
            {/* 页面标题 */}
            <h2 className="text-2xl font-bold text-text-primary">知识库明细</h2>
            <p className="text-text-secondary mt-1">管理和维护售后问题知识库的所有数据</p>
          </div>

          {/* 工具栏区域 */}
          <section className="mb-6">
            <div className="bg-gradient-card rounded-xl shadow-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setShowImportModal(true)}
                    className="px-4 py-2 bg-gradient-button text-white text-sm rounded-lg hover:shadow-lg transition-all"
                  >
                    <i className="fas fa-upload mr-2"></i>
                    导入
                  </button>
                  <button 
                    onClick={() => setShowExportModal(true)}
                    className="px-4 py-2 bg-white border border-gray-200 text-text-primary text-sm rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <i className="fas fa-download mr-2"></i>
                    导出
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    disabled={selectedIds.length === 0}
                    className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    <i className="fas fa-trash-alt mr-2"></i>
                    批量删除
                  </button>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-text-secondary">每页显示</span>
                    <select 
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                      className="px-3 py-1 text-sm border border-gray-200 rounded-lg bg-white/60 text-text-secondary"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      placeholder="搜索问题..." 
                      value={searchText}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-200 rounded-lg bg-white/60 text-text-primary placeholder-text-secondary"
                    />
                    <button 
                      onClick={() => handleSearch(searchText)}
                      className="px-3 py-1 text-sm bg-gradient-button text-white rounded-lg hover:shadow-lg transition-all"
                    >
                      <i className="fas fa-search"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 数据展示区域 */}
          <section className="mb-6">
            <div className="bg-gradient-card rounded-xl shadow-card overflow-hidden">
              {/* 表格头部工具栏 */}
              <div className="p-4 border-b border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-text-secondary">
                      共 <span className="font-medium text-text-primary">{totalItems}</span> 条记录
                    </span>
                    <button 
                      onClick={() => handleSearch(searchText)}
                      className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <i className="fas fa-sync-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 表格 */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={selectAllCurrentPage}
                          checked={currentPageData.every(i => selectedIds.includes(i.id)) && currentPageData.length > 0}
                        />
                      </th>
                      <th 
                        className={`px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer ${styles.sortButton}`}
                        onClick={() => handleSort('id')}
                      >
                        序号 <i className={`fas ${sortField === 'id' ? (sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'} ml-1`}></i>
                      </th>
                      <th 
                        className={`px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer ${styles.sortButton}`}
                        onClick={() => handleSort('sku')}
                      >
                        SKU <i className={`fas ${sortField === 'sku' ? (sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'} ml-1`}></i>
                      </th>
                      <th 
                        className={`px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer ${styles.sortButton}`}
                        onClick={() => handleSort('category')}
                      >
                        品类 <i className={`fas ${sortField === 'category' ? (sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'} ml-1`}></i>
                      </th>
                      <th 
                        className={`px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer ${styles.sortButton}`}
                        onClick={() => handleSort('vehicle_model')}
                      >
                        车型 <i className={`fas ${sortField === 'vehicle_model' ? (sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'} ml-1`}></i>
                      </th>
                      <th 
                        className={`px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer ${styles.sortButton}`}
                        onClick={() => handleSort('problem_level')}
                      >
                        问题层级 <i className={`fas ${sortField === 'problem_level' ? (sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'} ml-1`}></i>
                      </th>
                      <th 
                        className={`px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer ${styles.sortButton}`}
                        onClick={() => handleSort('problem_type')}
                      >
                        问题类型 <i className={`fas ${sortField === 'problem_type' ? (sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'} ml-1`}></i>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        具体问题描述
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        标准回答(对外)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        内部解决方案/操作步骤
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        常见错误规避
                      </th>
                      <th 
                        className={`px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer ${styles.sortButton}`}
                        onClick={() => handleSort('update_time')}
                      >
                        更新时间 <i className={`fas ${sortField === 'update_time' ? (sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down') : 'fa-sort'} ml-1`}></i>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        附件链接(截图/视频)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200/50">
                    {currentPageData.map((item) => (
                      <tr key={item.id} className={styles.tableRowHover}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">{item.id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">{item.sku}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{item.category}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{item.vehicle_model}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">{item.problem_level}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">{item.problem_type}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary max-w-xs truncate" title={item.problem_description}>
                          {item.problem_description}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary max-w-xs truncate" title={item.standard_answer}>
                          {item.standard_answer}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary max-w-xs truncate" title={item.internal_solution}>
                          {item.internal_solution}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary max-w-xs truncate" title={item.common_mistakes}>
                          {item.common_mistakes}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{item.update_time}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {item.attachments > 0 ? (
                            <button 
                              onClick={() => handleAttachmentClick(item.id)}
                              className="text-secondary hover:text-blue-600 transition-colors"
                            >
                              <i className="fas fa-paperclip mr-1"></i>{item.attachments}个
                            </button>
                          ) : (
                            <span className="text-text-secondary">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            onClick={() => navigate(`/detail?questionId=${item.id}`)}
                            className="px-3 py-1 text-sm bg-gradient-button text-white rounded-lg hover:shadow-lg transition-all"
                          >
                            详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 分页区域 */}
          <section>
            <div className="flex items-center justify-between">
              <div className="text-sm text-text-secondary">
                显示第 <span>{startIndex + 1}</span> - <span>{Math.min(endIndex, totalItems)}</span> 条，共 <span>{totalItems}</span> 条
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                
                <div className="flex items-center space-x-1">
                  {generatePageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        page === currentPage ? styles.paginationActive : 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </section>
        
      {/* 导入文件选择对话框 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-xl shadow-card max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">导入知识库数据</h3>
                <p className="text-sm text-text-secondary mb-6">支持Excel和CSV格式文件，建议先下载模板文件</p>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <i className="fas fa-cloud-upload-alt text-3xl text-text-secondary mb-2"></i>
                    <p className="text-sm text-text-secondary mb-4">点击选择文件或拖拽文件到此处</p>
                    <input 
                      type="file" 
                      accept=".csv,.xlsx,.xls" 
                      ref={importInputRef}
                      onChange={handleFileChange}
                      className={styles.fileInputHidden}
                    />
                    <button 
                      onClick={() => importInputRef.current?.click()}
                      className="px-4 py-2 bg-gradient-button text-white text-sm rounded-lg hover:shadow-lg transition-all"
                    >
                      选择文件
                    </button>
                    <button
                      onClick={() => {
                        const header = requiredHeaders;
                        const sample = [
                          ['1','AP-SHELF-001','货架','大众途观L','一般','installation',
                           '安装不上，螺丝孔对不齐','参考说明书第3页','检查支架与孔位','避免过度拧紧','2024-01-15 14:30','2']
                          ];
                        const ws = XLSX.utils.aoa_to_sheet([header, ...sample]);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, '模板');
                        const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                        const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                        downloadBlob('知识库导入模板.xlsx', blob);
                      }}
                      className="ml-3 px-4 py-2 bg-white border border-gray-200 text-text-primary text-sm rounded-lg hover:bg-gray-50 transition-all inline-block"
                    >
                      下载模板
                    </button>
                  </div>
                  
                  {selectedFile && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-text-primary">{selectedFile.name}</span>
                        <button 
                          onClick={handleRemoveFile}
                          className="text-text-secondary hover:text-red-500"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-text-secondary">
                            解析状态：{importLoading ? '解析中...' : '完成'}
                          </div>
                          <div className="text-sm">
                            导入模式：
                            <select 
                              value={importMode}
                              onChange={(e) => setImportMode(e.target.value as 'append' | 'dedupe')}
                              className="ml-2 px-2 py-1 border border-gray-200 rounded"
                            >
                              <option value="dedupe">去重追加</option>
                              <option value="append">直接追加</option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-text-secondary">
                          解析到 <span className="text-text-primary font-medium">{importPreview.length}</span> 条记录
                          {importErrors.length > 0 && (
                            <span className="ml-2 text-red-500">，警告/错误 {importErrors.length} 条</span>
                          )}
                        </div>
                        {importErrors.length > 0 && (
                          <ul className="mt-2 text-xs text-red-500 list-disc pl-4 max-h-24 overflow-auto">
                            {importErrors.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        )}
                        {importPreview.length > 0 && (
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-text-secondary">
                                  <th className="px-2 py-1 text-left">SKU</th>
                                  <th className="px-2 py-1 text-left">问题类型</th>
                                  <th className="px-2 py-1 text-left">车型</th>
                                  <th className="px-2 py-1 text-left">问题描述</th>
                                </tr>
                              </thead>
                              <tbody>
                                {importPreview.slice(0, 5).map((row, idx) => (
                                  <tr key={idx} className="border-t border-gray-100">
                                    <td className="px-2 py-1">{row.sku}</td>
                                    <td className="px-2 py-1">{row.problem_type}</td>
                                    <td className="px-2 py-1">{row.vehicle_model}</td>
                                    <td className="px-2 py-1 truncate max-w-[240px]" title={row.problem_description}>{row.problem_description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="mt-1 text-[11px] text-text-secondary">
                              预览显示前 5 条，导入时将应用所选模式并自动去重（SKU+车型+问题描述）。
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => {
                      setShowImportModal(false);
                      setSelectedFile(null);
                    }}
                    className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleConfirmImport}
                    className="px-4 py-2 bg-gradient-button text-white text-sm rounded-lg hover:shadow-lg transition-all"
                  >
                    确认导入
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 导出格式选择对话框 */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-xl shadow-card max-w-sm w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">导出知识库数据</h3>
                <p className="text-sm text-text-secondary mb-6">请选择导出文件格式</p>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input 
                      type="radio" 
                      name="export-format" 
                      value="excel" 
                      checked={exportFormat === 'excel'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="text-secondary focus:ring-secondary" 
                    />
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-file-excel text-green-500"></i>
                      <span className="text-text-primary">Excel格式 (.xlsx)</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input 
                      type="radio" 
                      name="export-format" 
                      value="csv" 
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="text-secondary focus:ring-secondary"
                    />
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-file-csv text-blue-500"></i>
                      <span className="text-text-primary">CSV格式 (.csv)</span>
                    </div>
                  </label>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleConfirmExport}
                    className="px-4 py-2 bg-gradient-button text-white text-sm rounded-lg hover:shadow-lg transition-all"
                  >
                    确认导出
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PManagePage;
