import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatTitle: string;
}

export default function ShareModal({ isOpen, onClose, chatTitle }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = window.location.origin;
  const shareText = `Check out CareerMind AI — an intelligent career coach that helps you find jobs, build resumes, and prepare applications! I was chatting about: "${chatTitle}"`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const platforms = [
    {
      name: 'WhatsApp',
      color: '#25D366',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    },
    {
      name: 'Twitter / X',
      color: '#000000',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'LinkedIn',
      color: '#0A66C2',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Facebook',
      color: '#1877F2',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Telegram',
      color: '#26A5E4',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      ),
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Email',
      color: '#EA4335',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
        </svg>
      ),
      url: `mailto:?subject=${encodeURIComponent('Check out CareerMind AI')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: '#111' }}>Share this chat</h3>
                    <p className="text-xs mt-0.5 truncate max-w-[220px]" style={{ color: '#888' }}>{chatTitle}</p>
                  </div>
                  <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: '#F5F5F5', color: '#888' }}>
                    <X size={15} />
                  </button>
                </div>

                {/* Social platforms */}
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {platforms.map(p => (
                      <motion.a
                        key={p.name}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer"
                        style={{ background: '#F8F8F8', border: '1px solid #EFEFEF' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F0F0F0'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#F8F8F8'; }}
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: p.color }}>
                          {p.icon}
                        </div>
                        <span className="text-xs font-medium" style={{ color: '#444' }}>{p.name}</span>
                      </motion.a>
                    ))}
                  </div>

                  {/* Copy link */}
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#F8F8F8', border: '1px solid #E5E5E5' }}>
                    <span className="flex-1 text-xs truncate" style={{ color: '#666' }}>{shareUrl}</span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0"
                      style={{ background: copied ? '#F0FDF4' : '#0095FF', color: copied ? '#16A34A' : '#FFFFFF' }}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}






