'use client';

import React, { useEffect, useState } from 'react';
import { Crosshair, MapPin, Search } from 'lucide-react';
import {
  DEFAULT_REGION_OPTIONS,
  findNearestRegion,
  getRegionByKey,
  type RegionOption,
} from '../lib/regions';

interface RegionSelectorProps {
  value?: string;
  onChange: (region: RegionOption) => void;
  disabled?: boolean;
  autoDetect?: boolean;
  label?: string;
  hint?: string;
}

const RegionSelector: React.FC<RegionSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  autoDetect = false,
  label = 'Regiao',
  hint,
}) => {
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [regionsLoaded, setRegionsLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [hasAttemptedAutoDetect, setHasAttemptedAutoDetect] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchRegions = async () => {
      try {
        const response = await fetch('/api/regions', { cache: 'no-store' });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? 'Nao foi possivel carregar regioes.');
        }

        if (!ignore) {
          setRegions(Array.isArray(payload?.regions) ? payload.regions : DEFAULT_REGION_OPTIONS);
        }
      } catch (error) {
        console.error('Failed to load regions:', error);

        if (!ignore) {
          setRegions(DEFAULT_REGION_OPTIONS);
        }
      } finally {
        if (!ignore) {
          setRegionsLoaded(true);
        }
      }
    };

    fetchRegions();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!autoDetect || hasAttemptedAutoDetect || value || disabled || !regionsLoaded || regions.length === 0) {
      return;
    }

    setHasAttemptedAutoDetect(true);
    void detectUserRegion();
  }, [autoDetect, disabled, hasAttemptedAutoDetect, regionsLoaded, value]);

  const detectUserRegion = async () => {
    if (regionsLoaded && regions.length === 0) {
      setLocationNotice('Nenhuma regiao ativa disponivel no momento. Fale com o administrador.');
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationNotice('Seu navegador nao suporta geolocalizacao. Escolha a regiao manualmente.');
      return;
    }

    setIsLocating(true);
    setLocationNotice(null);

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nearestRegion = findNearestRegion(
            position.coords.latitude,
            position.coords.longitude,
            regions,
          );
          onChange(nearestRegion);
          setLocationNotice(`Regiao sugerida: ${nearestRegion.label}. Voce pode trocar abaixo.`);
          resolve();
        },
        () => {
          setLocationNotice('Nao foi possivel detectar sua localizacao. Escolha a regiao manualmente.');
          resolve();
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        },
      );
    });

    setIsLocating(false);
  };

  const regionPool = regionsLoaded ? regions : DEFAULT_REGION_OPTIONS;

  const filteredRegions = regionPool.filter((region) => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return true;
    }

    return (
      region.label.toLowerCase().includes(normalizedSearch) ||
      region.city.toLowerCase().includes(normalizedSearch) ||
      region.state.toLowerCase().includes(normalizedSearch)
    );
  });
  const selectedRegion = getRegionByKey(value, regionPool);
  const visibleRegions =
    selectedRegion && !filteredRegions.some((region) => region.key === selectedRegion.key)
      ? [selectedRegion, ...filteredRegions]
      : filteredRegions;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-700">{label}</p>
          {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => void detectUserRegion()}
          disabled={disabled || isLocating}
          className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-[#004691] disabled:opacity-60"
        >
          <Crosshair size={14} />
          {isLocating ? 'Localizando...' : 'Usar localizacao'}
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar regiao"
          disabled={disabled}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#004691]"
        />
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>

      <select
        value={value || ''}
        onChange={(event) => {
          const region = getRegionByKey(event.target.value, regionPool);
          if (region) {
            onChange(region);
          }
        }}
        disabled={disabled}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#004691]"
      >
        <option value="" disabled>
          Selecione uma regiao
        </option>
        {visibleRegions.map((region) => (
          <option key={region.key} value={region.key}>
            {region.label}
          </option>
        ))}
      </select>

      {selectedRegion ? (
        <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
          <MapPin size={16} className="text-[#004691]" />
          {selectedRegion.label}
        </div>
      ) : null}

      {locationNotice ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          {locationNotice}
        </div>
      ) : null}
    </div>
  );
};

export default RegionSelector;
