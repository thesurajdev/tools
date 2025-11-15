import { ReactNode } from 'react';

interface ToolLayoutProps {
  title: string;
  subtitle: string;
  note?: string;
  children: ReactNode;
}

export default function ToolLayout({ title, subtitle, note, children }: ToolLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Tool Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
            {title}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-2">
            {subtitle}
          </p>
          {note && (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              {note}
            </p>
          )}
        </div>
      </div>
      
      {/* Tool Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
