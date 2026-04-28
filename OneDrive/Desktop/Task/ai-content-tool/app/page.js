"use client";

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, UploadCloud, Sparkles, Plus, Trash2, Loader2, MessageSquare, ChevronRight } from 'lucide-react';

export default function Home() {
  const [contents, setContents] = useState(['', '']);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState('');
  
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatting, setIsChatting] = useState(false);
  
  const [insights, setInsights] = useState(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const handleAddContent = () => setContents([...contents, '']);
  const handleRemoveContent = (index) => setContents(contents.filter((_, i) => i !== index));
  const handleContentChange = (index, value) => {
    const newContents = [...contents];
    newContents[index] = value;
    setContents(newContents);
  };

  const handleIngest = async () => {
    const validContents = contents.filter(c => c.trim().length > 0);
    if (validContents.length === 0) {
      setIngestStatus('Please add some content first.');
      return;
    }

    setIsIngesting(true);
    setIngestStatus('Uploading and generating embeddings...');
    
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: validContents }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setIngestStatus(`Success! ${data.message}`);
        // Clear forms after successful upload
        setContents(['', '']);
      } else {
        setIngestStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      setIngestStatus('Failed to ingest content.');
    } finally {
      setIsIngesting(false);
      setTimeout(() => setIngestStatus(''), 5000);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = { role: 'user', content: question };
    setChatHistory([...chatHistory, userMessage]);
    setQuestion('');
    setIsChatting(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.content }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setChatHistory(prev => [...prev, { role: 'ai', content: data.answer }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'ai', content: `Error: ${data.error}` }]);
      }
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', content: 'Failed to connect to chat API.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true);
    setInsights(null);
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setInsights(data.insights);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to generate insights.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              ContentBrain AI
            </h1>
          </div>
          <button 
            onClick={handleGenerateInsights}
            disabled={isGeneratingInsights}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-70"
          >
            {isGeneratingInsights ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Generate Insights</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Data Ingestion */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 mb-6">
              <UploadCloud className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold">Upload Content</h2>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Paste up to 3 blog articles or documents to train your AI assistant.
            </p>

            <div className="space-y-4">
              {contents.map((content, index) => (
                <div key={index} className="relative group">
                  <textarea
                    value={content}
                    onChange={(e) => handleContentChange(index, e.target.value)}
                    placeholder={`Paste content piece ${index + 1} here...`}
                    className="w-full h-32 p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
                  />
                  {contents.length > 1 && (
                    <button 
                      onClick={() => handleRemoveContent(index)}
                      className="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 rounded-md text-gray-400 hover:text-red-500 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {contents.length < 3 && (
              <button 
                onClick={handleAddContent}
                className="mt-3 flex items-center space-x-1 text-sm text-indigo-600 font-medium hover:text-indigo-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add another piece</span>
              </button>
            )}

            <div className="mt-6">
              <button 
                onClick={handleIngest}
                disabled={isIngesting}
                className="w-full flex justify-center items-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-70"
              >
                {isIngesting ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                <span>{isIngesting ? 'Processing...' : 'Save & Train AI'}</span>
              </button>
              {ingestStatus && (
                <p className={`mt-3 text-sm text-center ${ingestStatus.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                  {ingestStatus}
                </p>
              )}
            </div>
          </div>

          {/* Insights Display Area */}
          {insights && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 shadow-inner animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2">Key Topics</h3>
                  <ul className="space-y-1">
                    {insights.keyTopics?.map((topic, i) => (
                      <li key={i} className="text-sm flex items-start text-gray-700">
                        <ChevronRight className="h-4 w-4 text-indigo-400 mt-0.5 mr-1 shrink-0" />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider mb-2">New Content Ideas</h3>
                  <ul className="space-y-2">
                    {insights.newContentIdeas?.map((idea, i) => (
                      <li key={i} className="text-sm bg-white p-2.5 rounded-lg border border-purple-100 text-gray-700 shadow-sm">
                        {idea}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-2">CTA Suggestions</h3>
                  <div className="flex flex-wrap gap-2">
                    {insights.ctaSuggestions?.map((cta, i) => (
                      <span key={i} className="text-xs font-medium bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                        {cta}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Chat Interface */}
        <div className="lg:col-span-7 flex flex-col h-[calc(100vh-8rem)]">
          <div className="bg-white flex-1 rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center space-x-2 bg-gray-50/50">
              <MessageSquare className="h-5 w-5 text-gray-400" />
              <h2 className="font-medium text-gray-700">Chat with Content</h2>
            </div>
            
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="bg-indigo-50 p-4 rounded-full mb-4">
                    <MessageSquare className="h-8 w-8 text-indigo-300" />
                  </div>
                  <h3 className="text-gray-900 font-medium mb-1">No messages yet</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Upload your content on the left, then ask me anything about it. I can summarize, extract topics, or brainstorm ideas!
                  </p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-sm' 
                          : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                      }`}
                    >
                      {msg.role === 'ai' ? (
                        <div className="prose prose-sm prose-p:leading-relaxed max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-5 py-3 flex space-x-2 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleChat} className="relative flex items-center">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about the content..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent block pl-4 pr-12 py-3 transition-all"
                  disabled={isChatting}
                />
                <button 
                  type="submit"
                  disabled={isChatting || !question.trim()}
                  className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
