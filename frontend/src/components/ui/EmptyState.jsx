import React from 'react';
import { motion } from 'framer-motion';

export default function EmptyState({ icon = '🃏', title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="text-6xl mb-4"
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/40 text-sm max-w-xs mb-6">{description}</p>
      {action && (
        <button onClick={action.onClick} className="neon-btn text-sm px-6 py-2">
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
