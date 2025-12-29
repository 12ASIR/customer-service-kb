

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import Layout from '../../components/Layout';
import { getItems as storageGetItems, KBItem } from '../../utils/storage';
import { search as localSearch, SearchDoc } from '../../utils/localSearch';

interface QueryResult {
  id: string;
  question: string;
  sku: string;
  category: string;
  problemLevel: string;
  carModel: string;
  time: string;
  standardAnswer: string;
  internalSolution: string;
  viewCount: number;
  likeCount: number;
  attachmentCount: number;
}

const PQueryPage: React.FC = () => {
  const navigate = useNavigate();
  const [queryInputValue, setQueryInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const [resultCount, setResultCount] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [displayResults, setDisplayResults] = useState<QueryResult[]>([]);
  const [hotTags, setHotTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const mockResults: QueryResult[] = [
    {
      id: 'Q001',
      question: '货架安装不上，螺丝孔对不齐',
      sku: 'AP-SHELF-001',
      category: '安装问题',
      problemLevel: 'P1',
      carModel: '大众途观L',
      time: '2024-01-15 14:30',
      standardAnswer: '请检查安装位置是否正确，建议参考安装说明书第3页的图示。如仍有问题，请联系技术支持热线400-xxx-xxxx。',
      internalSolution: '1. 确认客户是否使用了正确的安装支架；2. 检查产品是否有运输损坏；3. 必要时安排上门安装服务。',
      viewCount: 127,
      likeCount: 89,
      attachmentCount: 2
    },
    {
      id: 'Q002',
      question: '保险杠表面有划痕，是否属于质量问题',
      sku: 'AP-BUMPER-002',
      category: '质量问题',
      problemLevel: 'P2',
      carModel: '本田雅阁',
      time: '2024-01-14 09:15',
      standardAnswer: '轻微划痕属于正常现象，可通过抛光处理修复。如划痕较深，请提供照片以便我们评估是否属于质量问题。',
      internalSolution: '1. 指导客户进行简单的抛光处理；2. 如无法修复，根据保修政策提供相应解决方案；3. 记录问题类型以便产品改进。',
      viewCount: 89,
      likeCount: 67,
      attachmentCount: 1
    },
    {
      id: 'Q003',
      question: '踏板安装后松动，如何固定',
      sku: 'AP-PEDAL-003',
      category: '安装问题',
      problemLevel: 'P1',
      carModel: '丰田汉兰达',
      time: '2024-01-13 16:45',
      standardAnswer: '请检查固定螺丝是否拧紧，建议使用扭矩扳手按照说明书要求的扭矩值进行固定。如问题持续存在，请联系我们。',
      internalSolution: '1. 确认客户是否按照正确扭矩安装；2. 检查产品是否有变形；3. 必要时提供加强型固定件。',
      viewCount: 156,
      likeCount: 123,
      attachmentCount: 3
    }
  ];

  useEffect(() => {
    const originalTitle = document.title;
    document.title = '问题查询 - 售后问题知识库';
    
    // 计算热门标签
    const calculateHotTags = () => {
      try {
        const items = storageGetItems();
        if (!items || items.length === 0) {
           // 如果没有数据，使用默认的
           setHotTags(['安装问题', '质量问题', '使用方法']);
           return;
        }

        // 统计分类频率
        const categoryCount: Record<string, number> = {};
        items.forEach(item => {
          const cat = item.category?.trim();
          if (cat) {
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
          }
        });

        // 排序并取前3
        const sortedTags = Object.entries(categoryCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([tag]) => tag);

        if (sortedTags.length > 0) {
          setHotTags(sortedTags);
        } else {
          setHotTags(['安装问题', '质量问题', '使用方法']);
        }
      } catch (e) {
        console.error('Failed to calculate hot tags', e);
        setHotTags(['安装问题', '质量问题', '使用方法']);
      }
    };

    calculateHotTags();

    return () => { document.title = originalTitle; };
  }, []);

  const getCombinedResults = (): QueryResult[] => {
    let localItems: KBItem[] = [];
    try {
      localItems = storageGetItems();
    } catch (error) {
      console.error('Failed to get items:', error);
    }
    const mappedLocal: QueryResult[] = localItems.map((i) => ({
      id: String(i.id),
      question: i.problem_description,
      sku: i.sku,
      category: i.category || '未分类',
      problemLevel: i.problem_level || 'P3',
      carModel: i.vehicle_model || '通用',
      time: i.update_time,
      standardAnswer: i.standard_answer,
      internalSolution: i.internal_solution,
      viewCount: 0,
      likeCount: 0,
      attachmentCount: Array.isArray(i.attachment_urls) ? i.attachment_urls.length : 0,
    }));
    return [...mockResults, ...mappedLocal];
  };

  const handleQuerySubmit = () => {
    const queryText = queryInputValue.trim();
    if (!queryText) return;
    setIsSearching(true);
    setTimeout(() => {
      const all = getCombinedResults();
      const docs: SearchDoc[] = all.map((r) => ({
        id: r.id,
        text: [
          r.question,
          r.standardAnswer,
          r.internalSolution,
          `SKU:${r.sku}`,
          `车型:${r.carModel}`,
        ].join('  '),
      }));
      const results = localSearch(queryText, docs, 100);
      const idToResult = new Map(all.map((r) => [r.id, r]));
      const ordered = results
        .map((res) => idToResult.get(res.id))
        .filter((r): r is QueryResult => Boolean(r));
      setDisplayResults(ordered);
      setResultCount(ordered.length);
      setCurrentPage(1); // Reset to first page on new search
      setShowResults(ordered.length > 0);
      setShowNoResults(ordered.length === 0);
      setIsSearching(false);
    }, 300);
  };

  const handleQueryInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleQuerySubmit();
    }
  };

  const handleSuggestionClick = (question: string) => {
    setQueryInputValue(question);
    handleQuerySubmit();
  };

  const handleVoiceInputClick = () => {
    setIsVoiceRecording(true);
    setTimeout(() => {
      setIsVoiceRecording(false);
      if (import.meta.env.DEV) {
        console.log('语音识别功能正在开发中...');
      }
    }, 2000);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
    const sorted = [...displayResults];
    if (e.target.value === 'time') {
      sorted.sort((a, b) => (a.time > b.time ? -1 : 1));
    }
    setDisplayResults(sorted);
  };

  const handleDetailClick = (questionId: string) => {
    navigate(`/detail?questionId=${questionId}`);
  };

  const handleAddQuestionClick = () => {
    navigate('/add');
  };

  const handlePaginationClick = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(resultCount / itemsPerPage);
  const currentResults = displayResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const generatePageNumbers = () => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
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
              <span className="text-text-primary font-medium">问题查询</span>
            </nav>
            
            {/* 页面标题 */}
            <h2 className="text-2xl font-bold text-text-primary">问题查询</h2>
            <p className="text-text-secondary mt-1">输入您遇到的售后问题，AI将为您匹配最佳解决方案</p>
          </div>

          {/* 查询区域 */}
          <section className="max-w-4xl mx-auto mb-8">
            <div className="bg-gradient-card rounded-2xl shadow-card p-8">
              <div className="text-center mb-6">
                <i className="fas fa-robot text-4xl text-secondary mb-4"></i>
                <h3 className="text-lg font-semibold text-text-primary mb-2">智能问题匹配</h3>
                <p className="text-text-secondary">请详细描述您遇到的售后问题，AI将为您快速匹配解决方案</p>
              </div>
              
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={queryInputValue}
                    onChange={(e) => setQueryInputValue(e.target.value)}
                    onKeyPress={handleQueryInputKeyPress}
                    placeholder="请输入您的问题，例如：货架安装不上怎么办？"
                    className={`w-full px-6 py-4 pr-12 border border-gray-200 rounded-xl ${styles.queryInputFocus} text-text-primary placeholder-text-secondary bg-white/50 backdrop-blur-sm`}
                  />
                  <button 
                    onClick={handleVoiceInputClick}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-secondary transition-colors"
                  >
                    <i className={`fas ${isVoiceRecording ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                  </button>
                </div>
                <button 
                  onClick={handleQuerySubmit}
                  disabled={isSearching}
                  className="px-8 py-4 bg-gradient-button text-white font-medium rounded-xl shadow-button hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  <i className={`fas ${isSearching ? 'fa-spinner fa-spin' : 'fa-search'} mr-2`}></i>
                  {isSearching ? '查询中...' : '查询'}
                </button>
              </div>
              
              {/* 查询建议 */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-text-secondary">热门问题：</span>
                {hotTags.map((tag, index) => (
                  <button 
                    key={index}
                    onClick={() => handleSuggestionClick(tag)}
                    className="px-3 py-1 text-sm bg-white/60 text-text-secondary rounded-full hover:bg-secondary hover:text-white transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 查询结果区域 */}
          {showResults && (
            <section className="max-w-6xl mx-auto">
              {/* 结果统计 */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-primary">查询结果</h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-text-secondary">
                      找到 <span className="font-medium text-text-primary">{resultCount}</span> 个相关结果
                    </span>
                    <select 
                      value={sortBy}
                      onChange={handleSortChange}
                      className="px-3 py-1 text-sm border border-gray-200 rounded-lg bg-white/60 text-text-secondary"
                    >
                      <option value="relevance">按相关性排序</option>
                      <option value="time">按时间排序</option>
                    </select>
                  </div>
                </div>
              </div>

          {/* 结果列表 */}
          <div className="space-y-4">
            {currentResults.map((result) => (
              <div 
                key={result.id}
                className={`bg-gradient-card rounded-xl shadow-card p-6 ${styles.resultCardHover} transition-all`}
              >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-text-primary mb-2">{result.question}</h4>
                        <div className="flex items-center space-x-4 text-sm text-text-secondary mb-3">
                          <span><i className="fas fa-tag mr-1"></i>SKU: {result.sku}</span>
                          <span><i className="fas fa-car mr-1"></i>车型: {result.carModel}</span>
                          <span><i className="fas fa-clock mr-1"></i>{result.time}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDetailClick(result.id)}
                        className="px-4 py-2 bg-gradient-button text-white text-sm rounded-lg hover:shadow-lg transition-all"
                      >
                        详情
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                    <h5 className="font-medium text-text-primary mb-2">标准回答</h5>
                    <p className="text-sm text-text-secondary leading-relaxed">{result.standardAnswer}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-text-primary mb-2">内部解决方案</h5>
                    <p className="text-sm text-text-secondary leading-relaxed">{result.internalSolution}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/50">
                  <div className="flex items-center space-x-4 text-sm text-text-secondary">
                    <span><i className="fas fa-folder mr-1"></i>{result.category}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      result.problemLevel === 'P0' ? 'bg-red-100 text-red-600' :
                      result.problemLevel === 'P1' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>{result.problemLevel}</span>
                    {result.attachmentCount > 0 && (
                      <span><i className="fas fa-paperclip mr-1"></i>{result.attachmentCount} 个附件</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-text-secondary hover:text-secondary transition-colors">
                      <i className="fas fa-share-alt"></i>
                    </button>
                    <button className="p-1 text-text-secondary hover:text-secondary transition-colors">
                      <i className="fas fa-bookmark"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center mt-8">
                  <nav className="flex items-center space-x-2">
                    <button 
                      onClick={() => handlePaginationClick(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    
                    {generatePageNumbers().map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePaginationClick(page)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          page === currentPage 
                            ? 'bg-gradient-button text-white shadow-md' 
                            : 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button 
                      onClick={() => handlePaginationClick(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </nav>
                </div>
              )}
            </section>
          )}

          {/* 无结果提示区域 */}
          {showNoResults && (
            <section className="max-w-4xl mx-auto">
              <div className="bg-gradient-card rounded-2xl shadow-card p-8 text-center">
                <i className="fas fa-search-minus text-6xl text-secondary mb-6"></i>
                <h3 className="text-xl font-semibold text-text-primary mb-4">当前知识库无该问题</h3>
                <p className="text-text-secondary mb-6">您查询的问题暂时不在知识库中，建议您：</p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-center space-x-2 text-sm text-text-secondary">
                    <i className="fas fa-check-circle text-green-500"></i>
                    <span>检查问题描述是否准确</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-text-secondary">
                    <i className="fas fa-check-circle text-green-500"></i>
                    <span>尝试更换关键词重新搜索</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-text-secondary">
                    <i className="fas fa-check-circle text-green-500"></i>
                    <span>新增该问题到知识库</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleAddQuestionClick}
                  className="px-6 py-3 bg-gradient-button text-white font-medium rounded-xl shadow-button hover:shadow-lg transition-all"
                >
                  <i className="fas fa-plus-circle mr-2"></i>
                  新增问题
                </button>
              </div>
            </section>
          )}
        </Layout>
  );
};

export default PQueryPage;
