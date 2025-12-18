import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getItems as storageGetItems, KBItem } from '../../utils/storage';
import Layout from '../../components/Layout';

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
    attachments: 2,
    attachment_urls: [
      'https://picsum.photos/id/237/800/600',
      'https://picsum.photos/id/238/800/600'
    ]
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
    attachments: 1,
    attachment_urls: [
      'https://picsum.photos/id/239/800/600'
    ]
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
    attachments: 1,
    attachment_urls: [
      'https://picsum.photos/id/240/800/600'
    ]
  }
];

const queryData: KnowledgeItem[] = [
  {
    id: 'Q001',
    sku: 'AP-SHELF-001',
    category: '货架',
    vehicle_model: '大众途观L',
    problem_level: '通用',
    problem_type: '使用',
    problem_description: '货架安装不上，螺丝孔对不齐',
    standard_answer: '请检查安装位置是否正确，建议参考安装说明书第3页的图示。如仍有问题，请联系技术支持热线400-xxx-xxxx。',
    internal_solution: '确认支架型号与车体匹配；检查运输损坏；必要时安排上门安装服务。',
    common_mistakes: '孔位不匹配；安装支架型号错误',
    update_time: '2024-01-15 14:30',
    attachments: 2
  },
  {
    id: 'Q002',
    sku: 'AP-BUMPER-002',
    category: '保险杠',
    vehicle_model: '本田雅阁',
    problem_level: '通用',
    problem_type: '质量',
    problem_description: '保险杠表面有划痕，是否属于质量问题',
    standard_answer: '轻微划痕属于正常现象，可通过抛光处理修复。如划痕较深，请提供照片以便我们评估是否属于质量问题。',
    internal_solution: '指导客户进行抛光；无法修复则依据保修政策处理；记录问题用于改进。',
    common_mistakes: '正常轻微划痕误判为质量问题',
    update_time: '2024-01-14 09:15',
    attachments: 1
  },
  {
    id: 'Q003',
    sku: 'AP-PEDAL-003',
    category: '踏板',
    vehicle_model: '丰田汉兰达',
    problem_level: '通用',
    problem_type: '使用',
    problem_description: '踏板安装后松动，如何固定',
    standard_answer: '请检查固定螺丝是否拧紧，建议使用扭矩扳手按照说明书要求的扭矩值进行固定。如问题持续存在，请联系我们。',
    internal_solution: '确认正确扭矩安装；检查是否变形；必要时提供加强型固定件。',
    common_mistakes: '扭矩不足导致松动',
    update_time: '2024-01-13 16:45',
    attachments: 3
  }
];

const PDetailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [knowledgeItem, setKnowledgeItem] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(true);

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
    
    if (questionId) {
      const manageItem = mockData.find(item => item.id === questionId);
      const queryItem = queryData.find(item => item.id === questionId);
      let localItem: KnowledgeItem | null = null;
      const localItems = storageGetItems() as KBItem[];
      localItem = localItems.find((i) => String(i.id) === String(questionId)) || null;
      setKnowledgeItem(manageItem || queryItem || localItem || null);
    }
    
    setLoading(false);
  }, [location.search]);

  const handleBack = () => {
    navigate('/manage');
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
              <h2 className="text-2xl font-bold text-text-primary">知识库详情</h2>
              <button 
                onClick={handleBack}
                className="px-4 py-2 bg-white border border-gray-200 text-text-primary text-sm rounded-lg hover:bg-gray-50 transition-all"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                返回列表
              </button>
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
                    <span className="text-text-primary">{knowledgeItem.sku}</span>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">品类</label>
                    <span className="text-text-primary">{knowledgeItem.category}</span>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">车型</label>
                    <span className="text-text-primary">{knowledgeItem.vehicle_model}</span>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">问题层级</label>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full inline-block w-fit">
                      {knowledgeItem.problem_level}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">问题类型</label>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full inline-block w-fit">
                      {knowledgeItem.problem_type}
                    </span>
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
                    <p className="text-text-primary whitespace-pre-line">{knowledgeItem.problem_description}</p>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">标准回答(对外)</label>
                    <p className="text-text-primary whitespace-pre-line">{knowledgeItem.standard_answer}</p>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">内部解决方案/操作步骤</label>
                    <p className="text-text-primary whitespace-pre-line">{knowledgeItem.internal_solution}</p>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-text-secondary mb-1">常见错误规避</label>
                    <p className="text-text-primary whitespace-pre-line">{knowledgeItem.common_mistakes}</p>
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
