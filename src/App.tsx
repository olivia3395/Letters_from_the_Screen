/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Sparkles, 
  RefreshCw, 
  MessageCircle, 
  ArrowLeft, 
  Film,
  Quote,
  Loader2,
  Heart,
  X,
  Info,
  Globe,
  Stamp
} from 'lucide-react';
import { CHARACTERS, Character } from './constants';
import { matchCharacter, generateLetter, generateFollowUp } from './services/geminiService';

type AppState = 'landing' | 'matching' | 'letter' | 'chat';
type Language = 'en' | 'zh';

const translations = {
  en: {
    title: "Letters from the Screen",
    subtitle: "Tell the screen what’s weighing on your heart tonight. Someone will write back.",
    placeholder: "I feel like everyone around me is moving forward and I’m still stuck...",
    btnAsk: "Ask for a letter",
    findingVoice: "Finding the right voice...",
    scanning: "Scanning the archives of cinema",
    letterFrom: "A letter from the screen",
    btnReply: "Reply to",
    btnSwitch: "Hear from someone else",
    btnStartOver: "Start over",
    writing: "Writing...",
    replyPlaceholder: "Reply to...",
    endSession: "End session",
    viewProfile: "View Profile",
    meetCharacters: "Meet the Characters",
    characterProfile: "Character Profile",
    archetype: "Archetype",
    voiceQualities: "Voice Qualities",
    comfortStyle: "Comfort Style",
    description: "Description",
    film: "Film",
    close: "Close"
  },
  zh: {
    title: "银幕来信",
    subtitle: "今晚，告诉银幕你心头的重担。会有人给你回信的。",
    placeholder: "我觉得周围的人都在前进，而我却停滞不前...",
    btnAsk: "请求回信",
    findingVoice: "寻找合适的声音...",
    scanning: "正在扫描影史档案",
    letterFrom: "来自银幕的信笺",
    btnReply: "回复",
    btnSwitch: "听听其他人的声音",
    btnStartOver: "重新开始",
    writing: "正在书写...",
    replyPlaceholder: "回复...",
    endSession: "结束会话",
    viewProfile: "查看档案",
    meetCharacters: "遇见角色",
    characterProfile: "角色档案",
    archetype: "原型",
    voiceQualities: "声音特质",
    comfortStyle: "安抚风格",
    description: "描述",
    film: "电影",
    close: "关闭"
  }
};

export default function App() {
  const [state, setState] = useState<AppState>('landing');
  const [lang, setLang] = useState<Language>('en');
  const [prompt, setPrompt] = useState('');
  const [matchedCharacter, setMatchedCharacter] = useState<Character | null>(null);
  const [letter, setLetter] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Character | null>(null);

  const t = translations[lang];
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setState('matching');
    setError(null);

    try {
      const character = await matchCharacter(prompt);
      setMatchedCharacter(character);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedLetter = await generateLetter(prompt, character, lang);
      setLetter(generatedLetter);
      setState('letter');
    } catch (err) {
      console.error(err);
      setError(lang === 'zh' ? '与银幕的连接中断，请重试。' : 'The connection to the screen was lost. Please try again.');
      setState('landing');
    }
  };

  const handleSwitchCharacter = async (character: Character) => {
    setState('matching');
    setMatchedCharacter(character);
    try {
      const generatedLetter = await generateLetter(prompt, character, lang);
      setLetter(generatedLetter);
      setState('letter');
    } catch (err) {
      console.error(err);
      setError(lang === 'zh' ? '暂时无法联系到这位角色。' : 'Could not reach this character right now.');
      setState('letter');
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !matchedCharacter) return;

    const newHistory = [...chatHistory, { role: 'user' as const, text }];
    setChatHistory(newHistory);
    setIsTyping(true);

    try {
      const response = await generateFollowUp(newHistory, matchedCharacter, lang);
      setChatHistory([...newHistory, { role: 'model' as const, text: response }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const reset = () => {
    setState('landing');
    setPrompt('');
    setMatchedCharacter(null);
    setLetter('');
    setChatHistory([]);
    setError(null);
    setSelectedProfile(null);
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative">
      {/* Cinematic Film Grain Overlay */}
      <div className="film-grain" />

      {/* Language Toggle */}
      <button 
        onClick={toggleLang}
        className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full text-stone-400 hover:text-white transition-all border border-white/10"
      >
        <Globe size={16} />
        <span className="text-xs font-medium uppercase tracking-widest">{lang === 'en' ? '中文' : 'English'}</span>
      </button>

      <AnimatePresence mode="wait">
        {state === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl z-10 text-center space-y-12"
          >
            <div className="space-y-4">
              <motion.h1 
                className="text-5xl md:text-7xl font-fancy italic text-gold tracking-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {t.title} 🪶
              </motion.h1>
              <motion.p 
                className="text-gold-light text-lg font-light tracking-wide max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {t.subtitle}
              </motion.p>
            </div>

            <form onSubmit={handleSubmitPrompt} className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.placeholder}
                className="w-full h-48 bg-white/5 border border-gold/30 rounded-2xl p-6 text-lg text-stone-200 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all resize-none font-light"
              />
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="absolute bottom-4 right-4 bg-gold text-midnight px-6 py-3 rounded-full font-medium flex items-center gap-2 hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.btnAsk}
                <Send size={18} />
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-3">
              {(lang === 'en' 
                ? ["I don't know what to do next in life.", "I'm tired of being strong all the time.", "I miss someone and I can't move on."]
                : ["我不知道接下来该怎么办。", "我厌倦了总是表现得很坚强。", "我思念某人，无法释怀。"]
              ).map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(p)}
                  className="text-xs uppercase tracking-widest text-stone-500 hover:text-stone-300 transition-colors border border-stone-800 px-3 py-1 rounded-full"
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="pt-8 space-y-6">
              <p className="text-[10px] uppercase tracking-[0.4em] text-stone-600 font-bold">{t.meetCharacters}</p>
              <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
                {CHARACTERS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedProfile(c)}
                    className="group flex flex-col items-center gap-2 transition-all"
                  >
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border border-white/10 group-hover:border-white/40 transition-all cinematic-glow">
                      <img 
                        src={c.imageUrl} 
                        alt={c.name} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-midnight/40 group-hover:bg-transparent transition-all" />
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-stone-600 group-hover:text-stone-300 transition-colors">
                      {lang === 'en' ? c.name.split(' ')[0] : c.nameZh.split('·')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-400/80 text-sm italic">{error}</p>
            )}
          </motion.div>
        )}

        {state === 'matching' && (
          <motion.div
            key="matching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 text-center space-y-8"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 border-t-2 border-white/20 rounded-full mx-auto"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="text-white/40 animate-pulse" size={32} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-serif italic text-gold">{t.findingVoice}</h2>
              <p className="text-gold-light font-light uppercase tracking-[0.2em] text-xs">{t.scanning}</p>
            </div>
          </motion.div>
        )}

        {state === 'letter' && matchedCharacter && (
          <motion.div
            key="letter"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-3xl z-10 flex flex-col items-center gap-8"
          >
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-gold-light text-xs uppercase tracking-[0.3em] mb-2">
                <Film size={14} />
                <span>{lang === 'en' ? matchedCharacter.film : matchedCharacter.filmZh}</span>
              </div>
              <h2 className="text-4xl font-serif italic text-gold">{lang === 'en' ? matchedCharacter.name : matchedCharacter.nameZh}</h2>
              <p className="text-gold-light text-sm font-light italic">{lang === 'en' ? matchedCharacter.moodTag : matchedCharacter.moodTagZh}</p>
            </div>

            <div className="w-full bg-[#fdfaf5] text-stone-800 p-10 md:p-16 rounded-sm shadow-2xl letter-texture relative cinematic-glow overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
              <Quote className="absolute top-8 left-8 text-gold/10" size={80} />
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2 }}
                className="font-serif text-2xl leading-[1.8] whitespace-pre-wrap italic tracking-tight text-stone-800/90"
              >
                {letter}
              </motion.div>

              <div className="mt-16 pt-10 border-t border-stone-800/10 flex justify-between items-center">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-[0.3em] opacity-60 text-stone-800">
                    {t.letterFrom}
                  </div>
                  <div className="text-lg font-serif italic text-stone-800/80">
                    {lang === 'en' ? matchedCharacter.name : matchedCharacter.nameZh}
                  </div>
                </div>
                <div className="relative">
                  <Stamp className="text-gold/30 rotate-12" size={48} />
                  <Heart className="absolute inset-0 m-auto text-gold/50" size={16} />
                </div>
              </div>

              {/* Decorative corner */}
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-gold/10 to-transparent pointer-events-none" />
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setState('chat')}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full flex items-center gap-2 transition-all"
              >
                <MessageCircle size={18} />
                {t.btnReply} {lang === 'en' ? matchedCharacter.name.split(' ')[0] : matchedCharacter.nameZh.split('·')[0]}
              </button>
              <div className="relative group">
                <button className="bg-white/5 hover:bg-white/10 text-stone-300 px-6 py-3 rounded-full flex items-center gap-2 transition-all">
                  <RefreshCw size={18} />
                  {t.btnSwitch}
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:flex flex-col bg-midnight border border-white/10 p-2 rounded-xl shadow-2xl min-w-[240px] z-50">
                  {CHARACTERS.filter(c => c.id !== matchedCharacter.id).map(c => (
                    <div key={c.id} className="flex items-center justify-between p-1 hover:bg-white/5 rounded-lg transition-colors group/item">
                      <button
                        onClick={() => handleSwitchCharacter(c)}
                        className="flex-1 text-left px-3 py-1"
                      >
                        <span className="block text-white text-sm">{lang === 'en' ? c.name : c.nameZh}</span>
                        <span className="text-stone-500 text-[10px] uppercase tracking-tighter">{lang === 'en' ? c.archetype : c.archetypeZh}</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedProfile(c); }}
                        className="p-2 text-stone-600 hover:text-white transition-colors"
                        title={t.viewProfile}
                      >
                        <Info size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={reset}
                className="text-stone-500 hover:text-white px-6 py-3 transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={18} />
                {t.btnStartOver}
              </button>
            </div>
          </motion.div>
        )}

        {state === 'chat' && matchedCharacter && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-2xl h-[80vh] z-10 flex flex-col bg-white/5 border border-white/10 rounded-3xl overflow-hidden cinematic-glow"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <button onClick={() => setState('letter')} className="text-stone-500 hover:text-white transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h3 className="text-white font-serif italic text-lg">{lang === 'en' ? matchedCharacter.name : matchedCharacter.nameZh}</h3>
                  <p className="text-stone-500 text-xs uppercase tracking-widest">{lang === 'en' ? matchedCharacter.film : matchedCharacter.filmZh}</p>
                </div>
              </div>
              <button onClick={reset} className="text-stone-500 hover:text-white text-sm">{t.endSession}</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 fade-mask">
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-white/10 p-4 rounded-2xl rounded-tl-none text-stone-200 font-serif italic leading-relaxed">
                  {letter}
                </div>
              </div>
              
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-white text-midnight rounded-tr-none' 
                      : 'bg-white/10 text-stone-200 rounded-tl-none font-serif italic leading-relaxed'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-stone-500" />
                    <span className="text-stone-500 text-xs italic">{t.writing}</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-white/[0.02] border-t border-white/10">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = (e.target as any).message.value;
                  if (input) {
                    handleSendMessage(input);
                    (e.target as any).message.value = '';
                  }
                }}
                className="relative"
              >
                <input
                  name="message"
                  autoComplete="off"
                  placeholder={`${t.replyPlaceholder} ${lang === 'en' ? matchedCharacter.name.split(' ')[0] : matchedCharacter.nameZh.split('·')[0]}...`}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-6 pr-14 text-stone-200 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-light"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-midnight p-2 rounded-full hover:bg-stone-200 transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character Profile Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-midnight/90 backdrop-blur-sm"
            onClick={() => setSelectedProfile(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-stone-50 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden border border-stone-900/10 flex flex-col md:flex-row shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full md:w-2/5 h-64 md:h-auto relative">
                <img 
                  src={selectedProfile.imageUrl} 
                  alt={selectedProfile.name}
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-transparent to-transparent md:bg-gradient-to-r" />
              </div>
              
              <div className="flex-1 p-8 md:p-12 overflow-y-auto space-y-8 relative">
                <button 
                  onClick={() => setSelectedProfile(null)}
                  className="absolute top-6 right-6 text-stone-500 hover:text-stone-900 transition-colors"
                >
                  <X size={24} />
                </button>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-stone-500 text-[10px] uppercase tracking-[0.4em]">
                    <Film size={12} />
                    <span>{lang === 'en' ? selectedProfile.film : selectedProfile.filmZh}</span>
                  </div>
                  <h2 className="text-4xl font-serif italic text-stone-900">{lang === 'en' ? selectedProfile.name : selectedProfile.nameZh}</h2>
                  <p className="text-stone-600 text-sm font-light italic">{lang === 'en' ? selectedProfile.moodTag : selectedProfile.moodTagZh}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <h4 className="text-[10px] uppercase tracking-widest text-stone-600 font-bold">{t.archetype}</h4>
                    <p className="text-stone-800 font-light">{lang === 'en' ? selectedProfile.archetype : selectedProfile.archetypeZh}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[10px] uppercase tracking-widest text-stone-600 font-bold">{t.voiceQualities}</h4>
                    <p className="text-stone-800 font-light">{lang === 'en' ? selectedProfile.voiceQualities : selectedProfile.voiceQualitiesZh}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[10px] uppercase tracking-widest text-stone-600 font-bold">{t.comfortStyle}</h4>
                    <p className="text-stone-800 font-light">{lang === 'en' ? selectedProfile.comfortStyle : selectedProfile.comfortStyleZh}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[10px] uppercase tracking-widest text-stone-600 font-bold">{t.description}</h4>
                    <p className="text-stone-800 font-light">{lang === 'en' ? selectedProfile.description : selectedProfile.descriptionZh}</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-stone-900/5">
                  <button
                    onClick={() => { handleSwitchCharacter(selectedProfile); setSelectedProfile(null); }}
                    className="w-full bg-stone-900 text-stone-50 py-4 rounded-xl font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                  >
                    {t.btnAsk}
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="fixed bottom-6 text-[10px] uppercase tracking-[0.4em] text-stone-700 pointer-events-none z-0">
        {lang === 'en' ? 'Cinematic Emotional Companion • 2026' : '银幕情感伴侣 • 2026'}
      </footer>
    </div>
  );
}
