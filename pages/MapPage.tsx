import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { store } from '../store';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { User, AppRoute } from '../types';
import { Button } from '../components/Button';

export const MapPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { t } = useLanguage();
  const { isDark } = useTheme();
  
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    // Load friends
    setFriends(store.getFriendsList());

    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
          zoomControl: false 
      }).setView([22.3193, 114.1694], 13);

      mapRef.current = map;
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Current User Marker
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(pos => {
              const { latitude, longitude } = pos.coords;
              map.setView([latitude, longitude], 14);
              
              const user = store.getCurrentUser();
              const avatar = user?.avatar || 'https://ui-avatars.com/api/?name=Me';
              
              const userIcon = L.divIcon({
                  className: 'custom-map-marker',
                  html: `
                    <div class="flex flex-col items-center">
                         <span class="bg-zinc-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 shadow-sm">You</span>
                         <div class="avatar-container relative w-[44px] h-[44px] rounded-full border-[3px] border-blue-500 shadow-xl overflow-hidden bg-zinc-900">
                             <img src="${avatar}" class="w-full h-full object-cover" />
                             <div class="absolute inset-0 ring-4 ring-blue-500/30 rounded-full animate-pulse"></div>
                         </div>
                    </div>
                  `,
                  iconSize: [44, 64], // adjusted for label
                  iconAnchor: [22, 64]
              });

              const marker = L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
              
              // No popup for "You", just visual
              marker.on('click', () => {
                 // Maybe center map
                 map.flyTo([latitude, longitude], 16);
              });
          });
      }

      // Add dummy friend markers for demo of interaction
      const mockFriends = store.getFriendsList();
      mockFriends.forEach((friend, idx) => {
           // Random nearby loc
           const lat = 22.3193 + (Math.random() * 0.02 - 0.01);
           const lng = 114.1694 + (Math.random() * 0.02 - 0.01);

           const friendIcon = L.divIcon({
                  className: 'custom-map-marker',
                  html: `
                    <div class="flex flex-col items-center">
                         <div class="avatar-container w-[40px] h-[40px] rounded-full border-[3px] border-white dark:border-zinc-800 shadow-lg overflow-hidden bg-zinc-200">
                             <img src="${friend.avatar}" class="w-full h-full object-cover" />
                         </div>
                    </div>
                  `,
                  iconSize: [40, 40],
                  iconAnchor: [20, 20]
           });

           const marker = L.marker([lat, lng], { icon: friendIcon }).addTo(map);
           marker.on('click', () => {
               setSelectedUser(friend);
               map.flyTo([lat, lng], 15);
           });
      });
    }
  }, []);

  // Handle Theme Change for Map Tiles
  useEffect(() => {
      if (!mapRef.current) return;

      const lightTiles = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      const darkTiles = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      const url = isDark ? darkTiles : lightTiles;

      if (tileLayerRef.current) {
          tileLayerRef.current.setUrl(url);
      } else {
          tileLayerRef.current = L.tileLayer(url, {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
          }).addTo(mapRef.current);
      }
  }, [isDark]);

  const handleSendInvite = async () => {
      const f = store.getFriendsList();
      if(f.length > 0) {
          try {
              await store.sendInvitation('location', f[0].uid);
              alert(t('location_invite_sent'));
          } catch(e) {}
      } else {
          alert(t('add_friends_map'));
      }
  };

  return (
    <div className="h-full w-full relative bg-zinc-50 dark:bg-black font-sans">
      <div className="absolute inset-0 z-0 pl-[0%]"> 
          <div ref={mapContainerRef} className="h-full w-full bg-zinc-200 dark:bg-zinc-900" />
      </div>
      
      {/* Top Overlay */}
      <div className="absolute top-6 left-6 right-6 z-[400] flex justify-center pointer-events-none">
          <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xl pointer-events-auto max-w-sm w-full flex justify-between items-center theme-transition">
             <div>
                <h3 className="text-zinc-900 dark:text-white font-bold text-sm">{t('location_sharing')}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">{friends.length} {t('active_users')}</p>
             </div>
             <button onClick={handleSendInvite} className="bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg active:scale-95 transition">
                 {t('share_location')}
             </button>
          </div>
      </div>

      {/* Side Slide-in Panel */}
      <div className={`absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-zinc-900 shadow-2xl z-[500] transform transition-transform duration-300 ease-out flex flex-col border-l border-zinc-200 dark:border-zinc-800 ${selectedUser ? 'translate-x-0' : 'translate-x-full'}`}>
          {selectedUser && (
              <>
                  <div className="p-6 flex flex-col items-center border-b border-zinc-100 dark:border-zinc-800 relative">
                      <button onClick={() => setSelectedUser(null)} className="absolute top-4 left-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-2">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                      <img src={selectedUser.avatar} className="w-24 h-24 rounded-full border-4 border-zinc-100 dark:border-zinc-800 shadow-lg object-cover mb-4" />
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{selectedUser.displayName || selectedUser.username}</h2>
                      <p className="text-zinc-500 text-sm">@{selectedUser.username}</p>
                  </div>
                  <div className="p-6 space-y-3">
                      <Button variant="primary" className="!w-full flex items-center justify-center gap-2">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                          Call
                      </Button>
                      <Button variant="secondary" className="!w-full flex items-center justify-center gap-2">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                          Message
                      </Button>
                      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                          <div className="flex justify-between items-center py-2">
                             <span className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">Location</span>
                             <span className="text-green-500 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">LIVE</span>
                          </div>
                      </div>
                  </div>
              </>
          )}
      </div>
      
      {/* Overlay to dismiss side panel */}
      {selectedUser && (
          <div className="absolute inset-0 bg-black/20 z-[450]" onClick={() => setSelectedUser(null)}></div>
      )}

    </div>
  );
};