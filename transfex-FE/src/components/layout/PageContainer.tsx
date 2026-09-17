import { motion } from 'framer-motion';

export function PageContainer({
  children,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex-1 overflow-y-auto"
    >
      <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
        {(title || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              {title && (
                <motion.h1
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl lg:text-3xl font-bold text-white"
                >
                  {title}
                </motion.h1>
              )}
              {subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-slate-400 mt-1"
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
            {actions && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3"
              >
                {actions}
              </motion.div>
            )}
          </div>
        )}
        {children}
      </div>
    </motion.div>
  );
}
