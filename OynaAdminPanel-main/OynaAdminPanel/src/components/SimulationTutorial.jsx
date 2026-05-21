/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const STEP_KEYS = ['welcome', 'palette', 'properties', 'connect', 'cabinet', 'shortcuts'];
const STEP_ICONS = {
  welcome: 'waving_hand',
  palette: 'category',
  properties: 'tune',
  connect: 'share',
  cabinet: 'zoom_out_map',
  shortcuts: 'keyboard',
};

const SimulationTutorial = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0);
      setDontShow(false);
    }
  }, [open]);

  if (!open) return null;

  const total = STEP_KEYS.length;
  const currentKey = STEP_KEYS[step];
  const isLast = step === total - 1;
  const progress = ((step + 1) / total) * 100;

  const finish = () => {
    if (dontShow) {
      localStorage.setItem('simulation_tutorial_seen', '1');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="grid w-full max-w-3xl overflow-hidden rounded-lg border border-white/10 bg-white shadow-2xl shadow-slate-950/30 dark:bg-slate-900 md:grid-cols-[15rem_1fr]">
        <div className="hidden border-r border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 md:block">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
              <span className="material-symbols-outlined">view_quilt</span>
            </div>
            <div>
              <p className="text-sm font-black text-on-surface dark:text-white">
                {t('simulation.title')}
              </p>
              <p className="text-[11px] font-bold text-on-surface-variant dark:text-slate-500">
                {t('simulation.tutorial.step', { current: step + 1, total })}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            {STEP_KEYS.map((key, index) => (
              <button
                key={key}
                onClick={() => setStep(index)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-black transition-colors ${
                  step === index
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-on-surface-variant hover:bg-white hover:text-primary dark:text-slate-400 dark:hover:bg-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">{STEP_ICONS[key]}</span>
                {t(`simulation.tutorial.steps.${key}.title`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-3xl">
                    {STEP_ICONS[currentKey]}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                    {t('simulation.tutorial.title')}
                  </p>
                  <h3 className="mt-1 text-xl font-black text-on-surface dark:text-white">
                    {t(`simulation.tutorial.steps.${currentKey}.title`)}
                  </h3>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-slate-100 hover:text-error dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="mt-6 text-sm leading-7 text-on-surface-variant dark:text-slate-300">
              {t(`simulation.tutorial.steps.${currentKey}.body`)}
            </p>

            <div className="mt-7 flex items-center justify-center gap-1.5 md:hidden">
              {STEP_KEYS.map((key, index) => (
                <button
                  key={key}
                  onClick={() => setStep(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === step ? 'w-8 bg-primary' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label={`Step ${index + 1}`}
                />
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={dontShow}
                  onChange={(event) => setDontShow(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40 dark:border-slate-700"
                />
                {t('simulation.tutorial.dontShowAgain')}
              </label>

              <div className="flex items-center justify-end gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-on-surface transition-colors hover:border-primary/40 hover:text-primary dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    {t('simulation.tutorial.prev')}
                  </button>
                )}

                <button
                  onClick={isLast ? finish : () => setStep(step + 1)}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-container"
                >
                  {isLast ? t('simulation.tutorial.finish') : t('simulation.tutorial.next')}
                  <span className="material-symbols-outlined text-lg">
                    {isLast ? 'check' : 'arrow_forward'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationTutorial;
