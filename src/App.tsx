/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  Stethoscope, 
  Activity, 
  Utensils, 
  Droplets, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User as UserIcon,
  ChevronRight,
  LogOut,
  Calendar,
  Zap,
  Leaf,
  Plus,
  X,
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  Users,
  Star,
  ShieldCheck,
  Shield,
  ChevronDown,
  LayoutGrid,
  Search,
  Check,
  Apple,
  Wind,
  Moon,
  Sun,
  Scale,
  Coffee,
  TrendingUp,
  Stethoscope as DoctorIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { auth, db, loginWithGoogle } from './lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import type { UserProfile, MealPlan, ComplianceLog, NutritionInfo, Disease, HealthTip } from './types';

// Utils
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Components
const LoadingScreen = () => (
  <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4">
    <motion.div
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="text-green-600 mb-4"
    >
      <Heart size={48} fill="currentColor" />
    </motion.div>
    <h2 className="text-xl font-semibold text-green-800">NutriCare</h2>
    <p className="text-green-600 animate-pulse">Đang chuẩn bị dinh dưỡng cho bạn...</p>
  </div>
);

const activityOptions = [
  { value: 'low', label: 'Ít vận động (Văn phòng)' },
  { value: 'moderate', label: 'Vận động vừa (Thể thao 2-3 buổi)' },
  { value: 'high', label: 'Vận động mạnh (Lao động, Fitness mỗi ngày)' }
];

const MedicalDisclaimer = ({ compact }: { compact?: boolean }) => (
  <div className={`flex gap-2 p-4 bg-amber-50 border border-amber-100 rounded-2xl ${compact ? 'p-3' : ''}`}>
    <AlertCircle size={compact ? 14 : 16} className="text-amber-600 shrink-0 mt-0.5" />
    <div className={`${compact ? 'text-[8px]' : 'text-[10px]'} text-amber-700 leading-relaxed font-medium`}>
      <p className="font-bold mb-1 underline">Lưu ý quan trọng (Medical Disclaimer):</p>
      NutriCare là trợ lý hỗ trợ dinh dưỡng dựa trên chuyên môn AI. Nội dung chỉ mang tính chất tham khảo, không thay thế tư vấn y tế chuyên nghiệp. Luôn tham khảo ý kiến bác sĩ trước khi thay đổi chế độ ăn.
    </div>
  </div>
);

const DaySelector = ({ selectedDate, onSelect }: { selectedDate: string, onSelect: (date: string) => void }) => {
  const [baseDate, setBaseDate] = useState(new Date());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseDate);
    // Find the Monday of the current baseDate week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const startOfWeek = new Date(d.setDate(diff));
    
    const current = new Date(startOfWeek);
    current.setDate(startOfWeek.getDate() + i);
    return current.toISOString().split('T')[0];
  });

  const shiftWeek = (weeks: number) => {
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + (weeks * 7));
    setBaseDate(newDate);
  };

  return (
    <div className="flex flex-col gap-3 mb-6">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={14} className="text-emerald-500" />
          Tháng {new Date(days[0]).getMonth() + 1}, {new Date(days[0]).getFullYear()}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={() => shiftWeek(-1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
          >
            <ChevronRight size={16} className="rotate-180" />
          </button>
          <button 
            onClick={() => setBaseDate(new Date())}
            className="px-2 py-1 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            Hôm nay
          </button>
          <button 
            onClick={() => shiftWeek(1)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {days.map(date => {
          const d = new Date(date);
          const isActive = date === selectedDate;
          const isToday = date === new Date().toISOString().split('T')[0];
          
          return (
            <button
              key={date}
              onClick={() => onSelect(date)}
              className={`flex flex-col items-center min-w-[60px] p-2.5 rounded-2xl transition-all ${
                isActive 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' 
                  : 'bg-white border border-slate-100 text-slate-400 hover:border-emerald-200'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-tighter opacity-80">
                {isToday ? 'Nay' : d.toLocaleDateString('vi-VN', { weekday: 'short' }).replace('Th ', 'T')}
              </span>
              <span className="text-sm font-black">{d.getDate()}</span>
              {isActive && <motion.div layoutId="activeDay" className="w-1 h-1 bg-white rounded-full mt-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const NutritionBadge = ({ info }: { info?: NutritionInfo }) => {
  if (!info) return null;
  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="grid grid-cols-4 gap-1">
        <div className="flex flex-col items-center bg-slate-50/50 rounded-lg py-1.5 border border-slate-50">
          <span className="text-[7px] font-black text-emerald-600 uppercase tracking-tighter">Calo</span>
          <span className="text-[10px] font-black text-slate-800">{info.calories}</span>
        </div>
        <div className="flex flex-col items-center bg-slate-50/50 rounded-lg py-1.5 border border-slate-50">
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Đạm</span>
          <span className="text-[10px] font-black text-slate-800">{info.protein}g</span>
        </div>
        <div className="flex flex-col items-center bg-slate-50/50 rounded-lg py-1.5 border border-slate-50">
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Carb</span>
          <span className="text-[10px] font-black text-slate-800">{info.carbs}g</span>
        </div>
        <div className="flex flex-col items-center bg-slate-50/50 rounded-lg py-1.5 border border-slate-50">
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Béo</span>
          <span className="text-[10px] font-black text-slate-800">{info.fat}g</span>
        </div>
      </div>

      {(info.fiber !== undefined || info.sugar !== undefined || info.sodium !== undefined) && (
        <div className="flex justify-center gap-3 mt-2">
          {info.fiber !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-[7px] font-bold text-slate-300 uppercase">Xơ:</span>
              <span className="text-[8px] font-bold text-slate-500">{info.fiber}g</span>
            </div>
          )}
          {info.sugar !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-[7px] font-bold text-slate-300 uppercase">Đường:</span>
              <span className="text-[8px] font-bold text-slate-500">{info.sugar}g</span>
            </div>
          )}
          {info.sodium !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-[7px] font-bold text-slate-300 uppercase">Muối:</span>
              <span className="text-[8px] font-bold text-slate-500">{info.sodium}mg</span>
            </div>
          )}
        </div>
      )}

      {/* Vitamins & Minerals */}
      {info.vitamins && Object.values(info.vitamins).some(v => v) && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(info.vitamins).map(([key, val]) => {
            if (!val) return null;
            const labels: Record<string, string> = {
              vitaminA: 'Vit A',
              vitaminC: 'Vit C',
              vitaminD: 'Vit D',
              calcium: 'Ca',
              iron: 'Fe',
              potassium: 'K'
            };
            return (
              <span key={key} className="text-[7px] font-bold px-1.5 py-0.5 bg-slate-50 text-slate-400 border border-slate-100 rounded uppercase">
                {labels[key] || key}: {val}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MealDetailModal = ({ isOpen, onClose, meal }: { isOpen: boolean, onClose: () => void, meal: { label: string, type: string, content: string, nutrition?: NutritionInfo, ingredients?: string[] } | null }) => {
  if (!meal) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white rounded-[2.5rem] shadow-2xl z-[101] flex flex-col overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="p-8 bg-emerald-600 text-white relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 transform pointer-events-none" />
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Utensils size={18} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest opacity-80">{meal.label}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight">{meal.content.split(',')[0]}</h2>
                  <p className="text-sm font-medium opacity-80 mt-2">{meal.content.split(',').slice(1).join(', ')}</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-8 space-y-10 custom-scrollbar bg-slate-50/30">
              {/* Ingredients */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Leaf size={14} className="text-emerald-500" />
                  Nguyên liệu đề xuất
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {meal.ingredients && meal.ingredients.length > 0 ? (
                    meal.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-sm font-bold text-slate-700">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full shrink-0" />
                        {ing}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                      <p className="text-xs text-slate-400 italic font-medium">Chi tiết nguyên liệu hiện chưa khả dụng. AI đang cập nhật dữ liệu.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Nutrition Breakdown */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-blue-500" />
                    Phân tích dinh dưỡng
                  </h3>
                  {meal.nutrition && (
                    <span className="text-lg font-black text-slate-800">{meal.nutrition.calories} kcal</span>
                  )}
                </div>
                
                {meal.nutrition ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Protein', value: meal.nutrition.protein, color: 'bg-emerald-500', unit: 'g', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
                        { label: 'Carbs', value: meal.nutrition.carbs, color: 'bg-blue-500', unit: 'g', textColor: 'text-blue-600', bgColor: 'bg-blue-50' },
                        { label: 'Fats', value: meal.nutrition.fat, color: 'bg-amber-500', unit: 'g', textColor: 'text-amber-600', bgColor: 'bg-amber-50' }
                      ].map(stat => (
                        <div key={stat.label} className={`${stat.bgColor} p-4 rounded-2xl border border-white`}>
                          <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${stat.textColor}`}>{stat.label}</p>
                          <p className="text-xl font-black text-slate-800">{stat.value}{stat.unit}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiêu hóa & Chuyển hóa</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs py-1.5 border-b border-slate-100">
                            <span className="text-slate-500 font-medium italic">Chất xơ:</span>
                            <span className="font-bold text-slate-800">{meal.nutrition.fiber || 0}g</span>
                          </div>
                          <div className="flex justify-between text-xs py-1.5 border-b border-slate-100">
                            <span className="text-slate-500 font-medium italic">Đường:</span>
                            <span className="font-bold text-slate-800">{meal.nutrition.sugar || 0}g</span>
                          </div>
                          <div className="flex justify-between text-xs py-1.5 border-b border-slate-100">
                            <span className="text-slate-500 font-medium italic">Natri:</span>
                            <span className="font-bold text-slate-800">{meal.nutrition.sodium || 0}mg</span>
                          </div>
                        </div>
                      </div>

                      {meal.nutrition.vitamins && (
                        <div className="sm:col-span-2 space-y-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vitamin & Khoáng chất</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(meal.nutrition.vitamins).map(([key, val]) => val ? (
                              <div key={key} className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2">
                                <Sparkles size={12} className="text-blue-400" />
                                <span className="text-xs font-bold text-blue-700 uppercase tracking-tight">
                                  {key.replace('vitamin', 'Vit ').toUpperCase()}: {val}
                                </span>
                              </div>
                            ) : null)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-sm text-slate-400 font-medium italic">Đang phân tích thành phần dinh dưỡng...</p>
                  </div>
                )}
              </section>

              {/* Health Note */}
              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 border-l-4 border-l-amber-400">
                <div className="flex gap-4">
                  <AlertCircle className="text-amber-500 shrink-0" size={24} />
                  <div>
                    <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">Ghi chú sức khỏe</h4>
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">Bữa ăn này được tối ưu hóa cho tình trạng bệnh lý hiện tại của bạn. Vui lòng không thêm gia vị hoặc nguyên liệu đậm màu nếu không có sự hướng dẫn.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-slate-100 text-center">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
              >
                Đã hiểu
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const HealthArticlesSection = ({ tips, loading }: { tips: HealthTip[], loading: boolean }) => {
  const IconComponent = (iconName: string) => {
    const icons: any = { Heart, Activity, Utensils, Zap, Leaf, ShieldCheck, Apple, Wind, Moon, Sun, Stethoscope };
    const Icon = icons[iconName] || Activity;
    return <Icon size={20} />;
  };

  return (
    <section className="col-span-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Sparkles size={16} className="text-amber-500" />
          Kiến thức dành riêng cho bạn
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm animate-pulse space-y-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-50 rounded w-full" />
              <div className="h-3 bg-slate-50 rounded w-5/6" />
            </div>
          ))
        ) : tips.length > 0 ? (
          tips.map((tip, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative cursor-default h-full flex flex-col`}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 rounded-full translate-x-1/2 -translate-y-1/2 ${
                tip.category === 'warning' ? 'bg-rose-500' : tip.category === 'nutrition' ? 'bg-emerald-500' : 'bg-blue-500'
              }`} />
              
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                tip.category === 'warning' ? 'bg-rose-50 text-rose-500' : tip.category === 'nutrition' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'
              }`}>
                {IconComponent(tip.icon || '')}
              </div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                tip.category === 'warning' ? 'text-rose-400' : tip.category === 'nutrition' ? 'text-emerald-400' : 'text-blue-400'
              }`}>
                {tip.category === 'warning' ? 'Cảnh báo' : tip.category === 'nutrition' ? 'Dinh dưỡng' : 'Lối sống'}
              </p>
              <h4 className="text-sm font-black text-slate-800 mb-2 leading-tight">{tip.title}</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {tip.content}
              </p>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic leading-relaxed">
               AI đang biên soạn lời khuyên dựa trên hồ sơ của bạn...
             </p>
          </div>
        )}
      </div>
    </section>
  );
};

const AITipsSection = ({ tips }: { tips?: string }) => {
  if (!tips) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="col-span-12 mb-2"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-emerald-600 to-emerald-500 rounded-[2rem] p-8 shadow-xl shadow-emerald-100 group">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 blur-2xl rounded-full -translate-x-1/2 translate-y-1/2 group-hover:scale-125 transition-transform duration-700" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 shadow-inner border border-white/30 group-hover:rotate-6 transition-transform">
            <Sparkles size={32} className="text-white animate-pulse" />
          </div>
          
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded text-[9px] font-black text-white uppercase tracking-[0.2em] border border-white/10">
                NutriCare AI Insight
              </span>
              <div className="h-px bg-white/20 flex-grow" />
            </div>
            <h3 className="text-white text-lg md:text-xl font-bold leading-tight mb-2 tracking-tight">
              Lời khuyên vàng cho sức khỏe của bạn
            </h3>
            <p className="text-emerald-50 text-sm md:text-base font-medium leading-relaxed italic max-w-3xl opacity-90">
              "{tips}"
            </p>
          </div>
          
          <div className="shrink-0 w-full md:w-auto">
            <button className="w-full md:w-auto px-6 py-3 bg-white text-emerald-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-50 transition-all active:scale-95 shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> Mark as seen
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

const DISEASE_CATEGORIES = [
  { id: 'digestive', label: 'Tiêu hóa', icon: 'Apple' },
  { id: 'metabolic', label: 'Chuyển hóa', icon: 'Zap' },
  { id: 'cardiovascular', label: 'Tim mạch', icon: 'Heart' },
  { id: 'urinary', label: 'Thận & Tiết niệu', icon: 'Droplets' },
  { id: 'respiratory', label: 'Hô hấp', icon: 'Wind' },
  { id: 'musculoskeletal', label: 'Cơ xương khớp', icon: 'Activity' },
  { id: 'other', label: 'Khác', icon: 'Stethoscope' }
];

const DiseaseSelector = ({ selected, onChange }: { selected: string[], onChange: (diseases: string[]) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const q = query(collection(db, 'diseases'));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => doc.data() as Disease);
        setDiseases(list);
      } catch (err) {
        console.error("Error fetching diseases:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDiseases();
  }, []);

  const filteredOptions = useMemo(() => diseases.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) && !selected.includes(d.name)
  ), [diseases, searchTerm, selected]);

  const modalFilteredDiseases = useMemo(() => diseases.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [diseases, searchTerm, selectedCategory]);

  const toggleDisease = (dName: string) => {
    if (selected.includes(dName)) {
      onChange(selected.filter(x => x !== dName));
    } else {
      onChange([...selected, dName]);
      setSearchTerm('');
    }
  };

  if (loading && diseases.length === 0) {
    return (
      <div className="p-4 text-center bg-slate-50 rounded-xl animate-pulse">
        <p className="text-[10px] font-bold text-slate-400 uppercase">Đang tải danh sách bệnh lý...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input Area */}
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Tìm kiếm bệnh lý..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:bg-white rounded-xl p-3 text-sm font-medium outline-none transition-all pl-10"
            id="disease-search-input"
          />
          <Stethoscope size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 group"
          title="Xem tất cả danh mục"
        >
          <LayoutGrid size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Duyệt nhanh</span>
        </button>
      </div>

              {/* Suggestions Dropdown */}
      {searchTerm && (
        <div className="bg-white border border-slate-100 rounded-xl max-h-48 overflow-y-auto shadow-sm p-2 space-y-1 z-50 relative">
          {filteredOptions.length > 0 ? filteredOptions.map(d => (
            <button
              key={d.id}
              onClick={() => toggleDisease(d.name)}
              className="w-full text-left p-2 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-md bg-slate-50 shrink-0 flex items-center justify-center">
                <Activity size={14} className="text-slate-300" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-700">{d.name}</p>
                <p className="text-[10px] text-slate-400 line-clamp-1">{d.description}</p>
              </div>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selected.includes(d.name) ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-200 text-transparent'}`}>
                <Check size={12} strokeWidth={4} />
              </div>
              <Plus size={14} className="text-emerald-500 hidden" />
            </button>
          )) : (
            <p className="text-[10px] text-slate-400 p-2 italic">Không tìm thấy bệnh lý phù hợp</p>
          )}
        </div>
      )}

      {/* Selected Tags */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Đã chọn ({selected.length})</p>
          {selected.length > 0 && (
            <button 
              onClick={() => onChange([])}
              className="text-[9px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-widest transition-colors"
            >
              Xóa tất cả
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 min-h-[32px] p-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <AnimatePresence>
            {selected.map(dName => {
              const d = diseases.find(x => x.name === dName);
              return (
                <motion.span
                  key={dName}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="inline-flex items-center gap-1.5 pl-2 pr-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm group"
                >
                  <Activity size={10} className="opacity-70" />
                  {dName}
                  <button 
                    onClick={() => toggleDisease(dName)} 
                    className="p-0.5 hover:bg-emerald-500 rounded-md transition-colors ml-1"
                    title={`Xóa ${dName}`}
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </motion.span>
              );
            })}
          </AnimatePresence>
          {selected.length === 0 && !searchTerm && (
            <p className="text-[10px] text-slate-400 italic py-1">Chưa chọn bệnh lý nào</p>
          )}
        </div>
      </div>

      {/* Grid Display for Better Visuals (Optional/Small screen fallback) */}
      {!searchTerm && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gợi ý phổ biến</p>
            {diseases.length > 0 && selected.length < diseases.length && (
              <button 
                onClick={() => onChange(diseases.map(d => d.name))}
                className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-colors flex items-center gap-1"
              >
                <Plus size={10} /> Chọn tất cả bệnh lý
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {diseases.filter(d => !selected.includes(d.name)).slice(0, 4).map(d => (
              <button
                key={d.id}
                onClick={() => toggleDisease(d.name)}
                className="group relative bg-white border border-slate-100 rounded-xl p-3 text-left hover:border-emerald-500 hover:shadow-md transition-all h-20 overflow-hidden flex flex-col justify-end"
              >
                {d.imageUrl && (
                  <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity">
                    <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
                  </div>
                )}
                <div className="relative z-10">
                  <p className="text-[11px] font-black text-slate-800 tracking-tight group-hover:text-emerald-600">{d.name}</p>
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selected.includes(d.name) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white/80 border-slate-200 text-transparent group-hover:border-emerald-500'}`}>
                    <Check size={12} strokeWidth={4} />
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
          >
            Xem thêm {diseases.length > 4 ? diseases.length - 4 : ''} bệnh lý khác
          </button>
        </div>
      )}

      {/* Browse Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1000]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-x-auto md:top-20 md:bottom-20 md:w-[600px] bg-white rounded-[2.5rem] shadow-2xl z-[1001] flex flex-col overflow-hidden mx-auto"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Danh mục Bệnh lý</h3>
                  <p className="text-xs font-medium text-slate-500">Chọn tất cả các tình trạng sức khỏe của bạn.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all hover:rotate-90"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 border-b border-slate-100 bg-white space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Tìm nhanh bệnh lý..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                    autoFocus
                    onChange={(e) => setSearchTerm(e.target.value)}
                    value={searchTerm}
                  />
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${selectedCategory === 'all' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    Tất cả
                  </button>
                  {DISEASE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 flex items-center gap-2 ${selectedCategory === cat.id ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200'}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {modalFilteredDiseases.map(d => {
                    const isSelected = selected.includes(d.name);
                    return (
                      <button
                        key={d.id}
                        onClick={() => toggleDisease(d.name)}
                        className={`group relative flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl border-2 transition-all text-left ${isSelected ? 'border-emerald-600 bg-emerald-50' : 'border-slate-50 bg-white hover:border-emerald-100 shadow-sm hover:shadow-md'}`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 border border-slate-100 flex items-center justify-center">
                          <Activity size={20} className="text-slate-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-black tracking-tight truncate ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>{d.name}</p>
                          <p className="text-[9px] text-slate-400 font-medium line-clamp-1">{d.description}</p>
                        </div>
                        <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white scale-110 shadow-lg shadow-emerald-200' : 'bg-white border-slate-200 text-transparent group-hover:border-emerald-300'}`}>
                          <Check size={18} strokeWidth={4} />
                        </div>
                      </button>
                    );
                  })}
                </div>
                {modalFilteredDiseases.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="text-slate-400 font-medium">Không tìm thấy bệnh lý nào khớp với từ khóa.</p>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Đã chọn</p>
                   <p className="text-lg font-black text-emerald-600">{selected.length} bệnh lý</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95"
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const LazyImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden bg-slate-100 ${className}`}
      style={{ aspectRatio: '16/9' }}
    >
      {isVisible && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          referrerPolicy="no-referrer"
        />
      )}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full animate-pulse bg-slate-200" />
        </div>
      )}
    </div>
  );
};

const AIChatbot = ({ profile }: { profile: UserProfile | null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: `Xin chào ${profile?.name || 'bạn'}! Tôi là trợ lý AI chuyên gia dinh dưỡng của NutriCare. Tôi có thể giúp gì cho sức khỏe của bạn hôm nay?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openNutriChat', handleOpenChat);
    return () => window.removeEventListener('openNutriChat', handleOpenChat);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const history = messages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const systemPrompt = `
        Bạn là "AI NutriCare Expert" - Chuyên gia tư vấn dinh dưỡng y khoa thông minh.
        Hồ sơ người dùng hiện tại:
        - Tên: ${profile?.name}
        - Tuổi: ${profile?.age}, Giới tính: ${profile?.gender}
        - Chỉ số: ${profile?.weight}kg, ${profile?.height}cm
        - Bệnh lý: ${profile?.diseases.join(", ") || 'Không có'}
        - Dị ứng: ${profile?.allergies.join(", ") || 'Không có'}
        - Mức độ vận động: ${profile?.activityLevel}

        QUY TẮC PHẢN HỒI:
        1. Luôn ưu tiên an toàn thực phẩm liên quan đến bệnh lý (${profile?.diseases.join(", ")}).
        2. Nếu người dùng hỏi về món ăn gây dị ứng (${profile?.allergies.join(", ")}), hãy cảnh báo mạnh mẽ.
        3. Văn phong chuyên nghiệp nhưng gần gũi, sử dụng tiếng Việt.
        4. KHÔNG kê đơn thuốc. Chỉ tư vấn thực phẩm, lối sống và dinh dưỡng.
        5. Luôn nhắc nhở người dùng tham khảo ý kiến bác sĩ cho các trường hợp cấp tính.
        6. Câu trả lời ngắn gọn, súc tích, định dạng Markdown nếu cần (list, bold).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...history,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          maxOutputTokens: 500,
          temperature: 0.7,
        }
      });

      const aiText = response.text || "Xin lỗi, tôi gặp chút trục trặc khi suy nghĩ. Bạn có thể hỏi lại không?";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("Chat AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Rất tiếc, máy chủ AI đang bận. Bạn vui lòng thử lại sau nhé!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[340px] h-[500px] mb-4 bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Chat Header */}
            <div className="p-4 bg-emerald-600 text-white flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight">AI NutriCare</p>
                  <p className="text-[8px] font-bold opacity-80 uppercase tracking-widest">Tư vấn dinh dưỡng 24/7</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200"
            >
              <MedicalDisclaimer compact />
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-medium ${
                    m.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-br-none' 
                      : 'bg-slate-100 text-slate-800 rounded-bl-none shadow-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-400 px-4 py-2.5 rounded-2xl rounded-bl-none flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-[10px] font-bold">Đang suy nghĩ...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-slate-100">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Hỏi tôi về dinh dưỡng..."
                  className="flex-grow bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-all active:scale-90 disabled:opacity-50 disabled:scale-100"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-center relative group"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && (
          <span className="absolute right-full mr-3 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
            Tư vấn AI
          </span>
        )}
      </motion.button>
    </div>
  );
};

interface LandingStepCardProps {
  item: {
    step: string;
    title: string;
    desc: string;
    img: string;
    details: string[];
  };
}

const LandingStepCard: React.FC<LandingStepCardProps> = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="flex flex-col gap-6 group">
      <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden">
        <img src={item.img} className="w-full h-full object-cover grayscale transition-all group-hover:grayscale-0 group-hover:scale-105" alt="" referrerPolicy="no-referrer" />
        <div className="absolute top-6 left-6 text-5xl font-black text-white/50">{item.step}</div>
      </div>
      <div>
        <h3 className="text-xl font-black text-white mb-3">{item.title}</h3>
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="cursor-pointer group/content"
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-slate-400 leading-relaxed font-medium flex-1">
              {item.desc}
            </p>
            <motion.div 
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className={`mt-1 shrink-0 p-1 rounded-full bg-white/5 text-slate-500 group-hover/content:text-emerald-400 group-hover/content:bg-white/10 transition-colors`}
            >
              <ChevronDown size={14} />
            </motion.div>
          </div>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Chi tiết giải pháp</p>
                  <ul className="space-y-2">
                    {item.details.map((detail: string, idx: number) => (
                      <motion.li 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-2 text-[11px] text-slate-400 font-medium"
                      >
                        <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                        {detail}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [logs, setLogs] = useState<ComplianceLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'dashboard' | 'profile' | 'onboarding' | 'pricing' | 'admin'>('dashboard');
  const [editingMeal, setEditingMeal] = useState<{ type: string, content: string } | null>(null);
  const [selectedMealDetail, setSelectedMealDetail] = useState<{ label: string, type: string, content: string, nutrition?: NutritionInfo, ingredients?: string[] } | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [healthTips, setHealthTips] = useState<HealthTip[]>([]);
  const [loadingTips, setLoadingTips] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        await fetchProfile(authUser.uid, authUser);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchProfile = async (uid: string, authUser: User) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        
        // Auto-sync admin role for bootstrap user
        if (authUser.email === 'quocvinh.tran87@gmail.com' && data.role !== 'admin') {
          const updated = { ...data, role: 'admin' as const };
          await setDoc(doc(db, 'users', uid), updated, { merge: true });
          setProfile(updated);
        } else {
          setProfile(data);
        }

        setView('dashboard');
      } else {
        setView('onboarding');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMealPlanForDate = async (uid: string, date: string) => {
    setMealPlan(null);
    try {
      const q = query(collection(db, 'mealPlans'), where('userId', '==', uid), where('date', '==', date));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setMealPlan(querySnapshot.docs[0].data() as MealPlan);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'mealPlans');
    }
  };

  useEffect(() => {
    if (user && selectedDate && view === 'dashboard') {
      fetchMealPlanForDate(user.uid, selectedDate);
    }
  }, [selectedDate, user, view]);

  const generateHealthTips = async (p: UserProfile) => {
    setLoadingTips(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        Dựa trên hồ sơ người dùng NutriCare:
        - Tên: ${p.name}
        - Bệnh lý: ${p.diseases.join(", ")}
        - Dị ứng: ${p.allergies.join(", ")}
        - Mức độ vận động: ${p.activityLevel}
        Cung cấp 3 bài viết/lời khuyên sức khỏe ngắn gọn, súc tích (tiếng Việt).
        Định dạng JSON: Array<{title: string, content: string, category: 'nutrition'|'lifestyle'|'warning', icon: string}>
        Sử dụng code icon từ Lucide (ví dụ: 'Apple', 'Zap', 'Activity', 'ShieldCheck', 'Moon', 'Sun', 'Wind').
      `;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                category: { type: Type.STRING },
                icon: { type: Type.STRING }
              },
              required: ["title", "content", "category", "icon"]
            }
          }
        }
      });
      const text = response.text || "[]";
      const data = JSON.parse(text);
      setHealthTips(data);
    } catch (error) {
      console.error("Error generating tips:", error);
    } finally {
      setLoadingTips(false);
    }
  };

  useEffect(() => {
    if (profile && view === 'dashboard' && healthTips.length === 0) {
      generateHealthTips(profile);
    }
  }, [profile, view, healthTips.length]);

  useEffect(() => {
    if (user && view === 'dashboard') {
      const unsub = fetchLogs(user.uid);
      return () => unsub();
    }
  }, [user, view]);

  const fetchLogs = (uid: string) => {
    const q = query(collection(db, 'complianceLogs'), where('userId', '==', uid));
    return onSnapshot(q, (snapshot) => {
      const newLogs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ComplianceLog));
      setLogs(newLogs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'complianceLogs');
    });
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      alert("Đăng nhập thất bại. Vui lòng thử lại.");
    }
  };

  const handleOnboardingSubmit = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const newProfile: UserProfile = {
      uid: user.uid,
      name: data.name || user.displayName || 'Người dùng',
      email: data.email || user.email || '',
      age: Number(data.age) || 30,
      gender: data.gender || 'male',
      height: Number(data.height) || 170,
      weight: Number(data.weight) || 60,
      diseases: data.diseases || [],
      allergies: data.allergies || [],
      habits: data.habits || '',
      activityLevel: data.activityLevel || 'moderate',
      subscriptionTier: 'free',
      planEndDate: sevenDaysLater.toISOString(),
      likedIngredients: data.likedIngredients || [],
      dislikedIngredients: data.dislikedIngredients || [],
      createdAt: now.toISOString()
    };

    try {
      await setDoc(doc(db, 'users', user.uid), newProfile, { merge: true });
      setProfile(newProfile);
      setView('dashboard');
      generateMeal(newProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const generateMeal = async (p: UserProfile, retryCount = 0) => {
    setLoading(true);
    const models = ["gemini-3-flash-preview", "gemini-3.1-flash-lite-preview"];
    const currentModel = models[retryCount] || models[models.length - 1];

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        Bạn là một chuyên gia dinh dưỡng y khoa (AI NutriCare).
        Hãy dựa vào hồ sơ sức khỏe người dùng sau để gợi ý thực đơn 1 ngày (Sáng, Trưa, Tối, Bữa phụ):
        - Tên: ${p.name}
        - Tuổi: ${p.age}
        - Cân nặng: ${p.weight}kg, Chiều cao: ${p.height}cm
        - Bệnh lý: ${p.diseases.join(", ")}
        - Dị ứng: ${p.allergies.join(", ")}
        - Thói quen: ${p.habits}
        - Mức độ vận động: ${p.activityLevel}
        - Nguyên liệu yêu thích: ${(p.likedIngredients || []).join(", ") || "Không có"}
        - Nguyên liệu không thích: ${(p.dislikedIngredients || []).join(", ") || "Không có"}

        Yêu cầu:
        1. Tuân thủ phác đồ dinh dưỡng cho người đang mắc các bệnh trên.
        2. Loại bỏ hoàn toàn thực phẩm gây dị ứng và ưu tiên loại bỏ các nguyên liệu không thích.
        3. Phân biệt rõ món nên ăn và món nên tránh.
        4. Tỉ lệ dinh dưỡng phù hợp với chỉ số BMI và mức vận động.
        5. Ước tính thành phần dinh dưỡng chi tiết (Calories, Protein, Carbs, Fat, Fiber, Sugar, Sodium và các Vitamin/khoáng chất quan trọng) cho từng bữa ăn.
        6. Cung cấp danh sách nguyên liệu (ingredients) chi tiết cho từng món ăn trong bữa.
        7. Ưu tiên các nguyên liệu yêu thích nhưng phải đảm bảo ĐA DẠNG món ăn để tránh nhàm chán (taste fatigue).
        8. Đảm bảo các món ăn luân phiên, không lặp lại nguyên liệu chính quá nhiều trong cùng 1 ngày và khuyến khích sự thay đổi giữa các ngày.
      `;

      const response = await ai.models.generateContent({
        model: currentModel,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              breakfast: { type: Type.STRING },
              lunch: { type: Type.STRING },
              dinner: { type: Type.STRING },
              snacks: { type: Type.STRING },
              ingredients: {
                type: Type.OBJECT,
                properties: {
                  breakfast: { type: Type.ARRAY, items: { type: Type.STRING } },
                  lunch: { type: Type.ARRAY, items: { type: Type.STRING } },
                  dinner: { type: Type.ARRAY, items: { type: Type.STRING } },
                  snacks: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["breakfast", "lunch", "dinner", "snacks"]
              },
              nutrition: {
                type: Type.OBJECT,
                properties: {
                  breakfast: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fat: { type: Type.NUMBER },
                      fiber: { type: Type.NUMBER },
                      sugar: { type: Type.NUMBER },
                      sodium: { type: Type.NUMBER },
                      vitamins: {
                        type: Type.OBJECT,
                        properties: {
                          vitaminA: { type: Type.STRING },
                          vitaminC: { type: Type.STRING },
                          vitaminD: { type: Type.STRING },
                          calcium: { type: Type.STRING },
                          iron: { type: Type.STRING },
                          potassium: { type: Type.STRING }
                        }
                      }
                    },
                    required: ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"]
                  },
                  lunch: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fat: { type: Type.NUMBER },
                      fiber: { type: Type.NUMBER },
                      sugar: { type: Type.NUMBER },
                      sodium: { type: Type.NUMBER },
                      vitamins: {
                        type: Type.OBJECT,
                        properties: {
                          vitaminA: { type: Type.STRING },
                          vitaminC: { type: Type.STRING },
                          vitaminD: { type: Type.STRING },
                          calcium: { type: Type.STRING },
                          iron: { type: Type.STRING },
                          potassium: { type: Type.STRING }
                        }
                      }
                    },
                    required: ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"]
                  },
                  dinner: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fat: { type: Type.NUMBER },
                      fiber: { type: Type.NUMBER },
                      sugar: { type: Type.NUMBER },
                      sodium: { type: Type.NUMBER },
                      vitamins: {
                        type: Type.OBJECT,
                        properties: {
                          vitaminA: { type: Type.STRING },
                          vitaminC: { type: Type.STRING },
                          vitaminD: { type: Type.STRING },
                          calcium: { type: Type.STRING },
                          iron: { type: Type.STRING },
                          potassium: { type: Type.STRING }
                        }
                      }
                    },
                    required: ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"]
                  },
                  snacks: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fat: { type: Type.NUMBER },
                      fiber: { type: Type.NUMBER },
                      sugar: { type: Type.NUMBER },
                      sodium: { type: Type.NUMBER },
                      vitamins: {
                        type: Type.OBJECT,
                        properties: {
                          vitaminA: { type: Type.STRING },
                          vitaminC: { type: Type.STRING },
                          vitaminD: { type: Type.STRING },
                          calcium: { type: Type.STRING },
                          iron: { type: Type.STRING },
                          potassium: { type: Type.STRING }
                        }
                      }
                    },
                    required: ["calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium"]
                  }
                },
                required: ["breakfast", "lunch", "dinner", "snacks"]
              },
              aiTips: { type: Type.STRING },
              shouldAvoid: { type: Type.ARRAY, items: { type: Type.STRING } },
              shouldEat: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["breakfast", "lunch", "dinner", "snacks", "nutrition", "aiTips", "shouldAvoid", "shouldEat", "ingredients"]
          }
        }
      });

      const textValue = response.text || "{}";
      const data = JSON.parse(textValue);
      
      const today = new Date().toISOString().split('T')[0];
      const newMealPlan: MealPlan = {
        userId: p.uid,
        date: today,
        ...data,
        createdAt: new Date().toISOString()
      };

      const docId = `${p.uid}_${today}`;
      await setDoc(doc(db, 'mealPlans', docId), newMealPlan);
      setMealPlan(newMealPlan);
    } catch (error: any) {
      console.error(`AI Error with model ${currentModel}:`, error);
      
      // Handle 429 Resource Exhausted
      if ((error.message?.includes("429") || error.status === 429) && retryCount < models.length - 1) {
        console.log(`Model ${currentModel} exhausted, retrying with ${models[retryCount + 1]}...`);
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return generateMeal(p, retryCount + 1);
      }

      alert("Máy chủ AI đang quá tải hoặc gặp sự cố. Vui lòng thử lại sau vài giây!");
    } finally {
      if (retryCount === 0 || !mealPlan) {
        setLoading(false);
      }
    }
  };

  const logCompliance = async (mealType: ComplianceLog['mealType'], status: ComplianceLog['status']) => {
    if (!user) return;
    const log: Partial<ComplianceLog> = {
      userId: user.uid,
      date: selectedDate,
      mealType,
      status,
      timestamp: new Date().toISOString()
    };

    try {
      await setDoc(doc(collection(db, 'complianceLogs')), log);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'complianceLogs');
    }
  };

  const handleSaveMeal = async () => {
    if (!mealPlan || !editingMeal || !user) return;
    
    const docId = `${user.uid}_${selectedDate}`;
    const updatedMealPlan = { ...mealPlan, [editingMeal.type]: editingMeal.content };

    try {
      await setDoc(doc(db, 'mealPlans', docId), updatedMealPlan);
      setMealPlan(updatedMealPlan);
      await logCompliance(editingMeal.type as any, 'modified');
      setEditingMeal(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `mealPlans/${docId}`);
    }
  };

  const handleUpgrade = async (tier: 'extra' | 'plus' | 'unlimited') => {
    if (!profile || !user) return;
    setIsUpgrading(true);
    
    let durationMonths = 0;
    if (tier === 'extra') durationMonths = 3;
    if (tier === 'plus') durationMonths = 12;

    const now = new Date();
    let endDate = '';
    if (tier === 'unlimited') {
      endDate = '2099-12-31T23:59:59.000Z';
    } else {
      const end = new Date(now.setMonth(now.getMonth() + durationMonths));
      endDate = end.toISOString();
    }

    const updatedProfile: UserProfile = {
      ...profile,
      subscriptionTier: tier,
      planEndDate: endDate
    };

    try {
      await setDoc(doc(db, 'users', user.uid), updatedProfile);
      setProfile(updatedProfile);
      setView('dashboard');
      alert(`Chúc mừng! Bạn đã nâng cấp thành công gói ${tier.toUpperCase()}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setIsUpgrading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        {/* Navigation */}
        <nav className="max-w-[1024px] mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-xl text-white">
              <Leaf size={24} />
            </div>
            <span className="font-black text-2xl tracking-tight text-slate-900">NutriCare</span>
          </div>
          <button
            onClick={handleLogin}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
          >
            Đăng nhập ngay
          </button>
        </nav>

        {/* Hero Section */}
        <header className="max-w-[1280px] mx-auto px-6 py-12 md:py-24 flex flex-col md:flex-row items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 space-y-8 text-center md:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest">
              <Zap size={14} fill="currentColor" /> Trí tuệ nhân tạo (AI) Chuẩn Y Khoa
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight">
              Dinh dưỡng đúng <br />
              <span className="text-emerald-600">Sống khỏe mỗi ngày.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl mx-auto md:mx-0">
              NutriCare sử dụng AI thế hệ mới để cá nhân hóa thực đơn hàng ngày chuẩn y khoa dựa trên bệnh lý, chỉ số cơ thể và thói quen của riêng bạn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button 
                onClick={handleLogin}
                className="px-8 py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95 flex items-center justify-center gap-2"
              >
                Trải nghiệm miễn phí <ChevronRight size={22} />
              </button>
              <div className="flex -space-x-3 items-center justify-center">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-11 h-11 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`} alt="User" />
                  </div>
                ))}
                <div className="pl-6 flex flex-col">
                  <div className="flex gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill="currentColor" />)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">5000+ người tin dùng</span>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex-1 relative"
          >
            <div className="absolute -inset-10 bg-emerald-400/10 blur-[100px] rounded-full" />
            <div className="geometric-card p-1 relative bg-white border-4 border-slate-100/50 shadow-2xl overflow-hidden">
              <div className="bg-slate-50 p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-100">
                      AI
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thực đơn cá nhân</p>
                      <p className="text-lg font-black text-slate-900">Bữa trưa Thứ Hai</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-white border border-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold">
                    Khớp 98%
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden shrink-0">
                      <img src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" alt="Food" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-900">Cá hồi sốt cam & Măng tây</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">350 Kcal</span>
                        <span className="text-[9px] font-bold text-emerald-500 uppercase">Giàu Đạm</span>
                      </div>
                    </div>
                    <CheckCircle2 className="text-emerald-500" size={20} />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: "Carbs", v: "45g", c: "blue" },
                      { l: "Protein", v: "32g", c: "rose" },
                      { l: "Fat", v: "12g", c: "amber" }
                    ].map(stat => (
                      <div key={stat.l} className={`p-3 bg-${stat.c}-50 rounded-xl border border-${stat.c}-100`}>
                        <p className={`text-[8px] font-black text-${stat.c}-600 uppercase mb-1`}>{stat.l}</p>
                        <p className="text-sm font-black text-slate-800">{stat.v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="flex gap-2 mb-3">
                    <AlertCircle size={14} className="text-amber-500" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">AI Ghi chú:</p>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed italic">
                    "Món ăn này được thiết kế riêng để kiểm soát đạm cho bệnh lý Gout và duy trì đường huyết ổn định."
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Stats Section */}
        <section className="max-w-[1280px] mx-auto px-6 mb-24 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[
            { label: "Người sử dụng", value: "5,000+", icon: Users, color: "emerald" },
            { label: "Dữ liệu bệnh lý", value: "20+", icon: ShieldCheck, color: "blue" },
            { label: "Món ăn chuẩn vị", value: "15,000+", icon: Utensils, color: "rose" },
            { label: "Cải thiện sức khỏe", value: "98%", icon: Activity, color: "amber" }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center shrink-0`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </section>

        {/* How it works */}
        <section className="bg-slate-900 py-24 px-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="max-w-[1024px] mx-auto relative z-10">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Sức khỏe của bạn, <br/> Quy trình của chúng tôi</h2>
              <div className="h-1.5 w-24 bg-emerald-600 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { 
                  step: "01",
                  title: "Nhập dữ liệu sức khỏe",
                  desc: "Chỉ mất 2 phút để cập nhật các chỉ số BMI, bệnh lý và thói quen vận động của bạn.",
                  img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400",
                  details: [
                    "Phân tích BMI và thành phần cơ thể chuyên sâu",
                    "Số hóa bệnh án và lịch sử dị ứng thực phẩm",
                    "Xác định ngưỡng calo tiêu thụ tối ưu (BMR/TDEE)"
                  ]
                },
                { 
                  step: "02",
                  title: "Phân tích bởi AI",
                  desc: "Hệ thống AI xử lý hàng nghìn quy tắc dinh dưỡng để tạo ra chiến lược ăn uống an toàn nhất.",
                  img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400",
                  details: [
                    "Đối soát 15,000+ thành phần dinh dưỡng chuẩn y khoa",
                    "Tự động loại bỏ các tác nhân gây kích ứng bệnh lý",
                    "Ưu tiên các nhóm thực phẩm hỗ trợ điều trị tự nhiên"
                  ]
                },
                { 
                  step: "03",
                  title: "Thực thi & Theo dõi",
                  desc: "Nhận thực đơn mỗi ngày, báo cáo tiến độ và điều chỉnh linh hoạt theo trạng thái cơ thể.",
                  img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400",
                  details: [
                    "Nhắc nhở thông minh: Uống nước, dùng thuốc, vận động",
                    "Biểu đồ tuân thủ và tiến triển sức khỏe hàng tuần",
                    "Hỗ trợ thay đổi món ăn linh hoạt theo sở thích cá nhân"
                  ]
                }
              ].map((item, i) => (
                <LandingStepCard key={i} item={item} />
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-24 px-6">
          <div className="max-w-[1024px] mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Giải pháp Dinh dưỡng Toàn diện</h2>
              <p className="text-slate-500 font-medium">Kết hợp khoa học dữ liệu và y tế để mang lại hiệu quả thật sự.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  icon: Stethoscope, 
                  title: "Dựa trên Bệnh lý", 
                  desc: "Phác đồ ăn uống được tối ưu cho Dạ dày, Đại tràng, Tiểu đường và hơn 20 nhóm bệnh lý.",
                  color: "emerald"
                },
                { 
                  icon: Zap, 
                  title: "Cá nhân hóa AI", 
                  desc: "Sử dụng Gemini AI để phân tích dữ liệu dinh dưỡng, đưa ra gợi ý khớp nhất với BMI và sở thích.",
                  color: "blue"
                },
                { 
                  icon: Calendar, 
                  title: "Theo dõi & Nhắc nhở", 
                  desc: "Nhắc giờ ăn, uống nước và đo lường mức độ tuân thủ hàng ngày để đảm bảo hiệu quả.",
                  color: "rose"
                }
              ].map((feat, i) => (
                <div key={i} className="geometric-card p-10 border-slate-100 hover:border-emerald-200 bg-white shadow-sm hover:shadow-xl transition-all transform hover:-translate-y-1">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 bg-${feat.color}-50 text-${feat.color}-600`}>
                    <feat.icon size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{feat.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* News & Knowledge Section */}
        <section className="py-24 px-6">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Kiến thức & Tin tức</h2>
                <p className="text-lg text-slate-500 font-medium max-w-lg">Cập nhật những nghiên cứu mới nhất và lời khuyên chuyên gia về sức khỏe chủ động.</p>
              </div>
              <button className="group flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-900 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">
                Xem tất cả bài viết <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  title: "Chế độ ăn DASH cho người cao huyết áp",
                  category: "Y khoa",
                  image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=800",
                  date: "12 Th04, 2024",
                  readTime: "5 phút đọc"
                },
                {
                  title: "Lợi ích của thực phẩm lên men đối với đại tràng",
                  category: "Dinh dưỡng",
                  image: "https://images.unsplash.com/photo-1547516508-4c1f9c7c4ec3?auto=format&fit=crop&q=80&w=800",
                  date: "10 Th04, 2024",
                  readTime: "4 phút đọc"
                },
                {
                  title: "Top 5 loại hạt tốt nhất cho bệnh nhân tiểu đường",
                  category: "Mẹo hay",
                  image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
                  date: "08 Th04, 2024",
                  readTime: "6 phút đọc"
                }
              ].map((news, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden mb-8 shadow-xl shadow-slate-200/50">
                    <img src={news.image} alt={news.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/90 backdrop-blur text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                      {news.category}
                    </div>
                  </div>
                  <div className="space-y-4 px-2">
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                      <span>{news.date}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      <span>{news.readTime}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-[1.2] group-hover:text-emerald-600 transition-colors">
                      {news.title}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Disease Coverage */}
        <section className="max-w-[1024px] mx-auto py-24 px-6 border-t border-slate-100">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-slate-900 leading-tight">Hỗ trợ đa dạng <br/> bệnh lý mãn tính</h2>
                <p className="text-lg text-slate-500 font-medium">Chúng tôi nghiên cứu và xây dựng dữ liệu chuyên sâu cho từng nhóm đối tượng, giúp bạn không còn băn khoăn "Hôm nay nên ăn gì?"</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["Dạ dày", "Đại tràng", "Tiểu đường", "Huyết áp cao", "Gout", "Gan nhiễm mỡ", "Sỏi thận", "Tim mạch"].map(d => (
                  <div key={d} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 shadow-sm hover:border-emerald-500 transition-colors">
                    <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                    {d}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-6">
              <div className="space-y-6 pt-16">
                <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2.5rem] shadow-sm transform hover:-translate-y-1 transition-all">
                  <Heart className="text-rose-500 mb-6" size={40} fill="currentColor" opacity={0.2} />
                  <p className="text-sm font-black text-rose-900 uppercase mb-3 tracking-widest">Tránh kích ứng</p>
                  <p className="text-sm text-rose-700 leading-relaxed">Loại bỏ thực phẩm gây viêm loét cho bệnh nhân dạ dày.</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] shadow-sm transform hover:-translate-y-1 transition-all">
                  <Activity className="text-amber-500 mb-6" size={40} />
                  <p className="text-sm font-black text-amber-900 uppercase mb-3 tracking-widest">Đường huyết</p>
                  <p className="text-sm text-amber-700 leading-relaxed">Kiểm soát tinh bột và đường cho người tiểu đường.</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2.5rem] shadow-sm transform hover:-translate-y-1 transition-all">
                  <Droplets className="text-blue-500 mb-6" size={40} fill="currentColor" opacity={0.2} />
                  <p className="text-sm font-black text-blue-900 uppercase mb-3 tracking-widest">Thanh lọc thận</p>
                  <p className="text-sm text-blue-700 leading-relaxed">Cân bằng đạm và khoáng chất phù hợp cho người bệnh thận.</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem] shadow-sm transform hover:-translate-y-1 transition-all">
                  <Leaf className="text-emerald-500 mb-6" size={40} />
                  <p className="text-sm font-black text-emerald-900 uppercase mb-3 tracking-widest">Sức sống xanh</p>
                  <p className="text-sm text-emerald-700 leading-relaxed">Tăng cường vitamin phục hồi sức khỏe tổng thể.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-6 bg-white overflow-hidden">
          <div className="max-w-[800px] mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">Câu hỏi thường gặp</h2>
              <p className="text-slate-500 font-medium">Giải đáp các thắc mắc về trợ lý NutriCare AI.</p>
            </div>

            <div className="space-y-4">
              {[
                { q: "NutriCare có thay thế được bác sĩ không?", a: "Ứng dụng đóng vai trò là trợ lý dinh dưỡng hỗ trợ, không thể thay thế cho chẩn đoán hay điều trị y tế chuyên nghiệp. Chúng tôi khuyên bạn nên tham khảo ý kiến bác sĩ trước khi áp dụng." },
                { q: "Dữ liệu thực đơn dựa trên cơ sở nào?", a: "AI của chúng tôi được huấn luyện dựa trên phác đồ dinh dưỡng chuẩn y khoa Việt Nam và quốc tế cho từng nhóm bệnh lý cụ thể." },
                { q: "Tôi có thể sử dụng miễn phí không?", a: "Có, gói Miễn phí cung cấp các tính năng cơ bản giúp bạn làm quen. Để tối ưu hóa trải nghiệm, bạn có thể cân nhắc các gói trả phí." },
                { q: "Làm thế nào để đổi món ăn nếu tôi không thích?", a: "Bạn có thể sử dụng tính năng 'Yêu cầu AI đổi món' (với gói Extra trở lên) hoặc tự chỉnh sửa món ăn theo ý thích trong trang thực đơn cá nhân." }
              ].map((faq, i) => (
                <div key={i} className="group bg-slate-50 rounded-3xl p-6 hover:bg-white border border-transparent hover:border-slate-100 transition-all cursor-pointer">
                  <div className="flex justify-between items-center bg-transparent">
                    <p className="text-base font-bold text-slate-900">{faq.q}</p>
                    <ChevronDown size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <div className="mt-4 text-sm text-slate-500 leading-relaxed font-medium hidden group-hover:block">
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Call to action */}
        <section className="max-w-[1280px] mx-auto px-6 mb-24">
          <div className="bg-emerald-600 rounded-[3.5rem] p-12 md:p-24 text-center space-y-10 relative overflow-hidden shadow-2xl shadow-emerald-200">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-400/20 blur-[80px] rounded-full -translate-x-1/3 translate-y-1/3" />
            
            <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/20 text-white rounded-full text-xs font-black uppercase tracking-[0.2em]">
                Bắt đầu hành trình của bạn
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">Sẵn sàng để bắt đầu <br/> kỷ nguyên dinh dưỡng mới?</h2>
              <p className="text-emerald-50 font-medium text-lg opacity-90">Chỉ mất 2 phút để thiết lập hồ sơ và nhận thực đơn đầu tiên từ chuyên gia AI của bạn.</p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleLogin}
                  className="px-12 py-5 bg-white text-emerald-600 rounded-2xl font-black text-xl hover:bg-emerald-50 transition-all shadow-xl shadow-emerald-900/10 active:scale-95"
                >
                  Đăng ký miễn phí
                </button>
                <div className="bg-emerald-700/30 backdrop-blur border border-white/10 p-4 rounded-2xl flex items-center gap-4 text-left">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">An toàn & Bảo mật</p>
                    <p className="text-[9px] text-emerald-100 opacity-80">Dữ liệu của bạn được mã hóa hoàn toàn.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Footer */}
        <footer className="max-w-[1024px] mx-auto px-6 py-12 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 opacity-50">
              <div className="bg-slate-900 p-1.5 rounded-lg text-white">
                <Leaf size={16} />
              </div>
              <span className="font-black text-lg tracking-tight text-slate-800">NutriCare.</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium text-center md:text-right max-w-sm italic">
              * NutriCare là trợ lý hỗ trợ dinh dưỡng dựa trên dữ liệu khoa học. Nội dung ứng dụng không thay thế lời khuyên hay chẩn đoán y tế chính thức từ bác sĩ chuyên khoa.
            </p>
          </div>
          <div className="mt-8 text-center text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
            © 2024 NutriCare Health AI. Powered by Gemini.
          </div>
        </footer>
      </div>
    );
  }

  if (view === 'onboarding') {
    return <OnboardingScreen onSubmit={handleOnboardingSubmit} user={user} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="max-w-[1024px] w-full mx-auto mt-6 flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm z-30">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <Leaf size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emerald-900 leading-tight">NutriCare</h1>
            <p className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase">Trợ lý dinh dưỡng thông minh</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">{profile?.name}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">ID: NC-{user.uid.slice(0, 4).toUpperCase()}</p>
          </div>
          <button 
            onClick={() => setView(view === 'dashboard' ? 'profile' : 'dashboard')}
            className="w-12 h-12 bg-slate-50 rounded-full border-2 border-emerald-100 flex items-center justify-center text-slate-600 hover:bg-emerald-50 transition-colors"
          >
            {view === 'dashboard' ? <UserIcon size={24} /> : <Activity size={24} />}
          </button>
          <button onClick={() => auth.signOut()} className="text-slate-400 hover:text-rose-500 transition-colors px-2">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-[1024px] w-full mx-auto p-6 flex-grow">
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-12 gap-6 h-full"
            >
              {/* Sidebar: Health Profile */}
              <aside className="col-span-12 lg:col-span-3 flex flex-col gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                   <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hồ sơ sức khỏe</h2>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                      profile?.subscriptionTier === 'free' ? 'bg-slate-100 text-slate-500' : 
                      profile?.subscriptionTier === 'extra' ? 'bg-blue-100 text-blue-600' :
                      profile?.subscriptionTier === 'plus' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      Plan: {profile?.subscriptionTier}
                    </span>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">Thời hạn còn lại</span>
                      <span className="font-bold text-emerald-600">
                        {profile?.planEndDate ? Math.ceil((new Date(profile.planEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0} ngày
                      </span>
                    </div>
                    {profile?.subscriptionTier === 'free' && (
                      <button 
                        onClick={() => setView('pricing')}
                        className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase hover:bg-emerald-100 transition-colors"
                      >
                        Nâng cấp ngay
                      </button>
                    )}
                    <hr className="border-slate-100" />
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">Tuổi / Giới</span>
                      <span className="font-bold">{profile?.age} / {profile?.gender === 'male' ? 'Nam' : 'Nữ'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">Chỉ số BMI</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-bold">
                        {(profile ? (profile.weight / (profile.height/100 * profile.height/100)) : 0).toFixed(1)}
                      </span>
                    </div>
                    <hr className="border-slate-100" />
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">TIỀN SỬ BỆNH</span>
                      <div className="flex flex-wrap gap-2">
                        {profile?.diseases?.map(d => (
                          <span key={d} className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-full text-[10px] font-bold">{d}</span>
                        ))}
                        {(!profile?.diseases || profile.diseases.length === 0) && (
                          <p className="text-[10px] text-slate-300 italic">Không có dữ liệu</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-600 text-white rounded-2xl p-5 shadow-md flex-grow flex flex-col justify-between min-h-[160px]">
                  <div>
                    <h2 className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-4">
                      Tuân thủ {selectedDate === new Date().toISOString().split('T')[0] ? 'Hôm nay' : 'Ngày ' + selectedDate.split('-').reverse().slice(0,2).join('/')}
                    </h2>
                    <div className="text-4xl font-black mb-1">
                      {Math.round((logs.filter(l => l.date === selectedDate && l.status === 'followed').length / 4) * 100)}%
                    </div>
                    <p className="text-xs opacity-90 leading-relaxed font-medium">
                      {logs.filter(l => l.date === selectedDate).length > 0 ? "Bạn đang làm rất tốt! Hãy duy trì thói quen này." : "Hãy bắt đầu đánh dấu các bữa ăn của bạn."}
                    </p>
                  </div>
                  <div className="h-2 bg-emerald-800 rounded-full overflow-hidden mt-4">
                    <motion.div 
                      key={selectedDate}
                      initial={{ width: 0 }}
                      animate={{ width: `${(logs.filter(l => l.date === selectedDate && l.status === 'followed').length / 4) * 100}%` }}
                      className="h-full bg-white"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => profile && generateMeal(profile)}
                  className="w-full py-4 bg-white border border-slate-200 text-emerald-600 rounded-2xl font-bold text-sm shadow-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={16} /> Đổi thực đơn mới
                </button>

                <div className="geometric-card overflow-hidden mt-4 hidden lg:block">
                  <LazyImage 
                    src="https://images.unsplash.com/photo-1543332164-6e82f355bab2?auto=format&fit=crop&q=80&w=800" 
                    alt="Healthy Diet" 
                  />
                  <div className="p-4">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">Kiến thức</span>
                    <h4 className="text-xs font-bold text-slate-800 mt-2 line-clamp-2">Cách đọc nhãn dinh dưỡng thực phẩm đúng cách</h4>
                    <button className="text-[9px] font-bold text-emerald-600 mt-3 flex items-center gap-1 hover:underline">Đọc ngay <ChevronRight size={10} /></button>
                  </div>
                </div>
              </aside>

              {/* Main Content: Meal Plan */}
              <main className="col-span-12 lg:col-span-9 flex flex-col gap-6">
                <DaySelector selectedDate={selectedDate} onSelect={setSelectedDate} />

                {mealPlan && <AITipsSection tips={mealPlan.aiTips} />}

                <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {selectedDate === new Date().toISOString().split('T')[0] ? 'Thực đơn đề xuất hôm nay' : 'Thực đơn lưu trữ'}
                      </h2>
                      <p className="text-sm text-slate-500 font-medium">
                        {new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Daily Nutrition Summary */}
                  {mealPlan && mealPlan.nutrition && (
                    <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(() => {
                        const total = (Object.values(mealPlan.nutrition) as NutritionInfo[]).reduce((acc, curr) => ({
                          calories: acc.calories + curr.calories,
                          protein: acc.protein + curr.protein,
                          carbs: acc.carbs + curr.carbs,
                          fat: acc.fat + curr.fat,
                        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

                        // Target calculation
                        let bmr = 0;
                        if (profile) {
                          if (profile.gender === 'male') {
                            bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + 5;
                          } else {
                            bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) - 161;
                          }
                          const activityFactor = profile.activityLevel === 'low' ? 1.2 : profile.activityLevel === 'moderate' ? 1.55 : 1.9;
                          const targetCal = Math.round(bmr * activityFactor);

                          return (
                            <>
                              <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col justify-between">
                                <p className="text-[8px] font-black uppercase tracking-wider opacity-60">Tổng Calo Hôm Nay</p>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-black">{total.calories}</span>
                                  <span className="text-[10px] opacity-60">/ {targetCal} kcal</span>
                                </div>
                                <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (total.calories/targetCal)*100)}%` }} />
                                </div>
                              </div>
                              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between">
                                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-wider">Đạm (Protein)</p>
                                <p className="text-2xl font-black text-emerald-900">{total.protein}g</p>
                                <p className="text-[9px] text-emerald-600 font-bold">{Math.round((total.protein * 4 / total.calories) * 100 || 0)}% năng lượng</p>
                              </div>
                              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col justify-between">
                                <p className="text-[8px] font-black text-blue-600 uppercase tracking-wider">Tinh bột (Carb)</p>
                                <p className="text-2xl font-black text-blue-900">{total.carbs}g</p>
                                <p className="text-[9px] text-blue-600 font-bold">{Math.round((total.carbs * 4 / total.calories) * 100 || 0)}% năng lượng</p>
                              </div>
                              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex flex-col justify-between">
                                <p className="text-[8px] font-black text-amber-600 uppercase tracking-wider">Chất béo (Fat)</p>
                                <p className="text-2xl font-black text-amber-900">{total.fat}g</p>
                                <p className="text-[9px] text-amber-600 font-bold">{Math.round((total.fat * 9 / total.calories) * 100 || 0)}% năng lượng</p>
                              </div>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  {mealPlan ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { type: 'breakfast', label: 'Bữa sáng', content: mealPlan.breakfast, time: '07:00' },
                        { type: 'lunch', label: 'Bữa trưa', content: mealPlan.lunch, time: '12:00', important: true },
                        { type: 'snacks', label: 'Bữa phụ', content: mealPlan.snacks, time: '15:30' },
                        { type: 'dinner', label: 'Bữa tối', content: mealPlan.dinner, time: '18:30' },
                      ].map((m, idx) => {
                        const isLogged = logs.some(l => l.mealType === m.type && l.date === mealPlan.date);
                        return (
                          <motion.div 
                            key={m.type}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`border ${m.important ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50'} rounded-xl p-4 relative group`}
                          >
                            <div className="text-[10px] font-bold text-emerald-600 mb-2 uppercase tracking-wide flex justify-between items-center">
                              <span>{m.label} • {m.time}</span>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => setSelectedMealDetail({ ...m, nutrition: mealPlan.nutrition?.[m.type as keyof typeof mealPlan.nutrition], ingredients: mealPlan.ingredients?.[m.type as keyof typeof mealPlan.ingredients] })}
                                  className="text-slate-400 hover:text-emerald-600 transition-colors"
                                  title="Xem chi tiết"
                                >
                                  <Plus size={14} />
                                </button>
                                {isLogged && <CheckCircle2 size={12} className="text-emerald-500" />}
                              </div>
                            </div>
                            <p className="font-bold text-slate-800 mb-1 text-sm line-clamp-2">{m.content.split(',')[0]}</p>
                            <p className="text-[10px] text-slate-500 mb-1 line-clamp-2">{m.content.split(',').slice(1).join(', ') || 'Dễ tiêu hóa, tốt cho sức khỏe.'}</p>
                            
                            <NutritionBadge info={mealPlan.nutrition?.[m.type as keyof typeof mealPlan.nutrition]} />

                            <div className="mt-4">
                              {editingMeal?.type === m.type ? (
                              <div className="space-y-2">
                                <textarea 
                                  className="w-full text-xs p-2 border border-emerald-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                                  rows={3}
                                  value={editingMeal.content}
                                  onChange={(e) => setEditingMeal({ ...editingMeal, content: e.target.value })}
                                />
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={handleSaveMeal}
                                      className="flex-1 text-[10px] bg-emerald-600 text-white rounded p-1.5 font-bold uppercase"
                                    >
                                      Lưu
                                    </button>
                                    <button 
                                      onClick={() => setEditingMeal(null)}
                                      className="flex-1 text-[10px] bg-slate-100 text-slate-500 rounded p-1.5 font-bold uppercase"
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                  <p className="text-[7px] text-rose-500 font-medium">* Lưu ý: Thông tin dinh dưỡng cũ có thể không còn chính xác sau khi sửa đổi.</p>
                                </div>
                            ) : (
                              <div className="flex gap-2">
                                {!isLogged ? (
                                  <>
                                    <button 
                                      onClick={() => logCompliance(m.type as any, 'followed')}
                                      className="flex-[2] text-[10px] bg-white border border-slate-200 rounded p-2 text-slate-500 font-bold hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                                    >
                                      Hoàn tất
                                    </button>
                                    <button 
                                      onClick={() => setEditingMeal({ type: m.type, content: m.content })}
                                      className="flex-1 text-[10px] bg-slate-50 border border-slate-100 rounded p-2 text-slate-400 font-bold hover:bg-slate-100 transition-colors"
                                    >
                                      Sửa
                                    </button>
                                  </>
                                ) : (
                                  <div className="w-full flex items-center justify-between text-[10px] bg-emerald-100 border border-emerald-200 rounded p-2 text-emerald-700 font-bold">
                                    <span>ĐÃ ĂN</span>
                                    <button 
                                      onClick={() => setEditingMeal({ type: m.type, content: m.content })}
                                      className="text-emerald-600 underline font-bold uppercase"
                                    >
                                      Sửa lại
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Activity size={32} />
                      </div>
                      <p className="text-slate-500 mb-6 font-medium">Bản tin dinh dưỡng của bạn đang được biên soạn</p>
                      <button 
                        onClick={() => profile && generateMeal(profile)}
                        className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-all active:scale-95"
                      >
                        Bắt đầu ngay
                      </button>
                    </div>
                  )}
                  
                  <MealDetailModal 
                    isOpen={!!selectedMealDetail} 
                    onClose={() => setSelectedMealDetail(null)} 
                    meal={selectedMealDetail} 
                  />
                </section>

                <HealthArticlesSection tips={healthTips} loading={loadingTips} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Avoid section */}
                  <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                      Thực phẩm cần tránh hôm nay
                    </h3>
                    <ul className="space-y-3">
                      {mealPlan?.shouldAvoid.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-rose-50 border border-rose-100/50">
                          <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-rose-900">{item}</p>
                            <p className="text-[10px] text-rose-700 opacity-80 font-medium">Có thể gây kích ứng hoặc không tốt cho bệnh lý hiện tại.</p>
                          </div>
                        </li>
                      )) || (
                        <p className="text-xs text-slate-400 italic">Dữ liệu sẽ hiển thị sau khi tạo thực đơn.</p>
                      )}
                    </ul>
                  </section>

                  {/* Recommendations */}
                  <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      Nhắc nhở & Lời khuyên
                    </h3>
                    <div className="space-y-3">
                      {mealPlan ? (
                        <>
                          <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                <Droplets size={18} />
                              </div>
                              <p className="text-sm font-medium">Uống 200ml nước ấm</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Sau mỗi bữa</span>
                          </div>
                   
                          <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                                <Activity size={18} />
                              </div>
                              <p className="text-sm font-medium">Đi bộ nhẹ 10 phút</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Chiều tối</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Đang chờ thực đơn mới...</p>
                      )}
                    </div>
                  </section>
                </div>
              </main>

              {/* Footer Disclaimer */}
              <footer className="col-span-12 mt-6 pt-4 border-t border-slate-200 flex flex-col gap-6">
                <MedicalDisclaimer />
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    NutriCare © 2026 • Intelligent Nutrition Assistant
                  </p>
                  <div className="flex gap-4">
                    {profile?.role === 'admin' && (
                    <button 
                      onClick={() => setView('admin')}
                      className="text-[10px] font-bold text-emerald-600 hover:underline uppercase tracking-wider"
                    >
                      Admin Panel
                    </button>
                  )}
                  <button className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-wider">Hướng dẫn</button>
                  <button className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-wider">Liên hệ</button>
                </div>
              </div>
            </footer>
            </motion.div>
          ) : view === 'profile' ? (
            <ProfileScreen 
              profile={profile} 
              onBack={() => setView('dashboard')} 
              onUpdate={handleOnboardingSubmit} 
              onUpgrade={() => setView('pricing')}
              onAdmin={() => setView('admin')}
            />
          ) : view === 'admin' ? (
            <AdminView onBack={() => setView('dashboard')} />
          ) : (
            <PricingView 
              currentTier={profile?.subscriptionTier || 'free'}
              onBack={() => setView('dashboard')}
              onSelect={handleUpgrade}
              loading={isUpgrading}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Floating Chatbot */}
      {view !== 'onboarding' && profile && (
        <AIChatbot profile={profile} />
      )}
    </div>
  );
}

function OnboardingScreen({ onSubmit, user }: { onSubmit: (d: Partial<UserProfile>) => void, user: User }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<UserProfile>>({
    name: user.displayName || '',
    email: user.email || '',
    age: 30,
    gender: 'male',
    height: 170,
    weight: 60,
    diseases: [],
    allergies: [],
    habits: '',
    activityLevel: 'moderate',
    likedIngredients: [],
    dislikedIngredients: []
  });

  const next = () => setStep(s => s + 1);
  const prev = () => setStep(s => s - 1);

  const steps = [
    { title: 'Chào mừng', icon: Sparkles },
    { title: 'Cá nhân', icon: UserIcon },
    { title: 'Chỉ số', icon: Scale },
    { title: 'Sức khỏe', icon: DoctorIcon },
    { title: 'Sở thích', icon: Heart }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 pt-12 relative overflow-x-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-50 to-transparent -z-10" />

      <button 
        onClick={() => auth.signOut()}
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors font-black text-[10px] uppercase tracking-widest"
      >
        <LogOut size={16} />
        Thoát
      </button>

      <div className="max-w-md w-full">
        {/* Progress */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${
                  step === i ? 'bg-emerald-600 text-white scale-110 shadow-lg shadow-emerald-200' :
                  step > i ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-300'
                }`}>
                  {step > i ? <CheckCircle2 size={16} /> : <s.icon size={16} />}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-tighter transition-colors ${step === i ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {s.title}
                </span>
                {i < steps.length - 1 && (
                  <div className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 ${step > i ? 'bg-emerald-100' : 'bg-slate-100'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="geometric-card p-8 bg-white border border-slate-100 shadow-xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 mb-6">
                  <Sparkles size={32} />
                </div>
                
                <h2 className="text-3xl font-black text-slate-900 leading-tight mb-4 tracking-tight">Chào mừng bạn đến với NutriCare!</h2>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed">Giải pháp AI đồng hành cùng sức khỏe và chế độ dinh dưỡng chuyên biệt của bạn.</p>

                <div className="space-y-4 mb-10">
                  {[
                    { icon: ShieldCheck, title: 'Thực đơn chuyên biệt', desc: 'Dựa trên tình trạng bệnh lý và dị ứng của riêng bạn.' },
                    { icon: Zap, title: 'AI Thông minh', desc: 'Phân tích thành phần dinh dưỡng và nguyên liệu chi tiết.' },
                    { icon: Activity, title: 'Theo dõi tiến độ', desc: 'Đánh dấu sự tuân thủ và nhận lời khuyên vàng mỗi ngày.' }
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 transition-colors group">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100 group-hover:border-emerald-100 text-emerald-600">
                        <feat.icon size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 tracking-tight">{feat.title}</h4>
                        <p className="text-xs text-slate-500 font-medium">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={next}
                  className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                >
                  Bắt đầu thiết lập <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="geometric-card p-8 border border-slate-100 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <UserIcon size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Về bạn</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Personal Profile</p>
                </div>
              </div>
              
              <MedicalDisclaimer />

              <div className="space-y-6 mt-8">
                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Họ và tên</label>
                  <input 
                    type="text" 
                    value={data.name} 
                    onChange={e => setData({...data, name: e.target.value})}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:bg-white rounded-xl p-4 transition-all outline-none text-slate-800 font-medium"
                  />
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Tuổi của bạn</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range"
                        min="1"
                        max="100"
                        value={data.age}
                        onChange={e => setData({...data, age: Number(e.target.value)})}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                      <span className="w-12 h-10 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-black text-sm">
                        {data.age}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block text-center">Giới tính</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'male', label: 'Nam', icon: '♂️' },
                        { value: 'female', label: 'Nữ', icon: '♀️' },
                        { value: 'other', label: 'Khác', icon: '✨' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setData({...data, gender: opt.value as any})}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                            data.gender === opt.value ? 'border-emerald-600 bg-emerald-50' : 'border-slate-50 bg-slate-50'
                          }`}
                        >
                          <span className="text-xl">{opt.icon}</span>
                          <span className={`text-[10px] font-black uppercase tracking-tight ${data.gender === opt.value ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {opt.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={next}
                disabled={!data.name}
                className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 mt-10 flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-emerald-700 transition-all active:scale-95 group"
              >
                Tiếp tục <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="geometric-card p-8 border border-slate-100 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Chỉ số hình thể</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Body Metrics</p>
                </div>
              </div>
              
              <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">Dữ liệu này giúp AI tính toán năng lượng và chế độ ăn tối ưu.</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Chiều cao (cm)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={data.height} 
                      onChange={e => setData({...data, height: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:bg-white rounded-xl p-4 transition-all outline-none text-slate-800 font-medium pr-10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">CM</span>
                  </div>
                </div>
                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Cân nặng (kg)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={data.weight} 
                      onChange={e => setData({...data, weight: Number(e.target.value)})}
                      className="w-full bg-slate-50 border-transparent border border-slate-100 focus:border-emerald-500 focus:bg-white rounded-xl p-4 transition-all outline-none text-slate-800 font-medium pr-10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">KG</span>
                  </div>
                </div>
              </div>

              <div className="relative mt-8">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Mức độ vận động hàng ngày</label>
                <div className="space-y-3">
                  {activityOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setData({...data, activityLevel: opt.value as any})}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                        data.activityLevel === opt.value ? 'border-emerald-600 bg-emerald-50 shadow-md shadow-emerald-100' : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        data.activityLevel === opt.value ? 'bg-emerald-600 text-white' : 'bg-white text-slate-300'
                      }`}>
                         {opt.value === 'low' ? <Coffee size={20} /> : opt.value === 'moderate' ? <Activity size={20} /> : <TrendingUp size={20} />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-black ${data.activityLevel === opt.value ? 'text-emerald-900' : 'text-slate-700'}`}>{opt.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Phù hợp với nhịp sống của bạn</p>
                      </div>
                      {data.activityLevel === opt.value && <CheckCircle2 size={16} className="text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-10">
                <button onClick={prev} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest">Quay lại</button>
                <button onClick={next} className="flex-[2] bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 group">
                  Tiếp theo <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="geometric-card p-8 border border-slate-100 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Y tế & Sức khỏe</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Critical Info</p>
                </div>
              </div>
              
              <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">Đây là thông tin quan trọng nhất để NutriCare đảm bảo an toàn thực phẩm cho bạn.</p>

              <div className="space-y-8">
                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Chọn các nhóm bệnh đang mắc</label>
                  <DiseaseSelector 
                    selected={data.diseases || []} 
                    onChange={(diseases) => setData({...data, diseases})} 
                  />
                </div>
                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Dị ứng thực phẩm</label>
                  <textarea 
                    value={data.allergies?.join(", ")} 
                    onChange={e => setData({...data, allergies: e.target.value.split(',').map(s => s.trim())})}
                    placeholder="Ví dụ: Hải sản, đậu phộng, sữa..."
                    className="w-full bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:bg-white rounded-xl p-4 transition-all outline-none min-h-[100px] text-sm text-slate-800 font-medium"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-10">
                <button onClick={prev} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest">Quay lại</button>
                <button onClick={next} className="flex-[2] bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 group">
                   Tiếp tục <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="geometric-card p-8 border border-slate-100 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center">
                  <Heart size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Sở thích ăn uống</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Preferences</p>
                </div>
              </div>
              
              <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">NutriCare sẽ ưu tiên các nguyên liệu bạn thích và tập trung vào sự ĐA DẠNG món ăn.</p>

              <div className="space-y-6">
                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block text-emerald-600">Nguyên liệu yêu thích</label>
                  <input 
                    type="text" 
                    placeholder="VD: Cá hồi, cải bó xôi, quả bơ (phân cách bằng dấu phẩy)"
                    className="w-full bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:bg-white rounded-xl p-4 transition-all outline-none text-slate-800 font-medium"
                    onChange={e => setData({...data, likedIngredients: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                  />
                </div>
                
                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block text-rose-400">Nguyên liệu không thích</label>
                  <input 
                    type="text" 
                    placeholder="VD: Mướp đắng, rau răm (phân cách bằng dấu phẩy)"
                    className="w-full bg-slate-50 border border-slate-100 focus:border-rose-300 focus:bg-white rounded-xl p-4 transition-all outline-none text-slate-800 font-medium"
                    onChange={e => setData({...data, dislikedIngredients: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-10">
                <button onClick={prev} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest">Quay lại</button>
                <button onClick={() => onSubmit(data)} className="flex-[2] bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 group">
                   Hoàn tất hồ sơ <ShieldCheck size={18} className="transition-transform group-hover:scale-110" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AdminView({ onBack }: { onBack: () => void }) {
  const [isAdminDarkMode, setIsAdminDarkMode] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [adminTab, setAdminTab] = useState<'users' | 'diseases'>('users');
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchDiseases();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        usersList.push(doc.data() as UserProfile);
      });
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiseases = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'diseases'));
      const diseasesList: Disease[] = [];
      querySnapshot.forEach((doc) => {
        diseasesList.push(doc.data() as Disease);
      });
      setDiseases(diseasesList);
    } catch (error) {
       console.error("Error fetching diseases:", error);
    }
  };

  const seedDiseases = async () => {
    setIsSeeding(true);
    const initialDiseases: Disease[] = [
      { 
        id: 'da-day', 
        name: 'Dạ dày', 
        category: 'digestive', 
        description: 'Viêm loét dạ dày, trào ngược và các vấn đề về tiêu hóa liên quan.', 
        imageUrl: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&q=80&w=800',
        shouldEat: ['Gừng', 'Chuối', 'Bánh mì trắng', 'Chế phẩm từ sữa (sữa chua)', 'Yến mạch'],
        shouldAvoid: ['Ớt', 'Hạt tiêu', 'Rượu bia', 'Đồ chua', 'Cà phê'],
        sampleMenu: ['Sáng: Cháo yến mạch + Chuối', 'Trưa: Cơm trắng + Ức gà hấp + Canh rau ngót', 'Tối: Súp bí đỏ + Sữa chua']
      },
      { 
        id: 'tieu-duong', 
        name: 'Tiểu đường', 
        category: 'metabolic', 
        description: 'Bệnh lý liên quan đến rối loạn chuyển hóa đường trong máu.', 
        imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800',
        shouldEat: ['Rau xanh (Xà lách, Bông cải)', 'Gạo lứt', 'Cá hồi', 'Quả hạch', 'Trứng'],
        shouldAvoid: ['Đường tinh luyện', 'Nước ngọt', 'Bánh kẹo', 'Trái cây quá ngọt', 'Tinh bột trắng'],
        sampleMenu: ['Sáng: Trứng luộc + 1 lát bánh mì đen', 'Trưa: Gạo lứt + Cá hồi áp chảo + Bông cải xanh', 'Tối: Salad ức gà + Các loại hạt']
      },
      { 
        id: 'huyet-ap-cao', 
        name: 'Huyết áp cao', 
        category: 'cardiovascular', 
        description: 'Tình trạng áp lực máu lên thành động mạch quá cao.', 
        imageUrl: 'https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?auto=format&fit=crop&q=80&w=800',
        shouldEat: ['Rau chân vịt', 'Cần tây', 'Các loại đậu', 'Khoai tây (hạn chế)', 'Cá giàu Omega-3'],
        shouldAvoid: ['Muối (Natri cao)', 'Mỡ động vật', 'Nước tương/Mắm mặn', 'Đồ đóng hộp', 'Rượu bia'],
        sampleMenu: ['Sáng: Sữa tươi không đường + Khoai lang luộc', 'Trưa: Cơm trắng (ít) + Đậu hũ sốt cà chua + Rau luộc', 'Tối: Cá thu nướng + Canh bí xanh']
      },
      { 
        id: 'gout', 
        name: 'Gout', 
        category: 'metabolic', 
        description: 'Viêm khớp do tăng nồng độ Acid Uric trong máu.', 
        imageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=800',
        shouldEat: ['Trái cây giàu Vitamin C', 'Rau xanh', 'Sữa ít béo', 'Đậu nành', 'Cà phê (vừa đủ)'],
        shouldAvoid: ['Thịt đỏ (Bò, Chó)', 'Hải sản (Tôm, Cua)', 'Nội tạng động vật', 'Rượu bia', 'Cá cơm'],
        sampleMenu: ['Sáng: Bún chay + Nước cam', 'Trưa: Cơm + Đậu phụ kho + Rau muống luộc', 'Tối: Miến xào rau củ + Sữa tách béo']
      },
      { 
        id: 'gan-nhiem-mo', 
        name: 'Gan nhiễm mỡ', 
        category: 'digestive', 
        description: 'Tình trạng tích tụ lượng mỡ dư thừa trong gan.', 
        imageUrl: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=800',
        shouldEat: ['Trà xanh', 'Tỏi', 'Dầu oliu', 'Táo', 'Các loại rau lá xanh'],
        shouldAvoid: ['Đường', 'Thực phẩm chiên rán', 'Muối', 'Thịt đỏ', 'Rượu'],
        sampleMenu: ['Sáng: 1 quả táo + Trà xanh', 'Trưa: Cơm gạo lứt + Cá hấp hành + Rau cải luộc', 'Tối: Salad rau mầm + Ức gà nướng dầu oliu']
      }
    ];

    try {
      for (const d of initialDiseases) {
        await setDoc(doc(db, 'diseases', d.id), d, { merge: true });
      }
      alert("Đã cập nhật dữ liệu bệnh lý chi tiết thành công!");
      fetchDiseases();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi cập nhật dữ liệu.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleUpdateRole = async (uid: string, role: 'admin' | 'user') => {
    try {
      await setDoc(doc(db, 'users', uid), { role }, { merge: true });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
      if (selectedUser?.uid === uid) {
        setSelectedUser(prev => prev ? { ...prev, role } : null);
      }
    } catch (error) {
      alert("Lỗi khi cập nhật quyền.");
    }
  };

  const handleUpdateTier = async (uid: string, tier: any) => {
    try {
      await setDoc(doc(db, 'users', uid), { subscriptionTier: tier }, { merge: true });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, subscriptionTier: tier } : u));
      if (selectedUser?.uid === uid) {
        setSelectedUser(prev => prev ? { ...prev, subscriptionTier: tier } : null);
      }
    } catch (error) {
      alert("Lỗi khi cập nhật gói.");
    }
  };

  const handleUpdateDiseaseCategory = async (id: string, category: string) => {
    try {
      await setDoc(doc(db, 'diseases', id), { category }, { merge: true });
      setDiseases(prev => prev.map(d => d.id === id ? { ...d, category } : d));
    } catch (err) {
      alert("Lỗi khi cập nhật danh mục.");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`space-y-8 pb-20 min-h-screen transition-colors duration-300 ${isAdminDarkMode ? 'bg-slate-950 p-8' : 'p-8'}`}
    >
      <div className={`flex justify-between items-center p-6 rounded-3xl border shadow-sm transition-colors ${isAdminDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl transition-colors ${isAdminDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
            <ChevronRight size={20} className={`rotate-180 ${isAdminDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
          </button>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isAdminDarkMode ? 'text-white' : 'text-slate-900'}`}>Quản trị Hệ thống</h2>
            <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${isAdminDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {adminTab === 'users' ? `Quản lý ${users.length} người dùng` : `Quản lý ${diseases.length} bệnh lý`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsAdminDarkMode(!isAdminDarkMode)}
            className={`p-2.5 rounded-xl border transition-all ${isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-yellow-500' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-200 hover:text-emerald-600'}`}
          >
            {isAdminDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className={`flex p-1 rounded-2xl ${isAdminDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <button 
              onClick={() => setAdminTab('users')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adminTab === 'users' ? (isAdminDarkMode ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-500 hover:text-slate-700'}`}
            >
              Người dùng
            </button>
            <button 
              onClick={() => setAdminTab('diseases')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adminTab === 'diseases' ? (isAdminDarkMode ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-500 hover:text-slate-700'}`}
            >
              Bệnh lý
            </button>
          </div>
        </div>
      </div>

      {adminTab === 'users' ? (
        <div className={`rounded-3xl border shadow-sm overflow-hidden ${isAdminDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className={`p-6 border-b flex flex-col md:flex-row gap-4 items-center justify-between ${isAdminDarkMode ? 'border-slate-800' : 'border-slate-50'}`}>
            <div className="relative w-full md:max-w-md">
              <input 
                type="text" 
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all ${isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:ring-emerald-500' : 'bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`}
              />
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className={`${isAdminDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${isAdminDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Người dùng</th>
                  <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${isAdminDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Chỉ số sức khỏe</th>
                  <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${isAdminDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Dịch vụ & Vai trò</th>
                  <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right ${isAdminDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Chi tiết</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isAdminDarkMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
                {loading ? (
                  <tr>
                     <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">Đang tải dữ liệu...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                     <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">Không tìm thấy người dùng nào</td>
                  </tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.uid} className={`transition-colors ${isAdminDarkMode ? 'hover:bg-slate-800/50 text-slate-300' : 'hover:bg-slate-50/50 text-slate-900 font-bold'}`}>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${isAdminDarkMode ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <p className={`font-bold ${isAdminDarkMode ? 'text-white' : 'text-slate-900'}`}>{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isAdminDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>Bệnh lý:</span>
                           <div className="flex gap-1">
                              {u.diseases?.slice(0, 2).map(d => (
                                <span key={d} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isAdminDarkMode ? 'bg-rose-950/30 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>{d}</span>
                              ))}
                              {u.diseases?.length > 2 && <span className="text-[9px] font-bold text-slate-400">+{u.diseases.length - 2}</span>}
                              {(!u.diseases || u.diseases.length === 0) && <span className="text-[9px] font-medium text-slate-300">Không có</span>}
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isAdminDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>Dị ứng:</span>
                           <p className={`text-[9px] font-bold truncate max-w-[150px] ${isAdminDarkMode ? 'text-amber-500/70' : 'text-amber-600'}`}>
                             {u.allergies?.join(", ") || 'Không có'}
                           </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <select 
                          value={u.subscriptionTier}
                          onChange={(e) => handleUpdateTier(u.uid, e.target.value)}
                          className={`text-[10px] font-black uppercase outline-none border rounded-lg px-2 py-1.5 shadow-sm ${isAdminDarkMode ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-white text-emerald-600 border-emerald-200'}`}
                        >
                           <option value="free">Free</option>
                           <option value="extra">Extra</option>
                           <option value="plus">Plus</option>
                           <option value="unlimited">Unlimited</option>
                        </select>
                        <select 
                          value={u.role || 'user'}
                          onChange={(e) => handleUpdateRole(u.uid, e.target.value as 'admin' | 'user')}
                          className={`text-[10px] font-black uppercase outline-none border rounded-lg px-2 py-1.5 shadow-sm ${u.role === 'admin' ? (isAdminDarkMode ? 'text-rose-400 border-rose-900/50 bg-rose-950/20' : 'text-rose-600 border-rose-200 bg-white') : (isAdminDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200')}`}
                        >
                           <option value="user">Người dùng</option>
                           <option value="admin">Quản trị</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedUser(u)}
                        className={`p-2.5 rounded-xl transition-all shadow-sm ${isAdminDarkMode ? 'bg-slate-800 text-slate-500 hover:text-emerald-400' : 'bg-slate-100 text-slate-500 hover:bg-emerald-600 hover:text-white'}`}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border shadow-sm flex justify-between items-center ${isAdminDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div>
              <h3 className={`text-lg font-bold ${isAdminDarkMode ? 'text-white' : 'text-slate-900'}`}>Danh mục Bệnh lý</h3>
              <p className={`text-sm ${isAdminDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Cấu trúc dữ liệu master cho các nhóm bệnh.</p>
            </div>
            <button 
              onClick={seedDiseases}
              disabled={isSeeding}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 ${isAdminDarkMode ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
            >
              {isSeeding ? 'Đang xử lý...' : 'Khởi tạo Dữ liệu (Seed)'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diseases.length === 0 ? (
              <div className={`col-span-full py-12 text-center rounded-3xl border border-dashed ${isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400 font-medium italic'}`}>
                <p>Chưa có dữ liệu bệnh lý. Hãy nhấn nút để khởi tạo.</p>
              </div>
            ) : diseases.map(d => (
              <div key={d.id} className={`rounded-3xl border shadow-sm overflow-hidden flex flex-col transition-all ${isAdminDarkMode ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-100 hover:border-emerald-200'}`}>
                <div className="h-20 relative bg-emerald-950 flex items-center justify-center">
                  <Activity size={32} className="text-emerald-500/50" />
                  <div className={`absolute top-4 left-4 backdrop-blur px-3 py-1 rounded-full shadow-sm bg-black/40 text-white`}>
                    <span className="text-[10px] font-black uppercase tracking-tighter">{d.id}</span>
                  </div>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                   <div className="flex justify-between items-start mb-2">
                     <h4 className={`text-lg font-black ${isAdminDarkMode ? 'text-white' : 'text-slate-900'}`}>{d.name}</h4>
                     <select 
                       value={d.category || 'other'}
                       onChange={(e) => handleUpdateDiseaseCategory(d.id, e.target.value)}
                       className={`text-[9px] font-black uppercase border rounded px-1.5 py-0.5 outline-none transition-colors ${isAdminDarkMode ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}
                     >
                       <option value="all">Chọn loại</option>
                       {DISEASE_CATEGORIES.map(cat => (
                         <option key={cat.id} value={cat.id}>{cat.label}</option>
                       ))}
                     </select>
                   </div>
                   <p className={`text-xs leading-relaxed line-clamp-3 mb-4 ${isAdminDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{d.description}</p>
                   <div className={`mt-auto pt-4 border-t flex justify-between items-center text-[10px] font-black uppercase tracking-widest ${isAdminDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-50 text-slate-400'}`}>
                      <span>{d.shouldEat?.length || 0} món nên ăn</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${isAdminDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
                      <span>{d.shouldAvoid?.length || 0} món tránh</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" 
            />
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className={`fixed top-0 right-0 bottom-0 w-full max-w-md shadow-2xl z-[101] overflow-y-auto transition-colors ${isAdminDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black tracking-tight">Hồ sơ chi tiết</h3>
                  <button onClick={() => setSelectedUser(null)} className={`p-2 rounded-full transition-colors ${isAdminDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                    <X size={24} className={isAdminDarkMode ? 'text-slate-500' : 'text-slate-400'} />
                  </button>
                </div>

                <div className={`flex items-center gap-6 p-6 rounded-3xl border ${isAdminDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg ${isAdminDarkMode ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-600 text-white shadow-emerald-100'}`}>
                    {selectedUser.name?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold leading-none mb-1">{selectedUser.name}</h4>
                    <p className={`text-sm font-medium ${isAdminDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{selectedUser.email}</p>
                    <div className="mt-2 flex gap-2">
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${isAdminDarkMode ? 'bg-emerald-950/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                         {selectedUser.subscriptionTier}
                       </span>
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${selectedUser.role === 'admin' ? 'bg-rose-100 text-rose-600' : (isAdminDarkMode ? 'bg-slate-700 text-slate-500' : 'bg-slate-200 text-slate-500')}`}>
                         {selectedUser.role === 'admin' ? 'Admin' : 'User'}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className={`p-4 rounded-2xl border ${isAdminDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                         <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 ${isAdminDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Chiều cao / Cân nặng</p>
                         <p className={`text-sm font-black ${isAdminDarkMode ? 'text-white' : 'text-slate-700'}`}>{selectedUser.height}cm / {selectedUser.weight}kg</p>
                      </div>
                      <div className={`p-4 rounded-2xl border ${isAdminDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                         <p className={`text-[9px] font-bold uppercase tracking-widest mb-1.5 ${isAdminDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Tuổi / Giới tính</p>
                         <p className={`text-sm font-black ${isAdminDarkMode ? 'text-white' : 'text-slate-700'}`}>{selectedUser.age} tuổi / {selectedUser.gender === 'male' ? 'Nam' : selectedUser.gender === 'female' ? 'Nữ' : 'Khác'}</p>
                      </div>
                   </div>

                   <section className="space-y-3">
                      <h5 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isAdminDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                        <Stethoscope size={14} className="text-emerald-500" /> Tình trạng sức khỏe
                      </h5>
                      <div className="space-y-4">
                        <div>
                          <p className={`text-[9px] font-bold uppercase mb-2 ${isAdminDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Bệnh lý đang mắc:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedUser.diseases?.length > 0 ? selectedUser.diseases.map(d => (
                              <span key={d} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${isAdminDarkMode ? 'bg-rose-950/30 text-rose-400 border-rose-900/50' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                {d}
                              </span>
                            )) : <p className="text-xs text-slate-400 italic">Không có dữ liệu bệnh lý</p>}
                          </div>
                        </div>
                        <div>
                          <p className={`text-[9px] font-bold uppercase mb-2 ${isAdminDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Dị ứng thực phẩm:</p>
                          <div className={`p-4 rounded-2xl border ${isAdminDarkMode ? 'bg-amber-950/20 border-amber-900/30' : 'bg-amber-50 border-amber-100'}`}>
                             <p className={`text-xs font-bold leading-relaxed ${isAdminDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                               {selectedUser.allergies?.join(", ") || 'Không phát hiện dị ứng thực phẩm.'}
                             </p>
                          </div>
                        </div>
                      </div>
                   </section>

                   <section className={`space-y-3 border-t pt-6 ${isAdminDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                      <h5 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isAdminDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                        <Zap size={14} className="text-blue-500" /> Hành động quản trị
                      </h5>
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => handleUpdateRole(selectedUser.uid, selectedUser.role === 'admin' ? 'user' : 'admin')}
                          className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border ${selectedUser.role === 'admin' ? (isAdminDarkMode ? 'border-rose-900 text-rose-400 hover:bg-rose-900/30' : 'border-rose-200 text-rose-600 hover:bg-rose-50') : (isAdminDarkMode ? 'border-emerald-900 text-emerald-400 hover:bg-emerald-900/30' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50')}`}
                        >
                          {selectedUser.role === 'admin' ? 'Thu hồi quyền Admin' : 'Cấp quyền Quản trị (Admin)'}
                        </button>
                        <div className={`p-4 rounded-2xl border ${isAdminDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                           <p className={`text-[9px] font-bold uppercase mb-2 text-center ${isAdminDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Nâng cấp gói dịch vụ thủ công</p>
                           <div className="grid grid-cols-2 gap-2">
                              {['free', 'extra', 'plus', 'unlimited'].map(t => (
                                <button
                                  key={t}
                                  onClick={() => handleUpdateTier(selectedUser.uid, t)}
                                  className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${selectedUser.subscriptionTier === t ? (isAdminDarkMode ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20 border-emerald-500' : 'bg-emerald-600 text-white shadow-md shadow-emerald-100 border-emerald-500') : (isAdminDarkMode ? 'bg-slate-800 text-slate-500 hover:text-emerald-400 border-slate-700' : 'bg-white text-slate-400 hover:text-emerald-600 border-slate-100')}`}
                                >
                                  {t}
                                </button>
                              ))}
                           </div>
                        </div>
                      </div>
                   </section>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PricingView({ currentTier, onBack, onSelect, loading }: { currentTier: string, onBack: () => void, onSelect: (tier: any) => void, loading: boolean }) {
  const tiers = [
    { 
      id: 'free', 
      name: 'Miễn phí', 
      price: '0đ', 
      duration: '7 ngày', 
      features: ['Thực đơn AI cơ bản', 'Theo dõi tuân thủ', 'Lời khuyên sức khỏe'],
      color: 'slate'
    },
    { 
      id: 'extra', 
      name: 'Extra', 
      price: '199.000đ', 
      duration: '3 tháng', 
      features: ['Thực đơn cá nhân hóa sâu', 'Ưu tiên xử lý AI', 'Lịch sử log chi tiết'],
      popular: true,
      color: 'blue'
    },
    { 
      id: 'plus', 
      name: 'Plus', 
      price: '499.000đ', 
      duration: '12 tháng', 
      features: ['Tất cả tính năng Extra', 'Hỗ trợ 1-1 từ AI', 'Báo cáo sức khỏe tháng'],
      color: 'amber'
    },
    { 
      id: 'unlimited', 
      name: 'Unlimited', 
      price: '999.000đ', 
      duration: 'Trọn đời', 
      features: ['Truy cập vĩnh viễn', 'Cập nhật tính năng sớm', 'Gói gia đình (sắp có)'],
      color: 'emerald'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-20"
    >
      <div className="text-center space-y-4">
        <button onClick={onBack} className="text-slate-400 hover:text-emerald-600 font-bold text-[10px] uppercase tracking-widest transition-colors mb-4">
          ← Quay lại Dashboard
        </button>
        <h2 className="text-3xl font-black text-slate-900 leading-tight">Nâng cấp sức khỏe của bạn</h2>
        <p className="text-slate-500 font-medium max-w-md mx-auto">Chọn gói dịch vụ phù hợp để đồng hành lâu dài cùng NutriCare.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((t) => (
          <div 
            key={t.id} 
            className={`geometric-card p-6 flex flex-col relative ${t.popular ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-100'}`}
          >
            {t.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                Phổ biến nhất
              </span>
            )}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-1">{t.name}</h3>
              <p className="text-2xl font-black text-slate-900">{t.price}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời hạn: {t.duration}</p>
            </div>
            <ul className="space-y-3 mb-8 flex-grow">
              {t.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-600">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button
              disabled={loading || currentTier === t.id}
              onClick={() => onSelect(t.id)}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                currentTier === t.id ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                t.id === 'unlimited' ? 'bg-emerald-600 text-white hover:bg-emerald-700' :
                t.id === 'plus' ? 'bg-amber-500 text-white hover:bg-amber-600' :
                t.id === 'extra' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                'bg-slate-800 text-white hover:bg-slate-900'
              }`}
            >
              {currentTier === t.id ? 'Đang sử dụng' : loading ? 'Đang xử lý...' : 'Chọn gói này'}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
function ProfileScreen({ profile, onBack, onUpdate, onUpgrade, onAdmin }: { profile: UserProfile | null, onBack: () => void, onUpdate: (d: Partial<UserProfile>) => void, onUpgrade: () => void, onAdmin: () => void }) {
  const [formData, setFormData] = useState<Partial<UserProfile>>(profile || {});
  
  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('openNutriChat'));
  };

  if (!profile) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-12 gap-6"
    >
      <div className="col-span-12 flex items-center justify-between">
        <button onClick={onBack} className="text-slate-500 flex items-center gap-1 font-bold text-xs uppercase tracking-widest hover:text-emerald-600 transition-colors">
           Quay lại
        </button>
        <h2 className="text-xl font-bold text-slate-900">Chi tiết hồ sơ</h2>
        <div className="w-10" />
      </div>

      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="geometric-card p-8 space-y-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
              <UserIcon size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800">{profile.name}</h3>
              <p className="text-sm font-medium text-slate-400">{profile.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Họ và tên</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-medium focus:bg-white focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Tuổi</label>
              <input 
                type="number" 
                value={formData.age} 
                onChange={e => setFormData({...formData, age: Number(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-medium focus:bg-white focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Chiều cao (cm)</label>
              <input 
                type="number" 
                value={formData.height} 
                onChange={e => setFormData({...formData, height: Number(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-medium focus:bg-white focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Cân nặng (kg)</label>
              <input 
                type="number" 
                value={formData.weight} 
                onChange={e => setFormData({...formData, weight: Number(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-medium focus:bg-white focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Tiền sử bệnh lý</label>
            <DiseaseSelector 
              selected={formData.diseases || []} 
              onChange={(diseases) => setFormData({...formData, diseases})} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Dị ứng thực phẩm</label>
            <textarea 
              value={formData.allergies?.join(", ")} 
              onChange={e => setFormData({...formData, allergies: e.target.value.split(',').map(s => s.trim())})}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-medium focus:bg-white focus:border-emerald-500 outline-none transition-all min-h-[100px]"
            />
          </div>

          <button 
            onClick={() => onUpdate(formData)}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-100 active:scale-[0.98] transition-all hover:bg-emerald-700 font-bold uppercase tracking-wider text-sm mt-4"
          >
            Lưu thay đổi hồ sơ
          </button>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-amber-900">Lưu ý y tế</h3>
          </div>
          <p className="text-sm text-amber-800 leading-relaxed font-medium">
            Thông tin hồ sơ sức khỏe của bạn sẽ được sử dụng bởi Trí tuệ nhân tạo (AI) để đưa ra các gợi ý dinh dưỡng. Hãy đảm bảo thông tin chính xác nhất có thể.
          </p>
        </div>

        <div className="geometric-card p-6 border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Hoạt động tài khoản</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Ngày tham gia</span>
              <span className="font-bold text-slate-700">{new Date(profile.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Thực đơn đã tạo</span>
              <span className="font-bold text-slate-700">1</span>
            </div>
            <div className="pt-4 border-t border-slate-100">
               <MedicalDisclaimer />
            </div>
            <div className="pt-4 border-t border-slate-100">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Gói dịch vụ</h3>
               <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleOpenChat}
                    className="w-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-[0.98]"
                  >
                    <MessageSquare size={14} />
                    Chat với Chuyên gia AI
                  </button>
                  <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-900 uppercase">{profile.subscriptionTier}</p>
                      <p className="text-[10px] text-slate-500">Hết hạn: {new Date(profile.planEndDate || '').toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={onUpgrade}
                    className="w-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    Nâng cấp gói
                  </button>
                  {profile.role === 'admin' && (
                    <button 
                      onClick={onAdmin}
                      className="w-full bg-slate-900 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Zap size={14} fill="currentColor" className="text-amber-400" />
                      Trang Quản Trị
                    </button>
                  )}
               </div>
            </div>
            <button 
              onClick={() => auth.signOut()}
              className="w-full text-rose-500 text-xs font-bold uppercase tracking-widest py-3 border border-rose-100 rounded-xl hover:bg-rose-50 transition-colors mt-6"
            >
              Đăng xuất tài khoản
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
