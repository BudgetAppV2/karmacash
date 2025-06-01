import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  CreditCardIcon,
  TagIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CreditCardIcon as CreditCardIconSolid,
  TagIcon as TagIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  CogIcon as CogIconSolid
} from '@heroicons/react/24/solid';
import styles from './BottomNavigation.module.css';

const NAVIGATION_TABS = [
  {
    id: 'budget',
    label: 'Budget',
    path: '/budget',
    icon: HomeIcon,
    iconActive: HomeIconSolid,
    description: 'Vue d\'ensemble des budgets et allocation'
  },
  {
    id: 'transactions',
    label: 'Transactions',
    path: '/transactions',
    icon: CreditCardIcon,
    iconActive: CreditCardIconSolid,
    description: 'Historique et gestion des transactions'
  },
  {
    id: 'categories',
    label: 'Catégories',
    path: '/categories',
    icon: TagIcon,
    iconActive: TagIconSolid,
    description: 'Organisation et gestion des catégories'
  },
  {
    id: 'graphs',
    label: 'Graphiques',
    path: '/graphs',
    icon: ChartBarIcon,
    iconActive: ChartBarIconSolid,
    description: 'Analyses visuelles et rapports'
  },
  {
    id: 'settings',
    label: 'Réglages',
    path: '/settings',
    icon: CogIcon,
    iconActive: CogIconSolid,
    description: 'Paramètres et configuration'
  }
];

// Animation variants following B3.11 specifications
const animationVariants = {
  // Tab container animations
  tabContainer: {
    hover: {
      scale: 1.02,
      y: -1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.15
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.1
      }
    }
  },
  
  // Icon animations
  icon: {
    initial: { scale: 1 },
    hover: {
      scale: 1.1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: 0.15
      }
    },
    active: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: 0.2
      }
    }
  },
  
  // Active indicator animations
  activeIndicator: {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 0.8,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        duration: 0.3
      }
    },
    exit: {
      scale: 0,
      opacity: 0,
      transition: {
        duration: 0.15
      }
    }
  },
  
  // Label animations
  label: {
    initial: { y: 0 },
    hover: {
      y: -1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.15
      }
    }
  }
};

/**
 * Bottom Navigation Component
 * 
 * Provides a 5-tab bottom navigation system with:
 * - French labels following app localization
 * - Heroicons for consistent iconography
 * - Active/inactive states with visual hierarchy
 * - Glassmorphism effect following design system
 * - Framer Motion animations with reduced motion support
 * - Accessibility support (WCAG 2.1 AA)
 * - Mobile-first responsive design
 */
function BottomNavigation() {
  const location = useLocation();
  
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Determine active tab based on current path
  const getActiveTab = (path) => {
    // Handle root path - defaults to budget
    if (path === '/') return 'budget';
    
    // Find matching tab by path
    const activeTab = NAVIGATION_TABS.find(tab => 
      path.startsWith(tab.path)
    );
    
    return activeTab?.id || 'budget';
  };
  
  const activeTabId = getActiveTab(location.pathname);
  
  return (
    <motion.nav 
      className={styles.bottomNavigation}
      role="navigation"
      aria-label="Navigation principale"
      initial={prefersReducedMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
      transition={prefersReducedMotion ? 
        { duration: 0.2 } : 
        {
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.4
        }
      }
    >
      <div className={styles.navContainer}>
        {NAVIGATION_TABS.map((tab) => {
          const isActive = activeTabId === tab.id;
          const IconComponent = isActive ? tab.iconActive : tab.icon;
          
          return (
            <motion.div
              key={tab.id}
              variants={prefersReducedMotion ? {} : animationVariants.tabContainer}
              whileHover={prefersReducedMotion ? {} : "hover"}
              whileTap={prefersReducedMotion ? {} : "tap"}
              className={styles.navTabWrapper}
            >
              <NavLink
                to={tab.path}
                className={({ isActive }) => 
                  `${styles.navTab} ${isActive ? styles.navTabActive : ''}`
                }
                aria-label={`${tab.label} - ${tab.description}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <motion.div 
                  className={styles.navIcon}
                  variants={prefersReducedMotion ? {} : animationVariants.icon}
                  animate={prefersReducedMotion ? {} : (isActive ? "active" : "initial")}
                >
                  <IconComponent 
                    className={styles.icon}
                    aria-hidden="true"
                  />
                </motion.div>
                
                <motion.span 
                  className={styles.navLabel}
                  variants={prefersReducedMotion ? {} : animationVariants.label}
                >
                  {tab.label}
                </motion.span>
                
                {/* Active indicator with entrance/exit animation */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      className={styles.activeIndicator}
                      variants={animationVariants.activeIndicator}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      aria-hidden="true"
                    />
                  )}
                </AnimatePresence>
              </NavLink>
            </motion.div>
          );
        })}
      </div>
    </motion.nav>
  );
}

export default BottomNavigation;
export { NAVIGATION_TABS };