import React, { useState, useRef } from 'react';
import { UploadCloud, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { BrutalModal, BrutalButton, BrutalInput } from '../brutal';
import { cn } from '../../lib/utils';

/**
 * UploadModal
 * Yellow Brutalist upload dialog featuring drag-and-drop ingestion zone,
 * target department selector, title override, and progress states.
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
  uploadLoading,
  uploadProgress,
  uploadMsg,
  onSubmit,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

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
      setFileToUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <BrutalModal
      isOpen={show}
      onClose={onClose}
      title="Ingest Institutional Document"
      subtitle="Supported: PDF, DOCX, XLSX, TXT, MD, CSV, Scanned Images (PNG, JPG, TIFF) (Max 50MB)"
      size="md"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        
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
                {uploadProgress.phase || 'Ingesting'}: {uploadProgress.message || 'Processing document...'}
              </span>
              <span className="text-brutal-black dark:text-brutal-yellow font-black">
                {uploadProgress.progress || 0}%
              </span>
            </div>
            
            {/* Brutalist Progress Track */}
            <div className="w-full h-3 bg-brutal-white dark:bg-brutal-dark border-2 border-brutal-black dark:border-brutal-yellow overflow-hidden relative">
              <div
                className="h-full bg-brutal-yellow border-r-2 border-brutal-black transition-all duration-300 ease-out"
                style={{ width: `${Math.max(4, Math.min(100, uploadProgress.progress || 0))}%` }}
              />
            </div>

            {/* Stage Indicators */}
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-brutal-muted dark:text-brutal-muted-dark pt-1">
              <span className={cn(uploadProgress.progress >= 20 && 'text-brutal-black dark:text-brutal-white font-black')}>
                1. Upload
              </span>
              <span>→</span>
              <span className={cn(uploadProgress.progress >= 40 && 'text-brutal-black dark:text-brutal-white font-black')}>
                2. Extract
              </span>
              <span>→</span>
              <span className={cn(uploadProgress.progress >= 60 && 'text-brutal-black dark:text-brutal-white font-black')}>
                3. Chunk
              </span>
              <span>→</span>
              <span className={cn(uploadProgress.progress >= 80 && 'text-brutal-black dark:text-brutal-white font-black')}>
                4. Vectorize
              </span>
            </div>
          </div>
        )}

        {/* Target Department Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs font-black uppercase text-brutal-black dark:text-brutal-white tracking-wider">
            Target Department Scope
          </label>
          <div className="bg-brutal-paper dark:bg-brutal-dark-surface border-2 border-brutal-black dark:border-brutal-yellow shadow-brutal-sm p-2">
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

        {/* Display Title Override */}
        <BrutalInput
          label="Display Title (Optional)"
          placeholder="e.g. Autonomous Regulations Curriculum 2024"
          value={uploadTitle}
          onChange={(e) => setUploadTitle(e.target.value)}
          disabled={uploadLoading}
        />

        {/* Drag and Drop Zone */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs font-black uppercase text-brutal-black dark:text-brutal-white tracking-wider">
            Document Asset File
          </label>

          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !uploadLoading && fileInputRef.current && fileInputRef.current.click()}
            className={cn(
              'border-3 border-dashed p-6 text-center cursor-pointer transition-all select-none',
              isDragOver
                ? 'bg-brutal-yellow border-brutal-black scale-[0.99]'
                : fileToUpload
                ? 'bg-brutal-white dark:bg-brutal-dark-surface border-brutal-black dark:border-brutal-yellow shadow-brutal-sm'
                : 'bg-brutal-paper dark:bg-brutal-dark-surface border-brutal-black/40 dark:border-brutal-yellow/40 hover:border-brutal-black hover:bg-brutal-yellow/10',
              uploadLoading && 'opacity-60 cursor-not-allowed'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.md,.csv,.png,.jpg,.jpeg,.tiff,.bmp,.webp"
              onChange={(e) => setFileToUpload(e.target.files[0] || null)}
              disabled={uploadLoading}
              className="hidden"
            />

            {fileToUpload ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 bg-brutal-yellow border-2 border-brutal-black flex items-center justify-center flex-shrink-0">
                  <FileCode size={20} className="text-brutal-black" strokeWidth={2.5} />
                </div>
                <div className="text-left min-w-0">
                  <div className="font-sans font-bold text-sm text-brutal-black dark:text-brutal-white truncate max-w-xs">
                    {fileToUpload.name}
                  </div>
                  <div className="font-mono text-[11px] text-brutal-muted dark:text-brutal-muted-dark">
                    {Math.round(fileToUpload.size / 1024)} KB • Click to change
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 bg-brutal-paper dark:bg-brutal-dark border-2 border-brutal-black dark:border-brutal-yellow flex items-center justify-center">
                  <UploadCloud size={24} className="text-brutal-black dark:text-brutal-yellow" />
                </div>
                <div className="font-display font-black text-sm uppercase text-brutal-black dark:text-brutal-white">
                  Drop Institutional Document Here
                </div>
                <div className="font-mono text-[11px] text-brutal-muted dark:text-brutal-muted-dark">
                  or click to browse local storage
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-brutal-black/20 dark:border-brutal-yellow/20">
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
            disabled={uploadLoading || !fileToUpload}
            loading={uploadLoading}
            className="shadow-brutal"
          >
            <span>{uploadLoading ? (uploadProgress ? `Ingesting (${uploadProgress.progress}%)` : 'Ingesting...') : 'Upload & Ingest'}</span>
          </BrutalButton>
        </div>

      </form>
    </BrutalModal>
  );
}
