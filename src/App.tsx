import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect, useRef, useCallback } from "react";
import { CreatePoemModal } from "./components/CreatePoemModal";
import { ThemeToggle } from "./components/ThemeToggle";
import { ProfileEditor } from "./components/ProfileEditor";
import { SubscriptionPlans } from "./components/SubscriptionPlans";

type ViewType = 'home' | 'explore';

interface Poem {
  _id: string;
  title: string;
  content: string;
  _creationTime: number;
  username?: string;
}

const PoemCard = ({ 
  poem, 
  isDark,
  isExpanded,
  onToggleExpand 
}: { 
  poem: Poem; 
  isDark: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) => {
  const maxLines = 3;
  const lines = poem.content.split('\n');
  const isLongPoem = lines.length > maxLines;
  const displayContent = isExpanded || !isLongPoem 
    ? poem.content 
    : lines.slice(0, maxLines).join('\n') + '...';

  return (
    <div className="group relative overflow-hidden rounded-2xl transition-all duration-500 hover:shadow-2xl hover:scale-105" 
         style={{
           backgroundImage: 'url(\"/poem-bg.png\")',
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           position: 'relative',
           border: isDark ? '1px solid rgba(55, 65, 81, 0.5)' : '1px solid rgba(229, 231, 235, 0.5)'
         }}>
      <div className={`absolute inset-0 ${isDark ? 'bg-black/40' : 'bg-white/60'}`} />
      <div className="relative p-6 h-full flex flex-col">
        <div className="flex-1">
          <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {poem.title}
          </h3>
          <div className={`prose max-w-none ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            <p className="whitespace-pre-line">
              {displayContent}
            </p>
          </div>
          {isLongPoem && (
            <button 
              onClick={onToggleExpand}
              className={`mt-2 text-sm font-medium ${isDark ? 'text-purple-300 hover:text-white' : 'text-purple-600 hover:text-purple-800'}`}
            >
              {isExpanded ? 'Show Less' : 'Read More'}
            </button>
          )}
        </div>
        <div className={`mt-4 pt-4 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-2 text-sm">
            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              Added on {new Date(poem._creationTime).toLocaleDateString()}
            </span>
            {poem.username && (
              <>
                <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>•</span>
                <span className={`font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                  @{poem.username}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [expandedPoemId, setExpandedPoemId] = useState<string | null>(null);
  // Define the user type
  type UserProfile = {
    _id: string;
    name?: string;
    email?: string;
    bio?: string;
    instagram?: string;
    twitter?: string;
    profilePicture?: string | null;
  };

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const samplePoems = [
    {
      _id: 'poem-1',
      title: 'ग़ज़ल १',
      content: 'दिल ले गया कोई, \nदर्द दे गया कोई, \n\nये कोई बता दे मुझको,\nक्यूँ ऐसा कर गया कोई।',
      _creationTime: Date.now(),
      username: 'Added by Nectar',
      
    },
    {
      _id: 'poem-2',
      title: 'ग़ज़ल २',
      content: 'कोई शाम थी जो गुजर गई \nकोई बात थी जो बिसर गई \nजिस मंच पर से हम मिले \nअब याद उसकी रह गई।\n\n कभी वक्त ने ही रुला दिया, \nकभी वक्त ने ही हँसा दिया \nकिसी ने कभी अपना लिया। \nकिसी ने कभी ठुकरा दिया ॥\n\nमेरी उम्र यूँ ही गुजर गई। \nकोई बात थी जो बिसर गई ॥',
      _creationTime: Date.now() - 86400000, // Yesterday
      
    },
    {
      _id: 'poem-3',
      title: 'ग़ज़ल ३',
      content: 'बहुत कमी है बुलन्दी की,\nसच को सच और झूठ को झूठ कहने की,\n\nन बात करिए सूफी से वसूलों की,\nयहाँ सबको जरुरत है एक कुर्सी की।',
      _creationTime: Date.now() - 172800000, // 2 days ago
      
    },
    {
      _id: 'poem-4',
      title: 'ग़ज़ल ४',
      content: 'वक्त कम है।\nइसी का गम है।\nकहीं न कहीं \nहम मिले तो सही \nयही क्या कम है ?',
      _creationTime: Date.now(),
      
    },
    {
      _id: 'poem-5',
      title: 'उस भीड़ में मुझे इक पहिचान तो मिले',
      content: 'उस भीड़ में मुझे इक पहिचान तो मिले\nखामोश जिंदगी को आवाज़ तो मिले\n\nढूंढा बहुत है लेकिन कोई मिला नहीं\nपूरे शहर में कोई इन्सान तो मिले\n\nकुछ भी नज़र न आता हर ओर है अंधेरा\nऐसे में "सूफी" कोई एक चिराग़ तो मिले\n\nलिख तो रहे हो सूफी पर क्या करोगे लिखकर\nग़ज़लों को अब तुम्हारे बाजार तो मिले\n\nउस भीड़ में मुझे एक पहिचान तो मिले\nखामोश जिंदगी को आवाज़ तो मिले',
      _creationTime: Date.now(),
      
    },
    {
      _id: 'poem-6',
      title: 'ग़ज़ल ६',
      content: 'वक्त कम है।\nइसी का गम है।\nकहीं न कहीं \nहम मिले तो सही \nयही क्या कम है ?',
      _creationTime: Date.now(),
      
    },
    {
      _id: 'poem-7',
      title: 'ग़ज़ल ७',
      content: 'वो क्यूँ आयें ?\nहम क्यूँ जायें ?\n\nन उन्हें फुर्सत ।\nन हमें फुर्सत ।',
      _creationTime: Date.now(),
      
    },
    {
      _id: 'poem-8',
      title: 'ग़ज़ल ८',
      content: 'वो जो थी मुहब्बत थी,\nअब जो है वो नफरत है,\nवो जो था वो मजहब था,\nअब जो है वो मतलब है',
      _creationTime: Date.now(),
      
    },
    {
      _id: 'poem-9',
      title: 'ग़ज़ल ९',
      content: 'क्या मेरी आरजू थी, क्या उनकी थी तमन्ना\nकुछ हम समझ न पाये, कुछ वो समझ न पाये।\n\nकिस्मत में जब लिखा था. हमको जुदा ही रहना,\nकिस बात के लिए थे तब हम करीब आये ।\n\nइतना ही याद रखना मुझको भूलाने वाले।\nहम सबको भूल गये पर तुमको भूला न पाये',
      _creationTime: Date.now(),
      
    },
    
  ];
  
  const maxLines = 3;
  
  const poems = useQuery(api.poems.listPublicPoems) || [];
  const visitorCount = useQuery(api.poems.getVisitorCount) || 0;
  const incrementVisitors = useMutation(api.poems.incrementVisitorCount);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileRef]);

  // Update current user when loggedInUser changes
  useEffect(() => {
    if (loggedInUser) {
      setCurrentUser({
        _id: loggedInUser._id,
        name: loggedInUser.name || 'user',
        email: loggedInUser.email || '',
        bio: loggedInUser.bio || '',
        instagram: loggedInUser.instagram || '',
        twitter: loggedInUser.twitter || '',
        profilePicture: loggedInUser.profilePicture || null
      });
    } else {
      setCurrentUser(null);
    }
  }, [loggedInUser]);

  useEffect(() => {
    // Increment visitor count on first load
    incrementVisitors();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const togglePoemExpansion = (poemId: string) => {
    setExpandedPoemId(expandedPoemId === poemId ? null : poemId);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${
        isDark 
          ? 'bg-gray-900/80 border-gray-700' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center">
            {/* Blinking Butterfly */}
            <div className="flex items-center">
              <button 
                onClick={handleRefresh}
                className="p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-500 transition-colors"
                title="Refresh"
              >
                <span className="text-2xl animate-pulse">🦋</span>
              </button>
            </div>
            
            {/* Centered Navigation */}
            <div className="flex-1 flex items-center justify-center gap-2">
              <button
                onClick={() => setActiveView('home')}
                className={`p-3 rounded-full transition-colors ${
                  isDark 
                    ? activeView === 'home' ? 'bg-gray-700 text-white' : 'hover:bg-gray-800 text-gray-300' 
                    : activeView === 'home' ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="My Poems"
              >
                🏠
              </button>
              <button
                onClick={() => setActiveView('explore')}
                className={`p-3 rounded-full transition-colors ${
                  isDark 
                    ? activeView === 'explore' ? 'bg-gray-700 text-white' : 'hover:bg-gray-800 text-gray-300' 
                    : activeView === 'explore' ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Explore Poems"
              >
                👁️
              </button>
              <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
            </div>
            
            {/* User Icon on the right */}
            <div className="flex items-center relative" ref={profileRef}>
              <Authenticated>
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className={`p-2 rounded-full transition-colors ${
                      isDark 
                        ? 'hover:bg-gray-700/50 text-gray-200' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    title="Profile"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
                      👤
                    </div>
                  </button>
                  
                  {/* Profile Dropdown */}
                  {showProfileDropdown && (
                    <div 
                      className={`absolute right-0 mt-2 w-64 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-lg ${
                        isDark 
                          ? 'bg-black/40 border border-gray-700/50' 
                          : 'bg-white/80 border border-gray-200/50'
                      }`}
                    >
                      <div className="p-4 border-b border-gray-200/30 dark:border-gray-700/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
                            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {currentUser?.name ? `@${currentUser.name}` : 'user'}
                            </p>
                            {currentUser?.email && (
                              <p className="text-xs text-gray-500">
                                {currentUser.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowProfileEditor(true);
                            setShowProfileDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm flex items-center ${
                            isDark 
                              ? 'text-gray-200 hover:bg-gray-700/50' 
                              : 'text-gray-700 hover:bg-gray-100/70'
                          }`}
                        >
                          <span className="mr-3">👤</span>
                          <span>Edit Profile</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowSubscriptionPlans(true);
                            setShowProfileDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm flex items-center ${
                            isDark 
                              ? 'text-yellow-300 hover:bg-gray-700/50' 
                              : 'text-yellow-600 hover:bg-gray-100/70'
                          }`}
                        >
                          <span className="mr-3">✨</span>
                          <span>Upgrade Plan</span>
                        </button>
                        
                        
                        
                        <div className="border-t border-gray-200/30 dark:border-gray-700/50 my-1"></div>
                        
                        <SignOutButton className="w-full justify-start" />
                      </div>
                    </div>
                  )}
                </div>
              </Authenticated>
              <Unauthenticated>
                <button
                  onClick={() => setShowSignIn(!showSignIn)}
                  className={`p-3 rounded-full transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-800 text-gray-300' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Sign in"
                >
                  👤
                </button>
              </Unauthenticated>
            </div>
          </div>
          <div className="text-center mt-1">
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {visitorCount.toLocaleString()} visitors
            </span>
          </div>
        </div>
      </header>

      {/* Sign In Modal */}
      {showSignIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl p-6 transform transition-all duration-300 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Sign In
              </h2>
              <button
                onClick={() => setShowSignIn(false)}
                className={`p-1 rounded ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                ✕
              </button>
            </div>
            <SignInForm />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeView === 'explore' && (
          <div className="text-center mb-8">
            <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Explore Poems
            </h1>
            <p className={`text-lg ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Discover beautiful poetry from our community
            </p>
          </div>
        )}
        {activeView === 'explore' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {poems.length > 0 ? (
              poems.map((poem) => (
                <PoemCard 
                  key={poem._id} 
                  poem={poem} 
                  isDark={isDark}
                  isExpanded={expandedPoemId === poem._id}
                  onToggleExpand={() => setExpandedPoemId(expandedPoemId === poem._id ? null : poem._id)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <span className="text-6xl mb-6 block animate-bounce">📝</span>
                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  No poems yet
                </h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Be the first to share your poetry with the world!
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full">
            <h2 className={`text-2xl font-bold mb-8 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Baba's Poetry Collection
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {samplePoems.map((poem) => {
                const lines = poem.content.split('\n');
                const isLongPoem = lines.length > maxLines;
                const isExpanded = expandedPoemId === poem._id;
                const displayContent = isExpanded || !isLongPoem 
                  ? poem.content 
                  : lines.slice(0, maxLines).join('\n') + '...';
                  
                return (
                  <div key={poem._id} className="group relative overflow-hidden rounded-2xl transition-all duration-500 hover:shadow-2xl hover:scale-105" 
                       style={{
                         backgroundImage: 'url(\"/poem-bg.png\")',
                         backgroundSize: 'cover',
                         backgroundPosition: 'center',
                         position: 'relative',
                         border: isDark ? '1px solid rgba(55, 65, 81, 0.5)' : '1px solid rgba(229, 231, 235, 0.5)'
                       }}>
                    <div className={`absolute inset-0 ${isDark ? 'bg-black/40' : 'bg-white/60'}`} />
                    <div className="relative p-6 h-full flex flex-col">
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {poem.title}
                        </h3>
                        <div className={`prose max-w-none ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          <p className="whitespace-pre-line">
                            {displayContent}
                          </p>
                          {isLongPoem && (
                            <button 
                              onClick={() => togglePoemExpansion(poem._id)}
                              className={`mt-2 text-sm font-medium ${isDark ? 'text-purple-300 hover:text-white' : 'text-purple-600 hover:text-purple-800'}`}
                            >
                              {isExpanded ? 'Show Less' : 'Read More'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {new Date(poem._creationTime).toLocaleDateString()}
                          </span>
                          {poem.username && (
                            <span className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                              @{poem.username}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Button with Glass Effect */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30">
        <button
          onClick={() => setShowCreateModal(true)}
          className={`glass-button px-6 py-3 text-base font-medium ${
            isDark ? 'text-white bg-black/30' : 'text-gray-900 bg-white/30'
          }`}
        >
          <span className="relative z-10 drop-shadow-md">
            Create Poem <span className="ml-1">✍️</span>
          </span>
        </button>
      </div>

      {/* Create Poem Modal */}
      {showCreateModal && (
        <CreatePoemModal
          isDark={isDark}
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Profile Editor Modal */}
      {showProfileEditor && currentUser && (
        <ProfileEditor 
          user={{
            username: currentUser.name || '',
            email: currentUser.email || '',
            bio: currentUser.bio,
            instagram: currentUser.instagram,
            twitter: currentUser.twitter,
            profilePicture: currentUser.profilePicture
          }}
          onClose={() => setShowProfileEditor(false)}
          onSave={(updates) => {
            setCurrentUser(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                name: updates.username,
                bio: updates.bio || '',
                instagram: updates.instagram || '',
                twitter: updates.twitter || '',
                profilePicture: updates.profilePicture || null
              };
            });
          }}
          isDark={isDark}
        />
      )}
      
      <Toaster position="top-center" richColors />

      {/* Subscription Plans Modal */}
      {showSubscriptionPlans && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl">
            <button
              onClick={() => setShowSubscriptionPlans(false)}
              className={`absolute -top-10 right-0 p-2 rounded-full transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <svg 
                className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-800'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SubscriptionPlans 
              isDark={isDark} 
              onClose={() => setShowSubscriptionPlans(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
