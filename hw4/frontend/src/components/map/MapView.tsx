import { useEffect, useRef, useState } from 'react';
import { Listing } from '@/types';
import { MapSearchBox } from './MapSearchBox';

interface MapViewProps {
  listings: Listing[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (listing: Listing) => void;
  selectedListing?: Listing | null;
  highlightedId?: number | null;
  onLocationSearch?: (location: { lat: number; lng: number }) => void;
}

export function MapView({
  listings,
  center,
  zoom = 12,
  onMarkerClick,
  selectedListing,
  highlightedId,
  onLocationSearch,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      console.warn('Please set VITE_GOOGLE_MAPS_API_KEY in your .env file');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      console.log('Google Maps already loaded');
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('Google Maps script already loading...');
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    // Load the script
    console.log('Loading Google Maps script...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps loaded successfully');
      setIsLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps');
    };
    document.head.appendChild(script);

    // Don't remove script on cleanup - keep it for the whole app
  }, []);

  // Initialize map - ensure it's created when component mounts
  useEffect(() => {
    if (!isLoaded || !mapRef.current) {
      console.log('Waiting for map to load...', { isLoaded, hasRef: !!mapRef.current });
      return;
    }

    // Check if map already rendered in this DOM element
    if (mapRef.current.querySelector('.gm-style')) {
      console.log('Map already rendered in this element, skipping init');
      // Map exists in DOM but we lost the reference, try to reuse
      if (!googleMapRef.current) {
        console.log('Recreating map reference...');
        const defaultCenter = center || {
          lat: parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LAT || '25.0330'),
          lng: parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LNG || '121.5654'),
        };
        googleMapRef.current = new google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });
      }
      return;
    }

    // Create new map
    console.log('Creating new Google Map instance...');
    const defaultCenter = center || {
      lat: parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LAT || '25.0330'),
      lng: parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LNG || '121.5654'),
    };

    try {
      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });
      console.log('✅ Google Map initialized successfully at', defaultCenter);
    } catch (error) {
      console.error('❌ Failed to initialize map:', error);
    }
  }, [isLoaded, center, zoom]);

  // Update markers
  useEffect(() => {
    if (!googleMapRef.current || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Create new markers
    listings.forEach((listing) => {
      const isHighlighted = highlightedId === listing.id;
      const marker = new google.maps.Marker({
        position: { lat: listing.latitude, lng: listing.longitude },
        map: googleMapRef.current!,
        title: listing.title,
        icon: {
          url: isHighlighted 
            ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
            : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(isHighlighted ? 50 : 40, isHighlighted ? 50 : 40),
        },
        animation: isHighlighted ? google.maps.Animation.BOUNCE : undefined,
      });

      marker.addListener('click', () => {
        if (onMarkerClick) {
          onMarkerClick(listing);
        }
        googleMapRef.current?.panTo({ lat: listing.latitude, lng: listing.longitude });
      });

      markersRef.current.push(marker);
    });
  }, [listings, isLoaded, onMarkerClick, highlightedId]);

  // Pan to selected listing
  useEffect(() => {
    if (selectedListing && googleMapRef.current) {
      googleMapRef.current.panTo({
        lat: selectedListing.latitude,
        lng: selectedListing.longitude,
      });
      googleMapRef.current.setZoom(15);
    }
  }, [selectedListing]);

  if (!isLoaded) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log('Map not loaded yet - API Key present:', !!apiKey);
    
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Google Maps...</p>
          <p className="text-xs text-muted-foreground mt-2">
            {!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' 
              ? '⚠️ API Key not configured' 
              : 'Please wait...'}
          </p>
        </div>
      </div>
    );
  }

  // 處理搜尋框選擇位置
  const handleLocationSelect = (location: { latitude: number; longitude: number; address: string }) => {
    if (googleMapRef.current) {
      const newCenter = { lat: location.latitude, lng: location.longitude };
      googleMapRef.current.setCenter(newCenter);
      googleMapRef.current.setZoom(16);
      
      // 添加臨時標記
      const marker = new google.maps.Marker({
        position: newCenter,
        map: googleMapRef.current,
        title: location.address,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        },
      });
      
      // 5 秒後移除標記
      setTimeout(() => {
        marker.setMap(null);
      }, 5000);
      
      // 通知父組件位置搜尋
      if (onLocationSearch) {
        onLocationSearch({ lat: location.latitude, lng: location.longitude });
      }
    }
  };

  console.log('Map container rendering');
  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" />
      {isLoaded && (
        <MapSearchBox onLocationSelect={handleLocationSelect} />
      )}
    </div>
  );
}

