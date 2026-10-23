import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { uiCache } from '../utils/uiCache';
import DocumentsHeader from '../components/documents/DocumentsHeader';
import DocumentFilters from '../components/documents/DocumentFilters';
import DocumentTable from '../components/documents/DocumentTable';
import UploadModal from '../components/documents/UploadModal';
import ChunkInspectorModal from '../components/documents/ChunkInspectorModal';
import { BrutalSkeleton, BrutalEmptyState, BrutalToast } from '../components/brutal';

/**
 * DocumentsView
 * Yellow Brutalist modular knowledge base and multi-modal ingestion view.
 */
export default function DocumentsView() {
  const cached = uiCache.get(uiCache.KEYS.DOCUMENTS, {});

  const { user, hasPermission } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(cached.selectedDept || '');
  const [activeFilterTab, setActiveFilterTab] = useState(cached.activeFilterTab || 'all'); // 'all' | 'pending'
  const [pendingDocs, setPendingDocs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toast feedback state
  const [toast, setToast] = useState(null);

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDeptId, setUploadDeptId] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);

  // Inspector modal state
  const [inspectDoc, setInspectDoc] = useState(null);

  const canWrite = hasPermission('documents:write');
  const canDelete = hasPermission('documents:delete');
  const isApprover = user?.roles?.some((r) => ['platform_admin', 'dept_admin'].includes(r.code));

  useEffect(() => {
    uiCache.set(uiCache.KEYS.DOCUMENTS, {
      selectedDept,
      activeFilterTab,
    });
  }, [selectedDept, activeFilterTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = [
        api.getDocuments(selectedDept || null),
        api.getDepartments(),
      ];
      if (isApprover) {
        promises.push(api.getPendingDocuments().catch(() => []));
      }
      const [docsData, deptsData, pendingData = []] = await Promise.all(promises);
      setDocuments(docsData || []);
      setDepartments(deptsData || []);
      setPendingDocs(pendingData || []);
      if (!uploadDeptId && deptsData && deptsData.length > 0) {
        setUploadDeptId(user?.primary_department_id || deptsData[0].id);
      }
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to load documents catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDept]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return;

    setUploadLoading(true);
    setUploadMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('department_id', uploadDeptId);
      if (uploadTitle.trim()) {
        formData.append('title', uploadTitle.trim());
      }

      const res = await api.uploadDocument(formData);
      const msg = res?.message || 'Document ingested and parsed successfully!';
      setUploadMsg({ type: 'success', text: msg });
      setToast({ message: msg, type: 'success' });
      setFileToUpload(null);
      setUploadTitle('');
      await fetchData();
      setTimeout(() => {
        setShowUpload(false);
        setUploadMsg(null);
      }, 1200);
    } catch (err) {
      setUploadMsg({ type: 'error', text: err?.message || 'Upload failed.' });
      setToast({ message: err?.message || 'Upload failed.', type: 'error' });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (docId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      await api.deleteDocument(docId);
      setToast({ message: `Document "${title}" deleted permanently.`, type: 'info' });
      await fetchData();
    } catch (err) {
      setToast({ message: `Deletion failed: ${err?.message}`, type: 'error' });
    }
  };

  const handleInspect = async (docId) => {
    try {
      const docDetails = await api.getDocument(docId);
      setInspectDoc(docDetails);
    } catch (err) {
      setToast({ message: `Failed to load chunk inspector: ${err?.message}`, type: 'error' });
    }
  };

  const handleReview = async (docId, decision) => {
    const notes = window.prompt(`Enter optional review notes for ${decision}:`) || '';
    try {
      await api.reviewDocument(docId, decision, notes);
      setToast({ message: `Document marked as ${decision}.`, type: 'success' });
      await fetchData();
    } catch (err) {
      setToast({ message: `Review action failed: ${err?.message}`, type: 'error' });
    }
  };

  // Filter current document list based on active tab and search query
  const rawDocs = activeFilterTab === 'pending' ? pendingDocs : documents;
  const filteredDocs = rawDocs.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(q) ||
      doc.filename?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full">
      {/* Toast Notification */}
      {toast && (
        <BrutalToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* View Header */}
      <DocumentsHeader
        totalDocs={documents.length}
        pendingCount={pendingDocs.length}
        canWrite={canWrite}
        onOpenUpload={() => setShowUpload(true)}
      />

      {/* Filters & Search Toolbar */}
      <DocumentFilters
        activeFilterTab={activeFilterTab}
        setActiveFilterTab={setActiveFilterTab}
        allCount={documents.length}
        pendingCount={pendingDocs.length}
        isApprover={isApprover}
        selectedDept={selectedDept}
        setSelectedDept={setSelectedDept}
        departments={departments}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Table or Loading/Empty States */}
      {loading ? (
        <div className="space-y-4">
          <BrutalSkeleton count={6} height="h-14" />
        </div>
      ) : error ? (
        <div className="p-6 bg-brutal-accent/15 border-3 border-brutal-accent text-brutal-black dark:text-brutal-white font-mono text-sm">
          <span className="font-bold">Error loading catalog:</span> {error}
        </div>
      ) : filteredDocs.length === 0 ? (
        <BrutalEmptyState
          title={
            searchQuery
              ? 'No Matching Documents'
              : activeFilterTab === 'pending'
              ? 'No Documents Awaiting Review'
              : 'No Institutional Documents Found'
          }
          description={
            searchQuery
              ? `No documents matched the search term "${searchQuery}".`
              : activeFilterTab === 'pending'
              ? 'All uploaded circulars and syllabi have been approved and indexed.'
              : 'Upload academic regulations, departmental syllabi, or course notices to trigger automated chunking.'
          }
          actionLabel={canWrite && activeFilterTab !== 'pending' && !searchQuery ? 'Upload Document' : undefined}
          onAction={canWrite ? () => setShowUpload(true) : undefined}
        />
      ) : (
        <DocumentTable
          documents={filteredDocs}
          departments={departments}
          isApprover={isApprover}
          canDelete={canDelete}
          onInspect={handleInspect}
          onReview={handleReview}
          onDelete={handleDelete}
        />
      )}

      {/* Ingestion & Inspection Modals */}
      <UploadModal
        show={showUpload}
        onClose={() => setShowUpload(false)}
        departments={departments}
        uploadDeptId={uploadDeptId}
        setUploadDeptId={setUploadDeptId}
        uploadTitle={uploadTitle}
        setUploadTitle={setUploadTitle}
        fileToUpload={fileToUpload}
        setFileToUpload={setFileToUpload}
        uploadLoading={uploadLoading}
        uploadMsg={uploadMsg}
        onSubmit={handleUploadSubmit}
      />

      <ChunkInspectorModal
        inspectDoc={inspectDoc}
        onClose={() => setInspectDoc(null)}
      />
    </div>
  );
}
