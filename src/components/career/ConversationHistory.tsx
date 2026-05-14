import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Plus, Trash2, X } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
}

interface ConversationHistoryProps {
  conversations: Conversation[];
  currentConversationId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ConversationHistory({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  onClose,
}: ConversationHistoryProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-80 z-50"
            style={{
              background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
              borderRight: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <h2
                className="text-lg font-bold"
                style={{ color: "rgba(255,255,255,0.9)", fontFamily: "Sora, sans-serif" }}
              >
                Conversations
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-all"
                style={{
                  color: "rgba(255,255,255,0.5)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onNewConversation();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: "linear-gradient(135deg, rgba(234,179,8,0.12), rgba(234,179,8,0.06))",
                  border: "1px solid rgba(234,179,8,0.25)",
                  color: "#EAB308",
                  fontFamily: "Sora, sans-serif",
                }}
              >
                <Plus size={16} />
                New Conversation
              </motion.button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare
                    size={32}
                    className="mx-auto mb-2"
                    style={{ color: "rgba(255,255,255,0.2)" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Sora, sans-serif" }}
                  >
                    No conversations yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group relative"
                    >
                      <button
                        onClick={() => {
                          onSelectConversation(conv.id);
                          onClose();
                        }}
                        className="w-full text-left p-3 rounded-lg transition-all"
                        style={{
                          background:
                            conv.id === currentConversationId
                              ? "rgba(234,179,8,0.08)"
                              : "rgba(255,255,255,0.03)",
                          border:
                            conv.id === currentConversationId
                              ? "1px solid rgba(234,179,8,0.2)"
                              : "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-sm font-medium truncate"
                              style={{
                                color:
                                  conv.id === currentConversationId
                                    ? "#EAB308"
                                    : "rgba(255,255,255,0.8)",
                                fontFamily: "Sora, sans-serif",
                              }}
                            >
                              {conv.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="text-xs"
                                style={{
                                  color: "rgba(255,255,255,0.4)",
                                  fontFamily: "Sora, sans-serif",
                                }}
                              >
                                {conv.messageCount} messages
                              </span>
                              <span
                                className="text-xs"
                                style={{
                                  color: "rgba(255,255,255,0.3)",
                                  fontFamily: "Sora, sans-serif",
                                }}
                              >
                                {new Date(conv.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                confirm(
                                  "Are you sure you want to delete this conversation?"
                                )
                              ) {
                                onDeleteConversation(conv.id);
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded transition-all"
                            style={{
                              color: "rgba(255,255,255,0.4)",
                              background: "rgba(255,255,255,0.05)",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}












