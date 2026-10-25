import React, { useState, useRef } from 'react';
import { UploadCloud, FileCode, CheckCircle2, AlertCircle, Globe, Files, X, Plus } from 'lucide-react';
import { BrutalModal, BrutalButton, BrutalInput } from '../brutal';
import { cn } from '../../lib/utils';

/**
 * UploadModal
 * Yellow Brutalist multi-source ingestion dialog supporting:
 *   - Mode 1: Multi-file Batch Drag & Drop Queue
 *   - Mode 2: Institutional Web Notice / Portal URL Crawler
 *   - Document Category tagging (Policy, Syllabus, Circular, Table)
 */
export default function UploadModal({
  show,
  onClose,
  departments,
  uploadDeptId,
  setUploadDeptId,
  uploadTitle,
  setUploadTitle,
  fileToUpload,
  setFileToUpload,
  filesList = [],
  setFilesList,
  urlToUpload = '',
  setUrlToUpload,
  uploadCategory = 'notice',
  setUploadCategory,
  uploadLoading,
  uploadProgress,
  batchProgress = null,
  uploadMsg,
  onSubmit,
}) {
  const [activeTab, setActiveTab] = useState('files'); // 'files' | 'url'
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const categories = [
    { id: 'notice', label: '📢 Examination / Office Circular' },
    { id: 'policy', label: '📜 Academic Regulation (Policy)' },
    { id: 'syllabus', label: '📚 Curriculum & Course Syllabus' },
    { id: 'table', label: '📊 Fee / Grading Matrix Table' },
  ];

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const incoming = Array.from(e.dataTransfer.files);
      if (setFilesList) {
        setFilesList((prev) => [...prev, ...incoming].slice(0, 15));
      } else if (setFileToUpload) {
        setFileToUpload(incoming[0]);
      }
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const incoming = Array.from(e.target.files);
      if (setFilesList) {
        setFilesList((prev) => [...prev, ...incoming].slice(0, 15));
      } else if (setFileToUpload) {
        setFileToUpload(incoming[0]);
      }
    }
  };

  const removeFileFromList = (index) => {
    if (setFilesList) {
      setFilesList((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const totalFiles = filesList.length > 0 ? filesList.length : fileToUpload ? 1 : 0;

  return (
    <BrutalModal
      isOpen={show}
      onClose={onClose}
      title="Ingest Institutional Knowledge"
      subtitle="Multi-modal ingestion gateway: batch documents or direct portal links."
      size="md"
    >
      <form onSubmit={(e) => onSubmit(e, activeTab)} className="flex flex-col gap-4">
        
        {/* Source Switcher Tabs */}
        <div className="flex border-2 border-brutal-black dark:border-brutal-yellow p-1 bg-brutal-paper dark:bg-brutal-dark gap-1 select-none">
          <button
            type="button"
            onClick={() => !uploadLoading && setActiveTab('files')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-1.5 px-3 font-mono text-xs font-black uppercase transition-all',
              activeTab === 'files'
                ? 'bg-brutal-yellow text-brutal-black border-2 border-brutal-black shadow-brutal-xs'
                : 'text-brutal-black dark:text-brutal-white hover:bg-brutal-yellow/20'
            )}
          >
            <Files size={14} className="stroke-[2.5]" />
            <span>Files Batch Drop</span>
          </button>

          <button
            type="button"
            onClick={() => !uploadLoading && setActiveTab('url')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-1.5 px-3 font-mono text-xs font-black uppercase transition-all',
              activeTab === 'url'
                ? 'bg-brutal-yellow text-brutal-black border-2 border-brutal-black shadow-brutal-xs'
                : 'text-brutal-black dark:text-brutal-white hover:bg-brutal-yellow/20'
            )}
          >
            <Globe size={14} className="stroke-[2.5]" />
            <span>Web Portal URL</span>
          </button>
        </div>

        {/* Status Notification */}
        {uploadMsg && (
          <div
            className={cn(
              'p-3 border-2 font-mono text-xs flex items-center gap-2 font-bold',
              uploadMsg.type === 'error'
                ? 'bg-brutal-accent/15 border-brutal-accent text-brutal-accent'
                : 'bg-brutal-success/15 border-brutal-success text-brutal-success'
            )}
          >
            {uploadMsg.type === 'error' ? (
              <AlertCircle size={16} className="flex-shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="flex-shrink-0" />
            )}
            <span>{uploadMsg.text}</span>
          </div>
        )}

        {/* Real-time Ingestion Progress Bar */}
        {uploadLoading && uploadProgress && (
          <div className="flex flex-col gap-2 p-3 bg-brutal-paper dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="uppercase text-brutal-black dark:text-brutal-white tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brutal-yellow border border-brutal-black animate-pulse" />
                {uploadProgress.phase || 'Ingesting'}: {uploadProgress.message || 'Processing asset...'}
              </span>
              <span className="text-brutal-black dark:text-brutal-yellow font-black">
                {uploadProgress.progress || 0}%
              </span>
            </div>
            
            <div className="w-full h-3 bg-brutal-white dark:bg-brutal-dark border-2 border-brutal-black dark:border-brutal-yellow overflow-hidden relative">
              <div
                className="h-full bg-brutal-yellow border-r-2 border-brutal-black transition-all duration-300 ease-out"
                style={{ width: `${Math.max(4, Math.min(100, uploadProgress.progress || 0))}%` }}
              />
            </div>

            {batchProgress && (
              <div className="font-mono text-[11px] font-bold text-brutal-muted dark:text-brutal-muted-dark flex justify-between">
                <span>Batch Queue Item {batchProgress.current} of {batchProgress.total}</span>
                <span>{batchProgress.filename}</span>
              </div>
            )}
          </div>
        )}

        {/* Target Department & Category Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Department */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] font-black uppercase text-brutal-black dark:text-brutal-white tracking-wider">
              Department Scope
            </label>
            <div className="bg-brutal-paper dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow p-1.5 shadow-brutal-xs">
              <select
                value={uploadDeptId}
                onChange={(e) => setUploadDeptId(e.target.value)}
                required
                disabled={uploadLoading}
                className="w-full bg-transparent font-mono text-xs font-bold uppercase text-brutal-black dark:text-brutal-white outline-none cursor-pointer border-none p-0"
              >
                {departments.map((d) => (
                  <option
                    key={d.id}
                    value={d.id}
                    className="bg-brutal-white dark:bg-brutal-dark text-brutal-black dark:text-brutal-white"
                  >
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] font-black uppercase text-brutal-black dark:text-brutal-white tracking-wider">
              Document Category
            </label>
            <div className="bg-brutal-paper dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow p-1.5 shadow-brutal-xs">
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory && setUploadCategory(e.target.value)}
                disabled={uploadLoading}
                className="w-full bg-transparent font-mono text-xs font-bold uppercase text-brutal-black dark:text-brutal-white outline-none cursor-pointer border-none p-0"
              >
                {categories.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    className="bg-brutal-white dark:bg-brutal-dark text-brutal-black dark:text-brutal-white"
                  >
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Title Input */}
        <BrutalInput
          label="Display Title (Optional Override)"
          placeholder="e.g. Autonomous Regulations Curriculum 2026"
          value={uploadTitle}
          onChange={(e) => setUploadTitle(e.target.value)}
          disabled={uploadLoading}
        />

        {/* Tab 1: Local Files Batch Drop */}
        {activeTab === 'files' && (
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs font-black uppercase text-brutal-black dark:text-brutal-white tracking-wider flex justify-between">
              <span>Document Files (Batch Ingestion)</span>
              {totalFiles > 0 && <span className="text-brutal-black dark:text-brutal-yellow font-black">{totalFiles} file(s) selected</span>}
            </label>

            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => !uploadLoading && fileInputRef.current && fileInputRef.current.click()}
              className={cn(
                'border-3 border-dashed p-5 text-center cursor-pointer transition-all select-none',
                isDragOver
                  ? 'bg-brutal-yellow border-brutal-black scale-[0.99]'
                  : 'bg-brutal-paper dark:bg-brutal-dark-surface border-brutal-black/40 dark:border-brutal-yellow/40 hover:border-brutal-black hover:bg-brutal-yellow/10',
                uploadLoading && 'opacity-60 cursor-not-allowed'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.md,.csv,.png,.jpg,.jpeg,.tiff,.bmp,.webp"
                onChange={handleFileInputChange}
                disabled={uploadLoading}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="w-10 h-10 bg-brutal-paper dark:bg-brutal-dark border-2 border-brutal-black dark:border-brutal-yellow flex items-center justify-center">
                  <UploadCloud size={20} className="text-brutal-black dark:text-brutal-yellow" />
                </div>
                <div className="font-display font-black text-xs uppercase text-brutal-black dark:text-brutal-white">
                  Drop Files Here or Click to Select (Multiple Allowed)
                </div>
                <div className="font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark">
                  PDF, DOCX, XLSX, TXT, CSV, Scanned Circular Images (PNG, JPG, TIFF)
                </div>
              </div>
            </div>

            {/* Selected Files Queue List */}
            {filesList.length > 0 && (
              <div className="max-h-36 overflow-y-auto border-2 border-brutal-black dark:border-brutal-yellow bg-brutal-white dark:bg-brutal-dark divide-y border-t-2">
                {filesList.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-2 text-xs font-mono">
                    <div className="flex items-center gap-2 truncate">
                      <FileCode size={14} className="text-brutal-black dark:text-brutal-yellow flex-shrink-0" />
                      <span className="truncate max-w-[260px] font-bold text-brutal-black dark:text-brutal-white">{f.name}</span>
                      <span className="text-brutal-muted text-[10px]">({Math.round(f.size / 1024)} KB)</span>
                    </div>
                    {!uploadLoading && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFileFromList(i); }}
                        className="text-brutal-accent hover:bg-brutal-accent/10 p-0.5"
                        title="Remove file"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Web Notice URL Crawler */}
        {activeTab === 'url' && (
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs font-black uppercase text-brutal-black dark:text-brutal-white tracking-wider">
              Institutional Portal URL
            </label>
            <BrutalInput
              type="url"
              placeholder="https://kitcoek.in/examination/semester-circular-2026.html"
              value={urlToUpload}
              onChange={(e) => setUrlToUpload && setUrlToUpload(e.target.value)}
              disabled={uploadLoading}
              required={activeTab === 'url'}
            />
            <span className="font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark">
              Crawls web notices, strips headers/scripts, and saves clean structured Markdown to ChromaDB with direct URL source citations.
            </span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20">
          <BrutalButton
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={uploadLoading}
          >
            Cancel
          </BrutalButton>

          <BrutalButton
            type="submit"
            variant="primary"
            size="md"
            disabled={
              uploadLoading ||
              (activeTab === 'files' && totalFiles === 0) ||
              (activeTab === 'url' && (!urlToUpload || !urlToUpload.trim()))
            }
            loading={uploadLoading}
            className="shadow-brutal"
          >
            <span>
              {uploadLoading
                ? 'Processing Ingestion...'
                : activeTab === 'files'
                ? `Ingest ${totalFiles > 1 ? `${totalFiles} Documents` : 'Document'}`
                : 'Crawl & Ingest URL'}
            </span>
          </BrutalButton>
        </div>

      </form>
    </BrutalModal>
  );
}
