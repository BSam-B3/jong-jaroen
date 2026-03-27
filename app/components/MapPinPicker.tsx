'use client';
import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface MapPinPickerProps {
  label: string;
  placeholder: string;
  onLocationSelect: (address: string, lat: number, lng: number) => void;
  value?: string;
}

let loaderInstance: Loader | null = null;

function getLoader(): Loader {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places'],
      language: 'th',
      region: 'TH',
    });
  }
  return loaderInstance;
}

export default function MapPinPicker({ label, placeholder, onLocationSelect, value }: MapPinPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value || '');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (value !== undefined) setInputValue(value);
  }, [value]);

  useEffect(() => {
    let isMounted = true;
    getLoader()
      .load()
      .then(() => {
        if (!isMounted || !inputRef.current) return;
        setIsLoaded(true);
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'TH' },
          fields: ['formatted_address', 'geometry', 'name'],
        });
        autocompleteRef.current = autocomplete;
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry?.location) return;
          const address = place.name || place.formatted_address || '';
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          setInputValue(address);
          onLocationSelect(address, lat, lng);
        });
      })
      .catch((err) => console.error('Maps load error:', err));
    return () => { isMounted = false; };
  }, [onLocationSelect]);

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-600 pl-1 flex items-center gap-1">
        <span className="text-base">📍</span> {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isLoaded ? placeholder : 'กำลังโหลด Maps...'}
          disabled={!isLoaded}
          className="w-full border border-gray-200 rounded-[1.25rem] px-4 py-3 text-sm focus:border-[#EE4D2D] focus:ring-2 focus:ring-[#EE4D2D]/20 outline-none transition-all disabled:opacity-50 disabled:bg-gray-50"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              onLocationSelect('', 0, 0);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs hover:bg-gray-300"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
