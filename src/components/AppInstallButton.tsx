import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Monitor, 
  Download, 
  X, 
  ArrowUpRight, 
  PlusSquare, 
  Chrome, 
  Share 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AppInstallButtonProps {
  lang: 'vi' | 'en';
}

export const AppInstallButton: React.FC<AppInstallButtonProps> = ({ lang }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isReadyToInstall, setIsReadyToInstall] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<'android' | 'ios' | 'desktop' | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setIsReadyToInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerNativePrompt = async () => {
    if (!deferredPrompt) return false;
    
    // Show the prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
    setIsReadyToInstall(false);
    return true;
  };

  const handleInstallClick = async (platform: 'android' | 'ios' | 'desktop') => {
    // Try triggering browser-level PWA installation if compatible
    if (isReadyToInstall && (platform === 'android' || platform === 'desktop')) {
      const success = await triggerNativePrompt();
      if (success) return;
    }

    // Otherwise, show the helpful step-by-step PWA manual guide
    setGuidePlatform(platform);
    setShowGuideModal(true);
  };

  return (
    <div className="mt-8 pt-6 border-t border-slate-100/80">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 text-center md:text-left">
        {lang === 'vi' ? 'CÀI ĐẶT ỨNG DỤNG DI ĐỘNG & MÁY TÍNH' : 'INSTALL MOBILE & DESKTOP APP'}
      </p>
      
      <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
        {/* Android button */}
        <button
          onClick={() => handleInstallClick('android')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer group active:scale-95"
        >
          <div className="w-5 h-5 bg-emerald-500/15 text-emerald-400 rounded-lg flex items-center justify-center transition-all group-hover:bg-emerald-500/30">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M17.523 15.3l1.816 3.146a.5.5 0 1 1-.866.5l-1.838-3.185a10.024 10.024 0 0 1-9.27 0l-1.837 3.185a.5.5 0 0 1-.866-.5L6.477 15.3C3.766 13.9 2 11.2 2 8h20c0 3.2-1.766 5.9-4.477 7.3zM7 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 2a4 4 0 0 1 4 4H8a4 4 0 0 1 4-4z" />
            </svg>
          </div>
          <div className="text-left shrink-0">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide leading-none">
              {lang === 'vi' ? 'TẢI CHO' : 'GET IT ON'}
            </p>
            <p className="text-[11px] font-black tracking-tight leading-none mt-1">
              Android APK / Chrome
            </p>
          </div>
        </button>

        {/* iOS button */}
        <button
          onClick={() => handleInstallClick('ios')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer group active:scale-95"
        >
          <div className="w-5 h-5 bg-indigo-505/15 text-indigo-400 rounded-lg flex items-center justify-center transition-all group-hover:bg-indigo-500/30">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.5-.62.72-1.16 1.86-1.01 2.97 1.11.09 2.27-.6 2.94-1.41z" />
            </svg>
          </div>
          <div className="text-left shrink-0">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide leading-none">
              {lang === 'vi' ? 'CÀI TRÊN' : 'INSTALL ON'}
            </p>
            <p className="text-[11px] font-black tracking-tight leading-none mt-1">
              iPhone / iOS Safari
            </p>
          </div>
        </button>

        {/* Desktop button */}
        <button
          onClick={() => handleInstallClick('desktop')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer group active:scale-95"
        >
          <div className="w-5 h-5 bg-slate-700/30 text-slate-300 rounded-lg flex items-center justify-center transition-all group-hover:bg-slate-700/50">
            <Monitor size={13} />
          </div>
          <div className="text-left shrink-0">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide leading-none">
              {lang === 'vi' ? 'CÀI ĐẶT' : 'INSTALL ON'}
            </p>
            <p className="text-[11px] font-black tracking-tight leading-none mt-1">
              Desktop PC / PWA
            </p>
          </div>
        </button>
      </div>

      {/* Guide Modal Backdrop & content */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Download size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{lang === 'vi' ? 'HƯỚNG DẪN CÀI ĐẶT APP' : 'INSTALLATION GUIDE'}</h4>
                    <span className="text-[12px] font-black text-slate-800 flex items-center gap-1">
                      {guidePlatform === 'ios' ? 'Apple iPhone / iOS iPad' : guidePlatform === 'android' ? 'Google Android / Chrome' : 'Desktop PC / macOS / Windows'}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setShowGuideModal(false);
                    setGuidePlatform(null);
                  }}
                  className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-450 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Steps Area details */}
              <div className="p-6 space-y-4 text-xs font-medium text-slate-600">
                {guidePlatform === 'ios' && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-805 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
                      <p>
                        {lang === 'vi' 
                          ? 'Mở trình duyệt ' 
                          : 'Open the default '}
                        <strong className="text-slate-900">Safari</strong> 
                        {lang === 'vi' ? ' trên thiết bị iOS của bạn.' : ' browser on your Apple device.'}
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-805 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
                      <p className="flex items-center gap-1.5 flex-wrap">
                        {lang === 'vi' ? 'Nhấn vào biểu tượng ' : 'Tap the '}
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 border border-slate-200 rounded text-slate-755 font-bold">
                          <Share size={12} /> Share
                        </span> 
                        {lang === 'vi' ? ' ở thanh menu dưới cùng của Safari.' : ' share icon in Safari bottom menu.'}
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-805 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">3</span>
                      <p className="flex items-center gap-1.5 flex-wrap">
                        {lang === 'vi' 
                          ? 'Cuộn xuống dưới và chọn mục ' 
                          : 'Scroll down and select '}
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 border border-slate-200 rounded text-slate-800 font-bold">
                          <PlusSquare size={12} /> {lang === 'vi' ? 'Thêm vào MH chính' : 'Add to Home Screen'}
                        </span>.
                      </p>
                    </div>

                    <div className="flex items-start gap-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3 text-emerald-800 text-[11px]">
                      <ArrowUpRight size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <p>
                        {lang === 'vi' 
                          ? 'Nhấn "Thêm" ở góc phải màn hình. Biểu tượng NutriCare sẽ xuất hiện ngay trên màn hình chính như một app tải từ App Store!' 
                          : 'Tap "Add" at the top right. The NutriCare icon will appear directly on your home screen ready for fast medical-AI assistant query.'}
                      </p>
                    </div>
                  </div>
                )}

                {guidePlatform === 'android' && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-805 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
                      <p>
                        {lang === 'vi' ? 'Đảm bảo trình duyệt đang xem là ' : 'Ensure you are browsing via '}
                        <strong className="text-slate-900">Google Chrome</strong> {lang === 'vi' ? 'hoặc Samsung Internet.' : 'on your Android smartphone.'}
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-805 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
                      <p>
                        {lang === 'vi' ? 'Nhấn vào biểu tượng dấu ba chấm dọc ' : 'Tap the triple dots option button '}
                        <span className="inline-block px-1.5 font-black text-slate-900 border border-slate-200 rounded bg-slate-100">⋮</span> 
                        {lang === 'vi' ? ' ở góc trên bên phải màn hình.' : ' in the top right corner of Chrome.'}
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-805 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">3</span>
                      <p>
                        {lang === 'vi' ? 'Tìm và nhấn chọn mục ' : 'Find and tap '}
                        <strong className="text-slate-900">{lang === 'vi' ? 'Cài đặt ứng dụng' : 'Install App'}</strong> 
                        {lang === 'vi' ? ' hoặc "Thêm vào Màn hình chính".' : ' or "Add to Home screen".'}
                      </p>
                    </div>

                    <div className="flex items-start gap-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3 text-emerald-800 text-[11px]">
                      <Chrome size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                      <p>
                        {lang === 'vi'
                          ? 'Xác nhận cài đặt. Thưởng thức toàn bộ tính năng mượt mà hơn gấp 2 lần, chạy offline không gián đoạn.'
                          : 'Confirm install. Enjoy NutriCare 2x faster, with safe storage caching.'}
                      </p>
                    </div>
                  </div>
                )}

                {guidePlatform === 'desktop' && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-805 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
                      <p>
                        {lang === 'vi' ? 'Nếu bạn dùng trình duyệt Chrome/Edge trên PC, hãy để ý ở cuối thanh địa chỉ URL.' : 'Look at your Chrome / Microsoft Edge address bar.'}
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-805 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
                      <p>
                        {lang === 'vi' ? 'Nhấp vào nút biểu tượng ' : 'Click the '}
                        <strong className="text-slate-900">{lang === 'vi' ? '"Cài đặt NutriCare"' : '"Install NutriCare"'}</strong> 
                        {lang === 'vi' ? ' có hình màn hình/mũi tên tải xuống.' : ' utility icon (monitor or download arrow).'}
                      </p>
                    </div>

                    <div className="flex items-start gap-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3 text-emerald-800 text-[11px]">
                      <Monitor size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                      <p>
                        {lang === 'vi'
                          ? 'App sẽ khởi động riêng biệt như một phần mềm độc lập vô cùng tiện lợi trên màn hình Desktop của bạn!'
                          : 'The app launches as a standalone premium program, completely isolated on your desktop PC.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Close footer */}
              <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/30">
                <button
                  onClick={() => {
                    setShowGuideModal(false);
                    setGuidePlatform(null);
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-[10.5px] font-black tracking-wider uppercase transition-colors focus:outline-none cursor-pointer"
                >
                  {lang === 'vi' ? 'Đã hiểu' : 'Got it'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
