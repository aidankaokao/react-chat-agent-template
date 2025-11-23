/**
 * ============================================================================
 *  1. 引入依賴 (Imports)
 * ============================================================================
 *  - React Hooks: 用於狀態管理 (useState)、副作用處理 (useEffect)、元素引用 (useRef)
 *  - Lucide Icons: 現代化的 SVG 圖標庫
 *  - Framer Motion: 處理平滑動畫 (如側邊欄縮放、訊息彈出)
 *  - Markdown: 負責將 AI 回傳的 Markdown 語法轉為漂亮的 HTML
 */
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Trash2,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  MessageSquare,
  Moon,
  Sun,
  Wrench,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * ============================================================================
 *  2. 輔助函式 (Helper Functions)
 * ============================================================================
 *  這些是不依賴 React 生命週期的小工具，放在 Component 外面可以避免重複宣告。
 */
const generateThreadId = () =>
  `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * ============================================================================
 *  3. 子元件：複製按鈕 (Sub-component: CopyAction)
 * ============================================================================
 *  React 哲學：把獨立的互動邏輯拆成小元件。
 *  功能：點擊後複製文字，並將圖示暫時變為「打勾」，2秒後變回。
 */
const CopyAction = ({ content }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content); // 瀏覽器原生的剪貼簿 API
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // 2秒後重置狀態
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 dark:hover:text-blue-400 transition-all"
      title="複製內容"
    >
      {isCopied ? (
        <Check size={14} className="text-green-500" />
      ) : (
        <Copy size={14} />
      )}
    </button>
  );
};

/**
 * ============================================================================
 *  4. 子元件：訊息內容渲染器 (Sub-component: MessageContent)
 * ============================================================================
 *  負責判斷是「使用者」還是「AI」，並決定要顯示純文字還是 Markdown。
 *  同時包含自定義的 CSS 樣式來處理程式碼區塊 (取代易崩潰的語法高亮套件)。
 */
const MessageContent = ({ content, isUser }) => {
  // 防呆機制：確保 content 是字串，避免 undefined 導致崩潰
  const safeContent = content ? String(content) : "";

  // [重要修正] 使用者訊息：
  // 因為背景是深藍色 (bg-blue-600)，所以文字必須強制設為白色 (text-white)
  if (isUser) {
    return (
      <div className="whitespace-pre-wrap break-words text-white">
        {safeContent}
      </div>
    );
  }

  // AI 訊息：使用 ReactMarkdown 渲染
  return (
    <div className="markdown-body text-sm text-slate-800 dark:text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]} // 支援表格、刪除線等擴充語法
        components={{
          // 自定義 <code> 標籤的渲染方式
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";

            return !inline ? (
              // === 區塊程式碼 (Block Code) ===
              <div className="my-3 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                {language && (
                  <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-500 dark:text-slate-400 font-mono border-b border-slate-200 dark:border-slate-700">
                    {language}
                  </div>
                )}
                <div className="bg-[#1e1e1e] text-[#d4d4d4] p-3 overflow-x-auto">
                  <pre className="font-mono text-[13px] leading-relaxed">
                    <code {...props} className={className}>
                      {children}
                    </code>
                  </pre>
                </div>
              </div>
            ) : (
              // === 行內程式碼 (Inline Code) ===
              <code
                {...props}
                className="bg-slate-100 dark:bg-slate-800 text-pink-500 dark:text-pink-400 px-1.5 py-0.5 rounded font-mono text-sm border border-slate-200 dark:border-slate-700 mx-0.5"
              >
                {children}
              </code>
            );
          },
          // 自定義連結 (強制開新視窗)
          a: ({ node, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            />
          ),
          // 自定義表格樣式
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 border border-slate-200 dark:border-slate-700 rounded-lg">
              <table {...props} className="min-w-full text-sm text-left" />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead
              {...props}
              className="bg-slate-50 dark:bg-slate-800 font-semibold"
            />
          ),
          th: ({ node, ...props }) => (
            <th
              {...props}
              className="px-4 py-2 border-b border-slate-200 dark:border-slate-700"
            />
          ),
          td: ({ node, ...props }) => (
            <td
              {...props}
              className="px-4 py-2 border-b border-slate-100 dark:border-slate-800"
            />
          ),
          // 其他基本樣式
          ul: ({ node, ...props }) => (
            <ul
              {...props}
              className="list-disc list-outside ml-5 my-2 space-y-1"
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              {...props}
              className="list-decimal list-outside ml-5 my-2 space-y-1"
            />
          ),
          p: ({ node, ...props }) => (
            <p {...props} className="mb-2 last:mb-0 leading-7" />
          ),
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
};

/**
 * ============================================================================
 *  5. 主應用元件 (Main Component: ChatInterface)
 * ============================================================================
 */
const ChatInterface = () => {
  // --- 狀態管理 (State) ---
  // 這裡定義了所有會讓畫面「動起來」的資料
  const [messages, setMessages] = useState([
    {
      id: "init-1",
      content: "你好！我是你的 AI 助手。我們開始對話吧！",
      type: "ai",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState(""); // 對話 ID (記憶功能)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // 側邊欄開關
  const [agentStatus, setAgentStatus] = useState(""); // MCP 工具調用狀態

  // 深色模式狀態：初始化時嘗試讀取 localStorage，若無則預設 false (亮色)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  // --- 引用 (Refs) ---
  const messagesEndRef = useRef(null); // 用來定位訊息列表的最底部

  // --- 環境變數 ---
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  // --- 副作用 (Effects) ---

  // 1. 處理深色模式切換
  // 當 isDarkMode 改變時，修改 <html> 標籤的 class 並寫入 localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // 2. 初始化 Thread ID
  // 只在元件第一次載入時執行 (依賴陣列為空 [])
  useEffect(() => {
    const savedThreadId = localStorage.getItem("chat_thread_id");
    if (savedThreadId) {
      setThreadId(savedThreadId);
    } else {
      const newId = generateThreadId();
      setThreadId(newId);
      localStorage.setItem("chat_thread_id", newId);
    }
  }, []);

  // 3. 自動滾動
  // 只要 messages, isLoading, 或 agentStatus 改變，就滾動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, agentStatus]);

  // --- 事件處理 (Handlers) ---

  const handleClearChat = () => {
    const newId = generateThreadId();
    setThreadId(newId);
    localStorage.setItem("chat_thread_id", newId);
    setMessages([
      {
        id: `new-${Date.now()}`,
        content: "記憶已清除，我們重新開始吧！",
        type: "ai",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  // 核心邏輯：發送訊息與串流處理
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue(""); // 清空輸入框
    setIsLoading(true);
    setAgentStatus("正在思考..."); // 初始狀態

    // Optimistic UI (樂觀更新)：先顯示使用者訊息，不用等伺服器回應
    const userMsgId = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        content: userText,
        type: "user",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    // 預先建立一個空的 AI 訊息，準備接收串流
    const aiMsgId = userMsgId + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        content: "",
        type: "ai",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    try {
      const payload = {
        input: { messages: [{ role: "user", content: userText }] },
        config: { configurable: { thread_id: threadId } },
      };

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      if (!response.body) throw new Error("ReadableStream not supported.");

      // === 串流讀取邏輯 (Stream Handling) ===
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiResponseText = "";
      let buffer = ""; // 緩衝區：處理斷成兩半的 JSON

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); // 後端用換行符號分隔 JSON
        buffer = lines.pop(); // 最後一行可能不完整，留到下一次處理

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);

            // 根據後端回傳的 type 決定如何處理
            if (data.type === "text") {
              // 文字內容 -> 更新到對話框
              aiResponseText += data.content;
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMsgIndex = newMessages.findIndex(
                  (m) => m.id === aiMsgId
                );
                if (lastMsgIndex !== -1) {
                  newMessages[lastMsgIndex] = {
                    ...newMessages[lastMsgIndex],
                    content: aiResponseText,
                  };
                }
                return newMessages;
              });
              setAgentStatus(""); // 開始回答後，清空狀態提示
            } else if (data.type === "status") {
              // 狀態更新 -> 更新狀態膠囊
              setAgentStatus(data.content);
            } else if (data.type === "done") {
              setAgentStatus("");
            }
          } catch (err) {
            console.warn("JSON Parse Error:", err);
          }
        }
      }
    } catch (error) {
      console.error("Streaming Failed:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? { ...msg, content: "連線發生錯誤。", isError: true }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setAgentStatus("");
    }
  };

  /**
   * ============================================================================
   *  6. 畫面渲染 (JSX Render)
   * ============================================================================
   *  這裡使用 Tailwind CSS 定義樣式，並使用 dark: 前綴處理深色模式。
   */
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      {/* === 側邊欄 (Sidebar) === */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full bg-white dark:bg-slate-900 border-r border-blue-100 dark:border-slate-800 flex flex-col shadow-lg z-20 relative"
          >
            {/* Logo 區 */}
            <div className="p-6 flex flex-col items-center border-b border-slate-100 dark:border-slate-800">
              <div className="w-24 h-24 rounded-full overflow-hidden shadow-md border-4 border-blue-50 dark:border-slate-700 mb-3">
                <img
                  src="/my_logo.png"
                  alt="My Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentNode.classList.add(
                      "bg-blue-100",
                      "dark:bg-slate-800",
                      "flex",
                      "items-center",
                      "justify-center"
                    );
                    e.target.parentNode.innerHTML =
                      '<span class="text-blue-400 font-bold">Logo</span>';
                  }}
                />
              </div>
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                我的 AI 助理
              </h2>
              <p className="text-xs text-slate-400">Intelligent Agent</p>
            </div>

            {/* 選單區 */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <div className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">
                主選單
              </div>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 rounded-lg font-medium transition-colors">
                <MessageSquare size={18} />
                <span>目前對話</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 rounded-lg font-medium transition-colors">
                <Settings size={18} />
                <span>系統設定</span>
              </button>
            </nav>

            {/* 底部切換按鈕 */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
              >
                {isDarkMode ? (
                  <Sun size={18} className="text-amber-400" />
                ) : (
                  <Moon size={18} className="text-indigo-500" />
                )}
                <span>{isDarkMode ? "亮色模式" : "深色模式"}</span>
              </button>
              <p className="text-[10px] text-center text-slate-300 mt-4">
                v1.3.0 Build 2024
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* === 主內容區塊 (Main Content) === */}
      <div className="flex-1 flex flex-col h-screen relative bg-slate-50 dark:bg-slate-950">
        {/* 頂部導航列 (Header) */}
        <header className="flex-none px-4 py-4 bg-white dark:bg-slate-900 border-b border-blue-100 dark:border-slate-800 shadow-sm z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 側邊欄切換按鈕 */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isSidebarOpen ? (
                <PanelLeftClose size={20} />
              ) : (
                <PanelLeftOpen size={20} />
              )}
            </button>

            {/* 標題與狀態燈 */}
            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-3 ml-1">
              <div className="p-2 bg-blue-100 dark:bg-slate-800 rounded-full text-blue-600 dark:text-blue-400">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  LangGraph Agent
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isLoading ? "bg-yellow-400 animate-pulse" : "bg-green-400"
                    }`}
                  />
                  <span>ID: {threadId.slice(-6)}</span>
                </div>
              </div>
            </div>
          </div>
          {/* 清除記憶按鈕 */}
          <button
            onClick={handleClearChat}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </header>

        {/* 訊息列表區 (Messages Area) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-slate-900">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start gap-3 ${
                  msg.type === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {/* 頭像 */}
                <div
                  className={`flex-none w-10 h-10 rounded-full flex items-center justify-center shadow-sm border
                  ${
                    msg.type === "user"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-slate-700"
                  }`}
                >
                  {msg.type === "user" ? <User size={20} /> : <Bot size={20} />}
                </div>

                {/* 氣泡框 */}
                <div
                  className={`flex flex-col max-w-[85%] ${
                    msg.type === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`px-5 py-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed overflow-hidden relative group
                    ${
                      msg.type === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-blue-100 dark:border-slate-700 rounded-tl-none"
                    } 
                    ${
                      msg.isError
                        ? "border-red-200 bg-red-50 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                        : ""
                    }`}
                  >
                    {msg.isError && (
                      <AlertCircle
                        size={16}
                        className="inline-block mr-2 -mt-1"
                      />
                    )}

                    {/* 渲染訊息內容 */}
                    <MessageContent
                      content={msg.content}
                      isUser={msg.type === "user"}
                    />

                    {/* 打字機游標 (Cursor) */}
                    {msg.type === "ai" &&
                      isLoading &&
                      !agentStatus &&
                      msg.id === messages[messages.length - 1].id && (
                        <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-blue-400 animate-pulse"></span>
                      )}

                    {/* 複製按鈕 (只在 AI 訊息且非錯誤時顯示) */}
                    {msg.type === "ai" && !msg.isError && (
                      <div className="mt-2 flex justify-end border-t border-slate-100 dark:border-slate-700/50 pt-1">
                        <CopyAction content={msg.content} />
                      </div>
                    )}
                  </div>

                  {/* MCP 狀態顯示 (Status Capsule) */}
                  {msg.type === "ai" &&
                    isLoading &&
                    agentStatus &&
                    msg.id === messages[messages.length - 1].id && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-blue-100 dark:border-slate-700 shadow-sm w-fit"
                      >
                        <Loader2
                          size={12}
                          className="animate-spin text-blue-500"
                        />
                        <Wrench size={12} className="text-amber-500" />
                        <span>{agentStatus}</span>
                      </motion.div>
                    )}

                  {/* 時間戳 */}
                  <span className="text-[10px] text-slate-400 mt-1 px-1 opacity-70">
                    {msg.timestamp}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* 底部輸入區 (Input Area) */}
        <div className="flex-none p-4 bg-white dark:bg-slate-900 border-t border-blue-50 dark:border-slate-800">
          <form
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="輸入您的問題..."
              disabled={isLoading}
              className="w-full pl-6 pr-14 py-4 bg-slate-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-slate-600 focus:border-blue-400 dark:focus:border-slate-500 transition-all shadow-inner text-base disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className={`absolute right-2 p-2.5 rounded-full transition-all duration-200 
                ${
                  !inputValue.trim() || isLoading
                    ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    : "bg-blue-600 dark:bg-blue-500 text-white shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg transform hover:scale-105 active:scale-95"
                }`}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
