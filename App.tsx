
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import MediaCard from './components/MediaCard';
import DetailModal from './components/DetailModal';
import SplashScreen from './components/SplashScreen';
import AuthScreen from './components/AuthScreen';
import { MediaItem, ViewState, User } from './types';
import { fetchTrending, fetchPopular, searchMedia, fetchMediaDetails, fetchNowPlaying, fetchMediaByGenre, fetchTopRated, fetchLatestTV, fetchNewReleases } from './services/tmdbService';
import { authService } from './services/authService';
import { Search, Loader2, Bookmark, Settings, HelpCircle, Shield, ChevronRight, ChevronLeft, ArrowDown, X, Zap, Smile, Rocket, Drama, Ghost, Heart, Eye, Sparkles, Command, Star, LayoutGrid, List, Sun, Moon, Check, User as UserIcon, Mail, Calendar, Edit2, LogOut, Bell, Lock, History, Clock } from 'lucide-react';

// Added TMDB Genre IDs and Icons with Arabic Names
const CATEGORIES = [
  { name: 'Action', arName: 'أكشن', keywords: ['action', 'اكشن', 'أكشن', 'قتال', 'حركة'], id: 28, gradient: 'from-orange-500 to-red-600', icon: Zap },
  { name: 'Comedy', arName: 'كوميديا', keywords: ['comedy', 'كوميديا', 'مضحك', 'ضحك'], id: 35, gradient: 'from-yellow-400 to-orange-500', icon: Smile },
  { name: 'Sci-Fi', arName: 'خيال علمي', keywords: ['sci-fi', 'scifi', 'science fiction', 'خيال', 'خيال علمي', 'فضاء'], id: 878, gradient: 'from-blue-500 to-purple-600', icon: Rocket },
  { name: 'Drama', arName: 'دراما', keywords: ['drama', 'دراما', 'حزين', 'قصة'], id: 18, gradient: 'from-purple-500 to-pink-600', icon: Drama },
  { name: 'Horror', arName: 'رعب', keywords: ['horror', 'رعب', 'خوف', 'مرعب'], id: 27, gradient: 'from-gray-800 to-gray-900', icon: Ghost },
  { name: 'Romance', arName: 'رومانسية', keywords: ['romance', 'love', 'رومانسية', 'حب', 'عشق'], id: 10749, gradient: 'from-pink-400 to-rose-500', icon: Heart },
  { name: 'Thriller', arName: 'إثارة', keywords: ['thriller', 'suspense', 'إثارة', 'تشويق', 'غموض'], id: 53, gradient: 'from-slate-700 to-slate-600', icon: Eye },
  { name: 'Fantasy', arName: 'فانتازيا', keywords: ['fantasy', 'فانتازيا', 'خيال', 'سحر'], id: 14, gradient: 'from-indigo-500 to-violet-600', icon: Sparkles },
];

// Profile Sub-Views Type
type ProfileView = 'main' | 'edit' | 'settings' | 'privacy' | 'help';
type AppState = 'splash' | 'auth' | 'app';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('splash');
  const [activeTab, setActiveTab] = useState<ViewState>('home');
  const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');
  const tabOrder: ViewState[] = ['home', 'search', 'saved', 'profile'];
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedItems, setSavedItems] = useState<MediaItem[]>([]);
  const [recentItems, setRecentItems] = useState<MediaItem[]>([]); 
  const [savedViewMode, setSavedViewMode] = useState<'grid' | 'list'>('list');
  
  // Notification State
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'info' }>({ show: false, message: '', type: 'success' });
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // See All State
  const [seeAllState, setSeeAllState] = useState<{ 
    title: string; 
    items: MediaItem[]; 
    source: 'mixed_releases' | 'trending' | 'latest_movies' | 'latest_tv' | 'top_rated';
    page: number;
  } | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showLoadMore, setShowLoadMore] = useState(false);
  
  // Data State
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [mixedReleases, setMixedReleases] = useState<MediaItem[]>([]); // New Mixed (Movie + TV)
  const [latestMovies, setLatestMovies] = useState<MediaItem[]>([]); // Movies Only
  const [latestTV, setLatestTV] = useState<MediaItem[]>([]); // TV Only
  const [topRated, setTopRated] = useState<MediaItem[]>([]);
  
  const [isLoadingHome, setIsLoadingHome] = useState(true);
  const dataLoadedRef = useRef(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mediaSuggestions, setMediaSuggestions] = useState<MediaItem[]>([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // New Search Pagination State
  const [searchPage, setSearchPage] = useState(1);
  const [showSearchLoadMore, setShowSearchLoadMore] = useState(false);
  const [isLoadingSearchMore, setIsLoadingSearchMore] = useState(false);

  // Genre/Discover State (Integrated into Search)
  const [selectedGenre, setSelectedGenre] = useState<{id: number, name: string, arName: string} | null>(null);
  const [genreItems, setGenreItems] = useState<MediaItem[]>([]);
  const [isGenreLoading, setIsGenreLoading] = useState(false);
  const [genrePage, setGenrePage] = useState(1);
  const [showGenreLoadMore, setShowGenreLoadMore] = useState(false);

  // --- PROFILE STATE ---
  const [profileView, setProfileView] = useState<ProfileView>('main');
  const [user, setUser] = useState<User>({
    name: '',
    email: '',
    joined: ''
  });
  const [tempUser, setTempUser] = useState<User>(user); 

  // --- SPLASH & AUTH EFFECT ---
  useEffect(() => {
    // 1. Show Splash for 2.5 seconds (matches animation)
    const splashTimer = setTimeout(() => {
      // 2. Check Auth
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setTempUser(currentUser);
        setAppState('app');
        if (!dataLoadedRef.current) {
            loadHomeData();
            dataLoadedRef.current = true;
        }
      } else {
        setAppState('auth');
      }
    }, 2800);

    // Load Search History
    const savedHistory = localStorage.getItem('MOVOS_SEARCH_HISTORY');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) { console.error("Error parsing history", e); }
    }

    return () => clearTimeout(splashTimer);
  }, []);

  const loadHomeData = async () => {
      setIsLoadingHome(true);
      try {
        const results = await Promise.allSettled([
          fetchTrending(),
          fetchNewReleases(), // Latest Mixed
          fetchNowPlaying(),  // Latest Movies
          fetchLatestTV(),    // Latest TV
          fetchTopRated()
        ]);

        const getResult = (res: PromiseSettledResult<MediaItem[]>) => res.status === 'fulfilled' ? res.value : [];

        const trendingData = getResult(results[0]);
        const mixedData = getResult(results[1]);
        const moviesData = getResult(results[2]);
        const tvData = getResult(results[3]);
        const topRatedData = getResult(results[4]);

        setTrending(trendingData);
        setMixedReleases(mixedData);
        setLatestMovies(moviesData);
        setLatestTV(tvData);
        setTopRated(topRatedData);

        // --- CHECK FOR NEW CONTENT SINCE LAST VISIT ---
        const lastVisit = localStorage.getItem('MOVOS_LAST_VISIT');
        const now = new Date().toISOString();

        if (lastVisit) {
            const lastVisitDate = new Date(lastVisit);
            let newContentCount = 0;
            const allLatest = [...mixedData];
            
            allLatest.forEach(item => {
                if (item.releaseDate) {
                    const releaseDate = new Date(item.releaseDate);
                    if (releaseDate > lastVisitDate) {
                        newContentCount++;
                    }
                }
            });

            if (newContentCount > 0) {
                 setTimeout(() => {
                    showNotificationFunc(`✨ ${newContentCount} new titles added since your last visit!`, 'info');
                 }, 1000);
            }
        }
        
        localStorage.setItem('MOVOS_LAST_VISIT', now);
        
        // Load Recently Viewed History
        const savedHistory = localStorage.getItem('MOVOS_RECENT');
        if (savedHistory) {
            setRecentItems(JSON.parse(savedHistory));
        }

      } catch (e) {
        console.error("Failed to load home data", e);
      } finally {
        setIsLoadingHome(false);
      }
  };

  const showNotificationFunc = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ show: true, message, type });
    notificationTimeoutRef.current = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  // Scroll Listener for Load More Button (See All, Genre, & Search)
  useEffect(() => {
    if (seeAllState) {
       const handleScroll = () => {
           const scrollTop = window.scrollY;
           const windowHeight = window.innerHeight;
           const docHeight = document.documentElement.scrollHeight;
           if (scrollTop + windowHeight >= docHeight - 300) {
               setShowLoadMore(true);
           } else {
               setShowLoadMore(false);
           }
       };
       window.addEventListener('scroll', handleScroll);
       handleScroll();
       return () => window.removeEventListener('scroll', handleScroll);
    } 
    else if (activeTab === 'search' && selectedGenre) {
       const handleScrollGenre = () => {
           const scrollTop = window.scrollY;
           const windowHeight = window.innerHeight;
           const docHeight = document.documentElement.scrollHeight;
           if (scrollTop + windowHeight >= docHeight - 300) {
               setShowGenreLoadMore(true);
           } else {
               setShowGenreLoadMore(false);
           }
       };
       window.addEventListener('scroll', handleScrollGenre);
       handleScrollGenre();
       return () => window.removeEventListener('scroll', handleScrollGenre);
    }
    else if (activeTab === 'search' && !selectedGenre && searchResults.length > 0) {
       const handleScrollSearch = () => {
           const scrollTop = window.scrollY;
           const windowHeight = window.innerHeight;
           const docHeight = document.documentElement.scrollHeight;
           if (scrollTop + windowHeight >= docHeight - 300) {
               setShowSearchLoadMore(true);
           } else {
               setShowSearchLoadMore(false);
           }
       };
       window.addEventListener('scroll', handleScrollSearch);
       handleScrollSearch();
       return () => window.removeEventListener('scroll', handleScrollSearch);
    }
    else {
        setShowLoadMore(false);
        setShowGenreLoadMore(false);
        setShowSearchLoadMore(false);
    }
  }, [seeAllState, activeTab, selectedGenre, searchResults]);

  // Debounce Search for Media Suggestions
  useEffect(() => {
    const fetchMediaSuggestions = async () => {
      if (searchQuery.trim().length > 1) {
        try {
          const results = await searchMedia(searchQuery);
          setMediaSuggestions(results.slice(0, 4)); 
        } catch (e) {
          console.error("Error fetching media suggestions", e);
          setMediaSuggestions([]);
        }
      } else {
        setMediaSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchMediaSuggestions, 400); 
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const addToHistory = (item: MediaItem) => {
    setRecentItems(prev => {
        const updated = [item, ...prev.filter(i => i.id !== item.id)].slice(0, 30);
        localStorage.setItem('MOVOS_RECENT', JSON.stringify(updated));
        return updated;
    });
  };

  const saveSearchToHistory = (query: string) => {
    setSearchHistory(prev => {
      const cleanQuery = query.trim();
      const filtered = prev.filter(q => q.toLowerCase() !== cleanQuery.toLowerCase());
      const newHistory = [cleanQuery, ...filtered].slice(0, 5); // Keep last 5
      localStorage.setItem('MOVOS_SEARCH_HISTORY', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const removeHistoryItem = (e: React.MouseEvent, itemToRemove: string) => {
    e.stopPropagation();
    setSearchHistory(prev => {
      const newHistory = prev.filter(item => item !== itemToRemove);
      localStorage.setItem('MOVOS_SEARCH_HISTORY', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const handleMediaClick = useCallback(async (item: MediaItem) => {
    setSelectedMedia(item);
    setIsModalOpen(true);
    setShowSuggestions(false);
    setIsSearchFocused(false);
    addToHistory(item);
    const fullDetails = await fetchMediaDetails(item.id, item.type);
    if (fullDetails) {
      setSelectedMedia(fullDetails);
    }
  }, []);

  const handleToggleSave = useCallback((item: MediaItem) => {
    setSavedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        showNotificationFunc("Removed from Saved list", 'info');
        return prev.filter(i => i.id !== item.id);
      }
      showNotificationFunc("Saved in Saved List", 'success');
      return [...prev, item];
    });
  }, [showNotificationFunc]);

  const handleTabChange = useCallback((newTab: ViewState) => {
    setActiveTab(prev => {
        if (newTab === prev) return prev;
        const currentIndex = tabOrder.indexOf(prev);
        const newIndex = tabOrder.indexOf(newTab);
        setSlideDirection(newIndex > currentIndex ? 'right' : 'left');
        
        setSeeAllState(null);
        setProfileView('main'); 
        window.scrollTo({ top: 0, behavior: 'instant' });
        return newTab;
    });
  }, []);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setMediaSuggestions([]);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    setIsSearchFocused(false);
    
    if (!searchQuery.trim()) return;

    saveSearchToHistory(searchQuery);

    setIsSearching(true);
    setSearchPage(1); // Reset page on new search
    const results = await searchMedia(searchQuery, 1);
    setSearchResults(results);
    setIsSearching(false);
    if (searchInputRef.current) searchInputRef.current.blur();
  };

  const handleLoadMoreSearch = async () => {
    if (isLoadingSearchMore) return;
    setIsLoadingSearchMore(true);
    const nextPage = searchPage + 1;
    try {
        const newItems = await searchMedia(searchQuery, nextPage);
        setSearchResults(prev => [...prev, ...newItems]);
        setSearchPage(nextPage);
    } catch (e) {
        console.error("Error loading more search results", e);
    } finally {
        setIsLoadingSearchMore(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSuggestions(false);
    setSearchPage(1);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const handleHistoryClick = (term: string) => {
    setSearchQuery(term);
    // Directly trigger search logic
    setIsSearching(true);
    setShowSuggestions(false);
    setIsSearchFocused(false);
    searchMedia(term, 1).then(results => {
        setSearchResults(results);
        setIsSearching(false);
    });
  };

  const handleSeeAll = (title: string, items: MediaItem[], source: 'mixed_releases' | 'trending' | 'latest_movies' | 'latest_tv' | 'top_rated') => {
    setSeeAllState({ title, items, source, page: 1 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromSeeAll = () => {
    setSeeAllState(null);
  };

  const handleLoadMore = async () => {
    if (!seeAllState || isLoadingMore) return;
    setIsLoadingMore(true);
    const nextPage = seeAllState.page + 1;
    let newItems: MediaItem[] = [];

    try {
      switch (seeAllState.source) {
        case 'trending': newItems = await fetchTrending(nextPage); break;
        case 'mixed_releases': newItems = await fetchNewReleases(nextPage); break;
        case 'latest_movies': newItems = await fetchNowPlaying(nextPage); break;
        case 'latest_tv': newItems = await fetchLatestTV(nextPage); break;
        case 'top_rated': newItems = await fetchTopRated(nextPage); break;
      }
      
      setSeeAllState(prev => prev ? ({
        ...prev,
        items: [...prev.items, ...newItems],
        page: nextPage
      }) : null);

    } catch (e) {
      console.error("Error loading more items", e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // --- Genre/Category Logic ---
  const handleCategorySelect = async (category: typeof CATEGORIES[0]) => {
    setSelectedGenre(category);
    setIsGenreLoading(true);
    setGenrePage(1); 
    if (activeTab !== 'search') { setActiveTab('search'); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
        const items = await fetchMediaByGenre(category.id, 'movie', 1);
        setGenreItems(items);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenreLoading(false);
    }
  };

  const handleLoadMoreGenre = async () => {
    if (!selectedGenre || isGenreLoading) return;
    setIsGenreLoading(true);
    const nextPage = genrePage + 1;
    try {
        const newItems = await fetchMediaByGenre(selectedGenre.id, 'movie', nextPage);
        setGenreItems(prev => [...prev, ...newItems]);
        setGenrePage(nextPage);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenreLoading(false);
    }
  };

  const handleBackFromGenre = () => {
    setSelectedGenre(null);
    setGenreItems([]);
    setGenrePage(1);
  };

  // --- Profile Logic ---
  const handleSaveProfile = () => {
      setUser(tempUser);
      localStorage.setItem('MOVOS_USER', JSON.stringify(tempUser));
      setProfileView('main');
      showNotificationFunc("Profile updated successfully!");
  };

  const handleSignOut = () => {
      authService.logout();
      setUser({ name: '', email: '', joined: '' });
      setRecentItems([]);
      setProfileView('main');
      setAppState('auth'); // Go back to auth screen
      dataLoadedRef.current = false; // Reset data loaded flag
  };

  const handleAuthSuccess = (loggedInUser: User) => {
      setUser(loggedInUser);
      setTempUser(loggedInUser);
      setAppState('app');
      if (!dataLoadedRef.current) {
          loadHomeData();
          dataLoadedRef.current = true;
      }
  };

  const SectionHeader = ({ title, onSeeAll }: { title: string, onSeeAll: () => void }) => (
    <div className="px-6 mb-5 flex items-center justify-between">
      <h2 className="text-2xl font-bold text-black dark:text-white tracking-tight">{title}</h2>
      <button 
        onClick={onSeeAll}
        className="glass-button px-4 py-1.5 rounded-full text-[#007AFF] text-xs font-bold tracking-wide shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] border border-white/30 dark:border-white/10 bg-gradient-to-b from-white/80 to-white/40 dark:from-white/10 dark:to-white/5 backdrop-blur-md active:scale-95 transition-transform hover:shadow-md"
      >
        See All
      </button>
    </div>
  );

  // --- RENDER LOGIC ---

  if (appState === 'splash') {
    return <SplashScreen />;
  }

  if (appState === 'auth') {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // --- MAIN APP ---
  return (
    <div className={`${isDarkMode ? 'dark' : ''} transition-colors duration-500`}>
    <div className="min-h-screen font-sans bg-[#F2F2F7] dark:bg-black transition-colors duration-500 overflow-hidden">
      
      {/* Toast Notification */}
      <div 
         className={`fixed top-12 left-1/2 -translate-x-1/2 z-[80] transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1) ${
            notification.show ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none'
         }`}
      >
          <div className="glass-nav px-6 py-3 rounded-full shadow-2xl border border-white/40 dark:border-white/10 flex items-center gap-3 backdrop-blur-xl">
             <div className={`w-6 h-6 rounded-full flex items-center justify-center ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                 <Check size={14} strokeWidth={4} />
             </div>
             <span className="text-black dark:text-white font-bold text-sm tracking-wide shadow-black/10 drop-shadow-sm">
                {notification.message}
             </span>
          </div>
      </div>

      <main className="max-w-3xl mx-auto relative h-screen">
        
        {/* Animated Page Container */}
        <div 
            key={activeTab} 
            className={`w-full h-full ${activeTab === 'profile' ? '' : 'overflow-y-auto pb-28'} ${slideDirection === 'right' ? 'slide-in-right' : 'slide-in-left'}`}
        >

        {/* HOME VIEW */}
        {activeTab === 'home' && (
          seeAllState ? (
            // SEE ALL VIEW (Unchanged logic)
            <div className="animate-in slide-in-from-right duration-300">
               <div className="sticky top-6 z-40 px-6 mb-6 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="glass-nav pointer-events-auto inline-flex pl-2 pr-6 py-2 rounded-full items-center gap-3 shadow-float border border-white/40 dark:border-white/10 min-w-[200px] justify-center">
                      <button 
                          onClick={handleBackFromSeeAll}
                          className="w-10 h-10 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center hover:bg-white dark:hover:bg-white/20 transition-colors active:scale-90 text-[#007AFF] shadow-sm"
                      >
                        <ChevronLeft size={24} strokeWidth={2.5} />
                      </button>
                      <span className="text-lg font-bold text-black dark:text-white pr-2 whitespace-nowrap">{seeAllState.title}</span>
                  </div>
               </div>
               
               <div className="px-6 grid grid-cols-2 md:grid-cols-3 gap-4 pb-32">
                  {seeAllState.items.map((item, index) => (
                     <MediaCard 
                       key={`${item.id}-${index}`} 
                       item={item} 
                       onClick={handleMediaClick} 
                       variant="poster" 
                     />
                  ))}
               </div>

               <div className={`fixed bottom-10 left-0 right-0 z-50 flex justify-center transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${
                   showLoadMore ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'
               }`}>
                  <button 
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="glass-nav px-8 py-3 rounded-[32px] shadow-float border border-white/40 dark:border-white/10 flex items-center gap-3 text-[#007AFF] font-bold text-lg active:scale-95 transition-all hover:bg-white/80 dark:hover:bg-white/10"
                  >
                    {isLoadingMore ? <Loader2 className="animate-spin" size={24} /> : <>Load More <ArrowDown size={24} strokeWidth={2.5} /></>}
                  </button>
               </div>
            </div>
          ) : (
            // MAIN HOME FEED
            <div>
              
              {/* Header with Subtitle */}
              <header className="px-6 pt-12 pb-6 flex justify-between items-start">
                <div className="flex flex-col">
                    <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#007AFF] via-[#5AC8FA] to-[#007AFF] animate-gradient-x inline-block">
                    MOVOS
                    </h1>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mt-1">
                    مكتبتك للأفلام والمسلسلات
                    </p>
                </div>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)} 
                  className="glass-button w-10 h-10 rounded-full flex items-center justify-center text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:scale-95 mt-1"
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </header>

              {isLoadingHome ? (
                <div className="flex justify-center items-center h-60 pt-20">
                  <Loader2 className="animate-spin text-[#007AFF]" size={32} />
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Sections Reordered: Trending, Releases, Movies, TV, Top Rated */}
                  <section>
                    <SectionHeader title="Trending Now" onSeeAll={() => handleSeeAll("Trending Now", trending, 'trending')} />
                    <div className="flex gap-5 overflow-x-auto px-6 pb-8 no-scrollbar snap-x scroll-pl-6">
                      {trending.map((item) => <MediaCard key={`trending-${item.id}`} item={item} onClick={handleMediaClick} variant="featured" className="w-[200px] snap-start"/>)}
                    </div>
                  </section>
                  <section>
                     <SectionHeader title="Latest Releases" onSeeAll={() => handleSeeAll("Latest Releases", mixedReleases, 'mixed_releases')} />
                     <div className="flex gap-4 overflow-x-auto px-6 pb-6 no-scrollbar snap-x scroll-pl-6">
                       {mixedReleases.map((item) => <MediaCard key={`mixed-${item.id}`} item={item} onClick={handleMediaClick} variant="poster" className="w-[140px] snap-start"/>)}
                     </div>
                  </section>
                  <section>
                     <SectionHeader title="Latest Movies" onSeeAll={() => handleSeeAll("Latest Movies", latestMovies, 'latest_movies')} />
                     <div className="flex gap-4 overflow-x-auto px-6 pb-6 no-scrollbar snap-x scroll-pl-6">
                       {latestMovies.map((item) => <MediaCard key={`latest-movie-${item.id}`} item={item} onClick={handleMediaClick} variant="poster" className="w-[140px] snap-start"/>)}
                     </div>
                  </section>
                  <section>
                     <SectionHeader title="Latest TV Shows" onSeeAll={() => handleSeeAll("Latest TV Shows", latestTV, 'latest_tv')} />
                     <div className="flex gap-4 overflow-x-auto px-6 pb-6 no-scrollbar snap-x scroll-pl-6">
                       {latestTV.map((item) => <MediaCard key={`latest-tv-${item.id}`} item={item} onClick={handleMediaClick} variant="poster" className="w-[140px] snap-start"/>)}
                     </div>
                  </section>
                  <section>
                     <SectionHeader title="Top Rated" onSeeAll={() => handleSeeAll("Top Rated", topRated, 'top_rated')} />
                     <div className="flex gap-4 overflow-x-auto px-6 pb-6 no-scrollbar snap-x scroll-pl-6">
                       {topRated.map((item) => <MediaCard key={`top-${item.id}`} item={item} onClick={handleMediaClick} variant="poster" className="w-[140px] snap-start"/>)}
                     </div>
                  </section>
                </div>
              )}
            </div>
          )
        )}

        {/* SEARCH VIEW */}
        {activeTab === 'search' && (
          selectedGenre ? (
            <div className="animate-in slide-in-from-right duration-300">
               <div className="sticky top-6 z-40 px-6 mb-6 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="glass-nav pointer-events-auto inline-flex pl-2 pr-6 py-2 rounded-full items-center gap-3 shadow-float border border-white/40 dark:border-white/10 min-w-[200px] justify-center bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md">
                      <button onClick={handleBackFromGenre} className="w-10 h-10 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center hover:bg-white dark:hover:bg-white/20 transition-colors active:scale-90 text-[#007AFF] shadow-sm"><ChevronLeft size={24} strokeWidth={2.5} /></button>
                      <span className="text-lg font-bold text-black dark:text-white pr-2 whitespace-nowrap">{selectedGenre.arName}</span>
                  </div>
               </div>
               {isGenreLoading && genrePage === 1 ? <div className="flex justify-center items-center h-60"><Loader2 className="animate-spin text-[#007AFF]" size={32} /></div> : (
                  <div className="px-6 grid grid-cols-2 md:grid-cols-3 gap-4 pb-32">
                      {genreItems.map((item, index) => <MediaCard key={`genre-${item.id}-${index}`} item={item} onClick={handleMediaClick} variant="poster" />)}
                  </div>
               )}
               <div className={`fixed bottom-10 left-0 right-0 z-50 flex justify-center transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${showGenreLoadMore ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}>
                  <button onClick={handleLoadMoreGenre} disabled={isGenreLoading} className="glass-nav px-8 py-3 rounded-[32px] shadow-float border border-white/40 dark:border-white/10 flex items-center gap-3 text-[#007AFF] font-bold text-lg active:scale-95 transition-all hover:bg-white/80 dark:hover:bg-white/10">
                    {isGenreLoading ? <Loader2 className="animate-spin" size={24} /> : <>Load More <ArrowDown size={24} strokeWidth={2.5} /></>}
                  </button>
               </div>
            </div>
          ) : (
            <div className="px-6 pt-12">
             <header className="sticky top-0 z-30 pt-4 pb-4 glass-header -mx-6 px-6 mb-4">
                <h1 className="text-4xl font-bold mb-5 text-black dark:text-white px-1">Search</h1>
                <form onSubmit={handleSearchSubmit} className="relative px-1">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      ref={searchInputRef} 
                      type="text" 
                      value={searchQuery} 
                      onChange={handleSearchInput} 
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                      placeholder="Search movies, genres..." 
                      className="w-full bg-white dark:bg-[#1C1C1E] text-black dark:text-white placeholder-gray-400 rounded-2xl py-4 pl-12 pr-12 text-lg font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all border border-transparent dark:border-white/10" 
                      autoComplete="off" 
                    />
                    {searchQuery && <button type="button" onClick={clearSearch} className="absolute right-5 top-1/2 -translate-y-1/2 p-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"><X size={16} /></button>}
                    
                    {/* Suggestions & History Dropdown */}
                    {(showSuggestions || (isSearchFocused && !searchQuery && searchHistory.length > 0)) && (
                      <div className="absolute top-full left-1 right-1 mt-2 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-float overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[60vh] overflow-y-auto">
                        
                        {/* Search History Section */}
                        {isSearchFocused && !searchQuery && searchHistory.length > 0 && (
                          <div className="py-2">
                             <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                               <span>Recent Searches</span>
                             </div>
                             {searchHistory.map((term, idx) => (
                                <button key={`hist-${idx}`} type="button" onClick={() => handleHistoryClick(term)} className="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between transition-colors group border-b border-gray-100 dark:border-gray-800 last:border-0">
                                   <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                     <Clock size={16} className="text-gray-400" />
                                     <span className="font-medium">{term}</span>
                                   </div>
                                   <div onClick={(e) => removeHistoryItem(e, term)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400">
                                      <X size={14} />
                                   </div>
                                </button>
                             ))}
                          </div>
                        )}

                        {/* Live Suggestions Section */}
                        {showSuggestions && mediaSuggestions.length > 0 && (
                           <div className="py-2">
                             <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Movies & TV</div>
                             {mediaSuggestions.map((item) => (
                                <button key={`suggest-${item.id}`} type="button" onClick={() => handleMediaClick(item)} className="w-full text-left px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-3 transition-colors group">
                                   <div className="w-10 h-14 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0 shadow-sm border border-gray-100 dark:border-gray-700"><img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" /></div>
                                   <div className="flex flex-col min-w-0"><span className="font-bold text-black dark:text-white text-sm truncate pr-4">{item.title}</span><div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><span>{item.year}</span><span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" /><div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500"><Star size={10} fill="currentColor" /><span>{item.rating}</span></div></div></div>
                                </button>
                             ))}
                           </div>
                        )}
                      </div>
                    )}
                </form>
             </header>
             <div className="mt-8">
                {isSearching ? <div className="flex flex-col items-center justify-center py-20 gap-3"><Loader2 className="animate-spin text-[#007AFF]" size={40} /><span className="text-gray-400 font-medium">Searching...</span></div> : (
                    <div className="grid grid-cols-2 gap-4 pb-24 px-1">
                        {searchResults.length > 0 ? (
                           <>
                             {searchResults.map((item, index) => <MediaCard key={`search-result-${item.id}-${index}`} item={item} onClick={handleMediaClick} variant="poster" />)}
                             <div className={`col-span-full fixed bottom-10 left-0 right-0 z-50 flex justify-center transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) ${showSearchLoadMore ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}>
                                <button onClick={handleLoadMoreSearch} disabled={isLoadingSearchMore} className="glass-nav px-8 py-3 rounded-[32px] shadow-float border border-white/40 dark:border-white/10 flex items-center gap-3 text-[#007AFF] font-bold text-lg active:scale-95 transition-all hover:bg-white/80 dark:hover:bg-white/10">
                                  {isLoadingSearchMore ? <Loader2 className="animate-spin" size={24} /> : <>Load More <ArrowDown size={24} strokeWidth={2.5} /></>}
                                </button>
                             </div>
                           </>
                        ) 
                        : searchQuery && !isSearching && !showSuggestions ? <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400"><Search size={64} className="mb-4 text-gray-200 dark:text-gray-700" /><p className="text-lg font-medium text-black dark:text-white">No results found</p><p className="text-sm">We couldn't find anything for "{searchQuery}".</p></div> 
                        : !searchQuery && (
                            <div className="col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-2 mb-4 px-1"><LayoutGrid size={20} className="text-[#007AFF]" /><h3 className="text-xl font-bold text-black dark:text-white">Browse Categories</h3></div>
                                <div className="grid grid-cols-2 gap-3 pb-24">
                                    {CATEGORIES.map(category => {
                                        const Icon = category.icon;
                                        return <button key={`search-cat-${category.name}`} onClick={() => handleCategorySelect(category)} className={`h-24 rounded-3xl bg-gradient-to-br ${category.gradient} p-4 flex flex-col justify-between shadow-sm hover:scale-[1.02] transition-transform active:scale-95 group relative overflow-hidden`}><div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" /><div className="absolute -right-3 -bottom-3 text-white/20 group-hover:text-white/30 transition-all duration-500 rotate-12 group-hover:rotate-0 group-hover:scale-110"><Icon size={64} strokeWidth={1.5} /></div><Icon size={20} className="text-white drop-shadow-md relative z-10" /><span className="text-white font-bold text-lg tracking-wide drop-shadow-md relative z-10 text-left">{category.arName}</span></button>;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
             </div>
          </div>
          )
        )}

        {/* SAVED VIEW */}
        {activeTab === 'saved' && (
             <div className="px-6 pt-12">
                <header className="sticky top-0 z-30 py-4 glass-header -mx-6 px-6 mb-6 flex justify-between items-center">
                  <h1 className="text-4xl font-bold text-black dark:text-white">Saved</h1>
                  <div className="flex bg-gray-200/80 dark:bg-white/10 p-1 rounded-xl shadow-inner">
                      <button onClick={() => setSavedViewMode('grid')} className={`p-2 rounded-lg transition-all ${savedViewMode === 'grid' ? 'bg-white dark:bg-[#1C1C1E] text-[#007AFF] shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><LayoutGrid size={20} /></button>
                      <button onClick={() => setSavedViewMode('list')} className={`p-2 rounded-lg transition-all ${savedViewMode === 'list' ? 'bg-white dark:bg-[#1C1C1E] text-[#007AFF] shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><List size={20} /></button>
                  </div>
                </header>
                {savedItems.length === 0 ? <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400 text-center"><div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6"><Bookmark size={32} className="text-gray-400" /></div><h3 className="text-xl font-bold text-black dark:text-white mb-2">No saved items</h3><p className="max-w-xs text-base">Items you save will appear here for quick access.</p></div> : (
                    <div className={`${savedViewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-3'} pb-24`}>{savedItems.map(item => <MediaCard key={item.id} item={item} onClick={handleMediaClick} variant={savedViewMode === 'grid' ? 'poster' : 'list'} />)}</div>
                )}
             </div>
        )}

        {/* PROFILE VIEW - FIXED TOP, SCROLL BOTTOM */}
        {activeTab === 'profile' && (
            <div className="w-full h-full flex flex-col bg-[#F2F2F7] dark:bg-black">
               {profileView === 'main' && (
                <>
                  {/* Fixed Top Section */}
                  <div className="shrink-0 flex flex-col items-center pt-8 pb-6 bg-[#F2F2F7] dark:bg-black z-20 relative px-6 animate-in slide-in-from-top-4 duration-300">
                      <div className="w-full flex justify-between items-start z-10 absolute top-8 left-6 right-6">
                         <button onClick={() => setProfileView('settings')} className="glass-button w-12 h-12 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors active:scale-95 shadow-sm"><Settings size={24} /></button>
                      </div>
                      <div className="relative mb-6 group mt-6">
                          <div className="w-28 h-28 bg-gradient-to-tr from-[#007AFF] to-[#5AC8FA] rounded-full shadow-2xl border-4 border-white dark:border-[#1C1C1E] flex items-center justify-center text-white text-3xl font-bold">{user.name.charAt(0)}</div>
                          <button onClick={() => { setTempUser(user); setProfileView('edit'); }} className="absolute bottom-0 right-0 w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black shadow-lg active:scale-95 transition-transform"><Edit2 size={14} strokeWidth={2.5} /></button>
                      </div>
                      <h2 className="text-3xl font-bold text-black dark:text-white mb-1">{user.name}</h2>
                      <p className="text-gray-500 dark:text-gray-400 font-medium text-base mb-6">{user.email}</p>
                      <div className="flex w-full max-w-sm justify-between gap-4">
                          <div className="flex-1 bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl shadow-sm text-center border border-transparent dark:border-white/10"><div className="text-2xl font-bold text-[#007AFF] mb-1">{savedItems.length}</div><div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Saved</div></div>
                          <div className="flex-1 bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl shadow-sm text-center border border-transparent dark:border-white/10"><div className="text-2xl font-bold text-purple-500 mb-1">{user.joined}</div><div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Joined</div></div>
                      </div>
                  </div>

                  {/* Scrollable Bottom Section */}
                  <div className="flex-1 overflow-y-auto px-6 pb-32 w-full">
                      <div className="flex items-center gap-2 mb-4"><History size={20} className="text-[#007AFF]" /><h3 className="text-xl font-bold text-black dark:text-white">Recently Viewed</h3></div>
                      {recentItems.length > 0 ? (
                         <div className="grid grid-cols-3 gap-3">
                             {recentItems.map((item) => <MediaCard key={`recent-${item.id}`} item={item} onClick={handleMediaClick} variant="poster" className="w-full aspect-[2/3]"/>)}
                         </div>
                      ) : (
                         <div className="w-full py-10 rounded-2xl bg-white/50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400">
                             <Eye size={32} className="mb-2 opacity-50" />
                             <p className="text-sm font-medium">No history yet</p>
                         </div>
                      )}
                  </div>
                </>
               )}
               {profileView === 'edit' && (
                 <div className="animate-in slide-in-from-right duration-300 p-6 pt-12 h-full overflow-y-auto">
                    <header className="flex items-center gap-4 mb-8"><button onClick={() => setProfileView('main')} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ChevronLeft size={24} className="text-black dark:text-white" /></button><h2 className="text-2xl font-bold text-black dark:text-white">Edit Profile</h2></header>
                    <div className="space-y-6 max-w-sm mx-auto">
                        <div className="space-y-2"><label className="text-sm font-bold text-gray-500 ml-1">Full Name</label><div className="relative"><UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" value={tempUser.name} onChange={(e) => setTempUser({...tempUser, name: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-black dark:text-white p-4 pl-12 rounded-2xl shadow-sm border border-transparent focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none" /></div></div>
                        <div className="space-y-2"><label className="text-sm font-bold text-gray-500 ml-1">Email Address</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="email" value={tempUser.email} onChange={(e) => setTempUser({...tempUser, email: e.target.value})} className="w-full bg-white dark:bg-[#1C1C1E] text-black dark:text-white p-4 pl-12 rounded-2xl shadow-sm border border-transparent focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] outline-none" /></div></div>
                        <button onClick={handleSaveProfile} className="w-full bg-[#007AFF] text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-transform mt-8">Save Changes</button>
                    </div>
                 </div>
               )}
               {profileView === 'settings' && (
                 <div className="animate-in slide-in-from-right duration-300 p-6 pt-12 h-full overflow-y-auto pb-28">
                    <header className="flex items-center gap-4 mb-8"><button onClick={() => setProfileView('main')} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ChevronLeft size={24} className="text-black dark:text-white" /></button><h2 className="text-2xl font-bold text-black dark:text-white">Settings</h2></header>
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-2 shadow-sm border border-transparent dark:border-white/10">
                           <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800"><div className="flex items-center gap-3"><div className={`p-2 rounded-full ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-orange-100 text-orange-500'}`}>{isDarkMode ? <Moon size={20} /> : <Sun size={20} />}</div><span className="font-bold text-black dark:text-white">Dark Mode</span></div><button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-12 h-7 rounded-full transition-colors relative ${isDarkMode ? 'bg-[#007AFF]' : 'bg-gray-200'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${isDarkMode ? 'left-6' : 'left-1'}`} /></button></div>
                           <div className="flex items-center justify-between p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20 text-red-500"><Bell size={20} /></div><span className="font-bold text-black dark:text-white">Notifications</span></div><button className="w-12 h-7 rounded-full bg-[#007AFF] relative"><div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full shadow-sm" /></button></div>
                        </div>
                        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-sm border border-transparent dark:border-white/10 overflow-hidden">
                           <button onClick={() => setProfileView('privacy')} className="w-full p-5 flex justify-between items-center group active:bg-gray-50 dark:active:bg-white/5 transition-colors border-b border-gray-100 dark:border-gray-800"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors"><Shield size={20} /></div><span className="font-bold text-base text-black dark:text-white">Privacy & Security</span></div><ChevronRight className="text-gray-300 dark:text-gray-600" size={20} /></button>
                           <button onClick={() => setProfileView('help')} className="w-full p-5 flex justify-between items-center group active:bg-gray-50 dark:active:bg-white/5 transition-colors"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors"><HelpCircle size={20} /></div><span className="font-bold text-base text-black dark:text-white">Help & Support</span></div><ChevronRight className="text-gray-300 dark:text-gray-600" size={20} /></button>
                        </div>
                        <button onClick={handleSignOut} className="w-full p-5 bg-white dark:bg-[#1C1C1E] shadow-sm rounded-3xl flex items-center justify-center gap-2 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"><LogOut size={20} />Sign Out</button>
                    </div>
                 </div>
               )}
               {profileView === 'privacy' && (
                 <div className="animate-in slide-in-from-right duration-300 p-6 pt-12 h-full overflow-y-auto">
                    <header className="flex items-center gap-4 mb-8"><button onClick={() => setProfileView('settings')} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ChevronLeft size={24} className="text-black dark:text-white" /></button><h2 className="text-2xl font-bold text-black dark:text-white">Privacy & Security</h2></header>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-sm border border-transparent dark:border-white/10 space-y-6"><div className="flex items-start gap-4"><Lock className="text-green-500 shrink-0 mt-1" size={24} /><div><h3 className="font-bold text-black dark:text-white mb-2">Data Protection</h3><p className="text-gray-500 text-sm leading-relaxed">Your data is stored locally on your device. We do not track your viewing habits on external servers.</p></div></div><div className="h-px bg-gray-100 dark:bg-gray-800" /><div className="text-center"><button onClick={() => { setRecentItems([]); localStorage.removeItem('MOVOS_RECENT'); showNotificationFunc("Watch history cleared", 'success'); }} className="text-red-500 font-bold text-sm hover:underline">Clear Watch History</button></div></div>
                 </div>
               )}
               {profileView === 'help' && (
                 <div className="animate-in slide-in-from-right duration-300 p-6 pt-12 h-full overflow-y-auto">
                    <header className="flex items-center gap-4 mb-8"><button onClick={() => setProfileView('settings')} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ChevronLeft size={24} className="text-black dark:text-white" /></button><h2 className="text-2xl font-bold text-black dark:text-white">Help & Support</h2></header>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-sm border border-transparent dark:border-white/10"><h3 className="font-bold text-black dark:text-white mb-4">About MOVOS</h3><p className="text-gray-500 text-sm leading-relaxed mb-6">MOVOS is a premium movie application built with React and Tailwind CSS. It uses the TMDB API to provide up-to-date information.</p><div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl"><p className="text-xs text-gray-400 font-mono">Version 1.1.0</p><p className="text-xs text-gray-400 font-mono">Build 2024.11.01</p></div></div>
                 </div>
               )}
            </div>
        )}
        
        </div>

        {/* Bottom Blur Overlay */}
        <div className={`fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F2F2F7] via-[#F2F2F7]/80 to-transparent dark:from-black dark:via-black/80 z-20 pointer-events-none transition-opacity duration-500 ${isModalOpen ? 'opacity-0' : 'opacity-100'}`} />

      </main>

      <DetailModal item={selectedMedia} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onToggleSave={handleToggleSave} isSaved={selectedMedia ? savedItems.some(i => i.id === selectedMedia.id) : false} />
      
      {/* Hide Navbar in non-main views */}
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} isVisible={appState === 'app' && !isModalOpen && !seeAllState && !(activeTab === 'search' && selectedGenre)} />
    </div>
    </div>
  );
};

export default App;
