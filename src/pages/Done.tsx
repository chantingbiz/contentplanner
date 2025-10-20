import { useState } from 'react';
import { useDoneIdeas, useAppStore } from '../store';

/**
 * Done Page - Shows all posted ideas with snapshot data
 * 
 * - Chronological list (newest first)
 * - Read-only display of snapshot data with copy buttons
 * - Optional unpost action to return to Working
 * - Timestamped records
 */
export default function Done() {
  const doneIdeas = useDoneIdeas();
  const bins = useAppStore(state => state.bins || []);
  const unpostIdea = useAppStore(state => state.unpostIdea);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const getBinName = (binId?: string | null) => {
    if (!binId) return '';
    return bins.find(b => b.id === binId)?.name || '';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleUnpost = (ideaId: string, title: string) => {
    if (confirm(`Return "${title}" to Working Ideas?`)) {
      unpostIdea(ideaId);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch((err) => {
      console.error('Failed to copy:', err);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Done</h1>
        <p className="text-white/60">
          Posted content history. These ideas have been published.
        </p>
      </div>

      {/* Done List */}
      <div className="space-y-4">
        {doneIdeas.length === 0 ? (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-white/20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-white/50 mb-2">No posted content yet.</p>
            <p className="text-sm text-white/40">
              Mark ideas as Posted from Working Ideas to see them here.
            </p>
          </div>
        ) : (
          doneIdeas.map(({ record }) => (
            <div
              key={record.id}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
            >
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">
                      {record.snapshot.title || record.snapshot.text || 'Untitled'}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-white/50">
                      <span>Posted {formatDate(record.movedAt)}</span>
                      {record.snapshot.binId && (
                        <>
                          <span>•</span>
                          <span>{getBinName(record.snapshot.binId)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Unpost Button */}
                  <button
                    onClick={() => handleUnpost(record.id, record.snapshot.title || record.snapshot.text || 'this idea')}
                    className="px-3 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/5 border border-white/10 rounded transition-colors"
                  >
                    ↶ Unpost
                  </button>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
                  {/* Thumbnail (9:16 frame) */}
                  {record.snapshot.thumbnail && (
                    <div className="w-48 flex-shrink-0">
                      <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden border border-white/10">
                        <img
                          src={record.snapshot.thumbnail}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Content Fields */}
                  <div className="space-y-4 flex-1">
                    {/* Description */}
                    {record.snapshot.description && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-white/70">Description</h4>
                          <button
                            onClick={() => copyToClipboard(record.snapshot.description!, `${record.id}-desc`)}
                            className="px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/5 border border-white/10 rounded transition-colors flex items-center gap-1"
                            title="Copy description"
                          >
                            {copiedField === `${record.id}-desc` ? (
                              <>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Copied
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-sm text-white/80 whitespace-pre-wrap bg-black/20 border border-white/5 rounded-lg p-3">
                          {record.snapshot.description}
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          {record.snapshot.description.length} characters
                        </p>
                      </div>
                    )}

                    {/* Hashtags */}
                    {(record.snapshot.hashtags?.youtube?.length || 
                      record.snapshot.hashtags?.tiktok?.length || 
                      record.snapshot.hashtags?.instagram?.length) ? (
                      <div>
                        <h4 className="text-sm font-medium text-white/70 mb-2">Hashtags</h4>
                        <div className="space-y-2">
                          {record.snapshot.hashtags?.youtube && record.snapshot.hashtags.youtube.length > 0 && (
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1">
                                <span className="text-xs text-red-400 font-medium">YouTube: </span>
                                <span className="text-sm text-white/70">
                                  {record.snapshot.hashtags.youtube.join(' ')}
                                </span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(record.snapshot.hashtags!.youtube!.join(' '), `${record.id}-yt`)}
                                className="px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/5 border border-white/10 rounded transition-colors flex-shrink-0"
                                title="Copy YouTube hashtags"
                              >
                                {copiedField === `${record.id}-yt` ? '✓' : 'Copy'}
                              </button>
                            </div>
                          )}
                          {record.snapshot.hashtags?.tiktok && record.snapshot.hashtags.tiktok.length > 0 && (
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1">
                                <span className="text-xs text-cyan-400 font-medium">TikTok: </span>
                                <span className="text-sm text-white/70">
                                  {record.snapshot.hashtags.tiktok.join(' ')}
                                </span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(record.snapshot.hashtags!.tiktok!.join(' '), `${record.id}-tt`)}
                                className="px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/5 border border-white/10 rounded transition-colors flex-shrink-0"
                                title="Copy TikTok hashtags"
                              >
                                {copiedField === `${record.id}-tt` ? '✓' : 'Copy'}
                              </button>
                            </div>
                          )}
                          {record.snapshot.hashtags?.instagram && record.snapshot.hashtags.instagram.length > 0 && (
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1">
                                <span className="text-xs text-pink-400 font-medium">Instagram: </span>
                                <span className="text-sm text-white/70">
                                  {record.snapshot.hashtags.instagram.join(' ')}
                                </span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(record.snapshot.hashtags!.instagram!.join(' '), `${record.id}-ig`)}
                                className="px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/5 border border-white/10 rounded transition-colors flex-shrink-0"
                                title="Copy Instagram hashtags"
                              >
                                {copiedField === `${record.id}-ig` ? '✓' : 'Copy'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {/* Script */}
                    {record.snapshot.script && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-white/70">Script</h4>
                          <button
                            onClick={() => copyToClipboard(record.snapshot.script!, `${record.id}-script`)}
                            className="px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/5 border border-white/10 rounded transition-colors flex items-center gap-1"
                            title="Copy script"
                          >
                            {copiedField === `${record.id}-script` ? (
                              <>✓ Copied</>
                            ) : (
                              <>Copy</>
                            )}
                          </button>
                        </div>
                        <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                          <p className="text-sm text-white/80 whitespace-pre-wrap font-mono">
                            {record.snapshot.script}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Shotlist */}
                    {record.snapshot.shotlist && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-white/70">Shotlist</h4>
                          <button
                            onClick={() => copyToClipboard(record.snapshot.shotlist!, `${record.id}-shotlist`)}
                            className="px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/5 border border-white/10 rounded transition-colors flex items-center gap-1"
                            title="Copy shotlist"
                          >
                            {copiedField === `${record.id}-shotlist` ? (
                              <>✓ Copied</>
                            ) : (
                              <>Copy</>
                            )}
                          </button>
                        </div>
                        <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                          <p className="text-sm text-white/80 whitespace-pre-wrap">
                            {record.snapshot.shotlist}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      {doneIdeas.length > 0 && (
        <div className="text-center text-sm text-white/50 py-4">
          {doneIdeas.length} posted {doneIdeas.length === 1 ? 'idea' : 'ideas'}
        </div>
      )}
    </div>
  );
}
