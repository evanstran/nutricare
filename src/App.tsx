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
  Lock,
  Mail,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Apple,
  Wind,
  Moon,
  Sun,
  Scale,
  Coffee,
  TrendingUp,
  Stethoscope as DoctorIcon,
  FileDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
// GoogleGenAI import removed from client-side
import { auth, db, loginWithGoogle, loginWithEmail, registerWithEmail } from './lib/firebase';
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
import type { UserProfile, MealPlan, ComplianceLog, NutritionInfo, Disease, HealthTip, WeightEntry } from './types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { LiveSupportChat, AdminChatPanel } from './components/LiveSupportChat';
import { RecipeSearch } from './components/RecipeSearch';
import { AppInstallButton } from './components/AppInstallButton';
import { MoodLogger } from './components/MoodLogger';
import { MoodAnalysisPanel } from './components/MoodAnalysisPanel';

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
const NutriCareSvgLogo = ({ className = "w-6 h-6", id }: { className?: string, id?: string }) => (
  <svg 
    id={id}
    viewBox="0 0 120 120" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="logo-green-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#15803d" />
        <stop offset="50%" stopColor="#16a34a" />
        <stop offset="100%" stopColor="#4ade80" />
      </linearGradient>
      <linearGradient id="logo-heart-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#14532d" />
        <stop offset="50%" stopColor="#15803d" />
        <stop offset="100%" stopColor="#22c55e" />
      </linearGradient>
    </defs>
    
    {/* 1. Main Heart Contour Left & Right */}
    <path 
      d="M 60,32 C 45,12 14,14 14,48 C 14,75 32,95 60,111 C 61.5,111.8 63,111.8 64.5,111 C 72,107 81,101 88,94" 
      stroke="url(#logo-heart-gradient)" 
      strokeWidth="8" 
      strokeLinecap="round" 
      fill="none" 
    />
    <path 
      d="M 60,32 C 75,12 106,14 106,48 C 106,58 102,68 96,76" 
      stroke="url(#logo-heart-gradient)" 
      strokeWidth="8" 
      strokeLinecap="round" 
      fill="none" 
    />

    {/* 2. Cradling Hand Shape at Bottom Left to Right */}
    <path 
      d="M 38,91 C 45,99 53,101 62,101 C 78,101 92,95 98,88 C 101,84 97,81 92,83 C 83,87 74,89 65,89 C 53,89 44,84 38,76" 
      stroke="url(#logo-green-gradient)" 
      strokeWidth="6" 
      strokeLinecap="round" 
      fill="none" 
    />

    {/* 3. Blue Medical/Health Cross */}
    <g fill="#3b82f6">
      <rect x="76" y="20" width="7" height="18" rx="3" />
      <rect x="70.5" y="25.5" width="18" height="7" rx="3" />
    </g>

    {/* 4. Abstract Healthy Human (raises hands) */}
    <circle cx="46" cy="38" r="7.5" fill="url(#logo-green-gradient)" />
    <path 
      d="M 34,58 C 32,44 29,38 31,30 C 33,28 35,30 38,36 C 44,48 55,54 62,50 C 64,49 61,53 57,57 C 49,65 44,78 44,86 C 44,88 40,88 40,84 C 40,75 38,65 34,58 Z" 
      fill="url(#logo-green-gradient)" 
    />

    {/* 5. Green Salad Bowl */}
    <path 
      d="M 57,69 C 66,73 84,73 95,69 C 95,80 86,89 76,89 C 66,89 57,80 57,69 Z" 
      fill="#84cc16" 
    />

    {/* 6. Food elements inside the Bowl */}
    <path 
      d="M 68,69 C 61,61 58,54 62,48 C 65,45 69,47 71,51 C 72,46 76,45 78,49 C 80,53 79,61 74,69 Z" 
      fill="#16a34a" 
    />
    <path 
      d="M 74,68 C 76,68 79,64 81,60 C 84,54 89,45 87,44 C 85,43 80,52 77,57 C 75,61 73,65 74,68 Z" 
      fill="#f97316" 
    />
    <path 
      d="M 87,44 L 89,38 C 90,37 91,38 90,39 L 88,44 M 86,43 L 83,39 C 82,38 83,37 84,38 L 86,43" 
      stroke="#16a34a" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />
    <path 
      d="M 85,68 C 82,68 81,65 81,61 C 81,55 85,52 89,52 C 93,52 97,55 97,61 C 97,65 95,68 91,68 C 89,68 87,67 85,68 Z" 
      fill="#dc2626" 
    />
    <path 
      d="M 89,52 C 89,48 91,46 93,48 C 93,50 91,52 89,52 Z" 
      fill="#22c55e" 
    />
  </svg>
);

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

const HydrationTracker = ({ 
  selectedDate, 
  onUpdateWater, 
  getWaterIntake, 
  lang 
}: { 
  selectedDate: string;
  onUpdateWater: (date: string, delta: number) => void;
  getWaterIntake: (date: string) => number;
  lang: string;
}) => {
  const currentIntake = getWaterIntake(selectedDate);
  const dailyGoal = 2000; // in ml
  const numCupsTotal = 8; // 250ml per cup
  const numCupsActive = Math.min(numCupsTotal, Math.floor(currentIntake / 250));
  const progressPercent = Math.min(100, Math.round((currentIntake / dailyGoal) * 100));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Droplets size={14} className="text-sky-500" />
          {lang === 'vi' ? 'Theo dõi nước uống' : 'Hydration Tracker'}
        </h3>
        <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
          {progressPercent}%
        </span>
      </div>

      {/* Progress metrics */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-black text-slate-800 tracking-tight">
            {currentIntake}
          </span>
          <span className="text-xs text-slate-550 font-bold ml-1">
            / {dailyGoal} ml
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-bold">
          {lang === 'vi' ? 'Mục tiêu: 8 ly' : 'Goal: 8 cups'}
        </span>
      </div>

      {/* Modern Wave Progress Bar */}
      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          className="h-full bg-gradient-to-r from-sky-450 to-blue-500 rounded-full"
        />
      </div>

      {/* 8 Cups Interactive Grid */}
      <div className="flex justify-between items-center px-1 my-1">
        {Array.from({ length: numCupsTotal }, (_, i) => {
          const isActive = i < numCupsActive;
          const isNext = i === numCupsActive;
          return (
            <button
              key={i}
              onClick={() => onUpdateWater(selectedDate, isActive ? -250 : 250)}
              className="relative p-1 transition-all transform hover:scale-125 active:scale-90"
              title={lang === 'vi' ? `Ly nước số ${i + 1} (250ml)` : `Cup ${i + 1} (250ml)`}
              id={`hydration-cup-${i}`}
            >
              <Droplets 
                size={18} 
                className={`transition-colors duration-300 ${
                  isActive 
                    ? 'text-sky-500 fill-sky-400 filter drop-shadow-[0_2px_4px_rgba(14,165,233,0.3)]' 
                    : isNext 
                      ? 'text-slate-400 hover:text-sky-400 border-none' 
                      : 'text-slate-200'
                }`} 
              />
              {isActive && (
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* Log Buttons Actions */}
      <div className="flex gap-2.5">
        <button
          onClick={() => onUpdateWater(selectedDate, 250)}
          className="flex-grow py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm shadow-sky-100 active:scale-[0.98] transition-all flex items-center justify-center gap-1 cursor-pointer"
          id="hydration-add-btn"
        >
          <Plus size={12} strokeWidth={3} />
          {lang === 'vi' ? 'Thêm 1 ly (250ml)' : 'Add 1 cup (250ml)'}
        </button>
        {currentIntake > 0 && (
          <button
            onClick={() => onUpdateWater(selectedDate, -250)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
            id="hydration-sub-btn"
            title={lang === 'vi' ? 'Bớt 250 ml' : 'Subtract 250 ml'}
          >
            <span className="font-bold">-250</span>
          </button>
        )}
      </div>

      {/* Mini tip text */}
      <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic text-center">
        {currentIntake >= dailyGoal 
          ? (lang === 'vi' ? '🎉 Tuyệt vời! Bạn đã đạt đủ lượng nước uống hôm nay.' : '🎉 Amazing! You achieved today\'s hydration baseline.')
          : (lang === 'vi' 
            ? `Hãy bổ sung thêm ${dailyGoal - currentIntake}ml nữa để tối ưu hóa hấp thu dinh dưỡng.` 
            : `Drink ${dailyGoal - currentIntake}ml more to support maximum nutritional metabolism.`)}
      </p>
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

const HealthArticlesSection = ({ tips, loading, onViewAll }: { tips: HealthTip[], loading: boolean, onViewAll?: () => void }) => {
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
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-xs font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-wider flex items-center gap-1 transition-all hover:underline"
          >
            Xem tất cả bài viết
            <ChevronRight size={14} />
          </button>
        )}
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages,
          profile,
          userMessage
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Rất tiếc, máy chủ AI gặp lỗi.");
      }

      const data = await response.json();
      const aiText = data.text || "Xin lỗi, tôi gặp chút trục trặc khi suy nghĩ. Bạn có thể hỏi lại không?";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error: any) {
      console.error("Chat AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: error.message || "Rất tiếc, máy chủ AI đang bận. Bạn vui lòng thử lại sau nhé!" }]);
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

const translations = {
  vi: {
    navBrand: "NutriCare",
    loginBtn: "Đăng nhập ngay",
    heroBadge: "Trí tuệ nhân tạo (AI) Chuẩn Y Khoa",
    heroTitleLine1: "Dinh dưỡng đúng",
    heroTitleLine2: "Sống khỏe mỗi ngày.",
    heroDesc: "NutriCare sử dụng AI thế hệ mới để cá nhân hóa thực đơn hàng ngày chuẩn y khoa dựa trên bệnh lý, chỉ số cơ thể và thói quen của riêng bạn.",
    freeTrial: "Trải nghiệm miễn phí",
    trustedUsers: "5000+ người tin dùng",
    
    lunchCardTitle: "Thực đơn cá nhân",
    lunchCardSub: "Bữa trưa Thứ Hai",
    matchPercent: "Khớp 98%",
    salmonDish: "Cá hồi sốt cam & Măng tây",
    richProtein: "Giàu Đạm",
    aiNoteTitle: "AI Ghi chú:",
    aiNoteDesc: '"Món ăn này được thiết kế riêng để kiểm soát đạm cho bệnh lý Gout và duy trì đường huyết ổn định."',
    
    statUsers: "Người sử dụng",
    statData: "Dữ liệu bệnh lý",
    statDishes: "Món ăn chuẩn vị",
    statImprove: "Cải thiện sức khỏe",
    
    howItWorksTitle: "Sức khỏe của bạn,",
    howItWorksSub: "Quy trình của chúng tôi",
    step1Title: "Nhập dữ liệu sức khỏe",
    step1Desc: "Chỉ mất 2 phút để cập nhật các chỉ số BMI, bệnh lý và thói quen vận động của bạn.",
    step1D1: "Phân tích BMI và thành phần cơ thể chuyên sâu",
    step1D2: "Số hóa bệnh án và lịch sử dị ứng thực phẩm",
    step1D3: "Xác định ngưỡng calo tiêu thụ tối ưu (BMR/TDEE)",
    
    step2Title: "Phân tích bởi AI",
    step2Desc: "Hệ thống AI xử lý hàng nghìn quy tắc dinh dưỡng để tạo ra chiến lược ăn uống an toàn nhất.",
    step2D1: "Đối soát 15,000+ thành phần dinh dưỡng chuẩn y khoa",
    step2D2: "Tự động loại bỏ các tác nhân gây kích ứng bệnh lý",
    step2D3: "Ưu tiên các nhóm thực phẩm hỗ trợ điều trị tự nhiên",
    
    step3Title: "Thực thi & Theo dõi",
    step3Desc: "Nhận thực đơn mỗi ngày, báo cáo tiến độ và điều chỉnh linh hoạt theo trạng thái cơ thể.",
    step3D1: "Nhắc nhở thông minh: Uống nước, dùng thuốc, vận động",
    step3D2: "Biểu đồ tuân thủ và tiến triển sức khỏe hàng tuần",
    step3D3: "Hỗ trợ thay đổi món ăn linh hoạt theo sở thích cá nhân",
    
    solutionsTitle: "Giải pháp Dinh dưỡng Toàn diện",
    solutionsDesc: "Kết hợp khoa học dữ liệu và y tế để mang lại hiệu quả thật sự.",
    feat1Title: "Dựa trên Bệnh lý",
    feat1Desc: "Phác đồ ăn uống được tối ưu cho Dạ dày, Đại tràng, Tiểu đường và hơn 20 nhóm bệnh lý.",
    feat2Title: "Cá nhân hóa AI",
    feat2Desc: "Sử dụng Gemini AI để phân tích dữ liệu dinh dưỡng, đưa ra gợi ý khớp nhất với BMI và sở thích.",
    feat3Title: "Theo dõi & Nhắc nhở",
    feat3Desc: "Nhắc giờ ăn, uống nước và đo lường mức độ tuân thủ hàng ngày để đảm bảo hiệu quả.",
    
    newsTitle: "Kiến thức & Tin tức",
    newsDesc: "Cập nhật những nghiên cứu mới nhất và lời khuyên chuyên gia về sức khỏe chủ động.",
    viewAllNews: "Xem tất cả bài viết",
    news1Title: "Chế độ ăn DASH cho người cao huyết áp",
    news1Cat: "Y khoa",
    news1Read: "5 phút đọc",
    news2Title: "Lợi ích của thực phẩm lên men đối với đại tràng",
    news2Cat: "Dinh dưỡng",
    news2Read: "4 phút đọc",
    news3Title: "Top 5 loại hạt tốt nhất cho bệnh nhân tiểu đường",
    news3Cat: "Mẹo hay",
    news3Read: "6 phút đọc",
    
    diseaseTitle: "Hỗ trợ đa dạng",
    diseaseTitleSub: "bệnh lý mãn tính",
    diseaseDesc: "Chúng tôi nghiên cứu và xây dựng dữ liệu chuyên sâu cho từng nhóm đối tượng, giúp bạn không còn băn khoăn \"Hôm nay nên ăn gì?\"",
    diseases: ["Dạ dày", "Đại tràng", "Tiểu đường", "Huyết áp cao", "Gout", "Gan nhiễm mỡ", "Sỏi thận", "Tim mạch"],
    
    cardHeartTitle: "Tránh kích ứng",
    cardHeartDesc: "Loại bỏ thực phẩm gây viêm loét cho bệnh nhân dạ dày.",
    cardGlucoseTitle: "Đường huyết",
    cardGlucoseDesc: "Kiểm soát tinh bột và đường cho người tiểu đường.",
    cardKidneyTitle: "Thanh lọc thận",
    cardKidneyDesc: "Cân bằng đạm và khoáng chất phù hợp cho người bệnh thận.",
    cardLifeTitle: "Sức sống xanh",
    cardLifeDesc: "Tăng cường vitamin phục hồi sức khỏe tổng thể.",
    
    faqTitle: "Câu hỏi thường gặp",
    faqDesc: "Giải đáp các thắc mắc về trợ lý NutriCare AI.",
    faqs: [
      { q: "NutriCare có thay thế được bác sĩ không?", a: "Ứng dụng đóng vai trò là trợ lý dinh dưỡng hỗ trợ, không thể thay thế cho chẩn đoán hay điều trị y tế chuyên nghiệp. Chúng tôi khuyên bạn nên tham khảo ý kiến bác sĩ trước khi áp dụng." },
      { q: "Dữ liệu thực đơn dựa trên cơ sở nào?", a: "AI của chúng tôi được huấn luyện dựa trên phác đồ dinh dưỡng chuẩn y khoa Việt Nam và quốc tế cho từng nhóm bệnh lý cụ thể." },
      { q: "Tôi có thể sử dụng miễn phí không?", a: "Có, gói Miễn phí cung cấp các tính năng cơ bản giúp bạn làm quen. Để tối ưu hóa trải nghiệm, bạn có thể cân nhắc các gói trả phí." },
      { q: "Làm thế nào để đổi món ăn nếu tôi không thích?", a: "Bạn có thể sử dụng tính năng 'Yêu cầu AI đổi món' (với gói Extra trở lên) hoặc tự chỉnh sửa món ăn theo ý thích trong trang thực đơn cá nhân." }
    ],
    
    callToActionBadge: "Bắt đầu hành trình của bạn",
    callToActionTitleLine1: "Sẵn sàng để bắt đầu",
    callToActionTitleLine2: "kỷ nguyên dinh dưỡng mới?",
    callToActionDesc: "Chỉ mất 2 phút để thiết lập hồ sơ và nhận thực đơn đầu tiên từ chuyên gia AI của bạn.",
    signUpFree: "Đăng ký miễn phí",
    secureBadgeTitle: "An toàn & Bảo mật",
    secureBadgeDesc: "Dữ liệu của bạn được mã hóa hoàn toàn.",
    footerNote: "* NutriCare là trợ lý hỗ trợ dinh dưỡng dựa trên dữ liệu khoa học. Nội dung ứng dụng không thay thế lời khuyên hay chẩn đoán y tế chính thức từ bác sĩ chuyên khoa.",
    solutionDetail: "Chi tiết giải pháp"
  },
  en: {
    navBrand: "NutriCare",
    loginBtn: "Sign In Now",
    heroBadge: "Medical-Grade Artificial Intelligence (AI)",
    heroTitleLine1: "Right Nutrition",
    heroTitleLine2: "Healthy Everyday Life.",
    heroDesc: "NutriCare uses next-generation AI to personalize medical-grade daily menus based on your conditions, body metrics, and lifestyle.",
    freeTrial: "Start Free Trial",
    trustedUsers: "5000+ trusted users",
    
    lunchCardTitle: "Personalized Plan",
    lunchCardSub: "Monday Lunch",
    matchPercent: "98% Match",
    salmonDish: "Orange Salmon & Asparagus",
    richProtein: "High Protein",
    aiNoteTitle: "AI Note:",
    aiNoteDesc: '"This meal is customized to control protein for Gout and maintain stable blood sugar levels."',
    
    statUsers: "Active Users",
    statData: "Medical Profiles",
    statDishes: "Premium Recipes",
    statImprove: "Health Improvement",
    
    howItWorksTitle: "Your Health,",
    howItWorksSub: "Our Systematic Process",
    step1Title: "Enter Health Data",
    step1Desc: "It takes only 2 minutes to update your BMI, medical conditions, and lifestyle habits.",
    step1D1: "In-depth BMI and body composition analysis",
    step1D2: "Digitalized medical history and allergen logs",
    step1D3: "Optimal calorie expenditure target (BMR/TDEE)",
    
    step2Title: "AI Scientific Analysis",
    step2Desc: "Our AI system processes thousands of medical nutrition guidelines to ensure absolute safety.",
    step2D1: "Over 15,000+ medical-grade nutritional database matches",
    step2D2: "Automatic elimination of medical and allergen trigger foods",
    step2D3: "Prioritized list of clean organic treatment-supportive foods",
    
    step3Title: "Track & Comply",
    step3Desc: "Receive daily menus, log meal compliance, and adapt to your changing body metrics dynamically.",
    step3D1: "Smart reminders: Water intake, medication, physical goals",
    step3D2: "Weekly compliance dashboard and health progression charts",
    step3D3: "Flexible alternative dish selections matching preferences",
    
    solutionsTitle: "Comprehensive Medical Nutrition Solution",
    solutionsDesc: "Blending healthcare science and artificial intelligence for tangible improvements.",
    feat1Title: "Medical Condition Specific",
    feat1Desc: "Diet plans fully optimized for Gastritis, Colitis, Diabetes, and 20+ other chronic conditions.",
    feat2Title: "Next-gen AI Personalization",
    feat2Desc: "Utilizing Gemini AI model to design meal structures matching your BMI targets and tastes.",
    feat3Title: "Interactive Trackers",
    feat3Desc: "Timely alerts for meals and logging sheets keeping you on track to success.",
    
    newsTitle: "Guides & Research Insights",
    newsDesc: "Stay updated with the latest clinical studies and expert advice on proactive wellness.",
    viewAllNews: "View All Articles",
    news1Title: "DASH Diet Guidelines for Hypertension Patients",
    news1Cat: "Medical Science",
    news1Read: "5 min read",
    news2Title: "Crucial Benefits of Fermented Food for Gut Microbiome",
    news2Cat: "Nutrition",
    news2Read: "4 min read",
    news3Title: "Top 5 Dietary Seeds Recommended for Diabetes Care",
    news3Cat: "Healthy Tips",
    news3Read: "6 min read",
    
    diseaseTitle: "Covers Diverse",
    diseaseTitleSub: "Chronic Diseases",
    diseaseDesc: "We continuous build in-depth specialized datasets to help you answer the classic: 'What should I eat today?' hassle-free.",
    diseases: ["Gastritis", "Colitis", "Diabetes", "Hypertension", "Gout", "Fatty Liver", "Kidney Stones", "Cardiovascular"],
    
    cardHeartTitle: "Avoid Irritation",
    cardHeartDesc: "Exclude gastric triggers for comfortable ulcer healing and care.",
    cardGlucoseTitle: "Blood Glucose",
    cardGlucoseDesc: "Control starch source and sugar levels for medical-grade diabetes care.",
    cardKidneyTitle: "Kidney Cleansing",
    cardKidneyDesc: "Excellently balance dietary minerals and proteins tailored for nephron safety.",
    cardLifeTitle: "Vital Organic Energy",
    cardLifeDesc: "Enhance recovery speed with micronutrient-rich wholesome vegetables.",
    
    faqTitle: "Frequently Asked Questions",
    faqDesc: "General answers to clarify how NutriCare AI companion helps you.",
    faqs: [
      { q: "Can NutriCare replace a physical doctor's diagnosis?", a: "Absolutely not. This acts purely as a smart medical-grade nutritional planner and cannot replace physical emergency treatment or clinical doctor counseling." },
      { q: "On what basis are these dietary plans generated?", a: "Our computational AI core parses medical nutrition directives matching both Vietnamese Ministry of Health standards and global NIH databases." },
      { q: "Is there a free basic subscription tier?", a: "Yes! The free subscription includes standard body analysis. You can upgrade any time to premium for deeper medical AI features." },
      { q: "Can I easily swap meals or ingredients if disliked?", a: "Of course! Simply utilize the 'Regenerate with AI' button (available on Extra plans and above) or customize details manually inside your planner page." }
    ],
    
    callToActionBadge: "Begin Your Path to Health Today",
    callToActionTitleLine1: "Ready to launch a new",
    callToActionTitleLine2: "nutrition-backed lifestyle?",
    callToActionDesc: "Configure your setup in just 2 minutes to obtain your personalized AI-driven recipe book.",
    signUpFree: "Get Started Free",
    secureBadgeTitle: "Fully Safeguarded",
    secureBadgeDesc: "All personal medical reports are fully encrypted.",
    footerNote: "* NutriCare is an AI assistant providing healthy diet suggestions. Content does not replace formal face-to-face physician consultation or diagnostic tests.",
    solutionDetail: "Solution Details"
  }
};

interface LandingStepCardProps {
  item: {
    step: string;
    title: string;
    desc: string;
    img: string;
    details: string[];
  };
  lang?: 'vi' | 'en';
}

const LandingStepCard: React.FC<LandingStepCardProps> = ({ item, lang = 'vi' }) => {
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
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                    {lang === 'en' ? 'Solution Details' : 'Chi tiết giải pháp'}
                  </p>
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

const getRealTimeMealData = (lang: 'vi' | 'en') => {
  const now = new Date();
  const hours = now.getHours();
  const day = now.getDay(); // 0: Sunday, 1: Monday, etc.

  const daysVi = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayStr = lang === 'en' ? daysEn[day] : daysVi[day];

  let mealTypeVi = "";
  let mealTypeEn = "";
  let dishNameVi = "";
  let dishNameEn = "";
  let image = "";
  let noteVi = "";
  let noteEn = "";
  let kcal = 0;
  let typeTagVi = "";
  let typeTagEn = "";
  let macros = [
    { l: "Carbs", v: "0g", c: "blue" },
    { l: "Protein", v: "0g", c: "rose" },
    { l: "Fat", v: "0g", c: "amber" }
  ];

  if (hours >= 5 && hours < 11) {
    mealTypeVi = "Bữa sáng";
    mealTypeEn = "Breakfast";
    dishNameVi = "Phở bò phi lê tái lăn & Rau thơm";
    dishNameEn = "Sautéed Beef Pho & Fresh Herbs";
    image = "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&q=80&w=300";
    noteVi = '"Ít muối, tăng cường thảo mộc tự nhiên hỗ trợ điều hòa huyết áp và hỗ trợ tiêu hóa vào sáng sớm."';
    noteEn = '"Low in sodium, fortified with digest-supportive natural herbs to gently stabilize early morning BP."';
    kcal = 280;
    typeTagVi = "Thanh Đạm";
    typeTagEn = "Balanced";
    macros = [
      { l: "Carbs", v: "55g", c: "blue" },
      { l: "Protein", v: "22g", c: "rose" },
      { l: "Fat", v: "8g", c: "amber" }
    ];
  } else if (hours >= 11 && hours < 16) {
    mealTypeVi = "Bữa trưa";
    mealTypeEn = "Lunch";
    dishNameVi = "Cá hồi sốt cam & Măng tây";
    dishNameEn = "Orange Salmon & Asparagus";
    image = "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&q=80&w=300";
    noteVi = '"Món ăn này được thiết kế riêng để kiểm soát đạm cho bệnh lý Gout và duy trì đường huyết ổn định."';
    noteEn = '"This meal is customized to control protein for Gout and maintain stable blood sugar levels."';
    kcal = 350;
    typeTagVi = "Giàu Đạm";
    typeTagEn = "High Protein";
    macros = [
      { l: "Carbs", v: "35g", c: "blue" },
      { l: "Protein", v: "40g", c: "rose" },
      { l: "Fat", v: "14g", c: "amber" }
    ];
  } else {
    mealTypeVi = "Bữa tối";
    mealTypeEn = "Dinner";
    dishNameVi = "Ức gà áp chảo sốt bơ tỏi & Súp lơ";
    dishNameEn = "Garlic Butter Chicken Breast & Broccoli";
    image = "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=300";
    noteVi = '"Ít tinh bột, giàu xơ và magie chất lượng cao giúp cải thiện chất lượng giấc ngủ tối đa."';
    noteEn = '"Low carbs, rich in natural fiber and active magnesium to promote deep restorative sleep."';
    kcal = 310;
    typeTagVi = "Giàu Xơ";
    typeTagEn = "High Fiber";
    macros = [
      { l: "Carbs", v: "12g", c: "blue" },
      { l: "Protein", v: "38g", c: "rose" },
      { l: "Fat", v: "9g", c: "amber" }
    ];
  }

  return {
    title: lang === 'en' ? "Personalized Plan" : "Thực đơn cá nhân",
    sub: lang === 'en' ? `${currentDayStr} ${mealTypeEn}` : `${mealTypeVi} ${currentDayStr}`,
    dishName: lang === 'en' ? dishNameEn : dishNameVi,
    image,
    note: lang === 'en' ? noteEn : noteVi,
    kcal,
    typeTag: lang === 'en' ? typeTagEn : typeTagVi,
    macros
  };
};

const getHealthArticlesData = (lang: 'vi' | 'en') => {
  return [
    {
      id: "art-1",
      title: lang === 'en' ? "DASH Diet Guidelines for Hypertension Patients" : "Chế độ ăn DASH cho người cao huyết áp",
      category: lang === 'en' ? "Medical Science" : "Y khoa",
      readTime: lang === 'en' ? "5 min read" : "5 phút đọc",
      date: lang === 'en' ? "Apr 12, 2026" : "12 Th04, 2026",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=800",
      summary: lang === 'en' 
        ? "Review dietary pathways shown to safely reduce arterial pressure and enhance heart longevity."
        : "Khám phá phác đồ ăn uống giúp giảm áp lực động mạch tự nhiên và kéo dài tuổi thọ tim mạch.",
      content: lang === 'en' ? [
        "The Dietary Approaches to Stop Hypertension (DASH) is a highly recommended nutrition standard for reducing systemic arterial pressure without sole reliance on pharmaceuticals.",
        "Clinical trials demonstrate that a DASH diet, rich in potassium, magnesium, calcium, and lean proteins, blocks excess sodium accumulation and naturally dilates blood vessels.",
        "Key food recommendations: Green leafy vegetables (spinach, kale), sweet berries (blueberries, strawberries), heavy dietary fibers like oats, and healthy mineral-rich pumpkin seeds.",
        "Additionally, strictly limiting sodium to under 1,500mg daily combined with light cardio exercise leads to a substantial reduction in both systolic and diastolic blood pressure within just 14 days of compliance."
      ] : [
        "Chế độ ăn kiềm chế cao huyết áp (DASH) là một tiêu chuẩn dinh dưỡng được khuyến cáo rộng rãi giúp hạ áp lực động mạch hệ thống một cách an toàn mà không cần lạm dụng thuốc Tây.",
        "Các thử nghiệm lâm sàng chỉ ra rằng DASH tập trung vào thực phẩm giàu Kali, Magiê, Canxi và Protein nạc nhằm ngăn tích tụ Natri dư thừa, đồng thời làm giãn nở mạch máu tự nhiên.",
        "Khuyến nghị thực phẩm cốt lõi: Rau xanh đậm (cải bó xôi, cải xoăn), trái cây mọng màu (việt quất, dâu tây), chất xơ hòa tan từ yến mạch và các loại hạt dồi dào khoáng chất.",
        "Đồng thời, việc hạn chế muối dưới 1.500mg mỗi ngày kết hợp với vận động aerobic nhẹ nhàng sẽ tạo ra cải thiện rõ rệt chỉ sau 14 ngày tuân thủ nghiêm ngặt."
      ],
      medicalReviewer: "Dr. Elena Vance, MD"
    },
    {
      id: "art-2",
      title: lang === 'en' ? "Crucial Benefits of Fermented Food for Gut Microbiome" : "Lợi ích của thực phẩm lên men đối với đại tràng",
      category: lang === 'en' ? "Nutrition" : "Dinh dưỡng",
      readTime: lang === 'en' ? "4 min read" : "4 phút đọc",
      date: lang === 'en' ? "Apr 10, 2026" : "10 Th04, 2026",
      image: "https://images.unsplash.com/photo-1547516508-4c1f9c7c4ec3?auto=format&fit=crop&q=80&w=800",
      summary: lang === 'en'
        ? "How active probiotics from traditional fermentation soothe clinical colitis and boost digest flow."
        : "Cách lợi khuẩn sống từ quá trình lên men giúp xoa dịu niêm mạc đại tràng co thắt và tăng cường tiêu hóa.",
      content: lang === 'en' ? [
        "The human colon houses billions of microbial agents that dictate localized gut immunity. Patients suffering from chronic colitis or IBS often display severely compromised flora diversity.",
        "Fermented foods undergo anaerobic conversion which nurtures highly resilient, healthy bacterial cultures like Lactobacillus and Bifidobacterium.",
        "Consuming active unsweetened yogurt, kefir, traditional kimchi, or mild pickled vegetables directly repopulates mucosal barriers, drastically cutting flatulence, bloating, and internal tissue spasms.",
        "Integrate one serving of live-culture probiotic food daily, preferably during lunch, to protect gut walls from pathogenic attacks."
      ] : [
        "Đại tràng con người là nơi cư ngụ của hàng tỷ sinh vật quyết định hệ miễn dịch tại chỗ. Bệnh nhân viêm đại tràng co thắt hoặc hội chứng ruột kích thích (IBS) thường có hệ vi sinh bị tổn hại nặng nề.",
        "Thực phẩm lên men trải qua quá trình chuyển hóa kị khí sản sinh các chủng khuẩn Axit Lactic cực kỳ bền bỉ bảo vệ cơ thể như Lactobacillus và Bifidobacterium.",
        "Sử dụng sữa chua không đường, nấm sữa kefir, kim chi hoặc dưa chua nhẹ giúp tái thiết lập hàng rào niêm mạc, giảm thiểu rõ rệt tình trạng đầy chướng bụng, ợ hơi và các cơn co thắt đột ngột.",
        "Hãy bổ sung một phần thực phẩm lên men chứa lợi khuẩn sống vào thực đơn trưa mỗi ngày để che chở hệ tiêu hóa khỏi sự xâm nhập của vi khuẩn có hại."
      ],
      medicalReviewer: "Professor Minh Tri, Gastroenterologist"
    },
    {
      id: "art-3",
      title: lang === 'en' ? "Top 5 Dietary Seeds Recommended for Diabetes Care" : "Top 5 loại hạt tốt nhất cho bệnh nhân tiểu đường",
      category: lang === 'en' ? "Healthy Tips" : "Mẹo hay",
      readTime: lang === 'en' ? "6 min read" : "6 phút đọc",
      date: lang === 'en' ? "Apr 08, 2026" : "08 Th04, 2026",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
      summary: lang === 'en'
        ? "Discover high fiber seeds that effectively blunt glucose spikes and restore optimal insulin response."
        : "Khám phá các loại hạt siêu giàu xơ giúp làm chậm hấp thu đường, duy trì mức đường huyết lý tưởng.",
      content: lang === 'en' ? [
        "Controlling blood sugar transitions after carbohydrate consumption is a critical ongoing goal in clinical Type-2 Diabetes management.",
        "Certain seeds are nutritional keys because their high mucilage fiber creates a gel-like paste in the upper intestine, slowing down glucose absorption rates.",
        "Chia seeds, flaxseeds, pumpkin seeds, almonds, and sunflower seeds contain essential omega-3 fatty acids that enhance cell membrane permeability, facilitating smoother insulin action.",
        "Ensure to grind flaxseeds before consuming and drink plenty of water to assist the soluble fibers in doing their therapeutic work."
      ] : [
        "Kiểm soát tốc độ gia tăng đường huyết sau bữa ăn là mục tiêu tối quan trọng trong việc điều trị và chung sống an toàn với bệnh tiểu đường tuýp 2.",
        "Một số loại hạt được coi là siêu thực phẩm vì chất xơ hòa tan dồi dào tạo nên lớp gel tự nhiên ở ruột non, trì hoãn cơ chế giải hấp đường vào máu.",
        "Hạt chia, hạt lanh, hạt bí ngô, hạnh nhân và hạt hướng dương giàu axit béo omega-3 dồi dào giúp làm mượt và mềm hóa màng tế bào, thúc đẩy insulin hoạt động hiệu quả hơn.",
        "Hãy xay nhỏ hạt lanh trước khi ăn và đảm bảo uống đủ nước để phát huy tối đa tác dụng cơ học xơ của chúng."
      ],
      medicalReviewer: "Dr. Sarah Jenkins, Endocrinologist"
    },
    {
      id: "art-4",
      title: lang === 'en' ? "Prevention of Kidney Stones Through Smart Fluid & Food Choices" : "Kiểm soát sỏi thận qua thói quen dinh dưỡng",
      category: lang === 'en' ? "Kidney Care" : "Thận khỏe",
      readTime: lang === 'en' ? "5 min read" : "5 phút đọc",
      date: lang === 'en' ? "Apr 05, 2026" : "05 Th04, 2026",
      image: "https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&q=80&w=800",
      summary: lang === 'en'
        ? "Key changes in hydration, calcium coordination, and sodium ceilings to halt oxalate stone formation."
        : "Những thay đổi cốt lõi về nước uống, phân phối canxi dồi dào và kiểm soát natri để ngăn sỏi oxalate.",
      content: lang === 'en' ? [
        "A large percentage of clinical kidney stones are calcium oxalate formations. Fortunately, targeted dietary steps are surprisingly powerful at halting kidney crystallization.",
        "The most critical rule is maintaining consistent daily urine volume above 2 liters, meaning a steady intake of around 2.5 to 3 liters of fresh drinking water.",
        "Interestingly, avoiding calcium completely is a mistake. Eating dietary calcium concurrently with oxalate-rich foods actually binds Oxalate in the digestive tract, preventing it from reaching the urinary tract.",
        "Red meats, spinach, rhubarb, chocolate, and high-sodium processed foods must be sensibly avoided to lower crystallizing factors in the kidneys."
      ] : [
        "Đại đa số các ca sỏi thận trong y khoa là kết tủa của canxi oxalate. Thật may mắn, các can thiệp ăn uống phù hợp mang lại hiệu quả rất cao để phòng tránh sỏi tích tụ thêm.",
        "Nguyên tắc cốt lõi là duy trì lưu lượng nước tiểu hàng ngày trên 2 lít, tương đương tiêu thụ đều đặn khoảng 2.5 đến 3 lít nước lọc sạch suốt cả ngày.",
        "Trái ngược với suy nghĩ sai lầm là kiêng canxi, việc nạp canxi hữu cơ qua thực phẩm kèm theo đồ ăn chứa oxalate giúp liên kết oxalate ngay tại ruột, giảm đào thải qua đường tiểu.",
        "Các loại thịt đỏ, rau bina, socola và đồ hộp mặn cần được cắt giảm tối đa để loại bỏ mầm mống gây sỏi kết tụ tại bể thận."
      ],
      medicalReviewer: "Dr. Andrew Low, Nephrologist"
    },
    {
      id: "art-5",
      title: lang === 'en' ? "Natural Fatty Liver Management via Soluble Fiber Intake" : "Giảm mỡ gan tự nhiên bằng chất xơ hòa tan",
      category: lang === 'en' ? "Detox Liver" : "Giải độc",
      readTime: lang === 'en' ? "5 min read" : "5 phút đọc",
      date: lang === 'en' ? "Apr 02, 2026" : "02 Th04, 2026",
      image: "https://images.unsplash.com/photo-1610970881699-44a5587caa16?auto=format&fit=crop&q=80&w=800",
      summary: lang === 'en'
        ? "How soluble fibers capture lipid acids in the digestive system, systematically detoxifying liver cells."
        : "Cách thức chất xơ hòa tan giữ bẫy thành phần mỡ tích tụ, hỗ trợ chuyển hóa thải độc tế bào gan nhanh chóng.",
      content: lang === 'en' ? [
        "Non-alcoholic fatty liver disease (NAFLD) is directly tied to metabolic syndrome and unhealthy blood lipid balances.",
        "Soluble fibers absorb water as they go through digestive routes, turning into sticky viscous cushions that lock inside cholesterol molecules and bile.",
        "When these cholesterols are excreted instead of reabsorbed, the liver must harvest stored lipids to create replacement bile, naturally using up fatty fat buildup.",
        "Outstanding dietary options include ripe avocados, okra, rolled oats, sweet potatoes, and organic chia seeds."
      ] : [
        "Thừa mỡ tế bào gan (NAFLD) không do rượu liên quan mật thiết đến hội chứng chuyển hóa và sự rối loạn các thành phần lipid trong máu.",
        "Chất xơ hòa tan khi đi qua hành trình tiêu hóa sẽ hút nước tạo thành lớp đệm nhầy giữ lấy nguyên tử cholesterol và dịch mật.",
        "Việc đào thải lượng mỡ này ra ngoài buộc gan phải lấy mỡ dự trữ sẵn có tại nhu mô để tổng hợp dịch mật mới, trực tiếp làm suy giảm chỉ số mỡ gan có hại.",
        "Những lựa chọn giàu xơ tối ưu bao gồm quả bơ chín, đậu bắp, yến mạch nguyên cám, khoai lang và hạt chia hữu cơ."
      ],
      medicalReviewer: "Dr. Christopher Chen, Hepatologist"
    },
    {
      id: "art-6",
      title: lang === 'en' ? "Uric Acid Control: Comprehensive Eating Guide for Gout Patients" : "Chế độ ăn kiêng acid uric cho người mắc bệnh Gout",
      category: lang === 'en' ? "Joint Care" : "Khớp khỏe",
      readTime: lang === 'en' ? "6 min read" : "6 phút đọc",
      date: lang === 'en' ? "Mar 28, 2026" : "28 Th03, 2026",
      image: "https://images.unsplash.com/photo-1505252585461-04db1eba846d?auto=format&fit=crop&q=80&w=800",
      summary: lang === 'en'
        ? "Slick purine restriction methods and water loading to lower painful joint crystal flare-ups safely."
        : "Kỹ thuật kiểm soát nồng độ purine và đẩy mạnh bù nước giúp xoa dịu, ngừa đau khớp do kết tinh axit uric.",
      content: lang === 'en' ? [
        "Gout is characterized by painful articular inflammation caused by monosodium urate monohydrate crystals depositing in joints when serum uric acid exceeds normal saturation thresholds.",
        "Minimizing clinical purines from red meats (beef, lamb), organs, rich seafood (shrimp, crabs, sardines), and avoiding any alcohol is highly necessary.",
        "To hasten excretion of existing uric acid, stay exceptionally hydrated. Eating low-fat dairy and vitamin-C dense cherries has been proven to lower circulating serum levels.",
        "Consuming fresh cucumbers, celery juice, and alkaline water also supports systemic uric acid dissolution and excretion."
      ] : [
        "Cơn đau Gout xuất hiện do các tinh thể axit uric muối sắc nhọn lắng đọng tại ổ khớp khi nồng độ acid trong máu vượt ngưỡng bão hòa sinh học.",
        "Cần kiêng tuyệt đối thực phẩm dồi dào nhân purine như cấu trúc thịt đỏ (bò, dê), nội tạng động vật, hải sản vỏ cứng và các chất kích thích có cồn.",
        "Để tăng tốc độ đào thải axit uric cũ, hãy uống nước liên tục kết hợp sữa ít béo và quả anh đào chín mọng (cherry) - vốn đã được lâm sàng chứng minh giúp giảm axit máu rất nhanh.",
        "Dưa chuột tươi, nước ép cần tây và các loại nước có tính kiềm nhẹ cũng hỗ trợ hòa tan và rửa trôi axit dư thừa qua đường niệu."
      ],
      medicalReviewer: "Dr. Olivia Bennett, Rheumatologist"
    },
    {
      id: "art-7",
      title: lang === 'en' ? "Strengthening Your Gastric Barrier Against Painful Ulcers" : "Bảo vệ niêm mạc dạ dày khỏi viêm loét",
      category: lang === 'en' ? "Stomach Care" : "Dạ dày",
      readTime: lang === 'en' ? "5 min read" : "5 phút đọc",
      date: lang === 'en' ? "Mar 25, 2026" : "25 Th03, 2026",
      image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&q=80&w=800",
      summary: lang === 'en'
        ? "Soothing mucosa with coating agents like honey, okra, and non-acidic healing nutrients."
        : "Bao phủ và tái tạo niêm mạc tổn thương nhờ mật ong, đậu bắp bổ sung dưỡng chất xoa dịu cơn trào ngược.",
      content: lang === 'en' ? [
        "Gastritis and peptic ulcers happen when corrosive hydrochloric digest acids wear down the stomach's protective mucin lining.",
        "Avoiding aggressive irritants like chili peppers, black peppers, acidic citruses, caffeine, and heavy deep-fried fat is the first rule.",
        "Embrace lubricating protective foods. The natural mucilage inside okra, boiled lotus roots, and warm organic honey coats raw ulcers, offering instant soothing relief.",
        "Eat in smaller quantities at highly structured time intervals to prevent sudden stomach distention and excessive acid outputs from empty states."
      ] : [
        "Viêm loét dạ dày tá tràng xảy ra do axit clohydric ăn mòn lớp chất nhầy mucin bảo vệ thành nội tạng, tạo nên tổn thương đỏ nông hoặc loét sâu.",
        "Cần hạn chế tối đa các tác nhân kích thích mạnh như ớt, tiêu đen, hoa quả quá chua, cafein đậm đặc và đồ chiên rán ngập dầu mỡ khó tiêu.",
        "Chào đón các thực phẩm sinh chất nhầy để bao bọc niêm mạc. Chất nhầy tự nhiên trong quả đậu bắp, củ sen hầm và mật ong ấm tạo lớp màng dịu loét tức thì.",
        "Chia nhỏ cự ly các bữa ăn theo khung giờ cố định nhằm tránh dạ dày quá đói sinh axit dư hay quá no gây áp lực cơ học lên vùng thương tổn."
      ],
      medicalReviewer: "Dr. Arthur Pendelton, Gastrologist"
    },
    {
      id: "art-8",
      title: lang === 'en' ? "Optimal Nutrient Selections for Post-Recovery Cardiovascular Care" : "Dinh dưỡng phục hồi tim mạch",
      category: lang === 'en' ? "Cardiovascular" : "Tim mạch",
      readTime: lang === 'en' ? "5 min read" : "5 phút đọc",
      date: lang === 'en' ? "Mar 20, 2026" : "20 Th03, 2026",
      image: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&q=80&w=800",
      summary: lang === 'en'
        ? "Harnessing omega-3 acids, vascular fibers, and active heart-healthy plant sterols."
        : "Tích lũy lipid omega-3, chất xơ dẻo dai và các hoạt chất sterol thực vật nâng niu độ đàn hồi thành mạch.",
      content: lang === 'en' ? [
        "Vascular resilience and healthy cholesterol levels dictate long-term heart vigor and blood flow efficiency.",
        "Active omega-3 fatty acids from walnuts, flaxseeds, and olive oil keep arterial walls highly elastic and directly curb plaque accumulation.",
        "Incorporate foods containing phytosterols like broccoli, Brussels sprouts, and whole wheat which naturally compete with cholesterol absorption pathways.",
        "Reduce systemic pressure by limiting commercial packaged ingredients containing high processing sodium percentages, replacing with garden-fresh herbs."
      ] : [
        "Độ đàn hồi dẻo dai của mạch máu và kiểm soát mảng bám mỡ quyết định trực tiếp hiệu năng co bóp và sức bền tổng thể của trái tim.",
        "Thành phần axit béo không bão hòa Omega-3 từ quả óc chó, dầu oliu nguyên chất giúp lòng mạch thông thoáng, tránh xơ cứng động mạch thứ phát.",
        "Khuyên dùng các thực phẩm tự nhiên giàu sterol như súp lơ xanh, măng tây, lúa mạch nguyên cám giúp kìm hãm hấp thụ cholesterol xấu.",
        "Cắt giảm tải trọng cho tim bằng việc hạn chế tối đa natri trong gia vị công nghiệp chế biến sẵn, thay bằng các loại rau thơm tươi lành."
      ],
      medicalReviewer: "Dr. Sophia Reynolds, FACC"
    }
  ];
};

const AllArticlesModal = ({ 
  isOpen, 
  onClose, 
  lang,
  selectedArticle,
  setSelectedArticle
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  lang: 'vi' | 'en',
  selectedArticle: any | null,
  setSelectedArticle: (article: any | null) => void
}) => {
  const articles = getHealthArticlesData(lang);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setSelectedArticle(null);
              onClose();
            }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl h-[90vh] bg-white rounded-[2.5rem] shadow-2xl z-[101] flex flex-col overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                {selectedArticle ? (
                  <button 
                    onClick={() => setSelectedArticle(null)}
                    className="w-10 h-10 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center transition-all text-slate-600 shadow-sm"
                  >
                    <ChevronDown size={20} className="rotate-90" />
                  </button>
                ) : (
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Activity size={20} />
                  </div>
                )}
                <div>
                  <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight font-sans">
                    {selectedArticle 
                      ? (lang === 'en' ? 'Reading Article' : 'Đọc bài viết') 
                      : (lang === 'en' ? 'Health Knowledge Library' : 'Thư viện kiến thức sức khỏe')}
                  </h2>
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {selectedArticle 
                      ? selectedArticle.category 
                      : (lang === 'en' ? '8 Curated Clinical Insights' : '8 chuyên đề nghiên cứu lâm sàng')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedArticle(null);
                  onClose();
                }}
                className="w-10 h-10 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center transition-all text-slate-400 hover:text-slate-600 shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-grow overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50/20">
              {selectedArticle ? (
                /* Article Detail View */
                <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
                  {/* Hero Image */}
                  <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-md shadow-slate-100">
                    <img 
                      src={selectedArticle.image} 
                      alt={selectedArticle.title} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                      <span className="px-3.5 py-1.5 bg-emerald-600/95 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                        {selectedArticle.category}
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-emerald-500" />
                      <span>{selectedArticle.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-blue-500" />
                      <span>{selectedArticle.readTime}</span>
                    </div>
                    {selectedArticle.medicalReviewer && (
                      <div className="flex items-center gap-1.5 ml-auto sm:ml-0 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-bold text-[9px] lowercase tracking-normal">
                        <ShieldCheck size={12} className="text-emerald-600 uppercase" />
                        reviewed by {selectedArticle.medicalReviewer}
                      </div>
                    )}
                  </div>

                  {/* Typography Content */}
                  <div className="space-y-6 text-slate-700 leading-relaxed text-sm md:text-base">
                    <h1 className="text-xl md:text-3xl font-black text-slate-900 leading-[1.2] tracking-tight">
                      {selectedArticle.title}
                    </h1>
                    
                    <p className="font-bold text-slate-800 text-sm md:text-lg border-l-4 border-emerald-500 pl-4 py-1 italic bg-emerald-50/30 rounded-r-xl">
                      {selectedArticle.summary}
                    </p>

                    {selectedArticle.content.map((p: string, idx: number) => (
                      <p key={idx} className="font-medium text-slate-600 leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-6 flex justify-between items-center">
                    <button 
                      onClick={() => setSelectedArticle(null)}
                      className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      {lang === 'en' ? 'Back to Library' : 'Quay lại thư viện'}
                    </button>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1">
                      <Sparkles size={12} />
                      NutriCare Clinical Verified
                    </span>
                  </div>
                </div>
              ) : (
                /* Grid Library View */
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {articles.map((news) => (
                      <div 
                        key={news.id}
                        onClick={() => setSelectedArticle(news)}
                        className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all cursor-pointer group flex flex-col justify-between h-full relative overflow-hidden"
                      >
                        <div>
                          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-5">
                            <img 
                              src={news.image} 
                              alt={news.title} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            />
                            <div className="absolute top-4 left-4 px-3 py-1 bg-white/95 backdrop-blur text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm">
                              {news.category}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                            <span>{news.date}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                            <span>{news.readTime}</span>
                          </div>

                          <h3 className="text-base font-black text-slate-900 leading-[1.3] group-hover:text-emerald-600 transition-colors mb-2">
                            {news.title}
                          </h3>

                          <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            {news.summary}
                          </p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center shrink-0">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck size={12} className="text-emerald-500" />
                            Medical Reviewed
                          </span>
                          <span className="text-xs font-black text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            {lang === 'en' ? 'Read article' : 'Đọc bài viết'} 
                            <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'vi' | 'en';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, lang }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | React.ReactNode>('');
  const [loading, setLoading] = useState(false);
  const [showIframeHelp] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error(err);
      const errMsg = lang === 'en' 
        ? "Google Sign-In was blocked or cancelled."
        : "Đăng nhập Google bị chặn hoặc bị hủy.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError(lang === 'en' ? 'Please fill in all fields.' : 'Vui lòng điền đầy đủ các trường.');
      return;
    }
    if (isSignUp && !name) {
      setError(lang === 'en' ? 'Please enter your name.' : 'Vui lòng nhập tên của bạn.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await registerWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      let friendlyError: string | React.ReactNode = err.message;
      if (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('auth/operation-not-allowed'))) {
        friendlyError = lang === 'en' ? (
          <div className="space-y-2">
            <p className="font-bold text-rose-800">ERROR: Email Authentication Disabled (auth/operation-not-allowed)</p>
            <p className="text-[11px] leading-relaxed text-rose-700">
              Firebase Authentication requires you to manually <b>ENABLE</b> the <b className="underline">Email/Password</b> provider in your Firebase project console.
            </p>
            <div className="text-[11px] space-y-1.5 bg-white/70 p-3 rounded-xl border border-rose-100 text-rose-900 font-medium">
              <p className="font-bold text-slate-800">How to enable Email/Password provider:</p>
              <div className="space-y-1 pl-1">
                <p>1. Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-600 underline font-black">Firebase Console</a></p>
                <p>2. Select your Firebase project.</p>
                <p>3. Click <b>Authentication</b> in the left sidebar.</p>
                <p>4. Go to the <b>Sign-in method</b> tab.</p>
                <p>5. Click on <b>Email/Password</b>, toggle "Enable", and click <b>Save</b>.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-bold text-rose-800">LỖI: Chưa kích hoạt đăng ký Email (auth/operation-not-allowed)</p>
            <p className="text-[11px] leading-relaxed text-rose-700">
              Hệ thống yêu cầu bạn phải <b>KÍCH HOẠT</b> phương thức <b className="underline">Email/Password</b> trong Firebase Console của bạn để cho phép tạo tài khoản mới.
            </p>
            <div className="text-[11px] space-y-1.5 bg-white/70 p-3 rounded-xl border border-rose-100 text-rose-900 font-medium">
              <p className="font-bold text-slate-800">Các bước kích hoạt nhanh chóng:</p>
              <div className="space-y-1 pl-1">
                <p>1. Truy cập <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-600 underline font-black">Firebase Console</a></p>
                <p>2. Chọn dự án tương ứng của bạn.</p>
                <p>3. Chọn mục <b>Authentication</b> ở menu bên trái.</p>
                <p>4. Chuyển sang tab <b>Sign-in method</b>.</p>
                <p>5. Bấm chọn <b>Email/Password</b>, chuyển sang trạng thái kích hoạt (Enable) cả hai tùy chọn rồi nhấp <b>Lưu (Save)</b>.</p>
              </div>
            </div>
          </div>
        );
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyError = lang === 'en' ? 'This email is already in use.' : 'Email này đã được sử dụng.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyError = lang === 'en' ? 'Invalid email address.' : 'Địa chỉ email không hợp lệ.';
      } else if (err.code === 'auth/weak-password') {
        friendlyError = lang === 'en' ? 'Password should be at least 6 characters.' : 'Mật khẩu phải có ít nhất 6 ký tự.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        friendlyError = lang === 'en' ? 'Email hoặc mật khẩu không chính xác.' : 'Email hoặc mật khẩu không chính xác.';
      } else if (err.message && err.message.includes('auth/invalid-credential')) {
        friendlyError = lang === 'en' ? 'Incorrect email or password.' : 'Email hoặc mật khẩu không chính xác.';
      }
      setError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const solutions = {
    vi: {
      title: "CÁCH SỬA LỖI ĐĂNG NHẬP GOOGLE",
      subtitle: "Giải pháp cho lỗi \"Yêu cầu không tuân thủ chính sách của Google\" do chế độ thử nghiệm (Testing/Sandbox) hoặc do chạy trong Iframe:",
      tip1Title: "1. Mở xem trước trong Tab mới (Nhanh nhất ⭐)",
      tip1Desc: "Google chặn popup đăng nhập bên trong khung iframe xem trước. Hãy nhấp vào nút \"Mở trong tab mới\" ở góc trên bên phải thanh công cụ live preview để đăng nhập bình thường.",
      tip2Title: "2. Dùng Đăng nhập Email & Mật khẩu bên dưới",
      tip2Desc: "Đăng ký hoặc Đăng nhập trực tiếp bằng form bên dưới (miễn phí). Giải pháp này giúp bạn bỏ qua các bước cấu hình Google OAuth phức tạp của nhà phát triển.",
      tip3Title: "3. Thêm Test User vào Google Cloud Console",
      tip3Desc: "Nếu cấu hình Firebase riêng, bạn hãy vào trang OAuth Consent Screen trong Google Cloud Console và thêm email hiện tại của bạn vào phần \"Test Users\" (Người dùng thử nghiệm).",
      orText: "HOẶC SỬ DỤNG EMAIL",
      googleBtn: "Đăng nhập nhanh với Google",
      emailBtnSignin: "Đăng nhập",
      emailBtnSignup: "Đăng ký tài khoản",
      switchSignup: "Chưa có tài khoản? Đăng ký ngay",
      switchSignin: "Đã có tài khoản? Đăng nhập",
      namePlaceholder: "Họ và tên của bạn",
      emailPlaceholder: "Địa chỉ email của bạn",
      passwordPlaceholder: "Mật khẩu (ít nhất 6 ký tự)"
    },
    en: {
      title: "HOW TO RECTIFY GOOGLE SIGN-IN BLOCKED",
      subtitle: "Solutions for \"request does not comply with Google policies\" due to Sandbox/Testing or running inside an Iframe:",
      tip1Title: "1. Open Preview in a New Tab (Easiest ⭐)",
      tip1Desc: "Google blocks OAuth popups initiated inside iframe workspaces. Click the arrow/Open in tab button at the top right of the live preview panel to run top-level.",
      tip2Title: "2. Use Email & Password below",
      tip2Desc: "Create any account with any email/password inside the form below to mock login and start instantly without configuring OAuth.",
      tip3Title: "3. Add a Test User in Google Console",
      tip3Desc: "If running your own credential config, navigate to Google Cloud Console > OAuth Consent Screen, and add your test email in the \"Test Users\" section.",
      orText: "OR USE EMAIL Fallback",
      googleBtn: "Sign in with Google",
      emailBtnSignin: "Sign In",
      emailBtnSignup: "Create Account",
      switchSignup: "Don't have an account? Sign Up",
      switchSignin: "Already have an account? Sign In",
      namePlaceholder: "Your full name",
      emailPlaceholder: "Your email address",
      passwordPlaceholder: "Password (Min 6 characters)"
    }
  };

  const t = solutions[lang] || solutions.vi;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[999] overflow-y-auto">
      {/* Background overlay */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
      />

      {/* Modal element */}
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-lg w-full p-6 md:p-8 z-10 my-8 space-y-6">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 focus:outline-none"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 bg-emerald-50 rounded-2xl items-center justify-center text-emerald-600 mb-2">
            <ShieldAlert size={24} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {isSignUp ? t.emailBtnSignup : t.emailBtnSignin}
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
            {lang === 'en' 
              ? 'Explore fully your health AI assistant and personalize your recipes.' 
              : 'Trải nghiệm trợ lý sức khỏe thông minh và lập thực đơn cá nhân hóa trọn vẹn.'}
          </p>
        </div>

        {/* Help Banner for Google policies */}
        {showIframeHelp && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 space-y-3.5 text-left text-xs text-amber-900 relative">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-bold text-amber-950 text-sm leading-tight uppercase tracking-wide">{t.title}</p>
                <p className="text-amber-800 font-medium mt-1 leading-snug">{t.subtitle}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2.5 border-t border-amber-200/50">
              <div className="space-y-0.5">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  {t.tip1Title}
                </p>
                <p className="text-amber-800 leading-relaxed pl-1">{t.tip1Desc}</p>
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  {t.tip2Title}
                </p>
                <p className="text-amber-800 leading-relaxed pl-1">{t.tip2Desc}</p>
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                  {t.tip3Title}
                </p>
                <p className="text-slate-500 leading-relaxed pl-1">{t.tip3Desc}</p>
              </div>
            </div>
          </div>
        )}

        {/* Buttons and Forms */}
        <div className="space-y-4">
          {/* Sign in with Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 transition-all text-sm active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{t.googleBtn}</span>
            {loading && <Loader2 className="animate-spin text-slate-400 shrink-0" size={16} />}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-slate-100" />
            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{t.orText}</span>
            <div className="flex-1 border-t border-slate-100" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-3 text-left">
            {error && (
              <div className="p-4 bg-rose-50 text-rose-700 text-xs font-semibold rounded-2xl flex items-start gap-2 border border-rose-100">
                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1">
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                    <UserIcon size={18} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder={t.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-900 transition-all font-medium"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-900 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-900 transition-all font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isSignUp ? t.emailBtnSignup : t.emailBtnSignin}</span>
              {loading ? (
                <Loader2 className="animate-spin text-white shrink-0" size={16} />
              ) : (
                <ChevronRight size={18} />
              )}
            </button>
          </form>

          {/* Toggle Tab link */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-xs font-black text-emerald-600 hover:text-emerald-700 hover:underline transition-colors focus:outline-none"
            >
              {isSignUp ? t.switchSignin : t.switchSignup}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const fetchFontAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font from ${url}`);
  }
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<'vi' | 'en'>(() => {
    try {
      return (localStorage.getItem('nutricare_lang') as 'vi' | 'en') || 'vi';
    } catch {
      return 'vi';
    }
  });

  const handleSetLang = (newLang: 'vi' | 'en') => {
    setLang(newLang);
    try {
      localStorage.setItem('nutricare_lang', newLang);
    } catch (e) {
      console.error(e);
    }
  };

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [logs, setLogs] = useState<ComplianceLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'dashboard' | 'profile' | 'onboarding' | 'pricing' | 'admin'>('dashboard');
  const [editingMeal, setEditingMeal] = useState<{ type: string, content: string } | null>(null);
  const [activeFeedbackMeal, setActiveFeedbackMeal] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [selectedMealDetail, setSelectedMealDetail] = useState<{ label: string, type: string, content: string, nutrition?: NutritionInfo, ingredients?: string[] } | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [healthTips, setHealthTips] = useState<HealthTip[]>([]);
  const [loadingTips, setLoadingTips] = useState(false);
  const [viewingAllArticles, setViewingAllArticles] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLiveSupport, setShowLiveSupport] = useState(false);
  const [activeMoodLogMeal, setActiveMoodLogMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks' | null>(null);
  const [localWaterState, setLocalWaterState] = useState<{ [date: string]: number }>({});
  const [showBmiInfo, setShowBmiInfo] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const getWaterIntakeForDate = (dateStr: string): number => {
    if (profile?.waterHistory) {
      const found = profile.waterHistory.find(item => item.date === dateStr);
      if (found) return found.amount;
    }
    // Fallback to local state if offline or user not logged in
    return localWaterState[dateStr] || Number(localStorage.getItem(`water_history_${dateStr}`) || 0);
  };

  const handleUpdateWater = async (dateStr: string, amountChange: number) => {
    if (!profile || !user) {
      // Offline/Guest fallback
      const localKey = `water_history_${dateStr}`;
      const current = Number(localStorage.getItem(localKey) || 0);
      const updated = Math.max(0, current + amountChange);
      localStorage.setItem(localKey, updated.toString());
      setLocalWaterState(prev => ({ ...prev, [dateStr]: updated }));
      return;
    }

    const existingHistory = profile.waterHistory || [];
    const existingDayEntry = existingHistory.find(item => item.date === dateStr);

    let updatedHistory;
    if (existingDayEntry) {
      updatedHistory = existingHistory.map(item => 
        item.date === dateStr 
          ? { ...item, amount: Math.max(0, item.amount + amountChange) }
          : item
      );
    } else {
      updatedHistory = [...existingHistory, { date: dateStr, amount: Math.max(0, amountChange) }];
    }

    const updatedProfile: UserProfile = {
      ...profile,
      waterHistory: updatedHistory,
    };

    try {
      await setDoc(doc(db, 'users', user.uid), updatedProfile);
      setProfile(updatedProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const get7DayTrendData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayLogs = logs.filter(l => l.date === dateStr);
      const followedCount = dayLogs.filter(l => l.status === 'followed').length;
      const compliancePercent = Math.min(100, followedCount * 25);
      
      const weekdayName = d.toLocaleDateString('vi-VN', { weekday: 'short' });
      const dateFormatted = d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
      
      data.push({
        dateStr,
        dayLabel: `${weekdayName} ${dateFormatted}`,
        compliance: compliancePercent,
      });
    }
    return data;
  };

  const calculateStreak = (trendDays: any[]) => {
    let streak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const sorted = [...trendDays].reverse();
    
    for (let i = 0; i < sorted.length; i++) {
      const day = sorted[i];
      const followedCount = logs.filter(l => l.date === day.dateStr && l.status === 'followed').length;
      if (followedCount > 0) {
        streak++;
      } else {
        if (day.dateStr === todayStr) {
          continue; 
        }
        break;
      }
    }
    return streak;
  };

  const exportWeeklyReportPDF = async () => {
    if (!profile) return;
    setIsExportingPDF(true);
    
    let doc: jsPDF;
    let usingUnicode = false;

    const removeAccents = (str: string): string => {
      if (!str) return '';
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
    };

    const textVal = (str: string): string => {
      return usingUnicode ? (str || '') : removeAccents(str);
    };

    const t = (unicodeStr: string, fallbackStr: string): string => {
      return usingUnicode ? unicodeStr : fallbackStr;
    };

    try {
      doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Fetch Roboto Regular and Medium (Bold) fonts from cdnjs
      const [regularBase64, mediumBase64] = await Promise.all([
        fetchFontAsBase64('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf'),
        fetchFontAsBase64('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf')
      ]);

      // Register regular style
      doc.addFileToVFS('Roboto-Regular.ttf', regularBase64);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      
      // Register bold style
      doc.addFileToVFS('Roboto-Medium.ttf', mediumBase64);
      doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');
      
      // Use Roboto font
      doc.setFont('Roboto', 'normal');
      usingUnicode = true;
    } catch (error) {
      console.warn('Failed to load Unicode fonts, falling back to standard Helvetica with non-accented text.', error);
      // Fallback instance
      doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      doc.setFont('Helvetica', 'normal');
      usingUnicode = false;
    }

    try {
      // 1. Branding Header Bar
      doc.setFillColor(5, 150, 105); 
      doc.rect(15, 15, 180, 26, 'F');

      // Title text inside banner
      doc.setTextColor(255, 255, 255);
      doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(
        t('NUTRICARE - BÁO CÁO TUÂN THỦ SỨC KHỎE & DINH DƯỠNG', 'NUTRICARE - BAO CAO TUAN THU SUC KHOE & DINH DUONG'), 
        20, 24
      );
      
      doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(
        t('Báo cáo sức khỏe để chia sẻ với bác sĩ - Phiên bản thử nghiệm CLINICAL BETA', 'Bao cao suc khoe de chia se voi bac si - Phien ban thu nghiem CLINICAL BETA'), 
        20, 31
      );
      
      const todayStr = new Date().toLocaleDateString('vi', { year: 'numeric', month: 'numeric', day: 'numeric' });
      doc.text(t(`Xuất ngày: ${todayStr}`, `Xuat ngay: ${todayStr}`), 155, 24);

      // 2. Patient Demographics & Profile
      doc.setTextColor(30, 41, 59); 
      doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(t('THÔNG TIN NGƯỜI DÙNG (PATIENT PROFILE)', 'THONG TIN NGUOI DUNG (PATIENT PROFILE)'), 15, 52);

      // Draw horizontal line below title
      doc.setDrawColor(226, 232, 240); 
      doc.setLineWidth(0.4);
      doc.line(15, 54, 195, 54);

      doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'normal');
      doc.setFontSize(9);
      
      const nameLine = t(`Họ và tên: ${profile.name}`, `Ho va ten: ${removeAccents(profile.name)}`);
      const ageLine = t(`Tuổi: ${profile.age}`, `Tuoi: ${profile.age}`);
      const genderLine = t(
        `Giới tính: ${profile.gender === 'male' ? 'Nam' : profile.gender === 'female' ? 'Nữ' : 'Khác'}`, 
        `Gioi tinh: ${profile.gender === 'male' ? 'Nam' : profile.gender === 'female' ? 'Nu' : 'Khac'}`
      );
      const bmi = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);
      const physicalLine = t(
        `Chiều cao: ${profile.height} cm  |  Cân nặng: ${profile.weight} kg  |  BMI: ${bmi}`,
        `Chieu cao: ${profile.height} cm  |  Can nang: ${profile.weight} kg  |  BMI: ${bmi}`
      );
      
      doc.text(nameLine, 15, 60);
      doc.text(ageLine, 85, 60);
      doc.text(genderLine, 135, 60);
      doc.text(physicalLine, 15, 66);

      const diseasesStr = profile.diseases && profile.diseases.length > 0 ? profile.diseases.join(', ') : t('Không ghi nhận', 'Khong ghi nhan');
      const allergiesStr = profile.allergies && profile.allergies.length > 0 ? profile.allergies.join(', ') : t('Không có', 'Khong co');
      
      const conditionsText = t(`Bệnh lý đang theo dõi: ${diseasesStr}`, `Benh ly dang theo doi: ${removeAccents(diseasesStr)}`);
      const allergiesText = t(`Dị ứng thực phẩm: ${allergiesStr}`, `Di ung thuc pham: ${removeAccents(allergiesStr)}`);
      const habitsText = t(
        `Thói quen hoạt động: ${profile.activityLevel === 'low' ? 'Ít vận động' : profile.activityLevel === 'moderate' ? 'Bình thường' : 'Nhiều'}`,
        `Thoi quen hoat dong: ${profile.activityLevel === 'low' ? 'It van dong' : profile.activityLevel === 'moderate' ? 'Moderate (Binh thuong)' : 'High (Nhieu)'}`
      );

      doc.text(conditionsText, 15, 72);
      doc.text(allergiesText, 15, 78);
      doc.text(habitsText, 15, 84);

      // 3. 7-Day Compliance Summary Metrics
      doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(t('KẾT QUẢ TUÂN THỦ DINH DƯỠNG (COMPLIANCE OUTCOMES)', 'KET QUA TUAN THU DINH DUONG (COMPLIANCE OUTCOMES)'), 15, 96);
      doc.line(15, 98, 195, 98);

      const trendDays = get7DayTrendData();
      const avgCompliance = Math.round(trendDays.reduce((acc, item) => acc + item.compliance, 0) / 7);
      const activeStreak = calculateStreak(trendDays);

      // Background blocks for metrics
      doc.setFillColor(248, 250, 252); 
      doc.rect(15, 102, 85, 18, 'F');
      doc.setFillColor(236, 253, 245); 
      doc.rect(110, 102, 85, 18, 'F');

      // Stats Labels & Values
      doc.setTextColor(71, 85, 105); 
      doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(t('TỶ LỆ TUÂN THỦ TRUNG BÌNH TUẦN', 'TI LE TUAN THU TRUNG BINH tuan'), 20, 108);
      doc.text(t('CHUỖI NGÀY TUÂN THỦ LIÊN TIẾP', 'CHUOI NGAY TUAN THU LIEN TIEP'), 115, 108);

      doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 118, 110); 
      doc.text(`${avgCompliance}%`, 20, 115);
      doc.setTextColor(4, 120, 87); 
      doc.text(t(`${activeStreak} Ngày`, `${activeStreak} Ngay`), 115, 115);

      // Evaluation text
      doc.setTextColor(30, 41, 59); 
      doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'italic');
      doc.setFontSize(8);
      let evaluationDesc = t(
        "Đánh giá khởi đầu: Hãy chăm chỉ theo dõi các bữa ăn để thông số thực đơn của bạn được chính xác.",
        "Danh gia khoi dau: Hay cham chi theo doi cac bua an de thong so thuc don cua ban duoc chinh xac."
      );
      if (avgCompliance >= 80) {
        evaluationDesc = t(
          "Đánh giá khoa học: XUẤT SẮC! Quá trình tuân thủ cực tốt, rất tốt cho mục tiêu giảm tải huyết áp/tiểu đường.",
          "Danh gia khoa hoc: XUAT SAC! Qua trinh tuan thu cuc tot, rat tot cho muc tieu giam tai huyet ap/tieu duong."
        );
      } else if (avgCompliance >= 50) {
        evaluationDesc = t(
          "Đánh giá khoa học: KHÁ TỐT! Hoàn thành khá đầy đủ thực đơn y khoa, giúp ổn định thể chất dài hạn.",
          "Danh gia khoa hoc: KHA TOT! Hoan thanh kha day du thuc don y khoa, giup on dinh the chat dai han."
        );
      } else if (avgCompliance > 0) {
        evaluationDesc = t(
          "Đánh giá khoa học: CẦN CỐ GẮNG! Hãy kiểm soát kỹ calo và hạn chế nạp các chất phụ gia quá tiêu chuẩn.",
          "Danh gia khoa hoc: CAN CO GANG! Hay kiem soat ky calo va han che nap cac cac chat phu gia qua tieu chuan."
        );
      }
      doc.text(evaluationDesc, 15, 125);

      // 4. Logged Activities Checklist Table
      doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(t('NHẬT KÝ BỮA ĂN TRONG 7 NGÀY QUA (7-DAY DIETARY MATRIX)', 'NHAT KY LOG BUA AN TRONG 7 NGAY QUA (7-DAY DIETARY MATRIX)'), 15, 135);
      doc.line(15, 137, 195, 137);

      // Table Header
      doc.setFillColor(241, 245, 249); 
      doc.rect(15, 140, 180, 8, 'F');
      
      doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85); 
      doc.text(t('Thời Gian', 'Thoi Gian'), 18, 145.5);
      doc.text(t('Bữa Sáng', 'Bua Sang'), 55, 145.5);
      doc.text(t('Bữa Trưa', 'Bua Trua'), 90, 145.5);
      doc.text(t('Bữa Tối', 'Bua Toi'), 125, 145.5);
      doc.text(t('Bữa Phụ', 'Bua Phu'), 160, 145.5);

      // Table Content
      doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'normal');
      doc.setFontSize(8);
      
      let tableY = 148;
      trendDays.forEach((day, index) => {
        if (index % 2 === 1) {
          doc.setFillColor(248, 250, 252); 
          doc.rect(15, tableY, 180, 7, 'F');
        }
        
        const dayLogs = logs.filter(l => l.date === day.dateStr);
        
        const getMealStatus = (mType: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
          const found = dayLogs.find(l => l.mealType === mType);
          if (!found) return t('Chưa ghi', 'Chua ghi');
          if (found.status === 'followed') return t('Tuân thủ', 'Tuan thu');
          if (found.status === 'modified') return t('Thay đổi', 'Thay doi');
          return t('Bỏ qua', 'Bo qua');
        };
        
        const displayDay = textVal(day.dayLabel);
        
        doc.setTextColor(30, 41, 59);
        doc.text(displayDay, 18, tableY + 5);
        
        const statusB = getMealStatus('breakfast');
        const statusL = getMealStatus('lunch');
        const statusD = getMealStatus('dinner');
        const statusS = getMealStatus('snacks');
        
        doc.text(statusB, 55, tableY + 5);
        doc.text(statusL, 90, tableY + 5);
        doc.text(statusD, 125, tableY + 5);
        doc.text(statusS, 160, tableY + 5);
        
        tableY += 7;
      });

      // 5. Active Meal Plan Recommendations
      if (mealPlan) {
        doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(t('QUY TẮC DINH DƯỠNG THEO THỂ TRẠNG (NUTRITIONAL ADVISORY)', 'QUY TAC DINH DUONG THEO THE TRANG (NUTRITIONAL ADVISORY)'), 15, tableY + 12);
        doc.line(15, tableY + 14, 195, tableY + 14);

        doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(t('NHÓM THỰC PHẨM KHUYÊN DÙNG (SHOULD EAT):', 'NHOM THUC PHAM KHUYEN DUNG (SHOULD EAT):'), 15, tableY + 19);
        doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'normal');
        
        const eatItems = mealPlan.shouldEat && mealPlan.shouldEat.length > 0 
          ? mealPlan.shouldEat.join(', ') 
          : t('Các nguồn thực phẩm tươi ngon, thanh đạm giàu chất xơ tự nhiên', 'Cac nguoi thuc pham tuoi ngon, thanh dam giau chat xo tu nhien');
        
        const eatWrapped = doc.splitTextToSize(textVal(eatItems), 180);
        doc.text(eatWrapped, 15, tableY + 23);
        
        const wrapHeightEat = eatWrapped.length * 4.5;

        doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(t('THỰC PHẨM HẠN CHẾ VÀ TRÁNH (SHOULD AVOID):', 'THUC PHAM HAN CHE VA TRANH (SHOULD AVOID):'), 15, tableY + 25 + wrapHeightEat);
        doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'normal');
        
        const avoidItems = mealPlan.shouldAvoid && mealPlan.shouldAvoid.length > 0 
          ? mealPlan.shouldAvoid.join(', ') 
          : t('Đồ ăn giàu chất béo bão hòa, sodium vượt mức cho phép', 'Do an giau chat beo bao hoa, sodium vuot muc cho phep');
          
        const avoidWrapped = doc.splitTextToSize(textVal(avoidItems), 180);
        doc.text(avoidWrapped, 15, tableY + 29 + wrapHeightEat);
        
        const wrapHeightAvoid = avoidWrapped.length * 4.5;

        // Doctor note block
        const noteY = tableY + 33 + wrapHeightEat + wrapHeightAvoid;
        doc.setFillColor(254, 251, 240); 
        doc.rect(15, noteY, 180, 16, 'F');
        doc.setDrawColor(253, 230, 138); 
        doc.rect(15, noteY, 180, 16);

        doc.setTextColor(146, 64, 14); 
        doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(t('KHUYẾN CÁO Y TẾ QUAN TRỌNG (CLINICAL DISCLAIMER):', 'KHUYEN CAO Y TE QUAN TRONG (CLINICAL DISCLAIMER):'), 18, noteY + 5);
        
        doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'normal');
        doc.setFontSize(7);
        const disclaimerText = t(
          'NutriCare cung cấp các thực đơn và chỉ số calo dự kiến phù hợp các bệnh nền hỗ trợ tối ưu tự do. Hãy chia sẻ ngay file PDF báo cáo lâm sàng này cho Bác sĩ chuyên khoa khám bệnh của bạn để phối hợp chẩn đoán, điều chỉnh khẩu phần lâm sàng an toàn và thực tế đúng nghĩa từng giai đoạn.',
          'NutriCare cung cap cac thuc don va chi so calo du kien phu hop cac benh nen ho tro toi uu tu do. Hay chia se ngay file PDF bao cao lam sang nay cho Bac si chuyen khoa khem benh cua ban de phoi hop chan doan, dieu chinh khau phan lam sang an toan va thuc te dung nghia tung giai doan.'
        );
        doc.text(doc.splitTextToSize(disclaimerText, 174), 18, noteY + 9);
      } else {
        const noteY = tableY + 12;
        doc.setFillColor(254, 251, 240); 
        doc.rect(15, noteY, 180, 16, 'F');
        doc.setDrawColor(253, 230, 138);
        doc.rect(15, noteY, 180, 16);

        doc.setTextColor(146, 64, 14);
        doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(t('KHUYẾN CÁO Y TẾ QUAN TRỌNG (CLINICAL DISCLAIMER):', 'KHUYEN CAO Y TE QUAN TRONG (CLINICAL DISCLAIMER):'), 18, noteY + 5);
        
        doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'normal');
        doc.setFontSize(7);
        const disclaimerText = t(
          'NutriCare thiết kế biểu đồ y khoa cho mục đích phân tích hành vi ăn uống y khoa hỗ trợ bệnh lý nền. Các thông tin không thay thế cho chẩn đoán phẫu thuật, duyệt y khoa chuyên nghiệp. Vui lòng đưa báo cáo này cho Bác sĩ để phân tích chính xác.',
          'NutriCare thiet ke bieu do y khoa cho muc dich phan tich hanh vi an uong y khoa ho tro benh ly nen. Cac thong tin khong thay the cho chan doan phau thuat, duyet y khoa chuyen nghiep. Vui long dua bao cao nay cho Bac si de phan tich chinh xac.'
        );
        doc.text(doc.splitTextToSize(disclaimerText, 174), 18, noteY + 9);
      }

      // 6. Footer signature
      doc.setTextColor(148, 163, 184); 
      doc.setFont(usingUnicode ? 'Roboto' : 'Helvetica', 'italic');
      doc.setFontSize(7);
      doc.text(
        t('Cảm ơn bạn đã tin dùng hệ thống NutriCare Health AI Companion.', 'Cam on ban da tin dung he thong NutriCare Health AI Companion.'), 
        15, 282
      );
      doc.text(
        t('Báo cáo tương thích cho các thiết bị y tế và ghi chép lâm sàng.', 'Bao cao tuong thich cho cac thiet bi y te va ghi chep lam sang.'), 
        130, 282
      );

      doc.save(`NutriCare_Bao_Cao_Suc_Khoe_${profile.name.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setIsExportingPDF(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const docRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(docRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        
        // Auto-sync admin role for bootstrap user
        if (user.email === 'quocvinh.tran87@gmail.com' && data.role !== 'admin') {
          const updated = { ...data, role: 'admin' as const };
          await setDoc(docRef, updated, { merge: true });
          setProfile(updated);
        } else {
          setProfile(data);
        }

        if (view === 'onboarding') {
          setView('dashboard');
        }
      } else {
        setView('onboarding');
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      setLoading(false);
    });

    return () => unsubscribeProfile();
  }, [user]);

  useEffect(() => {
    if (user && selectedDate && view === 'dashboard') {
      setMealPlan(null);
      const q = query(
        collection(db, 'mealPlans'),
        where('userId', '==', user.uid),
        where('date', '==', selectedDate)
      );
      const unsubscribeMeal = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          setMealPlan(snapshot.docs[0].data() as MealPlan);
        } else {
          setMealPlan(null);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'mealPlans');
      });

      return () => unsubscribeMeal();
    }
  }, [user, selectedDate, view]);

  const generateHealthTips = async (p: UserProfile) => {
    setLoadingTips(true);
    try {
      const response = await fetch('/api/generate-tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profile: p })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể tạo lời khuyên sức khỏe.");
      }

      const data = await response.json();
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

  const handleLogin = () => {
    setShowAuthModal(true);
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
      subscriptionTier: profile?.subscriptionTier || 'free',
      planEndDate: profile?.planEndDate || sevenDaysLater.toISOString(),
      role: profile?.role || 'user',
      likedIngredients: data.likedIngredients || profile?.likedIngredients || [],
      dislikedIngredients: data.dislikedIngredients || profile?.dislikedIngredients || [],
      weightHistory: data.weightHistory || profile?.weightHistory || [],
      createdAt: profile?.createdAt || now.toISOString()
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
    try {
      const response = await fetch('/api/generate-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile: p,
          retryCount
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể khởi tạo thực đơn.");
      }

      const data = await response.json();
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
      console.error(`AI Error retry count ${retryCount}:`, error);

      // Handle 429 Resource Exhausted on retry list
      if ((error.message?.includes("429") || error.message?.includes("Exhausted")) && retryCount < 1) {
        console.log(`Retrying with fallback model...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return generateMeal(p, retryCount + 1);
      }

      alert(error.message || "Máy chủ AI gặp sự cố. Vui lòng cấu hình API key hợp lệ hoặc thử lại sau.");
    } finally {
      if (retryCount === 0) {
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

  const handleSaveMoodLog = async (mealType: ComplianceLog['mealType'], mood?: ComplianceLog['mood'], moodNote?: string) => {
    if (!user) return;
    
    const existingLog = logs.find(l => l.mealType === mealType && l.date === selectedDate);
    
    try {
      if (existingLog && existingLog.id) {
        const updatedLog = {
          ...existingLog,
          mood,
          moodNote
        };
        await setDoc(doc(db, 'complianceLogs', existingLog.id), updatedLog);
      } else {
        const newLog: Partial<ComplianceLog> = {
          userId: user.uid,
          date: selectedDate,
          mealType,
          status: 'followed',
          timestamp: new Date().toISOString(),
          mood,
          moodNote
        };
        await setDoc(doc(collection(db, 'complianceLogs')), newLog);
      }
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

  const handleRatingClick = async (mealType: string, rating: number) => {
    if (!mealPlan || !user) return;
    
    const docId = `${user.uid}_${selectedDate}`;
    const ratings = mealPlan.ratings || {};
    const existingFeedback = ratings[mealType]?.feedback || '';
    const updatedRatings = {
      ...ratings,
      [mealType]: {
        rating,
        feedback: existingFeedback,
        createdAt: ratings[mealType]?.createdAt || new Date().toISOString()
      }
    };
    const updatedMealPlan = {
      ...mealPlan,
      ratings: updatedRatings
    };

    try {
      await setDoc(doc(db, 'mealPlans', docId), updatedMealPlan);
      setMealPlan(updatedMealPlan);
      setActiveFeedbackMeal(mealType);
      setFeedbackText(existingFeedback);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `mealPlans/${docId}`);
    }
  };

  const handleSaveFeedback = async (mealType: string) => {
    if (!mealPlan || !user) return;
    
    const docId = `${user.uid}_${selectedDate}`;
    const ratings = mealPlan.ratings || {};
    const currentRatingVal = ratings[mealType]?.rating || 5;
    const updatedRatings = {
      ...ratings,
      [mealType]: {
        rating: currentRatingVal,
        feedback: feedbackText,
        createdAt: ratings[mealType]?.createdAt || new Date().toISOString()
      }
    };
    const updatedMealPlan = {
      ...mealPlan,
      ratings: updatedRatings
    };

    try {
      await setDoc(doc(db, 'mealPlans', docId), updatedMealPlan);
      setMealPlan(updatedMealPlan);
      setActiveFeedbackMeal(null);
      setFeedbackText('');
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
    const activeText = translations[lang] || translations.vi;
    const realTimeMeal = getRealTimeMealData(lang);
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        {/* Banner Phiên bản Thử nghiệm (Beta Version) */}
        <div className="bg-slate-900 text-white border-b border-white/5 py-3 px-6 text-center text-xs font-medium tracking-tight">
          <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/25 border border-amber-500/30 text-amber-400 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md">
                BETA v0.9.5
              </span>
              <span className="hidden sm:inline text-slate-400 font-bold">|</span>
              <p className="text-slate-200">
                {lang === 'vi' 
                  ? 'Ứng dụng đang trong giai đoạn thử nghiệm. Vui lòng phản hồi góp ý tại phần trò chuyện.'
                  : 'Application is under clinical test phase. Please provide feedback in the active chat workspace.'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-wider text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse animate-duration-1000"></span>
                {lang === 'vi' ? 'Hệ thống trực tuyến' : 'ONLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="max-w-[1024px] mx-auto px-6 py-6 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 mr-auto">
            <div className="bg-white p-1 rounded-xl border border-slate-100 shadow-sm w-10 h-10 flex items-center justify-center">
              <NutriCareSvgLogo className="w-full h-full" />
            </div>
            <span className="font-black text-2xl tracking-tight text-slate-900">{activeText.navBrand}</span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 shrink-0" id="language-switcher">
            <span
              onClick={() => handleSetLang('vi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                lang === 'vi' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              VI
            </span>
            <span
              onClick={() => handleSetLang('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                lang === 'en' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              EN
            </span>
          </div>

          <button
            id="login-button-nav"
            onClick={handleLogin}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 shrink-0"
          >
            {activeText.loginBtn}
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
              <Zap size={14} fill="currentColor" /> {activeText.heroBadge}
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight">
              {activeText.heroTitleLine1} <br />
              <span className="text-emerald-600">{activeText.heroTitleLine2}</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl mx-auto md:mx-0">
              {activeText.heroDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button 
                onClick={handleLogin}
                className="px-8 py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95 flex items-center justify-center gap-2"
              >
                {activeText.freeTrial} <ChevronRight size={22} />
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
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{activeText.trustedUsers}</span>
                </div>
              </div>
            </div>
            
            <AppInstallButton lang={lang} />
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
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        {realTimeMeal.title}
                      </p>
                      <p className="text-lg font-black text-slate-900">{realTimeMeal.sub}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <div className="px-3 py-1 bg-white border border-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold">
                      {activeText.matchPercent}
                    </div>
                    <span className="text-[8px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {lang === 'en' ? 'Live Updated' : 'Chuẩn thời gian thực'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden shrink-0">
                      <img src={realTimeMeal.image} className="w-full h-full object-cover" alt="Food" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-900">{realTimeMeal.dishName}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{realTimeMeal.kcal} Kcal</span>
                        <span className="text-[9px] font-bold text-emerald-500 uppercase">{realTimeMeal.typeTag}</span>
                      </div>
                    </div>
                    <CheckCircle2 className="text-emerald-500" size={20} />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {realTimeMeal.macros.map((stat, idx) => (
                      <div key={idx} className={`p-3 bg-${stat.c}-50 rounded-xl border border-${stat.c}-100`}>
                        <p className={`text-[8px] font-black text-${stat.c}-600 uppercase mb-1`}>{stat.l}</p>
                        <p className="text-sm font-black text-slate-800">{stat.v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="flex gap-2 mb-3">
                    <AlertCircle size={14} className="text-amber-500" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{activeText.aiNoteTitle}</p>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed italic">
                    {realTimeMeal.note}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Stats Section */}
        <section className="max-w-[1280px] mx-auto px-6 mb-24 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[
            { label: activeText.statUsers, value: "5,000+", icon: Users, color: "emerald" },
            { label: activeText.statData, value: "20+", icon: ShieldCheck, color: "blue" },
            { label: activeText.statDishes, value: "15,000+", icon: Utensils, color: "rose" },
            { label: activeText.statImprove, value: "98%", icon: Activity, color: "amber" }
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
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight" dangerouslySetInnerHTML={{ __html: `${activeText.howItWorksTitle} <br/> ${activeText.howItWorksSub}` }} />
              <div className="h-1.5 w-24 bg-emerald-600 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { 
                  step: "01",
                  title: activeText.step1Title,
                  desc: activeText.step1Desc,
                  img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400",
                  details: [
                    activeText.step1D1,
                    activeText.step1D2,
                    activeText.step1D3
                  ]
                },
                { 
                  step: "02",
                  title: activeText.step2Title,
                  desc: activeText.step2Desc,
                  img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400",
                  details: [
                    activeText.step2D1,
                    activeText.step2D2,
                    activeText.step2D3
                  ]
                },
                { 
                  step: "03",
                  title: activeText.step3Title,
                  desc: activeText.step3Desc,
                  img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400",
                  details: [
                    activeText.step3D1,
                    activeText.step3D2,
                    activeText.step3D3
                  ]
                }
              ].map((item, i) => (
                <LandingStepCard key={i} item={item} lang={lang} />
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-24 px-6">
          <div className="max-w-[1024px] mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">{activeText.solutionsTitle}</h2>
              <p className="text-slate-500 font-medium">{activeText.solutionsDesc}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  icon: Stethoscope, 
                  title: activeText.feat1Title, 
                  desc: activeText.feat1Desc,
                  color: "emerald"
                },
                { 
                  icon: Zap, 
                  title: activeText.feat2Title, 
                  desc: activeText.feat2Desc,
                  color: "blue"
                },
                { 
                  icon: Calendar, 
                  title: activeText.feat3Title, 
                  desc: activeText.feat3Desc,
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
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">{activeText.newsTitle}</h2>
                <p className="text-lg text-slate-500 font-medium max-w-lg">{activeText.newsDesc}</p>
              </div>
              <button 
                onClick={() => setViewingAllArticles(true)}
                className="group flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-900 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
              >
                {activeText.viewAllNews} <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  title: activeText.news1Title,
                  category: activeText.news1Cat,
                  image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=800",
                  date: "12 Th04, 2024",
                  readTime: activeText.news1Read
                },
                {
                  title: activeText.news2Title,
                  category: activeText.news2Cat,
                  image: "https://images.unsplash.com/photo-1547516508-4c1f9c7c4ec3?auto=format&fit=crop&q=80&w=800",
                  date: "10 Th04, 2024",
                  readTime: activeText.news2Read
                },
                {
                  title: activeText.news3Title,
                  category: activeText.news3Cat,
                  image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
                  date: "08 Th04, 2024",
                  readTime: activeText.news3Read
                }
              ].map((news, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group cursor-pointer"
                  onClick={() => {
                    const articles = getHealthArticlesData(lang);
                    const matched = articles.find(art => art.id === `art-${i+1}`);
                    if (matched) {
                      setSelectedArticle(matched);
                      setViewingAllArticles(true);
                    }
                  }}
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
                <h2 className="text-4xl font-black text-slate-900 leading-tight" dangerouslySetInnerHTML={{ __html: `${activeText.diseaseTitle} <br/> ${activeText.diseaseTitleSub}` }} />
                <p className="text-lg text-slate-500 font-medium">{activeText.diseaseDesc}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeText.diseases.map(d => (
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
                  <p className="text-sm font-black text-rose-900 uppercase mb-3 tracking-widest">{activeText.cardHeartTitle}</p>
                  <p className="text-sm text-rose-700 leading-relaxed">{activeText.cardHeartDesc}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] shadow-sm transform hover:-translate-y-1 transition-all">
                  <Activity className="text-amber-500 mb-6" size={40} />
                  <p className="text-sm font-black text-amber-900 uppercase mb-3 tracking-widest">{activeText.cardGlucoseTitle}</p>
                  <p className="text-sm text-amber-700 leading-relaxed">{activeText.cardGlucoseDesc}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2.5rem] shadow-sm transform hover:-translate-y-1 transition-all">
                  <Droplets className="text-blue-500 mb-6" size={40} fill="currentColor" opacity={0.2} />
                  <p className="text-sm font-black text-blue-900 uppercase mb-3 tracking-widest">{activeText.cardKidneyTitle}</p>
                  <p className="text-sm text-blue-700 leading-relaxed">{activeText.cardKidneyDesc}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem] shadow-sm transform hover:-translate-y-1 transition-all">
                  <Leaf className="text-emerald-500 mb-6" size={40} />
                  <p className="text-sm font-black text-emerald-900 uppercase mb-3 tracking-widest">{activeText.cardLifeTitle}</p>
                  <p className="text-sm text-emerald-700 leading-relaxed">{activeText.cardLifeDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-6 bg-white overflow-hidden">
          <div className="max-w-[800px] mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">{activeText.faqTitle}</h2>
              <p className="text-slate-500 font-medium">{activeText.faqDesc}</p>
            </div>

            <div className="space-y-4">
              {activeText.faqs.map((faq, i) => (
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
                {activeText.callToActionBadge}
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight" dangerouslySetInnerHTML={{ __html: `${activeText.callToActionTitleLine1} <br/> ${activeText.callToActionTitleLine2}` }} />
              <p className="text-emerald-50 font-medium text-lg opacity-90">{activeText.callToActionDesc}</p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleLogin}
                  className="px-12 py-5 bg-white text-emerald-600 rounded-2xl font-black text-xl hover:bg-emerald-50 transition-all shadow-xl shadow-emerald-900/10 active:scale-95"
                >
                  {activeText.signUpFree}
                </button>
                <div className="bg-emerald-700/30 backdrop-blur border border-white/10 p-4 rounded-2xl flex items-center gap-4 text-left">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">{activeText.secureBadgeTitle}</p>
                    <p className="text-[9px] text-emerald-100 opacity-80">{activeText.secureBadgeDesc}</p>
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
              {activeText.footerNote}
            </p>
          </div>
          <div className="mt-8 text-center text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
            © 2026 NutriCare Health AI. Developed by Nutricare.
          </div>
        </footer>

        <AllArticlesModal 
          isOpen={viewingAllArticles} 
          onClose={() => setViewingAllArticles(false)} 
          lang={lang} 
          selectedArticle={selectedArticle} 
          setSelectedArticle={setSelectedArticle} 
        />

        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          lang={lang} 
        />
      </div>
    );
  }

  if (view === 'onboarding') {
    return <OnboardingScreen onSubmit={handleOnboardingSubmit} user={user} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Banner Phiên bản Thử nghiệm (Beta Version) */}
      <div className="bg-slate-900 text-white border-b border-white/5 py-3 px-6 text-center text-xs font-medium tracking-tight">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/25 border border-amber-500/30 text-amber-400 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md">
              BETA v0.9.5
            </span>
            <span className="hidden sm:inline text-slate-400 font-bold">|</span>
            <p className="text-slate-200">
              {lang === 'vi' 
                ? 'Ứng dụng đang trong giai đoạn thử nghiệm. Vui lòng phản hồi góp ý tại phần trò chuyện.'
                : 'Application is under clinical test phase. Please provide feedback in the active chat workspace.'}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-wider text-slate-400">
            <button 
              onClick={() => setShowLiveSupport(true)}
              className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 px-2.5 py-1 rounded-full transition-all focus:outline-none cursor-pointer"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>{lang === 'vi' ? 'Hỗ trợ trực tuyến' : 'LIVE SUPPORT'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="max-w-[1024px] w-full mx-auto mt-6 flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm z-30">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-inner">
            <NutriCareSvgLogo className="w-full h-full" id="nutricare-header-logo" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight flex items-center gap-1">NutriCare</h1>
            <p className="text-[10px] font-black text-emerald-600 tracking-wider uppercase">Trợ lý dinh dưỡng thông minh</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">{profile?.name}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight flex items-center gap-1.5 justify-end" title={lang === 'en' ? 'Synced in real-time' : 'Đồng bộ theo thời gian thực'}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              ID: NC-{user.uid.slice(0, 4).toUpperCase()}
            </p>
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
              <aside className="col-span-12 lg:col-span-4 flex flex-col gap-4">
                <div className="bg-gradient-to-br from-white via-white to-emerald-50/40 border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(209,250,229,0.3)] hover:shadow-[0_12px_40px_rgb(209,250,229,0.5)] transition-all duration-300 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
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
                    <div className="space-y-3 pb-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Chỉ số BMI</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-bold">
                          {(profile ? (profile.weight / (profile.height/100 * profile.height/100)) : 0).toFixed(1)}
                        </span>
                      </div>
                      {(() => {
                        const bmiVal = profile ? (profile.weight / ((profile.height / 100) * (profile.height / 100))) : 0;
                        let bmiCategory = "Cân đối";
                        let bmiColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
                        let markerLeft = "50%";
                        if (bmiVal < 18.5) {
                          bmiCategory = "Thiếu cân";
                          bmiColor = "text-blue-600 bg-blue-50 border-blue-200";
                          const pct = Math.max(0, Math.min(30, ((bmiVal - 15) / 3.5) * 30));
                          markerLeft = `${pct}%`;
                        } else if (bmiVal >= 18.5 && bmiVal < 25) {
                          bmiCategory = "Cân đối";
                          bmiColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
                          const pct = 30 + ((bmiVal - 18.5) / 6.5) * 40;
                          markerLeft = `${Math.max(30, Math.min(70, pct))}%`;
                        } else {
                          bmiCategory = "Thừa cân/Béo phì";
                          bmiColor = "text-rose-600 bg-rose-50 border-rose-200";
                          const pct = 70 + ((bmiVal - 25) / 10) * 30;
                          markerLeft = `${Math.max(70, Math.min(100, pct))}%`;
                        }
                        return (
                          <div className="p-2.5 bg-slate-50/75 rounded-xl border border-slate-100/50">
                            <div className="flex justify-between items-center mb-2 text-[10px] font-semibold text-slate-500">
                              <span>Tình trạng thể trạng:</span>
                              <span className={`px-1.5 py-0.5 border rounded text-[9px] font-bold ${bmiColor}`}>
                                {bmiCategory}
                              </span>
                            </div>
                            <div className="relative h-2 bg-gradient-to-r from-blue-300 via-emerald-400 to-rose-400 rounded-full overflow-visible mt-2.5 mb-1 bg-no-repeat">
                              {/* Current BMI Marker */}
                              <div 
                                className="absolute -top-1 w-4 h-4 bg-white border-2 border-slate-700 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.15)] -translate-x-1/2 flex items-center justify-center transition-all duration-500 ease-out z-10"
                                style={{ left: markerLeft }}
                              >
                                <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                              </div>
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-400 mt-1 font-mono">
                              <span>Thiếu cân (&lt;18.5)</span>
                              <span>Cân đối (18.5-25)</span>
                              <span>Thừa cân (&ge;25)</span>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-slate-100/50 flex flex-col">
                              <button 
                                onClick={() => setShowBmiInfo(!showBmiInfo)}
                                className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50 rounded transition-all duration-200 cursor-pointer w-max"
                              >
                                <Info size={11} className={`${showBmiInfo ? 'text-emerald-500' : 'text-slate-400'} shrink-0`} />
                                <span>WHO standards info</span>
                              </button>

                              <AnimatePresence>
                                {showBmiInfo && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden text-[9px] text-slate-500 space-y-1 bg-white p-2 rounded-lg border border-slate-100 mt-1.5 leading-relaxed shadow-sm"
                                  >
                                    <p className="font-bold text-slate-700">Khuyến nghị từ Tổ chức Y tế Thế giới (WHO):</p>
                                    {bmiVal < 18.5 && (
                                      <p>
                                        <span className="font-semibold text-blue-600">Thiếu cân (BMI &lt; 18.5):</span> Có nguy cơ cao về loãng xương, thiếu chất, mệt mỏi và hệ miễn dịch kém. Hãy chú trọng nạp calo lành mạnh, đạm chất lượng cao và chất béo tốt.
                                      </p>
                                    )}
                                    {bmiVal >= 18.5 && bmiVal < 25 && (
                                      <p>
                                        <span className="font-semibold text-emerald-600">Cân đối (BMI 18.5 - 24.9):</span> Thể trạng lý tưởng, giảm thiểu nguy cơ mắc tim mạch và tiểu đường. Bạn hãy tiếp tục duy trì chế độ dinh dưỡng và vận động hiện tại!
                                      </p>
                                    )}
                                    {bmiVal >= 25 && (
                                      <p>
                                        <span className="font-semibold text-rose-600">Thừa cân / Béo phì (BMI &ge; 25):</span> Tăng rủi ro huyết áp cao, đau tim, đột quỵ và tiểu đường type 2. Kiểm soát chặt lượng calo và hoạt động thể chất đều đặn được khuyến cáo khuyến nghị.
                                      </p>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        );
                      })()}
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

                <HydrationTracker 
                  selectedDate={selectedDate} 
                  onUpdateWater={handleUpdateWater} 
                  getWaterIntake={getWaterIntakeForDate} 
                  lang={lang} 
                />

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
              <main className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                <DaySelector selectedDate={selectedDate} onSelect={setSelectedDate} />

                {/* Health Overview & Compliance Trend Card */}
                <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <Activity size={18} className="text-emerald-500" />
                        Tóm tắt Sức khỏe & Tuân thủ
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">Theo dõi mức độ hoàn thành thực đơn dinh dưỡng trong 7 ngày qua</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        disabled={isExportingPDF}
                        onClick={exportWeeklyReportPDF}
                        className={`flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm shadow-emerald-50 transition-all cursor-pointer ${isExportingPDF ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isExportingPDF ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {lang === 'vi' ? 'Đang xuất...' : 'Exporting...'}
                          </>
                        ) : (
                          <>
                            <FileDown size={12} />
                            {lang === 'vi' ? 'Xuất báo cáo tuần' : 'Export PDF'}
                          </>
                        )}
                      </button>

                      {(() => {
                        const trendDays = get7DayTrendData();
                        const avgCompliance = Math.round(trendDays.reduce((acc, item) => acc + item.compliance, 0) / 7);
                        let statusText = "Khởi đầu mới";
                        let statusBg = "bg-slate-50 text-slate-500 border-slate-100";
                        if (avgCompliance >= 80) {
                          statusText = "Xuất sắc";
                          statusBg = "bg-emerald-50 text-emerald-700 border-emerald-100";
                        } else if (avgCompliance >= 50) {
                          statusText = "Khá tốt";
                          statusBg = "bg-blue-50 text-blue-700 border-blue-100";
                        } else if (avgCompliance > 0) {
                          statusText = "Cần cải thiện";
                          statusBg = "bg-amber-50 text-amber-700 border-amber-100";
                        }
                        return (
                          <span className={`px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full border ${statusBg}`}>
                            Đánh giá: {statusText}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Stats Columns on Left */}
                    <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-1 gap-4">
                      {(() => {
                        const trendDays = get7DayTrendData();
                        const avgCompliance = Math.round(trendDays.reduce((acc, item) => acc + item.compliance, 0) / 7);
                        const activeStreak = calculateStreak(trendDays);
                        
                        return (
                          <>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 flex flex-col justify-between">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tuân thủ Tb tuần</span>
                              <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-black text-slate-800">{avgCompliance}%</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium mt-1">
                                {avgCompliance >= 80 ? "Chỉ số hoàn hảo!" : avgCompliance >= 40 ? "Đang đi đúng hướng." : "Cố gắng log thêm bữa ăn nhé."}
                              </p>
                            </div>

                            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-50 flex flex-col justify-between">
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                🔥 Chuỗi tuân thủ
                              </span>
                              <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-black text-emerald-700">{activeStreak}</span>
                                <span className="text-[10px] text-emerald-600 font-bold">ngày liên tiếp</span>
                              </div>
                              <p className="text-[10px] text-emerald-600 font-medium mt-1">Duy trì thói quen lành mạnh.</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Elegant Area Chart using Recharts on the right */}
                    <div className="md:col-span-8 bg-slate-50/20 rounded-2xl p-4 border border-slate-100">
                      <div className="h-[140px] w-full">
                        {(() => {
                          const chartData = get7DayTrendData();
                          return (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                  dataKey="dayLabel" 
                                  stroke="#94a3b8" 
                                  tickLine={false}
                                  axisLine={false}
                                  style={{ fontSize: '9px', fontWeight: 700 }} 
                                />
                                <YAxis 
                                  stroke="#94a3b8" 
                                  domain={[0, 100]} 
                                  tickLine={false}
                                  axisLine={false}
                                  ticks={[0, 25, 50, 75, 100]}
                                  tickFormatter={(v) => `${v}%`}
                                  style={{ fontSize: '9px', fontWeight: 700 }} 
                                />
                                <Tooltip 
                                  cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] font-bold shadow-xl border border-slate-800">
                                          <p className="mb-0.5 opacity-70">{data.dateStr.split('-').reverse().join('/')}</p>
                                          <p className="text-emerald-400 font-black">Tuân thủ: {data.compliance}%</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="compliance" 
                                  stroke="#10b981" 
                                  strokeWidth={2.5} 
                                  fill="url(#colorCompliance)" 
                                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} 
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </section>

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

                            {/* Đánh giá và Phản hồi món ăn */}
                            <div className="mt-3 pt-3 border-t border-slate-200/50">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  {lang === 'en' ? 'Rate recipe' : 'Đánh giá món ăn'}
                                </span>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => {
                                    const currentRating = mealPlan.ratings?.[m.type]?.rating || 0;
                                    const isFilled = star <= currentRating;
                                    return (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleRatingClick(m.type, star)}
                                        className="text-slate-300 hover:text-amber-400 transition-colors focus:outline-none"
                                        title={`${star} ${lang === 'en' ? 'stars' : 'sao'}`}
                                      >
                                        <Star
                                          size={14}
                                          className={`transition-all ${isFilled ? 'text-amber-500 fill-amber-400' : 'text-slate-300 hover:scale-120'}`}
                                        />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              {mealPlan.ratings?.[m.type]?.rating ? (
                                <div className="mt-2 text-[10px]">
                                  {activeFeedbackMeal === m.type ? (
                                    <div className="flex gap-1 items-center">
                                      <input 
                                        type="text"
                                        placeholder={lang === 'en' ? 'Optional review...' : 'Ý kiến góp ý...'}
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        className="flex-1 text-[10px] px-2 py-1 bg-white border border-slate-200 rounded-md outline-none focus:border-emerald-500 font-medium text-slate-700"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveFeedback(m.type);
                                        }}
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleSaveFeedback(m.type)}
                                        className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-1 rounded-md hover:bg-emerald-700 transition-colors shrink-0"
                                      >
                                        {lang === 'en' ? 'Save' : 'Lưu'}
                                      </button>
                                      <button
                                        onClick={() => setActiveFeedbackMeal(null)}
                                        className="text-[9px] text-slate-400 hover:text-slate-600 font-medium px-1 shrink-0"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between bg-white border border-slate-100 p-1.5 rounded-lg shadow-sm">
                                      <span className="text-[10px] text-slate-500 italic truncate max-w-[70%]">
                                        {mealPlan.ratings[m.type].feedback || (lang === 'en' ? 'Click to add review' : 'Chọn để viết góp ý')}
                                      </span>
                                      <button 
                                        onClick={() => {
                                          setActiveFeedbackMeal(m.type);
                                          setFeedbackText(mealPlan.ratings?.[m.type]?.feedback || '');
                                        }}
                                        className="text-[9px] text-emerald-600 font-bold hover:underline shrink-0 ml-1"
                                      >
                                        {lang === 'en' ? 'Edit' : 'Góp ý'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </div>

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
                                      onClick={async () => {
                                        await logCompliance(m.type as any, 'followed');
                                        setActiveMoodLogMeal(m.type as any);
                                      }}
                                      className="flex-[2] text-[10px] bg-white border border-slate-200 rounded p-2 text-slate-500 font-bold hover:border-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer"
                                    >
                                      Hoàn tất
                                    </button>
                                    <button 
                                      onClick={() => setEditingMeal({ type: m.type, content: m.content })}
                                      className="flex-1 text-[10px] bg-slate-50 border border-slate-100 rounded p-2 text-slate-400 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                      Sửa
                                    </button>
                                  </>
                                ) : (
                                  <div className="w-full flex items-center justify-between text-[10px] bg-emerald-100 border border-emerald-200 rounded p-2 text-emerald-700 font-bold">
                                    <span>ĐÃ ĂN</span>
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => setActiveMoodLogMeal(m.type as any)}
                                        className="text-emerald-600 hover:text-emerald-800 underline font-extrabold uppercase cursor-pointer"
                                        title="Ghi nhật ký tâm trạng"
                                      >
                                        {lang === 'en' ? 'Mood' : 'Tâm trạng'}
                                      </button>
                                      <span className="text-emerald-300">|</span>
                                      <button 
                                        onClick={() => setEditingMeal({ type: m.type, content: m.content })}
                                        className="text-emerald-600 hover:text-emerald-800 underline font-extrabold uppercase cursor-pointer"
                                      >
                                        Sửa lại
                                      </button>
                                    </div>
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

                  {activeMoodLogMeal && (
                    <MoodLogger 
                      lang={lang}
                      mealType={activeMoodLogMeal}
                      mealLabel={
                        activeMoodLogMeal === 'breakfast' ? (lang === 'vi' ? 'Bữa sáng' : 'Breakfast') :
                        activeMoodLogMeal === 'lunch' ? (lang === 'vi' ? 'Bữa trưa' : 'Lunch') :
                        activeMoodLogMeal === 'snacks' ? (lang === 'vi' ? 'Bữa phụ' : 'Snack') :
                        (lang === 'vi' ? 'Bữa tối' : 'Dinner')
                      }
                      existingLog={logs.find(l => l.mealType === activeMoodLogMeal && l.date === selectedDate)}
                      onSave={async (mood, note) => {
                        await handleSaveMoodLog(activeMoodLogMeal, mood, note);
                      }}
                      onClose={() => setActiveMoodLogMeal(null)}
                    />
                  )}
                </section>

                <RecipeSearch 
                  user={user}
                  mealPlan={mealPlan}
                  onUpdateMealPlan={(p) => setMealPlan(p)}
                  lang={lang}
                  selectedDate={selectedDate}
                />

                <MoodAnalysisPanel 
                  lang={lang}
                  profile={profile}
                  mealPlan={mealPlan}
                  logs={logs.filter(l => l.date === selectedDate)}
                  selectedDate={selectedDate}
                  user={user}
                  db={db}
                />

                <HealthArticlesSection 
                  tips={healthTips} 
                  loading={loadingTips} 
                  onViewAll={() => setViewingAllArticles(true)} 
                />

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

      {/* Floating Live Support Chat (Vietnamese / English) */}
      <LiveSupportChat 
        user={user}
        profile={profile}
        lang={lang}
        isOpen={showLiveSupport}
        onClose={() => setShowLiveSupport(false)}
      />

      <AllArticlesModal 
        isOpen={viewingAllArticles} 
        onClose={() => setViewingAllArticles(false)} 
        lang={lang} 
        selectedArticle={selectedArticle} 
        setSelectedArticle={setSelectedArticle} 
      />
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

const removeVietnameseTones = (str: string) => {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Y|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  str = str.replace(/\u02C6|\u0306|\u031B/g, "");
  return str;
};

const slugify = (str: string) => {
  return removeVietnameseTones(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-');
};

function AdminView({ onBack }: { onBack: () => void }) {
  const [isAdminDarkMode, setIsAdminDarkMode] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [adminTab, setAdminTab] = useState<'users' | 'diseases' | 'chats'>('users');
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  const [showAddDiseaseModal, setShowAddDiseaseModal] = useState(false);
  const [newDiseaseId, setNewDiseaseId] = useState('');
  const [isIdManuallyEdited, setIsIdManuallyEdited] = useState(false);
  const [newDiseaseName, setNewDiseaseName] = useState('');
  const [newDiseaseCategory, setNewDiseaseCategory] = useState('');
  const [newDiseaseDescription, setNewDiseaseDescription] = useState('');
  const [newDiseaseImageUrl, setNewDiseaseImageUrl] = useState('');
  const [newDiseaseShouldEat, setNewDiseaseShouldEat] = useState('');
  const [newDiseaseShouldAvoid, setNewDiseaseShouldAvoid] = useState('');
  const [newDiseaseSampleMenu, setNewDiseaseSampleMenu] = useState('');
  const [isAddingDisease, setIsAddingDisease] = useState(false);

  useEffect(() => {
    if (!isIdManuallyEdited) {
      setNewDiseaseId(slugify(newDiseaseName));
    }
  }, [newDiseaseName, isIdManuallyEdited]);

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

  const handleAddDisease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiseaseName.trim()) {
      alert("Vui lòng nhập tên bệnh lý.");
      return;
    }
    const finalId = newDiseaseId.trim() || slugify(newDiseaseName);
    if (!finalId) {
      alert("Vui lòng nhập hoặc tự động tạo mã định danh ID.");
      return;
    }
    if (!/^[a-zA-Z0-9_\-]+$/.test(finalId)) {
      alert("Mã định danh ID chỉ được chứa các ký tự chữ cái, số, gạch dưới (_) hoặc gạch ngang (-).");
      return;
    }
    if (!newDiseaseCategory || newDiseaseCategory === 'all') {
      alert("Vui lòng chọn danh mục.");
      return;
    }
    if (!newDiseaseDescription.trim()) {
      alert("Vui lòng nhập mô tả bệnh lý.");
      return;
    }
    if (!newDiseaseImageUrl.trim() || !newDiseaseImageUrl.startsWith('http')) {
      alert("Vui lòng nhập URL hình ảnh gợi ý hợp lệ (bắt đầu bằng http hoặc https).");
      return;
    }

    setIsAddingDisease(true);

    const parseListInput = (input: string) => {
      return input
        .split(/[,\n]/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    };

    const newDiseaseData: Disease = {
      id: finalId,
      name: newDiseaseName.trim(),
      category: newDiseaseCategory,
      description: newDiseaseDescription.trim(),
      imageUrl: newDiseaseImageUrl.trim(),
      shouldEat: parseListInput(newDiseaseShouldEat),
      shouldAvoid: parseListInput(newDiseaseShouldAvoid),
      sampleMenu: parseListInput(newDiseaseSampleMenu)
    };

    try {
      await setDoc(doc(db, 'diseases', finalId), newDiseaseData);
      alert("Đã thêm bệnh lý mới thành công!");
      
      // Refresh list
      fetchDiseases();

      // Reset state and close modal
      setNewDiseaseName('');
      setNewDiseaseId('');
      setIsIdManuallyEdited(false);
      setNewDiseaseCategory('');
      setNewDiseaseDescription('');
      setNewDiseaseImageUrl('');
      setNewDiseaseShouldEat('');
      setNewDiseaseShouldAvoid('');
      setNewDiseaseSampleMenu('');
      setShowAddDiseaseModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `diseases/${finalId}`);
      alert("Lỗi khi thêm bệnh lý mới vào hệ thống.");
    } finally {
      setIsAddingDisease(false);
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
              {adminTab === 'users' ? `Quản lý ${users.length} người dùng` : adminTab === 'diseases' ? `Quản lý ${diseases.length} bệnh lý` : 'Quản lý tin nhắn hỗ trợ trực tiếp'}
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
            <button 
              onClick={() => setAdminTab('chats')}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adminTab === 'chats' ? (isAdminDarkMode ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-500 hover:text-slate-700'}`}
            >
              Hỗ trợ
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
      ) : adminTab === 'chats' ? (
        <AdminChatPanel isAdminDarkMode={isAdminDarkMode} />
      ) : (
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border shadow-sm flex flex-col sm:flex-row gap-4 justify-between sm:items-center transition-colors ${isAdminDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div>
              <h3 className={`text-lg font-bold ${isAdminDarkMode ? 'text-white' : 'text-slate-900'}`}>Danh mục Bệnh lý</h3>
              <p className={`text-sm ${isAdminDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Cấu trúc dữ liệu master cho các nhóm bệnh.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={seedDiseases}
                disabled={isSeeding}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 ${isAdminDarkMode ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
              >
                {isSeeding ? 'Đang xử lý...' : 'Khởi tạo Dữ liệu (Seed)'}
              </button>
              <button 
                onClick={() => setShowAddDiseaseModal(true)}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${isAdminDarkMode ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                <Plus size={14} /> Thêm bệnh lý
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diseases.length === 0 ? (
              <div className={`col-span-full py-12 text-center rounded-3xl border border-dashed ${isAdminDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400 font-medium italic'}`}>
                <p>Chưa có dữ liệu bệnh lý. Hãy nhấn nút để khởi tạo.</p>
              </div>
            ) : diseases.map(d => (
              <div key={d.id} className={`rounded-3xl border shadow-sm overflow-hidden flex flex-col transition-all ${isAdminDarkMode ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-100 hover:border-emerald-200'}`}>
                <div className="h-32 relative bg-emerald-950/20 overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-850">
                  {d.imageUrl ? (
                    <img 
                      src={d.imageUrl} 
                      alt={d.name} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <Activity size={36} className="text-emerald-500/40" />
                  )}
                  <div className={`absolute top-4 left-4 backdrop-blur px-3 py-1 rounded-full shadow-sm bg-black/40 text-white z-10`}>
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
                   <p className={`text-xs leading-relaxed line-clamp-3 mb-4 ${isAdminDarkMode ? 'text-slate-400' : 'text-slate-550'}`}>{d.description}</p>
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
        {showAddDiseaseModal && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowAddDiseaseModal(false)}
               className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" 
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-6 rounded-3xl shadow-2xl z-[101] overflow-y-auto max-h-[90vh] transition-colors ${isAdminDarkMode ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white text-slate-900 border border-slate-100'}`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">Thêm Bệnh Lý Mới</h3>
                <button onClick={() => setShowAddDiseaseModal(false)} className={`p-2 rounded-full transition-colors ${isAdminDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                  <X size={20} className={isAdminDarkMode ? 'text-slate-500' : 'text-slate-400'} />
                </button>
              </div>

              <form onSubmit={handleAddDisease} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Tên Bệnh Lý <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    value={newDiseaseName}
                    onChange={(e) => setNewDiseaseName(e.target.value)}
                    placeholder="VD: Cao Huyết Áp"
                    className={`w-full p-3 rounded-xl border text-sm outline-none transition-all ${isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Mã ID (tự động tạo hoặc nhập thủ công) <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    value={newDiseaseId}
                    onChange={(e) => {
                      setNewDiseaseId(e.target.value);
                      setIsIdManuallyEdited(true);
                    }}
                    placeholder="VD: cao-huyet-ap"
                    className={`w-full p-3 rounded-xl border text-sm outline-none transition-all ${isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Danh Mục <span className="text-rose-500">*</span></label>
                  <select 
                    value={newDiseaseCategory}
                    onChange={(e) => setNewDiseaseCategory(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-sm outline-none transition-all ${isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'}`}
                    required
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {DISEASE_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Mô Tả Bệnh Lý <span className="text-rose-500">*</span></label>
                  <textarea 
                    value={newDiseaseDescription}
                    onChange={(e) => setNewDiseaseDescription(e.target.value)}
                    placeholder="Mô tả tóm tắt về bệnh lý..."
                    rows={3}
                    className={`w-full p-3 rounded-xl border text-sm outline-none transition-all ${isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">URL Hình Ảnh Gợi Ý <span className="text-rose-500">*</span></label>
                  <input 
                    type="url" 
                    value={newDiseaseImageUrl}
                    onChange={(e) => setNewDiseaseImageUrl(e.target.value)}
                    placeholder="Bắt đầu bằng http hoặc https"
                    className={`w-full p-3 rounded-xl border text-sm outline-none transition-all ${isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Thực phẩm nên ăn (phân tách bằng dấu phẩy)</label>
                  <textarea 
                    value={newDiseaseShouldEat}
                    onChange={(e) => setNewDiseaseShouldEat(e.target.value)}
                    placeholder="VD: Rau xanh, Cá hồi, Trái cây tươi"
                    rows={2}
                    className={`w-full p-3 rounded-xl border text-sm outline-none transition-all ${isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Thực phẩm cần tránh (phân tách bằng dấu phẩy)</label>
                  <textarea 
                    value={newDiseaseShouldAvoid}
                    onChange={(e) => setNewDiseaseShouldAvoid(e.target.value)}
                    placeholder="VD: Muối, Đồ ăn nhanh, Sốt béo"
                    rows={2}
                    className={`w-full p-3 rounded-xl border text-sm outline-none transition-all ${isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1">Thực đơn mẫu gợi ý (phân tách bằng dấu phẩy)</label>
                  <textarea 
                    value={newDiseaseSampleMenu}
                    onChange={(e) => setNewDiseaseSampleMenu(e.target.value)}
                    placeholder="VD: Cháo yến mạch buổi sáng, Cá hấp sả buổi trưa"
                    rows={2}
                    className={`w-full p-3 rounded-xl border text-sm outline-none transition-all ${isAdminDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'}`}
                  />
                </div>

                <div className="pt-4 flex gap-3 justify-end">
                  <button 
                    type="button"
                    onClick={() => setShowAddDiseaseModal(false)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider border ${isAdminDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    disabled={isAddingDisease}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                  >
                    {isAddingDisease ? 'Đang thêm...' : 'Xác nhận Thêm'}
                  </button>
                </div>
              </form>
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
  const [chartTab, setChartTab] = useState<'both' | 'weight' | 'bmi'>('both');
  const [newWeight, setNewWeight] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('openNutriChat'));
  };

  if (!profile) return null;

  // Derived helper to format date for display on X-Axis and compute default history if empty
  const historyData = useMemo(() => {
    let hist = formData.weightHistory || [];
    if (hist.length === 0) {
      // Seed default historical data leading up to current weight
      const heightInMeters = formData.height ? (formData.height / 100) : 1.70;
      const currentWeight = formData.weight || 60;
      const today = new Date();
      const offsets = [
        { daysAgo: 28, weightDiff: -2.1 },
        { daysAgo: 21, weightDiff: -1.4 },
        { daysAgo: 14, weightDiff: -0.8 },
        { daysAgo: 7, weightDiff: -0.3 },
        { daysAgo: 0, weightDiff: 0 }
      ];
      hist = offsets.map(offset => {
        const d = new Date(today);
        d.setDate(today.getDate() - offset.daysAgo);
        const dateStr = d.toISOString().split('T')[0];
        const w = Number((currentWeight + offset.weightDiff).toFixed(1));
        const bmi = Number((w / (heightInMeters * heightInMeters)).toFixed(1));
        return { date: dateStr, weight: w, bmi };
      });
    }
    
    // Sort chronologically by date
    return [...hist].sort((a, b) => a.date.localeCompare(b.date));
  }, [formData.weightHistory, formData.weight, formData.height]);

  const currentBMI = useMemo(() => {
    const w = formData.weight || 60;
    const h = formData.height || 170;
    const bmi = w / ((h / 100) * (h / 100));
    return Number(bmi.toFixed(1));
  }, [formData.weight, formData.height]);

  const getBmiCategory = (bmiVal: number) => {
    if (bmiVal < 18.5) return { label: 'Thiếu cân (Gầy)', color: 'text-blue-500 bg-blue-50 border-blue-100', desc: 'Có nguy cơ suy dinh dưỡng, hãy ưu tiên các nhóm chất béo lành mạnh.' };
    if (bmiVal < 23) return { label: 'Bình thường (Lý tưởng)', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', desc: 'Tuyệt vời! Hãy tiếp tục duy trì chế độ sinh hoạt lành mạnh hiện tại.' };
    if (bmiVal < 25) return { label: 'Thừa cân (Tiền béo phì)', color: 'text-amber-600 bg-amber-50 border-amber-100', desc: 'Hãy chú ý cắt bớt tinh bột và bổ sung nhiều rau xanh hơn.' };
    return { label: 'Béo phì', color: 'text-rose-600 bg-rose-50 border-rose-100', desc: 'Khuyên dùng chế độ ăn nhạt, tránh muối đường dầu mỡ.' };
  };

  const bmiStatus = getBmiCategory(currentBMI);

  const handleAddMeasurement = () => {
    const w = Number(newWeight);
    if (isNaN(w) || w <= 0 || w > 300) {
      alert("Vui lòng nhập cân nặng hợp lệ (0kg - 300kg)!");
      return;
    }
    
    const heightInMeters = (formData.height || 170) / 100;
    const bmi = Number((w / (heightInMeters * heightInMeters)).toFixed(1));
    
    const newEntry: WeightEntry = {
      date: newDate,
      weight: w,
      bmi
    };
    
    const existingHist = formData.weightHistory && formData.weightHistory.length > 0 ? formData.weightHistory : historyData;
    const filteredHist = existingHist.filter(entry => entry.date !== newDate);
    const updatedHist = [...filteredHist, newEntry].sort((a, b) => a.date.localeCompare(b.date));
    
    const updatedForm = {
      ...formData,
      weight: w,
      weightHistory: updatedHist
    };
    
    setFormData(updatedForm);
    setNewWeight('');
    
    // Save to server
    onUpdate(updatedForm);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl text-white text-xs space-y-1">
          <p className="font-extrabold text-slate-300">
            {new Date(label).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} className="font-bold flex items-center gap-1.5" style={{ color: item.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}: {item.value} {item.name === 'Cân nặng' ? 'kg' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
        {/* Profile Details Edit Form */}
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
                onChange={e => {
                  const val = Number(e.target.value);
                  setFormData({...formData, weight: val});
                }}
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
            onClick={() => setShowConfirmModal(true)}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-100 active:scale-[0.98] transition-all hover:bg-emerald-700 font-bold uppercase tracking-wider text-sm mt-4 flex items-center justify-center gap-2"
          >
             Lưu thay đổi hồ sơ
          </button>
        </div>

        {/* Dynamic Weight and BMI Tracking & Visualization Section */}
        <div className="geometric-card p-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight font-sans">Tiến trình chỉ số cơ thể</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Weight & BMI History</p>
              </div>
            </div>

            {/* Segmented Controller Tab */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto shrink-0 border border-slate-200/50">
              {[
                { id: 'both', label: 'Cả hai' },
                { id: 'weight', label: 'Cân nặng' },
                { id: 'bmi', label: 'Chỉ số BMI' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setChartTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all ${
                    chartTab === tab.id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics & BMI Health Meter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cân nặng hiện tại</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-950">{formData.weight || 60}</span>
                  <span className="text-sm font-bold text-slate-500">kg</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-bold mt-4 flex items-center gap-1">
                <Scale size={14} className="text-emerald-500" /> Chiều cao cài đặt: {formData.height || 170} cm
              </p>
            </div>

            <div className={`p-5 rounded-2xl border ${bmiStatus.color} flex flex-col justify-between`}>
              <div>
                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1.5">Chỉ số BMI hiện tại</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">{currentBMI}</span>
                  <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/85 shadow-sm">{bmiStatus.label}</span>
                </div>
              </div>
              <p className="text-xs font-bold leading-relaxed opacity-85 mt-4">{bmiStatus.desc}</p>
            </div>
          </div>

          {/* Visualization Chart Container */}
          <div className="h-[300px] w-full md:h-[350px] relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBmi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(v) => {
                    const parts = v.split('-');
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : v;
                  }}
                  stroke="#94a3b8" 
                  style={{ fontSize: '11px', fontWeight: 600 }} 
                />
                
                {chartTab === 'both' && (
                  <>
                    <YAxis 
                      yAxisId="left" 
                      stroke="#10b981" 
                      domain={['dataMin - 3', 'dataMax + 3']} 
                      style={{ fontSize: '11px', fontWeight: 600 }} 
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke="#3b82f6" 
                      domain={['dataMin - 1', 'dataMax + 1']} 
                      style={{ fontSize: '11px', fontWeight: 600 }} 
                    />
                  </>
                )}

                {chartTab === 'weight' && (
                  <YAxis 
                    stroke="#10b981" 
                    domain={['dataMin - 4', 'dataMax + 4']} 
                    style={{ fontSize: '11px', fontWeight: 600 }} 
                  />
                )}

                {chartTab === 'bmi' && (
                  <YAxis 
                    stroke="#3b82f6" 
                    domain={['dataMin - 1.5', 'dataMax + 1.5']} 
                    style={{ fontSize: '11px', fontWeight: 600 }} 
                  />
                )}

                <Tooltip content={<CustomTooltip />} />
                
                {chartTab === 'both' && (
                  <>
                    <Area yAxisId="left" type="monotone" dataKey="weight" name="Cân nặng" stroke="#10b981" strokeWidth={3} fill="url(#colorWeight)" />
                    <Area yAxisId="right" type="monotone" dataKey="bmi" name="Chỉ số BMI" stroke="#3b82f6" strokeWidth={3} fill="url(#colorBmi)" />
                  </>
                )}

                {chartTab === 'weight' && (
                  <Area type="monotone" dataKey="weight" name="Cân nặng" stroke="#10b981" strokeWidth={3} fill="url(#colorWeight)" />
                )}

                {chartTab === 'bmi' && (
                  <Area type="monotone" dataKey="bmi" name="Chỉ số BMI" stroke="#3b82f6" strokeWidth={3} fill="url(#colorBmi)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Add Measurement Entry Form */}
          <div className="bg-slate-50 border border-slate-200/70 p-6 rounded-3xl mt-4">
            <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2 mb-4">
              <Plus size={16} className="text-emerald-500" /> Thêm số đo mới
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Chọn ngày đo</label>
                <input 
                  type="date" 
                  value={newDate} 
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 text-sm font-medium outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Cân nặng thực tế (kg)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="VD: 58"
                    value={newWeight} 
                    onChange={e => setNewWeight(e.target.value)}
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 text-sm font-medium outline-none transition-all pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">KG</span>
                </div>
              </div>

              <button 
                onClick={handleAddMeasurement}
                disabled={!newWeight}
                className="w-full bg-slate-900 border border-slate-950 hover:bg-slate-850 text-white font-bold py-3.5 rounded-xl transition-all font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Ghi chép số đo
              </button>
            </div>
          </div>
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

      <AnimatePresence>
        {showConfirmModal && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowConfirmModal(false)}
               className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" 
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-3xl shadow-2xl z-[101] bg-white text-slate-900 border border-slate-100"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 text-amber-600">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-slate-900">Xác nhận cập nhật hồ sơ?</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Thông tin thay đổi này sẽ làm cập nhật lại các chỉ số và gợi ý thực đơn dinh dưỡng từ AI. Hãy chắc chắn rằng bạn đã kiểm tra các thông tin chính xác.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={() => {
                    onUpdate(formData);
                    setShowConfirmModal(false);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  Xác nhận lưu
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
