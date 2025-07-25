import React, { useState } from 'react';
import { ContactSubmission } from '../AdminPage';
import { supabase } from '../../lib/supabase';

interface ContactSubmissionListProps {
  contactSubmissions: ContactSubmission[];
}

const ContactSubmissionList: React.FC<ContactSubmissionListProps> = ({ contactSubmissions }) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [id: string]: string }>({});
  const [statuses, setStatuses] = useState<{ [id: string]: string }>({});
  const [localSubmissions, setLocalSubmissions] = useState(contactSubmissions);

  // Sort newest first
  const sorted = [...localSubmissions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    setStatuses(prev => ({ ...prev, [id]: newStatus }));
    await supabase.from('contact_submissions').update({ status: newStatus }).eq('id', id);
    setLocalSubmissions(subs => subs.map(s => s.id === id ? { ...s, status: newStatus } : s));
    setUpdatingId(null);
  };

  const handleNotesChange = (id: string, value: string) => {
    setNotes(prev => ({ ...prev, [id]: value }));
  };

  const handleNotesBlur = async (id: string) => {
    setUpdatingId(id);
    await supabase.from('contact_submissions').update({ admin_notes: notes[id] }).eq('id', id);
    setLocalSubmissions(subs => subs.map(s => s.id === id ? { ...s, admin_notes: notes[id] } : s));
    setUpdatingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contact submission?')) return;
    setUpdatingId(id);
    await supabase.from('contact_submissions').delete().eq('id', id);
    setLocalSubmissions(subs => subs.filter(s => s.id !== id));
    setUpdatingId(null);
  };

  const handleRespondedCheckbox = async (id: string, checked: boolean) => {
    const newStatus = checked ? 'responded' : 'new';
    await handleStatusChange(id, newStatus);
  };

  return (
    <div className="space-y-4">
      {sorted.map((submission) => (
        <div key={submission.id} className="bg-[#1a1a1a] p-6 rounded-lg border border-gray-800">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-light tracking-tight">{submission.name}</h3>
              <p className="text-gray-400">{submission.email}</p>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <span className="text-sm text-gray-500 block">
                {new Date(submission.timestamp).toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(statuses[submission.id] ?? submission.status ?? 'new') === 'responded'}
                    onChange={e => handleRespondedCheckbox(submission.id, e.target.checked)}
                    disabled={updatingId === submission.id}
                  />
                  Responded
                </label>
                <select
                  className="bg-[#222] text-white border border-gray-700 rounded px-2 py-1 text-sm"
                  value={statuses[submission.id] ?? submission.status ?? 'new'}
                  onChange={e => handleStatusChange(submission.id, e.target.value)}
                  disabled={updatingId === submission.id}
                >
                  <option value="new">new</option>
                  <option value="responded">responded</option>
                </select>
                <button
                  className="ml-2 text-xs text-red-400 hover:text-red-200 border border-red-400 hover:border-red-200 rounded px-2 py-1 transition-colors"
                  onClick={() => handleDelete(submission.id)}
                  disabled={updatingId === submission.id}
                >
                  Delete
                </button>
              </div>
              {updatingId === submission.id && (
                <span className="ml-2 text-xs text-gray-400 animate-pulse">Saving...</span>
              )}
            </div>
          </div>
          <p className="text-gray-300 mb-4">{submission.message}</p>
          <div className="mb-2">
            <label className="block text-xs text-gray-400 mb-1">Admin Notes:</label>
            <textarea
              className="w-full bg-[#222] text-white border border-gray-700 rounded px-2 py-1 text-sm"
              rows={2}
              value={notes[submission.id] ?? submission.admin_notes ?? ''}
              onChange={e => handleNotesChange(submission.id, e.target.value)}
              onBlur={() => handleNotesBlur(submission.id)}
              disabled={updatingId === submission.id}
              placeholder="Add notes..."
            />
          </div>
          {submission.responded_at && (
            <div className="text-sm text-gray-500 border-t border-gray-800 pt-4 mt-4">
              Responded on {new Date(submission.responded_at).toLocaleString()}
              {submission.response_by && ` by ${submission.response_by}`}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ContactSubmissionList; 