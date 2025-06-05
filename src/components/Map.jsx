import React, { useEffect, useRef } from 'react';

const GrenadaLandmarksMap = ({ 
  className = "", 
  showHeader = true, 
  zoom = 11, 
  height = '650px',
  showLegend = true 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Load Leaflet CSS
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
    document.head.appendChild(leafletCSS);

    // Load Leaflet JS
    const leafletJS = document.createElement('script');
    leafletJS.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    leafletJS.onload = initializeMap;
    document.head.appendChild(leafletJS);

    return () => {
      // Cleanup
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
      document.head.removeChild(leafletCSS);
      document.head.removeChild(leafletJS);
    };
  }, []);

  const initializeMap = () => {
    if (!window.L || mapInstanceRef.current) return;

    console.log('Initializing Grenada Landmarks Map...');
    
    // Create map instance with configurable zoom
    const map = window.L.map(mapRef.current, {
      center: [12.1165, -61.6790],
      zoom: zoom, // Use the zoom prop
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      attributionControl: true,
      preferCanvas: false
    });

    mapInstanceRef.current = map;
    
    // Add tile layer
    const tileLayer = window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      crossOrigin: true,
      subdomains: ['a', 'b', 'c']
    });
    
    tileLayer.addTo(map);
    
    // Define categories with colors and icons
    const categories = {
      beaches: { color: '#3498db', icon: '🏖️' },
      historical: { color: '#e74c3c', icon: '🏛️' },
      natural: { color: '#27ae60', icon: '🌿' },
      cultural: { color: '#f39c12', icon: '🎭' },
      waterfalls: { color: '#9b59b6', icon: '💧' },
      viewpoints: { color: '#e67e22', icon: '🔭' }
    };

    // Grenada landmarks data
    const landmarks = [
      // Beaches
      { name: "Grand Anse Beach", lat: 12.025019195630641, lng: -61.76198898796977, category: "beaches", description: "One of the world's most beautiful beaches with 2 miles of white sand and crystal-clear waters." },
      { name: "Morne Rouge Beach", lat: 12.019585508732703, lng: -61.77275951076697, category: "beaches", description: "A sheltered crescent-shaped beach perfect for swimming and snorkeling." },
      { name: "Bathway Beach", lat: 12.215486712125777, lng: -61.60971498647282, category: "beaches", description: "A unique beach with natural rock formations creating protected swimming pools." },
      { name: "La Sagesse Beach", lat: 12.02367524407815, lng: -61.67280972067488, category: "beaches", description: "A secluded paradise with mangroves, salt pond, and pristine white sand." },
      { name: "Levera Beach", lat: 12.225012898987178, lng: -61.608054132667505, category: "beaches", description: "Wild Atlantic coast beach with dramatic waves and turtle nesting site." },
      { name: "Magazine Beach", lat: 12.010987068298734, lng: -61.78552011559304, category: "beaches", description: "Popular local beach with calm waters, perfect for families and water sports." },
      { name: "Pink Gin Beach", lat: 12.008588495277712, lng: -61.792573067359804, category: "beaches", description: "Exclusive beach with luxury resorts and pristine white sand." },
      
      // Historical Sites
      { name: "Fort Frederick", lat: 12.048339911869135, lng: -61.737469648650396, category: "historical", description: "18th-century fortress offering panoramic views of the island and harbor." },
      { name: "Fort Matthew", lat: 12.05039470482077, lng: -61.738016759655245, category: "historical", description: "Ruined fort on Richmond Hill with commanding views over St. George's." },
      { name: "Fort Jeudy Point", lat: 12.000084910146986, lng: -61.70763012260911, category: "historical", description: "Colonial fort ruins on the southeast coast with ocean views." },
      { name: "Leapers Hill", lat: 12.226473825642188, lng: -61.64019391610536, category: "historical", description: "Historic cliff in Sauteurs where the last Carib Indians leaped to their death in 1651." },
      { name: "Belmont Estate", lat: 12.174851630861625, lng: -61.626898110416285, category: "historical", description: "Historic plantation in St. Patrick showcasing traditional cocoa and spice production." },
      { name: "Laura Herb & Spice Garden", lat: 12.04190462103274, lng: -61.69665118585402, category: "historical", description: "Organic spice garden and plantation showcasing traditional farming methods." },
      { name: "Morne Fendue Plantation", lat: 12.209157370110871, lng: -61.63026848663825, category: "historical", description: "Historic plantation house offering traditional Grenadian cuisine and history." },
      
      // Natural Attractions
      { name: "Grand Etang National Park", lat: 12.094200932671036, lng: -61.69401638532512, category: "natural", description: "Crater lake surrounded by lush rainforest with hiking trails and wildlife." },
      { name: "Underwater Sculpture Park", lat: 12.083472210062865, lng: -61.76339677504767, category: "natural", description: "World's first underwater sculpture park, perfect for snorkeling and diving." },
      { name: "Lake Antoine", lat: 12.185809926207037, lng: -61.61232997325479, category: "natural", description: "Volcanic crater lake surrounded by tropical vegetation and bird life." },
      { name: "Levera National Park", lat: 12.222721629520914, lng: -61.612899088488554, category: "natural", description: "Coastal park with mangroves, pond, and important bird sanctuary." },
      { name: "La Sagesse Nature Center", lat: 12.024578143708172, lng: -61.67093491732724, category: "natural", description: "Protected area with mangrove estuary, salt pond, and diverse wildlife." },
      
      // Cultural Sites
      { name: "St. George's Market Square", lat: 12.052449656731188, lng: -61.75335418258073, category: "cultural", description: "Historic town center with colorful Georgian buildings and local markets." },
      { name: "House of Chocolate", lat: 12.050684087226339, lng: -61.75284421117853, category: "cultural", description: "Museum and factory showcasing Grenada's rich chocolate and spice heritage." },
      { name: "Grenada Chocolate Company", lat: 12.176046037537981, lng: -61.63776082030105, category: "cultural", description: "Organic chocolate factory using traditional methods and local cocoa beans." },
      { name: "Grenada National Museum", lat: 12.050499071172318, lng: -61.75260587743098, category: "cultural", description: "Museum housed in French barracks showcasing island's history and culture." },
      { name: "River Antoine Rum Distillery", lat: 12.2000, lng: -61.6167, category: "cultural", description: "Caribbean's oldest functioning water-powered rum distillery, dating from 1785." },
      { name: "Westerhall Rum Distillery", lat: 12.01918137376026, lng: -61.70365711732713, category: "cultural", description: "Historic rum distillery producing premium aged rums since 1811." },
      { name: "Clarke's Court Rum Distillery", lat: 12.02611718502591, lng: -61.74000584915563, category: "cultural", description: "Modern rum distillery offering tours and tastings of their premium rums." },
      { name: "Diamond Chocolate Factory (Jouvay Chocolate)", lat: 12.188900605731876, lng: -61.701141330817414, category: "cultural", description: "Artisan chocolate factory producing organic chocolate from tree to bar." },
      { name: "Tri-Island Spice Company", lat: 12.074907925973664, lng: -61.72986124616227, category: "cultural", description: "Spice processing facility and shop showcasing Grenada's spice heritage." },
      
      // Waterfalls
      { name: "Annandale Falls", lat: 12.087479234939158, lng: -61.717052820187, category: "waterfalls", description: "35-foot waterfall surrounded by tropical plants, with swimming pool below." },
      { name: "Seven Sisters Falls", lat: 12.095262568425326, lng: -61.68050939513836, category: "waterfalls", description: "Series of seven cascading waterfalls in the Grand Etang rainforest." },
      { name: "Concord Falls", lat: 12.11789452883382, lng: -61.71874454416698, category: "waterfalls", description: "Three-tiered waterfall system with the first fall easily accessible." },
      { name: "Royal Mt. Carmel Falls", lat: 12.093068741175745, lng: -61.63543313747944, category: "waterfalls", description: "Hidden 70-foot waterfall requiring a moderate hike through rainforest." },
      { name: "Honeymoon Falls", lat: 12.116661366918471, lng: -61.679050708774106, category: "waterfalls", description: "Romantic waterfall with natural pool, perfect for swimming and relaxation." },
      { name: "Tufton Hall Waterfall", lat: 12.16197888381273, lng: -61.68340132272949, category: "waterfalls", description: "Spectacular 100-foot waterfall cascading down volcanic rock formations." },
      
      // Scenic Viewpoints
      { name: "Mount Qua Qua", lat: 12.099700090584546, lng: -61.70119282314723, category: "viewpoints", description: "Hiking trail leading to summit with 360-degree island views." },
      { name: "Fedon's Camp", lat: 12.118636072834546, lng: -61.69819013266894, category: "viewpoints", description: "Historic revolutionary site with panoramic mountain and forest views." }
    ];

    // Function to create custom markers
    function createCustomMarker(category) {
      const cat = categories[category];
      return window.L.divIcon({
        html: `<div style="
          background-color: ${cat.color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          cursor: pointer;
          transition: all 0.3s ease;
        ">${cat.icon}</div>`,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });
    }

    // Add markers to map
    landmarks.forEach(landmark => {
      const marker = window.L.marker([landmark.lat, landmark.lng], {
        icon: createCustomMarker(landmark.category)
      }).addTo(map);

      // Create popup content
      const categoryColor = categories[landmark.category].color;
      const categoryName = landmark.category.charAt(0).toUpperCase() + landmark.category.slice(1);
      
      const popupContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="font-size: 1.2em; font-weight: 600; color: #2c3e50; margin: 0 0 8px 0;">
            ${landmark.name}
          </div>
          <div style="font-size: 0.9em; color: #7f8c8d; line-height: 1.4; margin-bottom: 8px;">
            ${landmark.description}
          </div>
          <div style="display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: 500; color: white; background-color: ${categoryColor};">
            ${categoryName}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });
      
      // Add hover effect
      marker.on('mouseover', function() {
        this.openPopup();
      });
    });

    // Add scale control
    window.L.control.scale({
      position: 'bottomleft',
      imperial: false
    }).addTo(map);
    
    // Force map to refresh
    setTimeout(() => {
      map.invalidateSize();
      console.log('Grenada map initialized successfully');
    }, 500);
  };

  return (
    <div className="relative z-0 mt-0 h-screen w-full">
      {/* Conditional Map Header */}
      {showHeader && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center p-4 rounded-t-lg">
          <h2 className="text-xl font-light tracking-wide mb-1">🏝️ GRENADA EXPLORER</h2>
          <p className="text-sm opacity-90">Discover the Spice Island's Most Beautiful Landmarks & Attractions</p>
        </div>
      )}
      
      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapRef} 
          style={{ height: height, width: '100%', background: '#b3d9ff' }}
          className={showHeader ? "rounded-b-lg" : "rounded-lg"}
        />
        
        {/* Conditional Legend */}
        {showLegend && (
          <div className="absolute bottom-4 right-4 bg-white bg-opacity-95 backdrop-blur-sm p-4 rounded-lg shadow-lg z-1000 min-w-48">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">📍 Categories</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-4 h-4 rounded-full mr-3 border-2 border-white" style={{backgroundColor: '#3498db'}}></div>
                <span>Beaches</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-4 h-4 rounded-full mr-3 border-2 border-white" style={{backgroundColor: '#e74c3c'}}></div>
                <span>Historical Sites</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-4 h-4 rounded-full mr-3 border-2 border-white" style={{backgroundColor: '#27ae60'}}></div>
                <span>Natural Attractions</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-4 h-4 rounded-full mr-3 border-2 border-white" style={{backgroundColor: '#f39c12'}}></div>
                <span>Cultural Sites</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-4 h-4 rounded-full mr-3 border-2 border-white" style={{backgroundColor: '#9b59b6'}}></div>
                <span>Waterfalls</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <div className="w-4 h-4 rounded-full mr-3 border-2 border-white" style={{backgroundColor: '#e67e22'}}></div>
                <span>Scenic Viewpoints</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrenadaLandmarksMap;