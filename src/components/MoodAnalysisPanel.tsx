import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Activity, FileText, CheckCircle2, AlertCircle, RefreshCw, Heart } from 'lucide-react';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { ComplianceLog, UserProfile, MealPlan } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MoodAnalysisPanelProps {
  lang: 'vi' | 'en';
  profile: UserProfile | null;
  mealPlan: MealPlan | null;
  logs: ComplianceLog[]; // Already filtered for selectedDate on the parent
  selectedDate: string;
  user: any;
  db: any;
}

export const MoodAnalysisPanel: React.FC<MoodAnalysisPanelProps> = ({
  lang,
  profile,
  mealPlan,
  logs,
  selectedDate,
  user,
  db
}) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Sưu tầm và hiển thị thông tin tâm trạng hôm nay
  const loggedMoodsCount = logs.filter(l => l.mood).length;

  // Tải phân tích đã lưu nếu có cho ngày được chọn
  useEffect(() => {
    const fetchSavedAnalysis = async () => {
      if (!user || !db || !selectedDate) return;
      setAnalysis('');
      setError('');
      try {
        const id = `${user.uid}_${selectedDate}`;
        const docRef = doc(db, 'moodAnalyses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAnalysis(docSnap.data().analysis || '');
        }
      } catch (err) {
        console.error("Error retrieving mood analysis:", err);
      }
    };

    fetchSavedAnalysis();
  }, [user, db, selectedDate]);

  const handleRunAnalysis = async () => {
    if (!profile) {
      setError(lang === 'vi' ? 'Vui lòng hoàn tất hồ sơ người dùng trước.' : 'Please complete your profile first.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analyze-mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile,
          mealPlan,
          logs
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || (lang === 'vi' ? 'Không thể thực hiện phân tích' : 'Failed to analyze'));
      }

      const data = await response.json();
      const resultText = data.analysis || '';
      setAnalysis(resultText);

      // Lưu trữ phân tích kết quả vào Firestore để sử dụng lại sau này
      if (user && db) {
        const id = `${user.uid}_${selectedDate}`;
        await setDoc(doc(db, 'moodAnalyses', id), {
          userId: user.uid,
          date: selectedDate,
          analysis: resultText,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || (lang === 'vi' ? 'Đã xảy ra lỗi khi kết nối với AI' : 'Error connection to AI'));
    } finally {
      setIsLoading(false);
    }
  };

  const mealsList = [
    { type: 'breakfast' as const, label: lang === 'vi' ? 'Bữa sáng' : 'Breakfast' },
    { type: 'lunch' as const, label: lang === 'vi' ? 'Bữa trưa' : 'Lunch' },
    { type: 'snacks' as const, label: lang === 'vi' ? 'Bữa phụ' : 'Snacks' },
    { type: 'dinner' as const, label: lang === 'vi' ? 'Bữa tối' : 'Dinner' }
  ];

  const moodEmojis: Record<string, string> = {
    happy: '🌟',
    calm: '😐',
    tired: '🥱',
    stressed: '😫',
    anxious: '😰',
    depressed: '😢'
  };

  const moodTextsVi: Record<string, string> = {
    happy: 'Hạnh phúc/Sảng khoái',
    calm: 'Bình yên/Thư giãn',
    tired: 'Mệt mỏi/Uể oải',
    stressed: 'Căng thẳng',
    anxious: 'Lo lắng',
    depressed: 'U uất/Buồn bã'
  };

  const moodTextsEn: Record<string, string> = {
    happy: 'Happy / Fresh',
    calm: 'Calm / Relaxed',
    tired: 'Tired / Low energy',
    stressed: 'Stressed',
    anxious: 'Anxious',
    depressed: 'Sad / Low'
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Brain size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">
              {lang === 'vi' ? 'AI Tâm Lý & Dinh Dưỡng' : 'AI Psychology & Nutrition'}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              {lang === 'vi' ? 'Liên hệ Chế độ ăn và Sức khỏe Tinh thần' : 'Diet & Mental Health Analysis'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-extrabold shadow-2xs">
          <Sparkles size={11} className="animate-spin-slow text-amber-500" />
          <span>{lang === 'vi' ? 'Trợ lý AI' : 'AI Expert'}</span>
        </div>
      </div>

      {/* Row summary logs check */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
              {lang === 'vi' ? 'Tổng số nhật ký' : 'Total meal mood logs'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-xl font-black text-slate-800">{loggedMoodsCount}</span>
              <span className="text-[10px] text-slate-500 font-bold">/ 4 bữa ăn</span>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 mt-2 font-medium">
            {lang === 'vi' ? 'Hãy ghi nhật ký sau khi hoàn thành bữa ăn để có kết quả chính xác nhất.' : 'Log your mental status after each meal for the best results.'}
          </p>
        </div>

        <div className="p-4 bg-emerald-50/20 rounded-2xl border border-emerald-100/50 flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">
              {lang === 'vi' ? 'Sức khỏe tinh thần' : 'Mental Gut Status'}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Heart size={16} className="text-emerald-500 fill-emerald-100 animate-pulse" />
              <span className="text-xs font-black text-emerald-800">
                {loggedMoodsCount > 0 
                  ? (lang === 'vi' ? 'Đã kích hoạt hành trình' : 'Journey Activated')
                  : (lang === 'vi' ? 'Chưa có dữ liệu' : 'No Data Today')}
              </span>
            </div>
          </div>
          <p className="text-[9px] text-emerald-650 mt-2 font-semibold">
            {lang === 'vi' ? 'Ý thức tâm lý giúp cơ thể tiêu hóa khỏe mạnh hơn.' : 'Mindful eating leads to optimal digestion.'}
          </p>
        </div>
      </div>

      {/* Mood breakdown list for selected Date */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
          {lang === 'vi' ? 'Chi tiết Nhật ký Hôm nay' : 'Today\'s Mood Entries'}
        </span>
        <div className="grid grid-cols-1 gap-2">
          {mealsList.map((m) => {
            const correspondingLog = logs.find(l => l.mealType === m.type);
            return (
              <div 
                key={m.type}
                className="flex items-center justify-between p-3.5 bg-slate-50/30 hover:bg-slate-50 rounded-2xl border border-slate-100/75 transition-colors"
              >
                <div>
                  <h4 className="text-xs font-black text-slate-700">{m.label}</h4>
                  {correspondingLog?.status ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold ${
                        correspondingLog.status === 'followed' 
                          ? 'bg-emerald-100/55 text-emerald-700' 
                          : correspondingLog.status === 'skipped'
                          ? 'bg-slate-200/60 text-slate-500'
                          : 'bg-amber-100/60 text-amber-500'
                      }`}>
                        {correspondingLog.status === 'followed' 
                          ? (lang === 'vi' ? 'Đã ăn' : 'Followed') 
                          : correspondingLog.status === 'skipped'
                          ? (lang === 'vi' ? 'Bỏ bữa' : 'Skipped')
                          : (lang === 'vi' ? 'Tùy chỉnh' : 'Modified')}
                      </span>
                      {correspondingLog.mood ? (
                        <div className="flex items-center gap-1 text-[10px] text-slate-600 font-bold">
                          <span>{moodEmojis[correspondingLog.mood]}</span>
                          <span>{lang === 'vi' ? moodTextsVi[correspondingLog.mood] : moodTextsEn[correspondingLog.mood]}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          {lang === 'vi' ? 'Chưa lưu tâm trạng' : 'No mood recorded'}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic mt-1 block">
                      {lang === 'vi' ? 'Chưa dùng bữa' : 'Meal not started yet'}
                    </span>
                  )}
                </div>

                {correspondingLog?.moodNote && (
                  <div className="max-w-[50%] bg-white border border-slate-100/50 rounded-xl p-2.5 shadow-3xs">
                    <p className="text-[10px] text-slate-500 leading-tight italic line-clamp-2">
                      "{correspondingLog.moodNote}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Trigger Box & Results */}
      <div className="bg-emerald-50/5 p-5 rounded-3xl border border-emerald-100/40 relative overflow-hidden">
        {/* Decorative elements */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/98 z-10 flex flex-col items-center justify-center p-6 space-y-4 animate-fade-in text-center">
            <div className="relative">
              <div className="w-14 h-14 border-3 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-emerald-600 animate-pulse">
                <Brain size={20} className="stroke-[2.5]" />
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-emerald-700">
                {lang === 'vi' ? 'AI NutriMind đang tiến hành liên hợp dữ liệu...' : 'Connecting nutritional and mood records...'}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-1 max-w-[280px]">
                {lang === 'vi' ? 'Xem xét các mối tương quan nội tạng, chỉ số dưỡng chất và tâm sinh lý của bạn...' : 'Analyzing correlation of gut health, active ingredients, and behavioral psychology...'}
              </p>
            </div>
          </div>
        )}

        {/* Content results or Call to Action */}
        {analysis ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                <FileText size={11} />
                {lang === 'vi' ? 'Kết quả Phân tích' : 'Analysis Output'}
              </span>
              <button
                type="button"
                onClick={handleRunAnalysis}
                className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 focus:outline-none cursor-pointer"
              >
                <RefreshCw size={10} />
                {lang === 'vi' ? 'Phân tích lại' : 'Re-run analysis'}
              </button>
            </div>

            <div className="bg-white border border-slate-100/50 p-4.5 rounded-2xl shadow-3xs max-h-[440px] overflow-y-auto scrollbar-thin">
              <MarkdownRenderer content={analysis} />
            </div>

            <div className="text-[9px] text-slate-400 flex items-center gap-1 bg-white border border-slate-100/40 p-2 rounded-xl text-center">
              <AlertCircle size={10} className="text-amber-500 shrink-0" />
              <span>
                {lang === 'vi' 
                  ? 'Phân tích mang tính chất tham khảo khoa học hành vi, không thay thế chẩn đoán y tế.' 
                  : 'Behavioral consulting data, does not substitute expert medical diagnostics.'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="bg-emerald-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 animate-pulse">
              <Sparkles size={20} className="text-emerald-500" />
            </div>
            <h4 className="text-xs font-black text-slate-800 mb-1">
              {lang === 'vi' ? 'Phân Tích Mối Liên Hệ Chế Độ Ăn & Tâm Trạng' : 'Analyze Diet-Psychology Link'}
            </h4>
            <p className="text-[10px] text-slate-500 mb-5 max-w-[320px] mx-auto leading-relaxed">
              {lang === 'vi' 
                ? 'Kích hoạt trí tuệ nhân tạo Gemini để tìm ra bức tranh tổng quát về cách cơ thể phản hồi với dinh dưỡng và các thực phẩm bạn nạp vào.' 
                : 'Unleash Gemini to discover key insights into how your gut health influences focus, mood, and daily motivation.'}
            </p>
            
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={loggedMoodsCount === 0}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black tracking-wider uppercase shadow-xs transition-all flex items-center gap-1.5 mx-auto cursor-pointer ${
                loggedMoodsCount > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-102 active:scale-98'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
              }`}
            >
              <Brain size={12} className="stroke-[2.5]" />
              <span>{lang === 'vi' ? 'Phân tích bằng AI' : 'Perform AI Analysis'}</span>
            </button>
            {loggedMoodsCount === 0 && (
              <p className="text-[9px] text-rose-500 font-bold mt-2">
                {lang === 'vi' ? '* Hãy ghi ít nhất 1 nhật ký tâm trạng hôm nay để bắt đầu phân tích.' : '* Please log mood for at least 1 meal to activate analysis.'}
              </p>
            )}
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-[10px] font-bold border border-red-100 animate-shake">
            <AlertCircle size={12} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
