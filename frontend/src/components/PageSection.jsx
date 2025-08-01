
    import React from 'react';
    import { motion } from 'framer-motion';
    import { cn } from '@/lib/utils';

    const PageSection = ({ children, className, id, fullWidth = false }) => {
      return (
        <motion.section
          id={id}
          className={cn('py-12 md:py-20', className)}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <div className={cn(!fullWidth && 'container')}>
            {children}
          </div>
        </motion.section>
      );
    };

    export default PageSection;
  