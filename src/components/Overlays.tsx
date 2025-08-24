import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { Language } from '../i18n/index.ts';

export const LoadingOverlay: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="fixed inset-0 bg-[#0A192F] z-[100] flex flex-col items-center justify-center gap-4">
            <svg className="animate-spin h-12 w-12 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h1 className="text-2xl text-cyan-400 neon-text-cyan tracking-widest">{t('loading')}</h1>
        </div>
    );
};

const Starfield: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let stars: {x: number, y: number, speed: number, size: number}[];
        let animationFrameId: number;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            stars = Array.from({ length: 200 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                speed: Math.random() * 1.5 + 0.2,
                size: Math.random() * 1.5 + 0.5
            }));
        };

        const render = () => {
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'white';
                stars.forEach(star => {
                    star.x -= star.speed;
                    if (star.x < 0) {
                        star.x = canvas.width;
                        star.y = Math.random() * canvas.height;
                    }
                    ctx.fillRect(star.x, star.y, star.size, star.size);
                });
            }
            animationFrameId = requestAnimationFrame(render);
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    return (
        <div className="absolute inset-0">
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>
    );
};


interface MainMenuProps {
  hasSaveData: boolean;
  onContinueGame: () => void;
  onNewGame: () => void;
  onShowOptions: () => void;
  focusedIndex: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({ hasSaveData, onContinueGame, onNewGame, onShowOptions, focusedIndex }) => {
  const { t } = useLanguage();
  
  const menuItems = [];
  if (hasSaveData) {
    menuItems.push({ label: t('main_menu.continue_game'), action: onContinueGame });
  }
  menuItems.push({ label: t('main_menu.new_game'), action: onNewGame });
  menuItems.push({ label: t('main_menu.options'), action: onShowOptions });


  return (
    <div className="fixed inset-0 bg-[#0A192F] z-[100] flex flex-col items-center justify-center">
      <Starfield />
      <div className="z-10 text-center flex flex-col items-center gap-8">
        <h1 className="text-6xl font-bold text-cyan-400 neon-text-cyan tracking-widest">
          {t('game_title')}
        </h1>
        <div className="flex flex-col gap-4 w-64">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`px-8 py-4 text-2xl bg-cyan-500/10 border-2 border-cyan-500/50 rounded-md hover:bg-cyan-500/20 hover:neon-glow-cyan transition-all duration-300 ${focusedIndex === index ? 'controller-focus' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface OptionsPanelProps {
    onBack: () => void;
    focusedIndex: number;
}

export const OptionsPanel: React.FC<OptionsPanelProps> = ({ onBack, focusedIndex }) => {
    const { t, setLanguage, language } = useLanguage();
    const languages: Language[] = ['en', 'pt-br'];

    return (
        <div className="fixed inset-0 bg-[#0A192F] z-[100] flex flex-col items-center justify-center">
            <Starfield />
            <div className="z-10 text-center flex flex-col items-center gap-8 p-8 bg-black/50 border-2 border-cyan-500/50 rounded-lg">
                <h1 className="text-4xl font-bold text-cyan-400 neon-text-cyan tracking-widest">
                    {t('options_panel.title')}
                </h1>
                <div className="flex flex-col gap-4 w-80">
                    <h2 className="text-2xl text-cyan-300">{t('options_panel.language')}</h2>
                    <div className="flex justify-center gap-4">
                        {languages.map((lang, index) => (
                            <button
                                key={lang}
                                onClick={() => setLanguage(lang)}
                                className={`px-6 py-3 text-lg border-2 rounded-md transition-all duration-300
                                    ${language === lang ? 'bg-cyan-500/40 border-cyan-400 neon-glow-cyan' : 'bg-cyan-500/10 border-cyan-500/50'}
                                    ${focusedIndex === index ? 'controller-focus' : ''}
                                `}
                            >
                                {t(`languages.${lang}` as any)}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={onBack}
                    className={`mt-4 px-8 py-4 text-2xl bg-cyan-500/10 border-2 border-cyan-500/50 rounded-md hover:bg-cyan-500/20 hover:neon-glow-cyan transition-all duration-300 ${focusedIndex === languages.length ? 'controller-focus' : ''}`}
                >
                   {t('options_panel.back')}
                </button>
            </div>
        </div>
    );
};


interface TravelOverlayProps {
  from: string;
  to: string;
  progress: number;
}

export const TravelOverlay: React.FC<TravelOverlayProps> = ({ from, to, progress }) => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 bg-black z-[90] flex flex-col items-center justify-center gap-8">
      <Starfield />
      <div className="z-10 text-center flex flex-col items-center gap-4">
        <h2 className="text-4xl text-orange-400 neon-text-orange tracking-widest animate-pulse">{t('in_transit')}</h2>
        <p className="text-xl text-cyan-300">{t('approaching')} <span className="font-bold text-white">{to}</span></p>
        <div className="w-96 h-4 bg-gray-800 border-2 border-cyan-400/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-all duration-500 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

interface PauseMenuProps {
    onResume: () => void;
    onSave: () => void;
    onShowOptions: () => void;
    onExit: () => void;
    focusedIndex: number;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onSave, onShowOptions, onExit, focusedIndex }) => {
    const { t } = useLanguage();
    const menuItems = [
        { label: t('pause_menu.resume'), action: onResume },
        { label: t('pause_menu.save'), action: onSave },
        { label: t('main_menu.options'), action: onShowOptions },
        { label: t('pause_menu.exit'), action: onExit },
    ];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
            <div className="z-10 text-center flex flex-col items-center gap-8">
                <h1 className="text-6xl font-bold text-cyan-400 neon-text-cyan tracking-widest">
                    {t('pause_menu.title')}
                </h1>
                <div className="flex flex-col gap-4 w-64">
                    {menuItems.map((item, index) => (
                        <button
                            key={item.label}
                            onClick={item.action}
                            className={`px-8 py-4 text-2xl bg-cyan-500/10 border-2 border-cyan-500/50 rounded-md hover:bg-cyan-500/20 hover:neon-glow-cyan transition-all duration-300 ${focusedIndex === index ? 'controller-focus' : ''}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};