'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, AlertTriangle } from 'lucide-react';

interface LegalDoc {
  id: string;
  document_type: string;
  version_number: string;
  title: string;
  body: string;
  effective_date: string;
  requires_reacceptance: boolean;
  status: string;
  published_at: string | null;
}

interface LegalEditorProps {
  doc: LegalDoc | null;
  docType: 'terms' | 'privacy';
  onClose: () => void;
  onSaved: () => void;
}

function LegalEditor({ doc, docType, onClose, onSaved }: LegalEditorProps) {
  const supabase = createClient();
  const [title, setTitle] = useState(doc?.title || (docType === 'terms' ? 'Terms of Service' : 'Privacy Policy'));
  const [body, setBody] = useState(doc?.body || '');
  const [effectiveDate, setEffectiveDate] = useState(doc?.effective_date || new Date().toISOString().split('T')[0]);
  const [versionNumber, setVersionNumber] = useState('');
  const [requiresReacceptance, setRequiresReacceptance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSaveDraft = async () => {
    setSaving(true);
    await supabase.from('legal_documents').insert({ document_type: docType, version_number: versionNumber || '1.0', title, body, effective_date: effectiveDate, requires_reacceptance: requiresReacceptance, status: 'draft' });
    setSaving(false);
    onSaved();
  };

  const handlePublish = async () => {
    setSaving(true);
    await supabase.from('legal_documents').insert({ document_type: docType, version_number: versionNumber || '1.0', title, body, effective_date: effectiveDate, requires_reacceptance: requiresReacceptance, status: 'published', published_at: new Date().toISOString() });
    setSaving(false);
    setShowConfirm(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl my-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {showConfirm ? (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} style={{ color: '#F59E0B' }} />
              <h3 className="text-base font-bold text-foreground">Confirm Publish</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Publishing a new {docType === 'terms' ? 'Terms of Service' : 'Privacy Policy'} will create a new version.
              {requiresReacceptance && ' Users will be required to accept the new version on next login.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--elevated)', color: 'var(--foreground)' }}>Cancel</button>
              <button onClick={handlePublish} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
                {saving ? 'Publishing...' : 'Confirm Publish'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-base font-bold text-foreground">New {docType === 'terms' ? 'Terms' : 'Privacy Policy'} Version</h3>
              <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'var(--elevated)', color: 'var(--muted-foreground)' }}>Cancel</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Version Number</label>
                  <input type="text" value={versionNumber} onChange={(e) => setVersionNumber(e.target.value)} placeholder="e.g. 1.1" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Effective Date</label>
                  <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Body Content</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none font-mono" style={{ background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <input type="checkbox" id="reaccept" checked={requiresReacceptance} onChange={(e) => setRequiresReacceptance(e.target.checked)} className="w-4 h-4 rounded" />
                <label htmlFor="reaccept" className="text-sm font-medium text-foreground cursor-pointer">Requires Re-Acceptance from all users</label>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t" style={{ borderColor: 'var(--border)' }}>
              <button onClick={handleSaveDraft} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--elevated)', color: 'var(--foreground)' }}>Save Draft</button>
              <button onClick={() => setShowConfirm(true)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>Publish</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function LegalManagement() {
  const supabase = createClient();
  const [termsDocs, setTermsDocs] = useState<LegalDoc[]>([]);
  const [privacyDocs, setPrivacyDocs] = useState<LegalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editorType, setEditorType] = useState<'terms' | 'privacy'>('terms');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('legal_documents').select('*').order('created_at', { ascending: false });
    if (data) {
      setTermsDocs(data.filter((d) => d.document_type === 'terms'));
      setPrivacyDocs(data.filter((d) => d.document_type === 'privacy'));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const DocList = ({ docs, type }: { docs: LegalDoc[]; type: 'terms' | 'privacy' }) => (
    <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-bold text-foreground">{type === 'terms' ? 'Terms of Service' : 'Privacy Policy'}</h3>
        <button onClick={() => { setEditorType(type); setShowEditor(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
          <Plus size={12} /> New Version
        </button>
      </div>
      {loading ? (
        <div className="p-4"><div className="h-10 rounded-lg animate-pulse" style={{ background: 'var(--elevated)' }} /></div>
      ) : docs.length === 0 ? (
        <div className="p-6 text-center"><p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No versions yet</p></div>
      ) : (
        docs.map((doc, i) => (
          <div key={doc.id} className={`flex items-center justify-between px-4 py-3 ${i < docs.length - 1 ? 'border-b' : ''}`} style={{ borderColor: 'var(--border)' }}>
            <div>
              <p className="text-sm font-semibold text-foreground">v{doc.version_number}</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {doc.effective_date ? new Date(doc.effective_date).toLocaleDateString() : 'No date'}
                {doc.requires_reacceptance && ' · Requires re-acceptance'}
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: doc.status === 'published' ? 'rgba(0,201,167,0.12)' : 'rgba(245,158,11,0.12)', color: doc.status === 'published' ? '#00C9A7' : '#F59E0B' }}>
              {doc.status}
            </span>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">Legal Documents</h2>
      <DocList docs={termsDocs} type="terms" />
      <DocList docs={privacyDocs} type="privacy" />
      {showEditor && (
        <LegalEditor doc={null} docType={editorType} onClose={() => setShowEditor(false)} onSaved={() => { setShowEditor(false); load(); }} />
      )}
    </div>
  );
}
