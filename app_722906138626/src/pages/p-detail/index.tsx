import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchAllItems, saveItem, type KBItem } from '../../utils/storage';
import Layout from '../../components/Layout';

interface KnowledgeItem extends KBItem {}

const toZhProblemType = (v: string) => {
  const m: Record<string, string> = {
    installation: '安装问题',
    quality: '质量问题',
    usage: '使用方法',
    compatibility: '兼容性问题',
    warranty: '保修政策',
    other: '其他',
  };
  const zh = new Set(Object.values(m));
  if (!v) return '';
  const key = v.toLowerCase();
  if (m[key]) return m[key];
  if (zh.has(v)) return v;
  return v;
};

const PDetailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [knowledgeItem, setKnowledgeItem] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<KnowledgeItem | null>(null);

  useEffect(() => {
    // 设置页面标题
    const originalTitle = document.title;
    document.title = '知识库详情 - 售后问题知识库';
    return () => { document.title = originalTitle; };
  }, []);

  useEffect(() => {
    // 从URL参数中获取questionId
    const searchParams = new URLSearchParams(location.search);
    const questionId = searchParams.get('questionId');
    
    const loadData = async () => {
      if (questionId) {
        try {
          // 统一从 fetchAllItems 获取数据，它会合并云端、本地和静态数据
          const allItems = await fetchAllItems();
          const item = allItems.find(i => String(i.id) === String(questionId));
          setKnowledgeItem(item || null);
        } catch (error) {
          console.error('Failed to load detail item:', error);
          setKnowledgeItem(null);
        }
      }
      setLoading(false);
    };

    loadData();
  }, [location.search]);

  const handleBack = () => {
    navigate('/manage');
  };

  const handleEdit = () => {
    if (knowledgeItem) {
      setEditForm(JSON.parse(JSON.stringify(knowledgeItem))); // Deep copy
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const handleSave = async () => {
    if (!editForm) return;
    
    // Basic validation
    if (!editForm.sku || !editForm.problem_description) {
      alert('SKU和问题描述不能为空');
      return;
    }
    
    try {
      // Update update_time
      const updatedItem = {
        ...editForm,
        update_time: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };
      
      await saveItem(updatedItem);
      setKnowledgeItem(updatedItem);
      setIsEditing(false);
      setEditForm(null);
      alert('保存成功');
    } catch (e) {
      console.error('Save failed', e);
      alert('保存失败');
    }
  };

  const handleInputChange = (field: keyof KnowledgeItem, value: string) => {
    if (!editForm) return;
    setEditForm({ ...editForm, [field]: value });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-text-primary">加载中...</div>
        </div>
      </Layout>
    );
  }

  if (!knowledgeItem) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-text-primary">未找到相关知识库内容</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* 页面头部 */}
      <div className="mb-8">
        {/* 面包屑导航 */}
            <nav className="text-sm text-text-secondary mb-4">
              <span onClick={() => navigate('/')} className="cursor-pointer hover:text-primary">首页</span>
              <i className="fas fa-chevron-right mx-2"></i>
              <span onClick={() => navigate('/manage')} className="cursor-pointer hover:text-primary">知识库明细</span>
              <i className="fas fa-chevron-right mx-2"></i>
              <span className="text-text-primary font-medium">知识库详情</span>
            </nav>
            
            {/* 页面标题和返回按钮 */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary">
                {isEditing ? '编辑知识库详情' : '知识库详情'}
              </h2>
              <div className="flex space-x-3">
                {isEditing ? (
                  <>
                    <button 
                      onClick={handleCancel}
                      className="px-4 py-2 bg-white border border-gray-200 text-text-primary text-sm rounded-lg hover:bg-gray-50 transition-all"
                    >
                      取消
                    </button>
                    <button 
                      onClick={handleSave}
                      className="px-4 py-2 bg-gradient-button text-white text-sm rounded-lg hover:shadow-lg transition-all"
                    >
                      保存
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleEdit}
                      className="px-4 py-2 bg-gradient-button text-white text-sm rounded-lg hover:shadow-lg transition-all"
                    >
                      <i className="fas fa-edit mr-2"></i>
                      编辑
                    </button>
                    <button 
                      onClick={handleBack}
                      className="px-4 py-2 bg-white border border-gray-200 text-text-primary text-sm rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <i className="fas fa-arrow-left mr-2"></i>
                      返回列表
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 详情内容区域 */}
          <section className="bg-gradient-card rounded-xl shadow-card p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本信息 */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">基本信息</h3>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">序号</label>
                    <span className="text-text-primary">{knowledgeItem.id}</span>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">SKU</label>
                    {isEditing ? (
                      <input 
                        type="text"
                        value={editForm?.sku || ''}
                        onChange={(e) => handleInputChange('sku', e.target.value)}
                        className="border border-gray-200 rounded px-3 py-1 text-text-primary focus:outline-none focus:border-primary"
                      />
                    ) : (
                      <span className="text-text-primary">{knowledgeItem.sku}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">品类</label>
                    {isEditing ? (
                      <input 
                        type="text"
                        value={editForm?.category || ''}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="border border-gray-200 rounded px-3 py-1 text-text-primary focus:outline-none focus:border-primary"
                      />
                    ) : (
                      <span className="text-text-primary">{knowledgeItem.category}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">车型</label>
                    {isEditing ? (
                      <input 
                        type="text"
                        value={editForm?.vehicle_model || ''}
                        onChange={(e) => handleInputChange('vehicle_model', e.target.value)}
                        className="border border-gray-200 rounded px-3 py-1 text-text-primary focus:outline-none focus:border-primary"
                      />
                    ) : (
                      <span className="text-text-primary">{knowledgeItem.vehicle_model}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">问题层级</label>
                    {isEditing ? (
                      <select 
                        value={editForm?.problem_level || ''}
                        onChange={(e) => handleInputChange('problem_level', e.target.value)}
                        className="border border-gray-200 rounded px-3 py-1 text-text-primary focus:outline-none focus:border-primary"
                      >
                        <option value="SKU专属">SKU专属</option>
                        <option value="通用">通用</option>
                      </select>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full inline-block w-fit">
                        {knowledgeItem.problem_level}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">问题类型</label>
                    {isEditing ? (
                      <select 
                        value={editForm?.problem_type || ''}
                        onChange={(e) => handleInputChange('problem_type', e.target.value)}
                        className="border border-gray-200 rounded px-3 py-1 text-text-primary focus:outline-none focus:border-primary"
                      >
                        <option value="installation">安装问题</option>
                        <option value="quality">质量问题</option>
                        <option value="usage">使用方法</option>
                        <option value="compatibility">兼容性问题</option>
                        <option value="warranty">保修政策</option>
                        <option value="other">其他</option>
                        {/* Preserve existing value if not in list */}
                        {editForm?.problem_type && !['installation','quality','usage','compatibility','warranty','other'].includes(editForm.problem_type) && (
                           <option value={editForm.problem_type}>{editForm.problem_type}</option>
                        )}
                      </select>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full inline-block w-fit">
                        {toZhProblemType(knowledgeItem.problem_type)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">更新时间</label>
                    <span className="text-text-primary">{knowledgeItem.update_time}</span>
                  </div>
                </div>
              </div>

              {/* 详细内容 */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">详细内容</h3>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">具体问题描述</label>
                    {isEditing ? (
                      <textarea 
                        rows={3}
                        value={editForm?.problem_description || ''}
                        onChange={(e) => handleInputChange('problem_description', e.target.value)}
                        className="border border-gray-200 rounded px-3 py-1 text-text-primary focus:outline-none focus:border-primary w-full resize-none"
                      />
                    ) : (
                      <p className="text-text-primary whitespace-pre-line">{knowledgeItem.problem_description}</p>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">标准回答(对外)</label>
                    {isEditing ? (
                      <textarea 
                        rows={3}
                        value={editForm?.standard_answer || ''}
                        onChange={(e) => handleInputChange('standard_answer', e.target.value)}
                        className="border border-gray-200 rounded px-3 py-1 text-text-primary focus:outline-none focus:border-primary w-full resize-none"
                      />
                    ) : (
                      <p className="text-text-primary whitespace-pre-line">{knowledgeItem.standard_answer}</p>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">内部解决方案/操作步骤</label>
                    {isEditing ? (
                      <textarea 
                        rows={3}
                        value={editForm?.internal_solution || ''}
                        onChange={(e) => handleInputChange('internal_solution', e.target.value)}
                        className="border border-gray-200 rounded px-3 py-1 text-text-primary focus:outline-none focus:border-primary w-full resize-none"
                      />
                    ) : (
                      <p className="text-text-primary whitespace-pre-line">{knowledgeItem.internal_solution}</p>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">常见错误规避</label>
                    {isEditing ? (
                      <textarea 
                        rows={2}
                        value={editForm?.common_mistakes || ''}
                        onChange={(e) => handleInputChange('common_mistakes', e.target.value)}
                        className="border border-gray-200 rounded px-3 py-1 text-text-primary focus:outline-none focus:border-primary w-full resize-none"
                      />
                    ) : (
                      <p className="text-text-primary whitespace-pre-line">{knowledgeItem.common_mistakes}</p>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">附件链接(截图/视频)</label>
                    {knowledgeItem.attachment_urls && knowledgeItem.attachment_urls.length > 0 ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {knowledgeItem.attachment_urls.map((url, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-2 bg-white">
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt={`附件${idx + 1}`} className="w-full h-32 object-cover rounded" />
                              </a>
                              <div className="flex items-center justify-between mt-2">
                                <a 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-text-secondary hover:text-text-primary text-sm"
                                >
                                  预览
                                </a>
                                <a 
                                  href={url} 
                                  download 
                                  className="text-text-secondary hover:text-text-primary text-sm"
                                >
                                  下载
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="text-sm text-text-secondary">
                          共 {knowledgeItem.attachment_urls.length} 张图片
                        </div>
                      </div>
                    ) : (
                      <span className="text-text-secondary">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
      </Layout>
  );
};

export default PDetailPage;
