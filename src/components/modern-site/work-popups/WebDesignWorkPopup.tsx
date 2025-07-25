import React, { useState, useEffect } from 'react';
import { colors, typography } from '../../../theme/theme';
import { X, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WebDesignWorkPopupProps {
  onClose: () => void;
}

interface WebsiteProject {
  id: string;
  title: string;
  url: string;
  description: string;
  technologies: string[];
  features: string[];
  imageUrl: string;
  color: string;
}

const WebDesignWorkPopup: React.FC<WebDesignWorkPopupProps> = ({ onClose }) => {
  const buttonColor = colors.primary.blue; // #008CFF
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const [currentProject, setCurrentProject] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [, setShowIframe] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const websiteProjects: WebsiteProject[] = [
    {
      id: 'mg-accounting',
      title: 'MG Accounting',
      url: 'https://www.mgaccounting.com.au/',
      description: `A professional website for an accounting firm that balances corporate trustworthiness with approachable design. The site features clear service descriptions, team profiles, and contact information to convert visitors into clients.`,
      technologies: ['React', 'Next.js', 'Tailwind CSS', 'Framer Motion'],
      features: ['Responsive Design', 'Service Showcases', 'Team Profiles', 'Contact Form Integration'],
      imageUrl: '/mgaccounting.png',
      color: '#008CFF'
    },
    {
      id: 'followfuse',
      title: 'FollowFuse',
      url: 'https://www.followfuse.com/',
      description: `A dynamic platform for social media management and analytics. The website presents a modern, tech-forward aesthetic with interactive elements that demonstrate the product's capabilities.`,
      technologies: ['React', 'TypeScript', 'Styled Components', 'Chart.js'],
      features: ['Interactive Dashboard Demo', 'Feature Showcase', 'Pricing Tables', 'User Testimonials'],
      imageUrl: '/followfuse.png',
      color: '#FF1493'
    },
    {
      id: 'boostr',
      title: 'Boostr',
      url: 'https://boostr-seven.vercel.app/',
      description: `A performance-focused website for a fitness coaching platform. The design emphasizes motivation and results with strong visuals and clear calls to action.`,
      technologies: ['Next.js', 'Tailwind CSS', 'Supabase', 'Vercel'],
      features: ['Program Showcases', 'Coach Profiles', 'Testimonial Carousel', 'Membership Portal'],
      imageUrl: '/brands/boostr.png',
      color: '#FFCC00'
    },
    {
      id: '1-step-ahead',
      title: '1 Step Ahead',
      url: 'https://1stepahead.vercel.app/',
      description: `An educational platform website with a clean, intuitive design that prioritizes content accessibility and user engagement. The site features course listings, instructor profiles, and learning resources.`,
      technologies: ['React', 'Next.js', 'Material UI', 'MongoDB'],
      features: ['Course Catalog', 'Learning Dashboard', 'Progress Tracking', 'Resource Library'],
      imageUrl: '/1stepahead.png',
      color: '#00CC66'
    },
    {
      id: 'followfuseapp',
      title: 'FollowFuseApp',
      url: 'https://followfuseapp.com/',
      description: `A mobile app landing page that showcases the FollowFuse application's features and benefits. The design uses app screenshots and interactive elements to demonstrate functionality.`,
      technologies: ['React', 'Gatsby', 'Tailwind CSS', 'Netlify'],
      features: ['App Feature Showcase', 'Interactive Demo', 'Download Links', 'User Reviews'],
      imageUrl: '/followfuseapp.png',
      color: '#9933FF'
    },
    {
      id: 'timelox',
      title: 'Timelox',
      url: 'https://timelox-website.vercel.app/',
      description: `A sleek, modern website for a time management application. The design emphasizes productivity and efficiency with a clean interface and subtle animations.`,
      technologies: ['Vue.js', 'Nuxt.js', 'SCSS', 'Firebase'],
      features: ['Feature Tours', 'Pricing Plans', 'User Testimonials', 'Blog Section'],
      imageUrl: '/timelox.png',
      color: '#FF6600'
    }
  ];
  
  
  const prevProject = () => {
    setIsImageLoading(true);
    setIframeLoading(true);
    setShowIframe(false);
    setCurrentProject((prev) => (prev - 1 + websiteProjects.length) % websiteProjects.length);
  };
  
  const project = websiteProjects[currentProject];

  // Reset iframe loading state when project changes
  useEffect(() => {
    setIframeLoading(true);
    setShowIframe(false);
  }, [currentProject]);
  
  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="bg-[#1a1a1a] rounded-lg border border-gray-800 w-full max-w-5xl max-h-[90vh] overflow-auto"
        style={isMobile ? { width: '100%', height: '100%', maxHeight: '100vh', borderRadius: 0 } : {}}
        initial={isMobile ? 
          { opacity: 0 } : 
          { scale: 0.9, opacity: 0 }
        }
        animate={isMobile ? 
          { opacity: 1 } : 
          { scale: 1, opacity: 1 }
        }
        exit={isMobile ? 
          { opacity: 0 } : 
          { scale: 0.9, opacity: 0 }
        }
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className={`${typography.fontSize['2xl']} ${typography.fontFamily.light} ${typography.tracking.tight} text-white`}>
            Websites
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {websiteProjects.map((project) => (
              <a
                key={project.id}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-black/30 border border-gray-800 rounded-lg overflow-hidden hover:border-blue-400 transition-colors shadow-lg"
                style={{ textDecoration: 'none' }}
              >
                <div className="relative aspect-video bg-black/50 flex items-center justify-center">
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-200"
                  />
                </div>
                <div className="p-2 text-center" style={{ minHeight: 0 }}>
                  <h3
                    className={`${typography.fontSize.lg} ${typography.fontFamily.light} ${typography.tracking.tight}`}
                    style={{ color: colors.primary.blue, margin: 0, padding: 0 }}
                  >
                    {project.title}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        </div>
        <div className="p-6 border-t border-gray-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-black rounded-md transition-colors duration-300 text-sm font-light tracking-tight"
            style={{ 
              backgroundColor: buttonColor,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = `${buttonColor}dd`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = buttonColor;
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WebDesignWorkPopup;