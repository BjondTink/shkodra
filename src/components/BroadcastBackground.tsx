import { motion } from 'motion/react';

export default function BroadcastBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Light Streak 1 */}
      <motion.div
        animate={{
          x: ['-100%', '200%'],
          y: ['0%', '100%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute w-[150%] h-[300px] bg-gradient-to-r from-transparent via-brand-red/5 to-transparent rotate-[-35deg] top-[-50%]"
      />
      
      {/* Light Streak 2 */}
      <motion.div
        animate={{
          x: ['200%', '-100%'],
          y: ['100%', '0%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute w-[150%] h-[200px] bg-gradient-to-r from-transparent via-blue-500/5 to-transparent rotate-[25deg] bottom-[-30%]"
      />

      {/* Pulsing Glows */}
      <motion.div
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-0 right-0 w-1/2 h-1/2 bg-brand-red/10 blur-[200px] rounded-full"
      />
    </div>
  );
}
