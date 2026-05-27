import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught rendering crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center dark:bg-slate-950 dark:text-white">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white p-10 shadow-2xl dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            </div>
            <h2 className="mt-6 text-2xl font-black tracking-tight font-headline">Gözlənilməz Xəta!</h2>
            <p className="mt-4 text-sm text-slate-500 leading-relaxed dark:text-slate-400 font-medium">
              Səhifə göstərilən zaman xəta baş verdi. Sistem idarəçisinə məlumat verildi. Lütfən, səhifəni yenidən yükləyin və ya əsas səhifəyə qayıdın.
            </p>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-4 rounded-2xl bg-[#0058bc] text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                Yenidən yüklə
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Ana səhifə
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
