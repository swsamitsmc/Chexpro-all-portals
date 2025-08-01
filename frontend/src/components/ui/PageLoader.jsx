import { motion } from 'framer-motion';

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
    />
  </div>
);

export default PageLoader;