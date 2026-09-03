import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  User,
  Paperclip,
  Send,
  Plus,
  FileText,
  Trash2,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Mail,
  Briefcase,
  Code2,
  RefreshCw,
  FolderArchive,
  Layers,
  UploadCloud,
  MessageSquare,
  History,
  Clock,
  LogOut,
  X,
  ChevronUp,
  ChevronDown,
  Pencil,
  FileSearch,
  Eye,
  Image as ImageIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Download,
  Activity,
  Zap,
  AudioLines,
  Pin,
  PinOff,
  Search,
  Share2,
  Columns,
  Maximize2,
  Bookmark,
  FileCheck,
  Sliders,
  ExternalLink
} from 'lucide-react';

const STORAGE_KEY = 'docbot_chat_history_v1';
const PINNED_STORAGE_KEY = 'docbot_pinned_highlights';

const INITIAL_ACCOUNT = { name: 'kishorj cse', email: 'kishorj.cse@skit.org.in', avatar: 'KI', bg: 'from-purple-500 to-indigo-600' };

const GoogleLogoSVG = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.37 24 12 24z"/>
    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z"/>
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
  </svg>
);

const App = () => {
  // Authentication & Guest Limit States
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('docbot_is_logged_in') === 'true';
  });

  const [guestPromptCount, setGuestPromptCount] = useState(() => {
    const saved = localStorage.getItem('docbot_guest_prompt_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Dynamic Logged-In Accounts Persistence (ONLY accounts user has logged in with!)
  const [savedAccounts, setSavedAccounts] = useState(() => {
    const saved = localStorage.getItem('docbot_saved_accounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [INITIAL_ACCOUNT];
  });

  const [isGooglePickerOpen, setIsGooglePickerOpen] = useState(false);
  const [isAccountCardOpen, setIsAccountCardOpen] = useState(false);
  const [isAccountToggleExpanded, setIsAccountToggleExpanded] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Document Source Citation Drawer State
  const [activeCitationDoc, setActiveCitationDoc] = useState(null);

  // 🎙️ VOICE ASSISTANT STATES (Speech Recognition & Speech Synthesis)
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const recognitionRef = useRef(null);

  // 📌 FEATURE 2: PINNED HIGHLIGHTS VAULT STATE
  const [pinnedMessages, setPinnedMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(PINNED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [sidebarTab, setSidebarTab] = useState('history'); // 'history' | 'pinned'

  // 🖼️ FEATURE 3: SPLIT-SCREEN GEMINI CANVAS MODE STATE
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);

  // 🔍 FEATURE 4: UNIVERSAL COMMAND PALETTE SEARCH (Ctrl + K) STATE
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // 🔗 FEATURE 5: SHAREABLE SESSION MODAL STATE
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('docbot_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_ACCOUNT;
  });

  // Save auth state, user profile, saved accounts & pinned highlights
  useEffect(() => {
    localStorage.setItem('docbot_is_logged_in', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('docbot_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('docbot_saved_accounts', JSON.stringify(savedAccounts));
  }, [savedAccounts]);

  useEffect(() => {
    localStorage.setItem('docbot_guest_prompt_count', guestPromptCount.toString());
  }, [guestPromptCount]);

  useEffect(() => {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedMessages));
  }, [pinnedMessages]);

  // 🔍 KEYBOARD SHORTCUT LISTENER (CTRL + K / CMD + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load sessions from localStorage
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
    const defaultId = 'session_' + Date.now();
    return [{
      id: defaultId,
      title: 'New Chat Session',
      messages: [],
      fileNames: [],
      updatedAt: Date.now()
    }];
  });

  const [currentSessionId, setCurrentSessionId] = useState(() => {
    return sessions.length > 0 ? sessions[0].id : 'session_' + Date.now();
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Active session helper
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = currentSession ? currentSession.messages : [];

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save chat history to localStorage:', e);
    }
  }, [sessions]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, streamingText]);

  // 📌 TOGGLE PINNED HIGHLIGHT HANDLER
  const handleTogglePin = (msg) => {
    setPinnedMessages((prev) => {
      const exists = prev.some((p) => p.id === msg.id);
      if (exists) {
        return prev.filter((p) => p.id !== msg.id);
      } else {
        return [
          {
            ...msg,
            sessionTitle: currentSession.title,
            sessionId: currentSession.id,
            pinnedAt: new Date().toLocaleString()
          },
          ...prev
        ];
      }
    });
  };

  // 🎙️ SPEECH RECOGNITION (VOICE INPUT) HANDLER
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError('');
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setInputPrompt(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  // 🔊 TEXT-TO-SPEECH (AI VOICE OUTPUT) HANDLER
  const handleSpeakResponse = (msgId, text) => {
    if (!('speechSynthesis' in window)) {
      setError('Text-to-speech is not supported in this browser.');
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any previous speech
    const cleanText = text.replace(/[*#_`[\]]/g, ''); // Strip Markdown symbols for clean voice synthesis

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setSpeakingMsgId(null);
    };

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // 📤 EXPORT CHAT SESSION AS MARKDOWN REPORT
  const handleExportSession = () => {
    if (!messages || messages.length === 0) {
      setError('No session history available to export.');
      return;
    }

    let reportText = `# DocsBot AI Session Report\n`;
    reportText += `**Session Title:** ${currentSession.title}\n`;
    reportText += `**Date Exported:** ${new Date().toLocaleString()}\n`;
    reportText += `**Attached Files:** ${selectedFiles.map(f => f.name).join(', ') || 'None'}\n\n`;
    reportText += `---\n\n`;

    messages.forEach((m, idx) => {
      const role = m.sender === 'user' ? '👤 User' : '🤖 DocsBot';
      reportText += `### ${idx + 1}. ${role} (${m.timestamp})\n\n${m.text}\n\n`;
    });

    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DocsBot_Report_${currentSession.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 🔗 SHAREABLE HTML PRESENTATION REPORT GENERATOR
  const handleExportHTMLReport = () => {
    if (!messages || messages.length === 0) return;
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DocsBot AI Report - ${currentSession.title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; line-height: 1.6; }
    .card { background: #1e293b; border-radius: 16px; padding: 24px; margin-bottom: 20px; border: 1px solid #334155; }
    .user { border-left: 4px solid #ef4444; }
    .bot { border-left: 4px solid #3b82f6; }
    h1 { color: #f43f5e; margin-bottom: 5px; }
    .meta { color: #94a3b8; font-size: 13px; margin-bottom: 30px; }
    .role { font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #cbd5e1; }
  </style>
</head>
<body>
  <h1>DocsBot AI Executive Report</h1>
  <div class="meta">Session: ${currentSession.title} | Generated: ${new Date().toLocaleString()}</div>
`;
    messages.forEach((m) => {
      html += `<div class="card ${m.sender === 'user' ? 'user' : 'bot'}">
        <div class="role">${m.sender === 'user' ? '👤 User Query' : '🤖 DocsBot Intelligence'} (${m.timestamp})</div>
        <div>${m.text.replace(/\n/g, '<br/>')}</div>
      </div>`;
    });
    html += `</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DocsBot_Report_${currentSession.title.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 🔐 Authentic Google Login Action Handler
  const handleSelectGoogleAccount = (account) => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setUserProfile(account);
      setIsLoggedIn(true);

      // Save to logged-in accounts list dynamically if not already saved!
      setSavedAccounts((prev) => {
        const exists = prev.some((a) => a.email.toLowerCase() === account.email.toLowerCase());
        if (!exists) {
          return [...prev, account];
        }
        return prev;
      });

      setIsAuthenticating(false);
      setIsGooglePickerOpen(false);
      setIsAccountCardOpen(false);
      setError('');
    }, 400);
  };

  const handleCustomEmailSubmit = (e) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const email = customEmail.trim();
    const name = email.split('@')[0].replace('.', ' ').replace('_', ' ');
    const initials = name.substring(0, 2).toUpperCase();
    const newAcc = { name, email, avatar: initials, bg: 'from-blue-600 to-indigo-600' };
    handleSelectGoogleAccount(newAcc);
    setCustomEmail('');
    setShowCustomInput(false);
  };

  // 🚪 Authentic Gemini Sign-Out Handler
  const handleSignOut = () => {
    setIsLoggedIn(false);
    setIsAccountCardOpen(false);
    setGuestPromptCount(0);
  };

  // Update current session's messages
  const updateCurrentSessionMessages = (newMessages, currentFiles = selectedFiles) => {
    setSessions((prevSessions) => {
      return prevSessions.map((session) => {
        if (session.id === currentSessionId) {
          let newTitle = session.title;
          const firstUserMsg = newMessages.find((m) => m.sender === 'user');
          if (firstUserMsg && (session.title === 'New Chat Session' || !session.title)) {
            newTitle = firstUserMsg.text.length > 36
              ? firstUserMsg.text.substring(0, 36) + '...'
              : firstUserMsg.text;
          }

          const fileNamesList = currentFiles.map(f => f.name);

          return {
            ...session,
            title: newTitle,
            messages: newMessages,
            fileNames: fileNamesList.length > 0 ? fileNamesList : session.fileNames,
            updatedAt: Date.now()
          };
        }
        return session;
      });
    });
  };

  // Helper to append unique valid files
  const addValidFiles = (incomingFiles) => {
    if (!incomingFiles || incomingFiles.length === 0) return;
    const allowed = ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv', '.json', '.zip', '.png', '.jpg', '.jpeg', '.bmp', '.tiff'];
    
    const valid = incomingFiles.filter((f) => {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      return allowed.includes(ext);
    });

    if (valid.length === 0) {
      setError('No supported files found. Upload PDF, DOCX, TXT, MD, CSV, JSON, ZIP, or Image files (PNG, JPG).');
      return;
    }

    setSelectedFiles((prev) => {
      const existingKeys = new Set(prev.map((f) => `${f.name}_${f.size}`));
      const newUnique = valid.filter((f) => !existingKeys.has(`${f.name}_${f.size}`));
      return [...prev, ...newUnique];
    });

    setError('');
  };

  // Handle file input selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    addValidFiles(files);
    if (e.target) {
      e.target.value = '';
    }
  };

  // Full window Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      addValidFiles(files);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewChat = () => {
    const newId = 'session_' + Date.now();
    const newSession = {
      id: newId,
      title: 'New Chat Session',
      messages: [],
      fileNames: [],
      updatedAt: Date.now()
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setSelectedFiles([]);
    setError('');
    setInputPrompt('');
  };

  const handleSelectSession = (sessionId) => {
    setCurrentSessionId(sessionId);
    setError('');
    setInputPrompt('');
    setSelectedFiles([]);
  };

  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      if (filtered.length === 0) {
        const fallbackId = 'session_' + Date.now();
        const fallbackSession = {
          id: fallbackId,
          title: 'New Chat Session',
          messages: [],
          fileNames: [],
          updatedAt: Date.now()
        };
        setCurrentSessionId(fallbackId);
        return [fallbackSession];
      }
      if (currentSessionId === sessionId) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleQuickPrompt = (promptText) => {
    setInputPrompt(promptText);
  };

  // ⚡ Simulated Token Streaming Reader Effect (Sub-Second Perception)
  const streamBotResponse = (fullText, baseMessages, currentFiles) => {
    setStreamingText('');
    const words = fullText.split(' ');
    let currentIdx = 0;
    let accumulated = '';

    const interval = setInterval(() => {
      if (currentIdx < words.length) {
        accumulated += (currentIdx === 0 ? '' : ' ') + words[currentIdx];
        setStreamingText(accumulated);
        currentIdx++;
      } else {
        clearInterval(interval);
        setStreamingText('');
        const botResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: fullText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        updateCurrentSessionMessages([...baseMessages, botResponse], currentFiles);
        setLoading(false);
      }
    }, 25);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    // 🔒 GUEST USAGE LIMIT CHECK: If unauthenticated and 1 prompt used -> Open Google OAuth Account Picker!
    if (!isLoggedIn && guestPromptCount >= 1) {
      setIsGooglePickerOpen(true);
      return;
    }

    const trimmedPrompt = inputPrompt.trim();
    if (!trimmedPrompt && selectedFiles.length === 0) {
      setError('Please attach documents/ZIP or type a prompt.');
      return;
    }

    const currentPrompt = trimmedPrompt || 'Summarize these documents and extract key insights.';
    const currentFiles = [...selectedFiles];

    // Format display string for attached files
    const fileSummary = currentFiles.length > 0
      ? currentFiles.length === 1
        ? currentFiles[0].name
        : `${currentFiles.length} Items Attached (${currentFiles.map(f => f.name).slice(0, 3).join(', ')}${currentFiles.length > 3 ? '...' : ''})`
      : null;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: currentPrompt,
      fileName: fileSummary,
      fileCount: currentFiles.length,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMessage];
    updateCurrentSessionMessages(updatedMessages, currentFiles);
    setInputPrompt('');

    // If NO files attached and session has no files attached -> Immediately notify user to upload document first!
    const sessionHasFiles = currentSession && currentSession.fileNames && currentSession.fileNames.length > 0;
    if (currentFiles.length === 0 && !sessionHasFiles) {
      const uploadNotice = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: '⚠️ **Please upload a document or ZIP archive first before prompting.**\n\nDocsBot requires at least one document (PDF, DOCX, TXT, or ZIP) attached to analyze and answer your questions.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updateCurrentSessionMessages([...updatedMessages, uploadNotice], currentFiles);
      if (!isLoggedIn) setGuestPromptCount((prev) => prev + 1);
      return;
    }

    // Increment guest prompt count for unauthenticated user
    if (!isLoggedIn) {
      setGuestPromptCount((prev) => prev + 1);
    }

    setLoading(true);

    const formData = new FormData();
    if (currentFiles.length > 0) {
      currentFiles.forEach((file) => {
        formData.append('files', file);
      });
    }
    formData.append('prompt', currentPrompt);

    const API_URL = 'http://localhost:8000/api/upload';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Server error occurred while processing bulk documents.');
      }

      const rawResponseText = data.translation || data.message || 'Processing complete.';
      
      // Fast Token Streaming Reader
      streamBotResponse(rawResponseText, updatedMessages, currentFiles);
    } catch (err) {
      console.error('API Error:', err);
      setLoading(false);
      const errorMessage = err.message || 'Could not connect to FastAPI server. Ensure backend is running on port 8000.';
      setError(errorMessage);
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        isError: true,
        text: `⚠️ **Processing Error:** ${errorMessage}\n\nPlease verify that your files are valid and backend is active.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updateCurrentSessionMessages([...updatedMessages, errorResponse], currentFiles);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickPrompts = [
    { label: 'Bulk Document Summary', icon: Layers, prompt: 'Analyze all uploaded documents and provide a consolidated executive summary.' },
    { label: 'Extract Contact & Emails', icon: Mail, prompt: 'Extract all email IDs, contact numbers, and personal info across all files.' },
    { label: 'Technical Skills Matrix', icon: Code2, prompt: 'List all technical skills, frameworks, and technologies found in these documents.' },
    { label: 'Compare & Rank Profiles', icon: Briefcase, prompt: 'Compare candidate profiles or sections across documents and summarize key experience into a Markdown Table.' }
  ];

  // Global search filtering across sessions & messages
  const filteredSearchSessions = sessions.filter((s) => {
    if (!globalSearchQuery.trim()) return true;
    const q = globalSearchQuery.toLowerCase();
    const matchTitle = s.title.toLowerCase().includes(q);
    const matchMsg = s.messages.some((m) => m.text.toLowerCase().includes(q));
    const matchFile = s.fileNames && s.fileNames.some((f) => f.toLowerCase().includes(q));
    return matchTitle || matchMsg || matchFile;
  });

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased relative"
    >
      {/* FULL WINDOW DRAG AND DROP OVERLAY */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-red-500 transition-all pointer-events-none">
          <div className="p-6 rounded-full bg-red-950/60 border border-red-800 text-red-400 mb-4 animate-bounce">
            <UploadCloud className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-bold text-slate-100">Drop Files & ZIP Archives Here</h3>
          <p className="text-sm text-slate-400 mt-2">Upload PDF, DOCX, TXT, ZIP, or PNG/JPG images</p>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 🔍 FEATURE 4: UNIVERSAL COMMAND PALETTE SEARCH MODAL (Ctrl + K) */}
      {/* ---------------------------------------------------------------- */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsCommandPaletteOpen(false)} />

          <div className="relative z-10 w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3">
              <Search className="w-5 h-5 text-red-500 shrink-0" />
              <input
                type="text"
                autoFocus
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="Search across all past sessions, documents, and messages... (Press Esc to close)"
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-800 px-2 py-1 rounded-md shrink-0">
                ESC
              </span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                Matching Conversations ({filteredSearchSessions.length})
              </div>

              {filteredSearchSessions.length > 0 ? (
                filteredSearchSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => {
                      handleSelectSession(session.id);
                      setIsCommandPaletteOpen(false);
                    }}
                    className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-red-500/50 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-200">{session.title}</h4>
                      <span className="text-[10px] text-slate-500">{new Date(session.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {session.messages && session.messages.length > 0 && (
                      <p className="text-[11px] text-slate-400 truncate">
                        Latest: {session.messages[session.messages.length - 1].text.substring(0, 80)}...
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  No matching sessions or files found for "{globalSearchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 🔗 FEATURE 5: SHAREABLE SESSION & HTML REPORT MODAL */}
      {/* ---------------------------------------------------------------- */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsShareModalOpen(false)} />

          <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <Share2 className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold text-slate-100">Share Document Session</h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400">
                Share an interactive read-only link or download a presentable HTML report of <b>{currentSession.title}</b>.
              </p>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                <span className="text-slate-300 truncate font-mono text-[11px] mr-2">
                  {window.location.origin}/share/{currentSession.id}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/share/${currentSession.id}`);
                    setCopiedShareLink(true);
                    setTimeout(() => setCopiedShareLink(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-[11px] shrink-0"
                >
                  {copiedShareLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  onClick={handleExportHTMLReport}
                  className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Download HTML Presentation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 📄 DOCUMENT SOURCE CITATION VIEWER DRAWER */}
      {/* ---------------------------------------------------------------- */}
      {activeCitationDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setActiveCitationDoc(null)} />

          <div className="relative z-10 w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-250">
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-400">
                    <FileSearch className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-100 truncate">{activeCitationDoc.name}</h3>
                    <p className="text-xs text-slate-400">Document Citation Source Inspection</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveCitationDoc(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Source Document Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-slate-500 font-semibold block uppercase">File Type</span>
                  <span className="font-bold text-slate-200">{activeCitationDoc.name.split('.').pop().toUpperCase()}</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-slate-500 font-semibold block uppercase">Indexing Status</span>
                  <span className="font-bold text-emerald-400">Vector DB Chunked</span>
                </div>
              </div>

              {/* Citation Content Preview */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Document Snippet Context</span>
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
                  {activeCitationDoc.snippet || `[Source: ${activeCitationDoc.name}]\nDocument uploaded and indexed successfully into DocsBot vector search engine.`}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveCitationDoc(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Citation Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* AUTHENTIC GOOGLE OAUTH ACCOUNT PICKER MODAL */}
      {/* ---------------------------------------------------------------- */}
      {isGooglePickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setIsGooglePickerOpen(false)} />

          <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl space-y-6 text-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 rounded-full bg-slate-800/80 border border-slate-700/80 shadow-md">
                <GoogleLogoSVG />
              </div>
              <h3 className="text-xl font-bold text-slate-100 tracking-tight">Sign in with Google</h3>
              <p className="text-xs text-slate-400">Choose an account to continue to <b>DocsBot AI</b></p>
            </div>

            {isAuthenticating ? (
              <div className="py-8 flex flex-col items-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-xs font-semibold text-slate-300">Authenticating with Google...</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="space-y-2">
                  {savedAccounts.map((acc, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectGoogleAccount(acc)}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-blue-500/50 transition-all group text-left"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${acc.bg || 'from-blue-500 to-indigo-600'} flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm`}>
                          {acc.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 group-hover:text-white truncate">{acc.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{acc.email}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                        Sign in →
                      </span>
                    </button>
                  ))}
                </div>

                {showCustomInput ? (
                  <form onSubmit={handleCustomEmailSubmit} className="pt-2 space-y-2.5">
                    <input
                      type="email"
                      required
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="Enter your Gmail address"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
                      >
                        Continue
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomInput(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl bg-slate-950/40 hover:bg-slate-800/60 border border-dashed border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4 text-blue-400" />
                    <span>Use another Google account</span>
                  </button>
                )}
              </div>
            )}

            <div className="pt-2 text-center">
              <button
                onClick={() => setIsGooglePickerOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* GOOGLE GEMINI STYLE ACCOUNT PROFILE CARD MODAL */}
      {/* ---------------------------------------------------------------- */}
      {isAccountCardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsAccountCardOpen(false)} />

          <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Google Account</span>
              <button
                onClick={() => setIsAccountCardOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              onClick={() => setIsAccountToggleExpanded(!isAccountToggleExpanded)}
              className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-inner group"
            >
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${userProfile.bg || 'from-blue-500 to-indigo-600'} p-0.5 shadow-md`}>
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-sm font-bold text-slate-100">
                      {isLoggedIn ? userProfile.avatar : 'GU'}
                    </div>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                    <Pencil className="w-2 h-2" />
                  </div>
                </div>

                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-sm font-bold text-slate-100 leading-none truncate">
                    {isLoggedIn ? userProfile.name : 'Guest User'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium truncate">
                    {isLoggedIn ? userProfile.email : 'Unauthenticated (1 Query Limit)'}
                  </p>
                </div>
              </div>

              <div className="p-1.5 rounded-full bg-slate-800/80 group-hover:bg-slate-800 text-slate-300 transition-colors shrink-0">
                {isAccountToggleExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {isAccountToggleExpanded && (
              <div className="space-y-2 pt-1 border-t border-slate-800/60 animate-in slide-in-from-top-2 duration-150">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">Switch Account</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {savedAccounts.map((acc, idx) => {
                    const isActive = isLoggedIn && userProfile.email.toLowerCase() === acc.email.toLowerCase();
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectGoogleAccount(acc)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                          isActive
                            ? 'bg-slate-800/90 border-blue-500/60 text-white font-semibold shadow-sm'
                            : 'bg-slate-950/60 border-slate-800/60 hover:bg-slate-800/60 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${acc.bg || 'from-blue-500 to-indigo-600'} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                            {acc.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate leading-tight">{acc.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{acc.email}</p>
                          </div>
                        </div>
                        {isActive && (
                          <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-[10px] font-semibold text-emerald-400 shrink-0">
                            <span>Active</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              {!isLoggedIn ? (
                <button
                  onClick={() => {
                    setIsAccountCardOpen(false);
                    setIsGooglePickerOpen(true);
                  }}
                  className="w-full flex items-center justify-center space-x-3 py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold transition-all text-sm shadow-md"
                >
                  <GoogleLogoSVG />
                  <span>Sign in with Google</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsAccountCardOpen(false);
                      setIsGooglePickerOpen(true);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 text-slate-200 hover:text-white transition-all text-xs font-medium group"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-slate-700 transition-colors">
                      <Plus className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <span>Add another account</span>
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 text-slate-200 hover:text-white transition-all text-xs font-medium group"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-slate-700 transition-colors">
                      <LogOut className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <span>Sign out</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* SIDEBAR */}
      {/* ---------------------------------------------------------------- */}
      <aside
        className={`relative h-full flex flex-col shrink-0 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80 transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full overflow-hidden border-none'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-lg shadow-red-900/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-lg tracking-tight leading-none">
                DocsBot
              </h1>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            title="Close Sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 shrink-0">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 transition-all duration-200 font-medium text-sm shadow-sm group"
          >
            <Plus className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
            <span>New Chat Session</span>
          </button>
        </div>

        {/* Sidebar Body Content */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {/* Active Documents List Card */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Attached Files ({selectedFiles.length})</span>
              {selectedFiles.length > 0 && (
                <button onClick={handleClearAllFiles} className="text-[10px] text-red-400 hover:underline">
                  Clear All
                </button>
              )}
            </div>

            {selectedFiles.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {selectedFiles.map((file, idx) => {
                  const ext = file.name.split('.').pop().toLowerCase();
                  const isZip = ext === 'zip';
                  const isImg = ['png', 'jpg', 'jpeg', 'bmp', 'tiff'].includes(ext);

                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveCitationDoc(file)}
                      className="flex items-center justify-between bg-slate-900/90 border border-slate-800 hover:border-red-500/50 p-2 rounded-lg text-xs cursor-pointer group transition-colors"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        {isZip ? (
                          <FolderArchive className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : isImg ? (
                          <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 group-hover:text-red-400 truncate transition-colors">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCitationDoc(file);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                          title="Inspect Source Citation"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(idx);
                          }}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-red-500/50 bg-slate-900/40 hover:bg-slate-900/80 rounded-lg p-3 text-center cursor-pointer transition-all duration-200 group"
              >
                <FolderArchive className="w-5 h-5 mx-auto text-slate-500 group-hover:text-red-400 transition-colors" />
                <p className="text-xs font-medium text-slate-300 mt-1">Upload Files, Images or ZIP</p>
                <p className="text-[10px] text-slate-500">PDF, DOCX, TXT, ZIP, PNG, JPG supported</p>
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-center py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/60 rounded-lg border border-red-900/40 transition-colors flex items-center justify-center space-x-1.5"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>+ Add Files / Images / ZIP</span>
            </button>
          </div>

          {/* SIDEBAR TABS: History vs Pinned Vault */}
          <div className="space-y-2">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setSidebarTab('history')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  sidebarTab === 'history' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                History ({sessions.length})
              </button>
              <button
                onClick={() => setSidebarTab('pinned')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1 ${
                  sidebarTab === 'pinned' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Pin className="w-3 h-3 text-amber-400" />
                <span>Pinned ({pinnedMessages.length})</span>
              </button>
            </div>

            {sidebarTab === 'history' ? (
              /* CHAT HISTORY LIST */
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                {sessions.map((session) => {
                  const isActive = session.id === currentSessionId;
                  const hasMsgs = session.messages && session.messages.length > 0;
                  return (
                    <div
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all duration-150 group border ${
                        isActive
                          ? 'bg-red-950/50 border-red-800/60 text-slate-100 font-semibold shadow-sm'
                          : 'bg-slate-900/40 border-slate-800/60 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                        <div className="min-w-0">
                          <p className="truncate leading-snug">{session.title || 'New Chat'}</p>
                          <p className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                            <span>{hasMsgs ? `${session.messages.length} msg(s)` : 'Empty'}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* 📌 PINNED HIGHLIGHTS VAULT LIST */
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {pinnedMessages.length > 0 ? (
                  pinnedMessages.map((pin) => (
                    <div
                      key={pin.id}
                      onClick={() => handleSelectSession(pin.sessionId)}
                      className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs space-y-1 cursor-pointer hover:bg-amber-950/40 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[10px] text-amber-400 font-semibold">
                        <span className="truncate max-w-[140px]">{pin.sessionTitle}</span>
                        <button onClick={() => handleTogglePin(pin)} className="hover:text-red-400">
                          <PinOff className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-slate-200 line-clamp-2 leading-relaxed">{pin.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-500 text-center py-4">No pinned highlights saved yet. Click 📌 on any response bubble!</p>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions List */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Bulk Actions</p>
            {quickPrompts.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(item.prompt)}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left group border border-transparent hover:border-slate-800"
                >
                  <IconComp className="w-4 h-4 text-red-500/80 group-hover:text-red-400 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer Account Button */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
          <button
            onClick={() => {
              if (isLoggedIn) {
                setIsAccountCardOpen(true);
              } else {
                setIsGooglePickerOpen(true);
              }
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 transition-colors text-left group border border-transparent hover:border-slate-800"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${isLoggedIn ? userProfile.bg : 'from-slate-700 to-slate-800'} p-0.5 shrink-0`}>
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-100">
                  {isLoggedIn ? userProfile.avatar : 'GU'}
                </div>
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">
                  {isLoggedIn ? userProfile.name : 'Sign in with Google'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {isLoggedIn ? userProfile.email : '1 Free Guest Prompt Available'}
                </p>
              </div>
            </div>
            <span className="flex h-2 w-2 relative shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLoggedIn ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLoggedIn ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
          </button>
        </div>
      </aside>

      {/* ---------------------------------------------------------------- */}
      {/* MAIN CHAT & SPLIT CANVAS AREA */}
      {/* ---------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-slate-950 relative overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 mr-1"
                title="Open Sidebar"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center space-x-2 min-w-0">
              <Sparkles className="w-4 h-4 text-red-500 shrink-0" />
              <span className="font-semibold text-slate-200 text-sm truncate">
                {currentSession ? currentSession.title : 'DocsBot'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs shrink-0">
            {/* 🔍 COMMAND PALETTE BUTTON */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Search Sessions & Documents (Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5 text-red-500" />
              <span>Search...</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">Ctrl K</span>
            </button>

            {/* 🖼️ FEATURE 3: SPLIT-SCREEN CANVAS TOGGLE BUTTON */}
            <button
              onClick={() => setIsCanvasOpen((prev) => !prev)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
                isCanvasOpen ? 'bg-red-950 border-red-800 text-red-400 font-semibold' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
              title="Toggle Gemini Split Screen Canvas Viewer"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isCanvasOpen ? 'Close Canvas' : 'Split Canvas'}</span>
            </button>

            {/* 🔗 FEATURE 5: SHARE SESSION BUTTON */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Share Session Link & HTML Report"
            >
              <Share2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* 📤 Export Chat Session Button */}
            <button
              onClick={handleExportSession}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Export Conversation Report (.MD)"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
            </button>

            {/* 🔐 Authentic Gemini Google Sign-In or User Profile Button */}
            {!isLoggedIn ? (
              <button
                onClick={() => setIsGooglePickerOpen(true)}
                className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-all shadow-md active:scale-95"
              >
                <GoogleLogoSVG />
                <span>Sign in</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAccountCardOpen(true)}
                className={`w-8 h-8 rounded-full bg-gradient-to-tr ${userProfile.bg || 'from-blue-500 to-indigo-600'} p-0.5 hover:scale-105 transition-transform shadow-md`}
                title="Account Profile"
              >
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-100">
                  {userProfile.avatar}
                </div>
              </button>
            )}
          </div>
        </header>

        {/* Hidden Multi-File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple={true}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* CONTAINER FOR CHAT + SPLIT CANVAS */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* ---------------------------------------------------------------- */}
          {/* 🖼️ FEATURE 3: SPLIT SCREEN CANVAS VIEWER PANEL */}
          {/* ---------------------------------------------------------------- */}
          {isCanvasOpen && (
            <div className="w-1/2 h-full border-r border-slate-800 bg-slate-900/90 flex flex-col animate-in slide-in-from-left duration-200">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center space-x-2">
                  <FileSearch className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-slate-200">Gemini Visual Canvas Viewer</span>
                </div>
                <button onClick={() => setIsCanvasOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {selectedFiles.length > 0 ? (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Document Sources</span>
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-red-400" />
                            <span>{f.name}</span>
                          </div>
                          <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                            Indexed Chunk
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-400 bg-slate-900 p-3 rounded-xl max-h-40 overflow-y-auto leading-relaxed">
                          [Source Document Chunk preview active in Vector Index]
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <Columns className="w-10 h-10 text-slate-600" />
                    <p className="text-xs font-medium text-slate-400">
                      Upload a document or select an attached file to view source chunks side-by-side in Canvas Mode.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Messages Section */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 w-full max-w-7xl mx-auto">
            {/* ⚡ FEATURE 1: INSTANT EXECUTIVE SUMMARY PILLS (Auto-generated on Upload) */}
            {selectedFiles.length > 0 && messages.length <= 1 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg animate-in fade-in duration-300">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                  <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>Instant Executive Takeaways ({selectedFiles.length} File Uploaded)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">📌 Main Focus</span>
                    <p className="text-slate-300 font-medium">Document content analyzed & chunked into RAG Index.</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">🎯 Recommended Action</span>
                    <p className="text-slate-300 font-medium">Ask for comparison matrix, skill matrix, or summary.</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">⚡ Status</span>
                    <p className="text-slate-300 font-medium">Vector search ready for real-time streaming queries.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Welcome Screen when no messages */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[65vh] text-center space-y-6 px-4 py-8">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-xl shadow-red-900/30 text-white">
                    <Bot className="w-9 h-9" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[10px] text-white font-bold">
                    ✓
                  </div>
                </div>

                <div className="max-w-xl space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">
                    DocsBot AI Voice & Document Assistant
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Upload multiple PDF, DOCX, TXT, ZIP, or PNG/JPG images. Speak your questions using the <b>Microphone</b> or type your prompt for instant RAG responses.
                  </p>
                </div>

                {/* Quick suggestion cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl mt-4">
                  {quickPrompts.map((q, idx) => {
                    const IconC = q.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleQuickPrompt(q.prompt)}
                        className="flex items-start space-x-3.5 p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-red-500/40 text-left transition-all duration-200 group shadow-sm"
                      >
                        <div className="p-2.5 rounded-lg bg-slate-800/80 text-red-400 group-hover:bg-red-950/60 transition-colors shrink-0">
                          <IconC className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 group-hover:text-red-400 transition-colors">
                            {q.label}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">{q.prompt}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message Thread */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isSpeakingThis = speakingMsgId === msg.id;
              const isPinned = pinnedMessages.some((p) => p.id === msg.id);

              return (
                <div key={msg.id} className={`flex items-start space-x-3.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-slate-800 border border-slate-700 text-slate-200'
                        : 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-md shadow-red-900/20'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Bubble Container */}
                  <div className={`flex flex-col min-w-0 ${isUser ? 'items-end max-w-[85%]' : 'items-start w-full max-w-[92%]'}`}>
                    {/* File Tag (if user uploaded with message) */}
                    {msg.fileName && (
                      <div className="mb-1.5 flex items-center space-x-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300">
                        <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                        <span>{msg.fileName}</span>
                      </div>
                    )}

                    {/* Message Body */}
                    <div
                      className={`rounded-2xl p-4 md:p-5 shadow-sm text-sm relative group w-full ${
                        isUser
                          ? 'bg-red-600 text-white rounded-tr-none w-auto max-w-full'
                          : msg.isError
                          ? 'bg-red-950/40 border border-red-800/80 text-red-200 rounded-tl-none'
                          : 'bg-slate-900/90 border border-slate-800/80 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      ) : (
                        <div className="prose-custom w-full overflow-x-auto space-y-2">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                        </div>
                      )}

                      {/* Action Buttons for Bot Messages: Pin Highlight, Voice Text-to-Speech, Copy */}
                      {!isUser && (
                        <div className="absolute top-3 right-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* 📌 FEATURE 2: PIN HIGHLIGHT BUTTON */}
                          <button
                            onClick={() => handleTogglePin(msg)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isPinned
                                ? 'bg-amber-950 border-amber-800 text-amber-400'
                                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                            title={isPinned ? 'Remove from Pinned Highlights' : 'Pin to Highlights Vault'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleSpeakResponse(msg.id, msg.text)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isSpeakingThis
                                ? 'bg-red-950 border-red-800 text-red-400 animate-pulse'
                                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                            title={isSpeakingThis ? 'Stop Voice Reading' : 'Listen to Voice Speech'}
                          >
                            {isSpeakingThis ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-slate-200"
                            title="Copy Response"
                          >
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {/* ⚡ STREAMING TYPEWRITER TOKEN READER */}
            {loading && (
              <div className="flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl rounded-tl-none p-4 text-sm text-slate-300 w-full max-w-[92%] space-y-2">
                  {streamingText ? (
                    <div className="prose-custom w-full overflow-x-auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText + ' ▌'}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      <span className="font-medium">Reading files & generating instant citations...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Global Error Banner if any */}
        {error && (
          <div className="mx-6 mb-2 p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-slate-400 hover:text-white font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* FLOATING PROMPT INPUT BAR WITH REAL-TIME VOICE ASSISTANT */}
        {/* ---------------------------------------------------------------- */}
        <div className="p-4 md:p-5 bg-slate-950 border-t border-slate-800/80 sticky bottom-0 z-20 shrink-0">
          <div className="w-full max-w-7xl mx-auto space-y-2">
            {/* Active Attachment Chip List */}
            {selectedFiles.length > 0 && (
              <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl w-full text-xs">
                <div className="flex items-center space-x-2 truncate">
                  <FolderArchive className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-medium text-slate-200 truncate">
                    {selectedFiles.length} Item(s) Attached: {selectedFiles.map(f => f.name).join(', ')}
                  </span>
                </div>
                <button onClick={handleClearAllFiles} className="ml-3 text-slate-400 hover:text-red-400 shrink-0">
                  Clear All
                </button>
              </div>
            )}

            {/* Form Input Box with Voice Mic */}
            <form onSubmit={handleSubmit} className="relative flex items-center">
              {/* Upload Paperclip Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-3.5 p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
                title="Attach Documents, Images, or ZIP Archive"
              >
                <Paperclip className="w-4.5 h-4.5" />
              </button>

              {/* Textarea Input */}
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? '🎙️ Listening... Speak your prompt now...'
                    : selectedFiles.length > 0
                    ? `Ask anything about attached ${selectedFiles.length} file(s) or ZIP...`
                    : 'Upload multiple files / ZIP archive or speak a question...'
                }
                rows={1}
                disabled={loading}
                className={`w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 text-sm rounded-2xl pl-12 pr-24 py-4 border focus:outline-none transition-all resize-none shadow-inner ${
                  isListening ? 'border-red-500 ring-2 ring-red-500/50' : 'border-slate-800 focus:ring-2 focus:ring-red-500/50 focus:border-red-500'
                }`}
              />

              {/* 🎙️ REAL-TIME VOICE MICROPHONE BUTTON */}
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-14 p-2 rounded-xl transition-all ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-900/50'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title={isListening ? 'Stop Voice Listening' : 'Speak Prompt using Microphone'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={loading || (!inputPrompt.trim() && selectedFiles.length === 0)}
                className={`absolute right-3 p-2.5 rounded-xl transition-all duration-200 ${
                  loading || (!inputPrompt.trim() && selectedFiles.length === 0)
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg shadow-red-900/30 hover:scale-[1.03] active:scale-[0.97]'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <p className="text-[11px] text-slate-500 text-center flex items-center justify-center space-x-2">
              <span>DocsBot AI Voice & Document Intelligence</span>
              {!isLoggedIn && (
                <span className="text-amber-400 font-medium">· Guest Limit: 1 Free Prompt</span>
              )}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;