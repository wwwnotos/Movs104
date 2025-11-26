import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Bookmark, ChevronLeft, Loader2, ExternalLink, Users, Star, ImageOff } from 'lucide-react';
import { MediaItem } from '../types';

interface DetailModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleSave: (item: MediaItem) => void;
  isSaved: boolean;
}

const DetailModal: React.FC<DetailModalProps> = ({ item, isOpen, onClose, onToggleSave, isSaved }) => {
  const [showTrailer, setShowTrailer] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hasImageError, setHasImageError] = useState(false);
  
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (item) {
      setHasImageError(false);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  // Function to lock orientation to landscape and enter fullscreen
  const handleEnterFullscreen = async () => {
    // Wait for state to update and DOM to render
    setTimeout(async () => {
        const elem = playerContainerRef.current as any;
        if (!elem) return;

        // 1. Request Fullscreen
        try {
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) { /* Safari */
                await elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) { /* IE11 */
                await elem.msRequestFullscreen();
            }
        } catch (err) {
            console.log("Error attempting to enable fullscreen:", err);
        }

        // 2. Lock Orientation (Android/Chrome mainly)
        // iOS Safari does not support screen.orientation.lock via JS API
        try {
            if (screen.orientation && (screen.orientation as any).lock) {
                await (screen.orientation as any).lock('landscape');
            }
        } catch (err) {
            console.log("Orientation lock not supported or denied:", err);
        }
    }, 100);
  };

  // Function to exit fullscreen and unlock orientation
  const handleExitFullscreen = async () => {
    // 1. Unlock Orientation
    try {
        if (screen.orientation && (screen.orientation as any).unlock) {
            (screen.orientation as any).unlock();
        }
    } catch (err) {
        console.log("Orientation unlock error:", err);
    }

    // 2. Exit Fullscreen
    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else if ((document as any).webkitFullscreenElement) {
            await (document as any).webkitExitFullscreen();
        }
    } catch (err) {
        console.log("Error attempting to exit fullscreen:", err);
    }
  };

  // Close handler specifically for the video player
  const closePlayer = () => {
      handleExitFullscreen();
      setShowTrailer(false);
      setIsVideoLoaded(false);
  };

  // Construct robust YouTube Embed URL
  const getEmbedUrl = (key: string, isSearch: boolean = false) => {
    const baseUrl = 'https://www.youtube.com/embed';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    
    // Common parameters
    const params = new URLSearchParams({
      // Disable autoplay for search embeds on mobile to prevent "Video Unavailable" or playback failures
      autoplay: isSearch ? '0' : '1', 
      playsinline: '1',
      rel: '0',
    });

    // Only append origin if it's valid
    if (origin && origin !== 'null') {
       params.append('origin', origin);
    }

    if (isSearch) {
      // "Another Way": Use the listType=search functionality
      // This loads a player searching for the string provided in `key`
      params.append('listType', 'search');
      params.append('list', key);
      return `${baseUrl}?${params.toString()}`;
    } else {
      // Standard ID based embed
      return `${baseUrl}/${key}?${params.toString()}`;
    }
  };

  const handleSubmitRating = () => {
      // Here you would typically send the rating to a backend
      setShowRatingModal(false);
  };

  return (
    <>
      {/* RATING MODAL OVERLAY */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRatingModal(false)} />
            <div className="relative bg-white dark:bg-[#1C1C1E] w-full max-w-sm rounded-3xl p-6 shadow-2xl scale-100 animate-spring-up border border-white/10 text-center">
                <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Rate this title</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">What did you think of {item.title}?</p>
                
                <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setUserRating(star)}
                            className="p-1 transition-transform hover:scale-110 active:scale-90 focus:outline-none"
                        >
                            <Star 
                                size={36} 
                                className={`${star <= userRating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 dark:fill-gray-800 text-gray-200 dark:text-gray-700'}`} 
                                strokeWidth={star <= userRating ? 0 : 1.5}
                            />
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                  <button 
                      onClick={() => setShowRatingModal(false)}
                      className="flex-1 py-3.5 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                      Cancel
                  </button>
                  <button 
                      onClick={handleSubmitRating}
                      className="flex-1 py-3.5 rounded-2xl bg-[#007AFF] text-white font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
                  >
                      Submit
                  </button>
                </div>
            </div>
        </div>
      )}

      {/* Light & Simple Video Player Overlay */}
      {showTrailer && item.trailerKey && (
        <div 
            ref={playerContainerRef}
            className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300"
        >
             
             {/* Close Button - Absolute to remain visible in fullscreen, respects safe area */}
             <button 
                onClick={closePlayer}
                className="absolute top-6 right-6 pt-safe w-12 h-12 box-content rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors z-50"
             >
                <X size={32} />
             </button>
             
             {/* Player Container */}
             <div className="w-full h-full relative flex items-center justify-center bg-black">
                 
                 {/* Loading Spinner */}
                 {!isVideoLoaded && (
                     <div className="absolute inset-0 flex items-center justify-center z-10">
                         <Loader2 className="animate-spin text-white/50" size={48} />
                     </div>
                 )}

                 <iframe 
                    src={getEmbedUrl(item.trailerKey, item.isSearchEmbed)}
                    title="Trailer" 
                    onLoad={() => setIsVideoLoaded(true)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    className={`w-full h-full md:max-w-5xl md:aspect-video md:h-auto transition-opacity duration-500 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
                 ></iframe>
             </div>

             {/* Fallback Link - Only shown if not fullscreen or on large screens */}
             <a 
                href={item.trailerUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(item.title + ' trailer')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-10 flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full backdrop-blur-md transition-colors z-40 font-medium pb-safe"
             >
                <ExternalLink size={18} />
                <span>Watch on YouTube</span>
             </a>
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500 animate-in fade-in" 
          onClick={onClose}
        />

        {/* Main Container */}
        <div className="relative w-full h-[95vh] bg-white dark:bg-[#1C1C1E] rounded-t-[40px] shadow-2xl overflow-hidden animate-spring-up flex flex-col md:max-w-2xl md:h-[90vh] md:rounded-[40px] md:mb-6 border-t border-transparent dark:border-white/10">
          
          {/* Top Header Image */}
          <div className="relative h-[55%] w-full shrink-0 bg-gray-900">
            {!hasImageError ? (
                <img 
                  key={item.posterUrl}
                  src={item.posterUrl}
                  alt={item.title} 
                  className="w-full h-full object-cover"
                  onError={() => setHasImageError(true)}
                  referrerPolicy="no-referrer"
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
                    <ImageOff size={48} className="mb-2 opacity-50" />
                    <span className="text-sm font-medium">Image not available</span>
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 dark:to-[#1C1C1E]" />
            
            {/* Glass Icon Buttons - Added pt-safe for Notch support */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10 pt-safe">
              <button 
                  onClick={onClose}
                  className="glass-button w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors active:scale-95"
              >
                  <ChevronLeft size={32} />
              </button>
              
              {/* RATE BUTTON */}
              <button 
                  onClick={() => setShowRatingModal(true)}
                  className={`glass-button w-12 h-12 rounded-full flex items-center justify-center transition-colors active:scale-95 ${userRating > 0 ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400' : 'text-white hover:bg-white/40'}`}
              >
                  <Star size={24} className={userRating > 0 ? "fill-yellow-400" : ""} />
              </button>
            </div>
          </div>

          {/* Floating Info Card */}
          <div className="relative -mt-20 flex-1 bg-white dark:bg-[#1C1C1E] rounded-t-[40px] px-8 pt-14 pb-10 overflow-y-auto no-scrollbar shadow-float">
              {/* Handle Bar */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />

              {/* Title & Metadata */}
              <div className="text-center mb-8">
                  <h1 className="text-4xl md:text-5xl font-extrabold text-black dark:text-white mb-4 tracking-tight leading-none">{item.title}</h1>
                  <div className="flex items-center justify-center gap-3 text-base text-gray-500 dark:text-gray-400 font-semibold">
                      <span>{item.year}</span>
                      <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                      <span>{item.genre[0]}</span>
                      <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                      <span>{item.duration || '2h 15m'}</span>
                  </div>
              </div>

              {/* Rating Badges */}
              <div className="flex justify-center gap-5 mb-10">
                  <div className="flex items-center gap-2.5 bg-yellow-50 dark:bg-yellow-900/20 px-5 py-2.5 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
                      <span className="bg-[#F5C518] text-black text-xs font-bold px-1.5 py-0.5 rounded">IMDb</span>
                      <span className="text-black dark:text-white font-bold text-lg">{item.rating}</span>
                      <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">/10</span>
                  </div>
                  
                  {/* Updated User Rating Badge */}
                  {item.appRating && (
                      <div className="flex items-center gap-2.5 bg-blue-50 dark:bg-blue-900/20 px-5 py-2.5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                          <Users size={20} className="text-[#007AFF] fill-current" />
                          <span className="text-black dark:text-white font-bold text-lg">
                            {userRating > 0 ? userRating : item.appRating}
                          </span>
                          <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">/5</span>
                      </div>
                  )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-5 mb-10">
                  {/* Primary Button - TRAILER */}
                  <button 
                      onClick={() => {
                          if (item.trailerKey) {
                              setShowTrailer(true);
                              handleEnterFullscreen();
                          } else if (item.trailerUrl) {
                              window.open(item.trailerUrl, '_blank');
                          }
                      }}
                      className="flex-1 bg-[#007AFF] hover:bg-blue-600 active:scale-[0.98] text-white font-bold text-lg py-5 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/30"
                  >
                      <Play fill="currentColor" size={20} />
                      Watch Trailer
                  </button>
                  
                  {/* Secondary Button */}
                  <button 
                      onClick={() => onToggleSave(item)}
                      className={`flex-1 font-bold text-lg py-5 rounded-3xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] border ${
                          isSaved 
                          ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white border-gray-200 dark:border-gray-700' 
                          : 'bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] text-black dark:text-white border-transparent'
                      }`}
                  >
                      <Bookmark fill={isSaved ? "currentColor" : "none"} size={22} />
                      {isSaved ? 'Saved' : 'Save'}
                  </button>
              </div>

              {/* Plot */}
              <div className="space-y-10 pb-safe">
                  <section>
                      <h3 className="text-2xl font-bold text-black dark:text-white mb-4">Plot Summary</h3>
                      <p className="text-gray-500 dark:text-gray-400 leading-8 text-lg font-normal">
                          {item.description}
                      </p>
                  </section>

                  {/* Cast */}
                  {item.cast && item.cast.length > 0 && (
                      <section>
                          <h3 className="text-2xl font-bold text-black dark:text-white mb-5">Top Cast</h3>
                          <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                              {item.cast.map((actor, idx) => (
                                  <div key={idx} className="flex flex-col items-center gap-3 min-w-[84px]">
                                      <div className="w-20 h-20 rounded-full overflow-hidden shadow-md border-2 border-white dark:border-gray-700 bg-gray-200 dark:bg-gray-800">
                                          <img src={actor.image} alt={actor.name} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="text-center">
                                          <div className="text-sm font-bold text-black dark:text-white line-clamp-1">{actor.name}</div>
                                          <div className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{actor.role}</div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </section>
                  )}
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DetailModal;