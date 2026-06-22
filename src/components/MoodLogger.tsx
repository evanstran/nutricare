import React, { useState, useEffect } from 'react';
import { Smile, User, Check, X, Brain, HelpCircle, Activity, Sparkles } from 'lucide-react';
import { ComplianceLog } from '../types';

interface MoodLoggerProps {
  lang: 'vi' | 'en';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  mealLabel: string;
  existingLog?: ComplianceLog;
  onSave: (mood: ComplianceLog['mood'], note: string) => Promise<void>;
  onClose: () => void;
}

export const MoodLogger: React.FC<MoodLoggerProps> = ({
  lang,
  mealType,
  mealLabel,
  existingLog,
  onSave,
  onClose
}) => {
  const [selectedMood, setSelectedMood] = useState<ComplianceLog['mood']>(existingLog?.mood || undefined);
  const [note, setNote] = useState<string>(existingLog?.moodNote || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingLog) {
      setSelectedMood(existingLog.mood);
      setNote(existingLog.moodNote || '');
    }
  }, [existingLog]);

  const moodsList = [
    { id: 'happy' as const, emoji: '🌟', labelVi: 'Hạnh phúc', labelEn: 'Happy', color: 'bg-amber-100 border-amber-300 text-amber-800' },
    { id: 'calm' as const, emoji: '😐', labelVi: 'Bình yên', labelEn: 'Calm', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
    { id: 'tired' as const, emoji: '🥱', labelVi: 'Mệt mỏi', labelEn: 'Tired', color: 'bg-blue-100 border-blue-300 text-blue-800' },
    { id: 'stressed' as const, emoji: '😫', labelVi: 'Căng thẳng', labelEn: 'Stressed', color: 'bg-rose-100 border-rose-300 text-rose-800' },
    { id: 'anxious' as const, emoji: '😰', labelVi: 'Lo lắng', labelEn: 'Anxious', color: 'bg-purple-100 border-purple-300 text-purple-800' },
    { id: 'depressed' as const, emoji: '😢', labelVi: 'Buồn bã', labelEn: 'Sad', color: 'bg-slate-100 border-slate-300 text-slate-800' },
  ];

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(selectedMood, note);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center animate-pulse">
              <Brain size={16} />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                {lang === 'vi' ? 'NHẬT KÝ TÂM TRẠNG' : 'MOOD JOURNAL'}
              </h4>
              <span className="text-xs font-black text-slate-800 mt-1 block">
                {lang === 'vi' ? `Bạn cảm thấy ra sao sau ${mealLabel}?` : `How do you feel after ${mealLabel}?`}
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveSubmit} className="p-6 space-y-5">
          {/* Mood Grids */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3">
              {lang === 'vi' ? '1. Chọn tâm trạng của bạn' : '1. Choose your mood state'}
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {moodsList.map((m) => {
                const isSelected = selectedMood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMood(m.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer text-center group ${
                      isSelected 
                        ? `${m.color} ring-2 ring-emerald-500 scale-102 font-black shadow-xs` 
                        : 'border-slate-100 hover:border-slate-350 bg-slate-50/50 hover:bg-white text-slate-600'
                    }`}
                  >
                    <span className="text-2xl mb-1 block transition-transform group-hover:scale-110">{m.emoji}</span>
                    <span className="text-[10px] font-bold tracking-tight">
                      {lang === 'vi' ? m.labelVi : m.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Textarea detail of feeling */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
              {lang === 'vi' ? '2. Ghi chú chi tiết / Triệu chứng cơ thể' : '2. Detailed Notes / Physical symptoms'}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={lang === 'vi' 
                ? 'Ví dụ: Bụng êm, sảng khoái và tràn đầy năng lượng, không thấy đầy hơi...' 
                : 'Example: Smooth digestion, feeling energized, no brain fog...'}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 line-height-[1.4] h-24 bg-slate-50/30 focus:bg-white transition-all text-slate-700 font-medium"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-colors uppercase cursor-pointer text-center"
            >
              {lang === 'vi' ? 'Bỏ qua' : 'Discard'}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold tracking-wider uppercase transition-colors shrink-0 cursor-pointer text-center flex items-center justify-center gap-1 shadow-sm active:scale-98"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check size={12} className="stroke-[3]" />
              )}
              <span>{lang === 'vi' ? 'Lưu nhật ký' : 'Save entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
