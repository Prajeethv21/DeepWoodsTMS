import React, { useEffect, useState, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import emailService from '../services/emailService';
import type { EmailThread, EmailMessage } from '../services/api';
import { Mail, Send, Search, RefreshCw, User, Clock, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const MailCenter: React.FC = () => {
  const { user } = useAuth();
  
  // States
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState<boolean>(true);
  const [threadError, setThreadError] = useState<string | null>(null);
  
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  
  const [replyText, setReplyText] = useState<string>('');
  const [sendingReply, setSendingReply] = useState<boolean>(false);
  const [replyStatus, setReplyStatus] = useState<{ success: boolean; message: string } | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load threads on mount
  useEffect(() => {
    if (user?.email) {
      fetchThreads();
    }
  }, [user?.email]);

  // Scroll messages to bottom when thread loads or reply is sent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchThreads = async () => {
    if (!user?.email) return;
    setLoadingThreads(true);
    setThreadError(null);
    try {
      const data = await emailService.getEmailThreads(user.email);
      setThreads(data);
    } catch (err: any) {
      setThreadError(err.message || "Failed to load email threads.");
    } finally {
      setLoadingThreads(false);
    }
  };

  const handleSelectThread = async (threadId: string) => {
    if (!user?.email) return;
    setSelectedThreadId(threadId);
    setLoadingMessages(true);
    setMessageError(null);
    setReplyText('');
    setReplyStatus(null);
    setExpandedMessages({});
    try {
      const data = await emailService.getThreadMessages(threadId, user.email);
      setMessages(data);
      
      // Expand the last message by default
      if (data.length > 0) {
        const lastMsgId = data[data.length - 1].id;
        setExpandedMessages({ [lastMsgId]: true });
      }
    } catch (err: any) {
      setMessageError(err.message || "Failed to load thread messages.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThreadId || !replyText.trim() || !user?.email) return;

    setSendingReply(true);
    setReplyStatus(null);
    try {
      const response = await emailService.replyToThread(selectedThreadId, replyText.trim(), user.email);
      setReplyStatus({ success: true, message: response.message || "Reply sent successfully!" });
      setReplyText('');
      
      // Refresh messages in the thread to show the new reply
      const updatedMessages = await emailService.getThreadMessages(selectedThreadId, user.email);
      setMessages(updatedMessages);
      
      // Expand the latest reply
      if (updatedMessages.length > 0) {
        const lastMsgId = updatedMessages[updatedMessages.length - 1].id;
        setExpandedMessages(prev => ({ ...prev, [lastMsgId]: true }));
      }
      
      // Refresh thread list snippets in background
      fetchThreads();
    } catch (err: any) {
      setReplyStatus({ success: false, message: err.message || "Failed to send reply." });
    } finally {
      setSendingReply(false);
    }
  };

  const toggleMessageExpansion = (msgId: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  // Filter threads by search query
  const filteredThreads = threads.filter(thread => 
    thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.snippet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user?.isGoogleAuth) {
    return (
      <div className="min-h-screen bg-[#F4F8F5] text-slate-800 flex flex-col relative overflow-hidden font-sans">
        <Sidebar />
        <Header />
        <main className="flex-1 p-4 md:p-6 ml-[88px] mr-4 mb-6 z-10 relative flex flex-col items-center justify-center h-[calc(100vh-80px)]">
          <div className="bg-white border border-slate-200/60 rounded-[28px] p-8 max-w-md w-full shadow-[0_8px_30px_rgba(0,0,0,0.02)] text-center select-none">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-5 border border-amber-500/20 text-lg">
              🛡️
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-2 font-sans">
              Google Authentication Required
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-6 leading-relaxed font-sans font-medium">
              To view and reply to project-linked email threads, you must be signed in using Google Sign-In. 
              This ensures employees only access the specific emails assigned to their verified accounts.
            </p>
            <p className="text-[10px] text-slate-400 font-bold font-sans uppercase tracking-wider">
              Please sign out and sign in using your corporate Google account.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F8F5] text-slate-800 flex flex-col relative overflow-hidden font-sans">
      <Sidebar />
      <Header />

      <main className="flex-1 p-4 md:p-6 ml-[88px] mr-4 mb-6 z-10 relative flex flex-col h-[calc(100vh-80px)]">
        
        {/* ===== PAGE TITLE BAR ===== */}
        <div className="flex items-center justify-between gap-4 mb-6 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#92c13e] animate-pulse" />
              <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">
                MAIL ROOM
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Mail Center
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Access and reply to your project-linked email threads securely without leaving the workspace.
            </p>
          </div>
          
          <button 
            onClick={fetchThreads}
            disabled={loadingThreads}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
            title="Refresh threads"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingThreads ? 'animate-spin text-brand-primary' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* ===== MAIN SPLIT VIEW CONTAINER ===== */}
        <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
          
          {/* ========================================================
              LEFT COLUMN: Thread List Sidebar (~35% width)
              ======================================================== */}
          <div className={`w-full lg:w-[350px] border-r border-slate-100 flex flex-col shrink-0 min-h-0 ${selectedThreadId ? 'hidden lg:flex' : 'flex'}`}>
            
            {/* Search Input Box */}
            <div className="p-4 border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all font-semibold font-sans"
                />
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60 p-2">
              {loadingThreads ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                  <span className="text-xs font-semibold">Scanning mailbox...</span>
                </div>
              ) : threadError ? (
                <div className="p-6 text-center text-red-500 text-xs font-bold leading-relaxed flex flex-col items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <span>{threadError}</span>
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center px-6">
                  <Mail className="w-8 h-8 text-slate-300 mb-3" />
                  <p className="text-xs font-bold mb-1">No relevant threads found</p>
                  <p className="text-[10.5px] text-slate-500 font-semibold px-4 leading-normal">
                    Emails matching your email address or assigned Task IDs will appear here automatically.
                  </p>
                </div>
              ) : (
                filteredThreads.map(thread => {
                  const isSelected = selectedThreadId === thread.id;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => handleSelectThread(thread.id)}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all duration-200 select-none mb-1 group flex flex-col gap-1.5 ${
                        isSelected 
                          ? 'bg-brand-primary/8 border-brand-primary/10' 
                          : 'hover:bg-slate-50/70 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {thread.isUnread && (
                            <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-[#92c13e]" />
                          )}
                          <h4 className={`text-xs font-extrabold text-slate-800 truncate font-sans ${thread.isUnread ? 'font-black text-slate-900' : ''}`}>
                            {thread.subject}
                          </h4>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold shrink-0 font-sans whitespace-nowrap">
                          {thread.lastMessageDate.split(' ')[0]}
                        </span>
                      </div>
                      
                      <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed line-clamp-2 pr-2 font-sans">
                        {thread.snippet}
                      </p>

                      <div className="flex items-center justify-between shrink-0">
                        <span className="text-[9.5px] text-slate-400 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-300" />
                          {thread.lastMessageDate.split(' ')[1] || ''}
                        </span>
                        <span className="bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 text-[9px] font-extrabold font-sans">
                          {thread.messageCount} {thread.messageCount === 1 ? 'msg' : 'msgs'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* ========================================================
              RIGHT COLUMN: Thread Details & Reply (~65% width)
              ======================================================== */}
          <div className={`flex-1 flex flex-col min-h-0 bg-slate-50/30 ${!selectedThreadId ? 'hidden lg:flex justify-center items-center p-12 text-center text-slate-400' : 'flex'}`}>
            
            {!selectedThreadId ? (
              <div className="flex flex-col items-center max-w-sm">
                <div className="w-14 h-14 rounded-full bg-brand-primary/6 text-brand-primary flex items-center justify-center border border-brand-primary/10 mb-5 shadow-sm text-xl">
                  ✉️
                </div>
                <h3 className="text-sm font-extrabold text-slate-800 mb-1 font-sans">
                  Select a Thread
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed font-sans">
                  Choose a project conversation from the inbox list to read full message histories and write replies.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile back button & Header */}
                <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button 
                      onClick={() => setSelectedThreadId(null)}
                      className="lg:hidden p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-700 cursor-pointer shadow-sm"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-black text-brand-primary bg-brand-primary/8 border border-brand-primary/10 px-1.5 py-0.5 rounded font-sans uppercase tracking-wider select-none">
                          CONVERSATION
                        </span>
                      </div>
                      <h2 className="text-sm font-extrabold text-slate-800 truncate mt-1 font-sans select-all" title={messages[0]?.subject}>
                        {messages[0]?.subject || "Loading thread..."}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Message logs */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                      <span className="text-xs font-semibold">Retrieving secure transcripts...</span>
                    </div>
                  ) : messageError ? (
                    <div className="p-6 text-center text-red-500 text-xs font-bold leading-relaxed flex flex-col items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                      <span>{messageError}</span>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isExpanded = !!expandedMessages[msg.id];
                      return (
                        <div 
                          key={msg.id}
                          className="bg-white border border-slate-200/60 rounded-[22px] overflow-hidden shadow-sm transition-all duration-300"
                        >
                          {/* Message Header (clickable to collapse/expand) */}
                          <div 
                            onClick={() => toggleMessageExpansion(msg.id)}
                            className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-all select-none"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-extrabold border border-slate-200/50 shrink-0 text-xs">
                                <User className="w-4 h-4 text-slate-400" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[12.5px] font-black text-slate-800 truncate font-sans">
                                  {msg.from}
                                </h4>
                                <p className="text-[9.5px] text-slate-400 font-bold font-sans mt-0.5">
                                  To: {msg.to} {msg.cc && `| CC: ${msg.cc}`}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[9.5px] text-slate-400 font-bold font-sans">
                                {msg.date}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Message Body */}
                          {isExpanded && (
                            <div className="p-5 pt-0 border-t border-slate-100 overflow-x-auto">
                              <div 
                                className="text-xs text-slate-700 leading-relaxed font-sans font-medium mt-4 select-text space-y-2 prose max-w-none break-words"
                                dangerouslySetInnerHTML={{ __html: msg.body }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply section */}
                {!loadingMessages && !messageError && (
                  <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-slate-100 shrink-0">
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <textarea
                          placeholder="Type your reply here..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          disabled={sendingReply}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all font-semibold font-sans resize-none shadow-inner"
                          required
                        />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <p className="text-[9px] text-slate-400 font-semibold leading-normal max-w-md font-sans">
                          ℹ️ Reply will be sent from the company primary account. A signature index 
                          <span className="font-bold text-slate-600"> "Sent by {user?.name || 'User'} ({user?.email}) via Deepwoods Task Manager"</span> 
                          will be automatically appended for transparency.
                        </p>

                        <button
                          type="submit"
                          disabled={sendingReply || !replyText.trim()}
                          className="bg-[#92c13e] hover:bg-[#82b22e] disabled:opacity-50 text-emerald-950 font-black text-xs px-5 py-3 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-2 font-sans self-end sm:self-center"
                        >
                          {sendingReply ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Send Reply</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Toast Banner Status Feedback */}
                      {replyStatus && (
                        <div className={`mt-2 flex items-center gap-2 p-3 rounded-xl border text-[11px] font-bold ${
                          replyStatus.success 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                            : 'bg-red-50 border-red-100 text-red-700'
                        }`}>
                          {replyStatus.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          )}
                          <span className="font-sans leading-normal">{replyStatus.message}</span>
                        </div>
                      )}
                    </div>
                  </form>
                )}
              </>
            )}

          </div>

        </div>

      </main>
    </div>
  );
};

export default MailCenter;
