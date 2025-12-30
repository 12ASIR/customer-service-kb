

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import Layout from '../../components/Layout';
import { saveItem, KBItem } from '../../utils/storage';

interface FormData {
  sku: string;
  vehicleModel: string;
  category: string;
  problemLevel: string;
  problemType: string;
  problemDescription: string;
  standardAnswer: string;
  internalSolution: string;
  commonMistakes: string;
}

type FormErrors = Partial<FormData>;

interface UploadedFile {
  file: File;
  id: string;
  previewUrl?: string;
}

// 将图片文件转为Base64，非图片返回null
const fileToDataURL = (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

const AddQuestionPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 状态管理
  const [formData, setFormData] = useState<FormData>({
    sku: '',
    vehicleModel: '',
    category: '',
    problemLevel: '',
    problemType: '',
    problemDescription: '',
    standardAnswer: '',
    internalSolution: '',
    commonMistakes: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 设置页面标题
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '新增售后问题 - 售后问题知识库';
    return () => {
      document.title = originalTitle;
    };
  }, []);

  // 表单输入处理
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除对应字段的错误信息
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 验证文件类型
  const isValidFileType = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov'];
    return allowedTypes.includes(file.type);
  };

  // 验证文件大小
  const isValidFileSize = (file: File): boolean => {
    const maxImageSize = 50 * 1024 * 1024; // 50MB
    const maxVideoSize = 200 * 1024 * 1024; // 200MB
    
    if (file.type.startsWith('image/')) {
      return file.size <= maxImageSize;
    } else if (file.type.startsWith('video/')) {
      return file.size <= maxVideoSize;
    }
    return false;
  };

  // 检查重复文件
  const isDuplicateFile = (file: File): boolean => {
    return uploadedFiles.some(f => f.file.name === file.name && f.file.size === file.size);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 处理文件上传
  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      // 验证文件类型
      if (!isValidFileType(file)) {
        alert('不支持的文件格式，请选择图片或视频文件');
        return;
      }

      // 验证文件大小
      if (!isValidFileSize(file)) {
        alert(`文件 ${file.name} 大小超过限制`);
        return;
      }

      // 检查重复文件
      if (isDuplicateFile(file)) {
        alert(`文件 ${file.name} 已存在`);
        return;
      }

      // 添加文件到列表
      const newFile: UploadedFile = {
        file,
        id: Date.now() + Math.random().toString(36).slice(2, 11),
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };
      setUploadedFiles(prev => [...prev, newFile]);
    });
  };

  // 点击上传区域
  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  // 文件选择处理
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // 移除文件
  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  // 表单验证
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    // 验证SKU
    if (!formData.sku.trim()) {
      errors.sku = '请输入SKU编码';
      isValid = false;
    }
    // 验证品类
    if (!formData.category.trim()) {
      errors.category = '请输入品类';
      isValid = false;
    }

    // 验证问题类型
    if (!formData.problemType) {
      errors.problemType = '请选择问题类型';
      isValid = false;
    }

    // 验证问题描述
    if (!formData.problemDescription.trim()) {
      errors.problemDescription = '请填写问题描述';
      isValid = false;
    } else if (formData.problemDescription.trim().length < 10) {
      errors.problemDescription = '问题描述至少需要10个字符';
      isValid = false;
    }

    // 验证标准回答
    if (!formData.standardAnswer.trim()) {
      errors.standardAnswer = '请填写标准回答';
      isValid = false;
    }

    // 验证内部解决方案
    if (!formData.internalSolution.trim()) {
      errors.internalSolution = '请填写内部解决方案';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // 表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    // 转换图片附件为Base64
    const imageDataUrls: string[] = [];
    for (const f of uploadedFiles) {
      const dataUrl = await fileToDataURL(f.file);
      if (dataUrl) imageDataUrls.push(dataUrl);
    }
    
    // 生成知识库条目，并写入localStorage
    const newItem: KBItem = {
      id: String(Date.now()),
      sku: formData.sku,
      category: formData.category,
      vehicle_model: formData.vehicleModel || '通用',
      problem_level: formData.problemLevel || '通用',
      problem_type: formData.problemType,
      problem_description: formData.problemDescription,
      standard_answer: formData.standardAnswer,
      internal_solution: formData.internalSolution,
      common_mistakes: formData.commonMistakes || '/',
      update_time: new Date().toISOString().slice(0, 16).replace('T', ' '),
      attachments: imageDataUrls.length,
      attachment_urls: imageDataUrls,
    };
    
    try {
      await saveItem(newItem);
      alert('保存成功！');
      navigate('/manage');
    } catch (e) {
      console.error('Save failed', e);
      alert('保存失败，请重试');
    }
  };

  // 取消操作
  const handleCancel = () => {
    if (confirm('确定要取消吗？未保存的内容将丢失。')) {
      navigate('/query');
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent, nextField?: () => void) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      nextField?.();
    }
  };

  const handleInternalSolutionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <Layout>
      {/* 页面头部 */}
      <div className="mb-8">
        {/* 面包屑导航 */}
            <nav className="text-sm text-text-secondary mb-4">
              <Link to="/query" className="hover:text-text-primary transition-colors">首页</Link>
              <i className="fas fa-chevron-right mx-2"></i>
              <Link to="/query" className="hover:text-text-primary transition-colors">问题查询</Link>
              <i className="fas fa-chevron-right mx-2"></i>
              <span className="text-text-primary font-medium">新增问题</span>
            </nav>
            
            {/* 页面标题 */}
            <h2 className="text-2xl font-bold text-text-primary">新增售后问题</h2>
            <p className="text-text-secondary mt-1">请填写详细的问题信息，以便其他客服人员能够快速找到解决方案</p>
          </div>

          {/* 表单区域 */}
          <section className="max-w-4xl mx-auto">
            <div className="bg-gradient-card rounded-2xl shadow-card p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 基本信息区域 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-text-primary border-b border-gray-200/50 pb-2">基本信息</h3>
                  
                  {/* SKU */}
                  <div className="space-y-2">
                    <label htmlFor="sku" className="block text-sm font-medium text-text-primary">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="sku" 
                      name="sku" 
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, () => document.getElementById('vehicle-model')?.focus())}
                      className={`w-full px-4 py-3 border ${formErrors.sku ? 'border-red-500' : 'border-gray-200'} rounded-xl ${styles.formInputFocus} text-text-primary placeholder-text-secondary bg-white/50 backdrop-blur-sm`}
                      placeholder="请输入产品SKU编码，例如：AP-SHELF-001"
                      required
                    />
                    {formErrors.sku && <div className={styles.errorMessage}>{formErrors.sku}</div>}
                  </div>

                  {/* 品类 */}
                  <div className="space-y-2">
                    <label htmlFor="category" className="block text-sm font-medium text-text-primary">
                      品类 <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="category" 
                      name="category" 
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className={`w-full px-4 py-3 border ${formErrors.category ? 'border-red-500' : 'border-gray-200'} rounded-xl ${styles.formInputFocus} text-text-primary placeholder-text-secondary bg-white/50 backdrop-blur-sm`}
                      placeholder="请输入品类，例如：保险杠、行李架"
                      required
                    />
                    {formErrors.category && <div className={styles.errorMessage}>{formErrors.category}</div>}
                  </div>

                  {/* 车型 */}
                  <div className="space-y-2">
                    <label htmlFor="vehicle-model" className="block text-sm font-medium text-text-primary">
                      车型 <span className="text-text-secondary">(建议填写)</span>
                    </label>
                    <input 
                      type="text" 
                      id="vehicle-model" 
                      name="vehicle-model" 
                      value={formData.vehicleModel}
                      onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, () => document.getElementById('problem-type')?.focus())}
                      className={`w-full px-4 py-3 border border-gray-200 rounded-xl ${styles.formInputFocus} text-text-primary placeholder-text-secondary bg-white/50 backdrop-blur-sm`}
                      placeholder="请输入适用车型，例如：大众途观L"
                    />
                  </div>

                  {/* 问题层级 */}
                  <div className="space-y-2">
                    <label htmlFor="problem-level" className="block text-sm font-medium text-text-primary">
                      问题层级
                    </label>
                    <select 
                      id="problem-level" 
                      name="problem-level" 
                      value={formData.problemLevel}
                      onChange={(e) => handleInputChange('problemLevel', e.target.value)}
                      className={`w-full px-4 py-3 border border-gray-200 rounded-xl ${styles.formInputFocus} text-text-primary bg-white/50 backdrop-blur-sm`}
                    >
                      <option value="">请选择问题层级</option>
                      <option value="SKU专属">SKU专属</option>
                      <option value="通用">通用</option>
                    </select>
                  </div>

                  {/* 问题类型 */}
                  <div className="space-y-2">
                    <label htmlFor="problem-type" className="block text-sm font-medium text-text-primary">
                      问题类型 <span className="text-red-500">*</span>
                    </label>
                    <select 
                      id="problem-type" 
                      name="problem-type" 
                      value={formData.problemType}
                      onChange={(e) => handleInputChange('problemType', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, () => document.getElementById('problem-description')?.focus())}
                      className={`w-full px-4 py-3 border ${formErrors.problemType ? 'border-red-500' : 'border-gray-200'} rounded-xl ${styles.formInputFocus} text-text-primary bg-white/50 backdrop-blur-sm`}
                      required
                    >
                      <option value="">请选择问题类型</option>
                      <option value="installation">安装问题</option>
                      <option value="quality">质量问题</option>
                      <option value="usage">使用方法</option>
                      <option value="compatibility">兼容性问题</option>
                      <option value="warranty">保修政策</option>
                      <option value="other">其他</option>
                    </select>
                    {formErrors.problemType && <div className={styles.errorMessage}>{formErrors.problemType}</div>}
                  </div>
                </div>

                {/* 问题描述区域 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-text-primary border-b border-gray-200/50 pb-2">问题描述</h3>
                  
                  <div className="space-y-2">
                    <label htmlFor="problem-description" className="block text-sm font-medium text-text-primary">
                      具体问题描述 <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      id="problem-description" 
                      name="problem-description" 
                      rows={4}
                      value={formData.problemDescription}
                      onChange={(e) => handleInputChange('problemDescription', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, () => document.getElementById('standard-answer')?.focus())}
                      className={`w-full px-4 py-3 border ${formErrors.problemDescription ? 'border-red-500' : 'border-gray-200'} rounded-xl ${styles.formInputFocus} text-text-primary placeholder-text-secondary bg-white/50 backdrop-blur-sm resize-none`}
                      placeholder="请详细描述客户遇到的具体问题，包括症状、错误信息、使用场景等"
                      required
                    />
                    {formErrors.problemDescription && <div className={styles.errorMessage}>{formErrors.problemDescription}</div>}
                    <div className="text-xs text-text-secondary">
                      <i className="fas fa-info-circle mr-1"></i>
                      建议包含：问题现象、发生时间、使用环境、错误信息等
                    </div>
                  </div>
                  </div>

                {/* 解决方案区域 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-text-primary border-b border-gray-200/50 pb-2">解决方案</h3>
                  
                  {/* 标准回答 */}
                  <div className="space-y-2">
                    <label htmlFor="standard-answer" className="block text-sm font-medium text-text-primary">
                      标准回答 <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      id="standard-answer" 
                      name="standard-answer" 
                      rows={4}
                      value={formData.standardAnswer}
                      onChange={(e) => handleInputChange('standardAnswer', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, () => document.getElementById('internal-solution')?.focus())}
                      className={`w-full px-4 py-3 border ${formErrors.standardAnswer ? 'border-red-500' : 'border-gray-200'} rounded-xl ${styles.formInputFocus} text-text-primary placeholder-text-secondary bg-white/50 backdrop-blur-sm resize-none`}
                      placeholder="请填写对客户的标准回答内容，确保专业、友好、准确"
                      required
                    />
                    {formErrors.standardAnswer && <div className={styles.errorMessage}>{formErrors.standardAnswer}</div>}
                  </div>

                  {/* 内部解决方案 */}
                  <div className="space-y-2">
                    <label htmlFor="internal-solution" className="block text-sm font-medium text-text-primary">
                      内部解决方案 <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      id="internal-solution" 
                      name="internal-solution" 
                      rows={4}
                      value={formData.internalSolution}
                      onChange={(e) => handleInputChange('internalSolution', e.target.value)}
                      onKeyDown={handleInternalSolutionKeyPress}
                      className={`w-full px-4 py-3 border ${formErrors.internalSolution ? 'border-red-500' : 'border-gray-200'} rounded-xl ${styles.formInputFocus} text-text-primary placeholder-text-secondary bg-white/50 backdrop-blur-sm resize-none`}
                      placeholder="请填写内部处理方案，包括排查步骤、解决方法、注意事项等"
                      required
                    />
                    {formErrors.internalSolution && <div className={styles.errorMessage}>{formErrors.internalSolution}</div>}
                  </div>

                  {/* 常见错误规避 */}
                  <div className="space-y-2">
                    <label htmlFor="common-mistakes" className="block text-sm font-medium text-text-primary">
                      常见错误规避
                    </label>
                    <textarea 
                      id="common-mistakes" 
                      name="common-mistakes" 
                      rows={3}
                      value={formData.commonMistakes}
                      onChange={(e) => handleInputChange('commonMistakes', e.target.value)}
                      className={`w-full px-4 py-3 border border-gray-200 rounded-xl ${styles.formInputFocus} text-text-primary placeholder-text-secondary bg-white/50 backdrop-blur-sm resize-none`}
                      placeholder="例如：安装时注意孔位匹配；避免过度拧紧螺丝等"
                    />
                  </div>
                </div>

                {/* 附件上传区域 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-text-primary border-b border-gray-200/50 pb-2">附件上传</h3>
                  
                  {/* 上传区域 */}
                  <div 
                    onClick={handleUploadAreaClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`${styles.uploadArea} ${isDragOver ? styles.uploadAreaDragover : ''} rounded-xl p-6 text-center cursor-pointer`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      multiple 
                      accept="image/*,video/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    <i className="fas fa-cloud-upload-alt text-4xl text-secondary mb-4"></i>
                    <h4 className="text-lg font-medium text-text-primary mb-2">点击上传或拖拽文件到此处</h4>
                    <p className="text-sm text-text-secondary mb-4">
                      支持图片和视频格式，单个图片最大50MB，单个视频最大200MB
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-xs text-text-secondary">
                      <span><i className="fas fa-image mr-1"></i>支持 JPG、PNG、GIF</span>
                      <span><i className="fas fa-video mr-1"></i>支持 MP4、AVI、MOV</span>
                    </div>
                  </div>

                  {/* 已上传文件列表 */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-text-primary">已上传文件</h5>
                      <div className="space-y-2">
                        {uploadedFiles.map((uploadedFile) => (
                          <div key={uploadedFile.id} className={`${styles.fileItem} flex items-center justify-between p-3 border border-gray-200 rounded-lg`}>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-button rounded-lg flex items-center justify-center overflow-hidden">
                        {uploadedFile.previewUrl ? (
                          <img src={uploadedFile.previewUrl} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <i className={`fas ${uploadedFile.file.type.startsWith('image/') ? 'fa-image' : 'fa-video'} text-white text-sm`}></i>
                        )}
                      </div>
                              <div>
                                <div className="text-sm font-medium text-text-primary">{uploadedFile.file.name}</div>
                                <div className="text-xs text-text-secondary">{formatFileSize(uploadedFile.file.size)} • {uploadedFile.file.type}</div>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveFile(uploadedFile.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </form>
            </div>
          </section>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10 lg:pl-64">
        <div className="max-w-4xl mx-auto flex items-center justify-end space-x-4">
          <button 
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 text-text-secondary hover:text-text-primary transition-colors font-medium"
          >
            取消
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-2 bg-gradient-button text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                提交中...
              </>
            ) : (
              <>
                <i className="fas fa-check mr-2"></i>
                提交问题
              </>
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default AddQuestionPage;
