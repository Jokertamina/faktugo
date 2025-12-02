'use client';

import { useState, useEffect } from "react";
import Link from "next/link";

interface CookiePreferences {
  necessary: boolean; // siempre true
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = "faktugo_cookie_consent";

function getStoredConsent(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function storeConsent(preferences: CookiePreferences) {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
    // También guardar como cookie para que el servidor pueda leerla
    document.cookie = `${COOKIE_CONSENT_KEY}=${JSON.stringify(preferences)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  } catch {}
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      setVisible(true);
    } else {
      setPreferences(stored);
    }
  }, []);

  function handleAcceptAll() {
    const allAccepted: CookiePreferences = {
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    storeConsent(allAccepted);
    setVisible(false);
  }

  function handleAcceptNecessary() {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
    };
    setPreferences(onlyNecessary);
    storeConsent(onlyNecessary);
    setVisible(false);
  }

  function handleSavePreferences() {
    storeConsent(preferences);
    setVisible(false);
    setShowConfig(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-700 bg-[#0B1220] p-4 shadow-2xl shadow-black/60 sm:p-6">
        {!showConfig ? (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-50">
                  🍪 Utilizamos cookies
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  Usamos cookies propias y de terceros para mejorar tu experiencia, analizar el uso
                  del sitio y mostrarte contenido personalizado. Puedes aceptar todas, solo las
                  necesarias, o configurar tus preferencias.
                </p>
                <Link
                  href="/legal/cookies"
                  className="mt-2 inline-block text-xs text-blue-400 hover:underline"
                >
                  Más información sobre cookies
                </Link>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  onClick={() => setShowConfig(true)}
                  className="rounded-full border border-slate-600 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Configurar
                </button>
                <button
                  onClick={handleAcceptNecessary}
                  className="rounded-full border border-slate-600 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Solo necesarias
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="rounded-full bg-[#22CC88] px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-[#18a96f]"
                >
                  Aceptar todas
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-50">Configurar cookies</h3>
              <button
                onClick={() => setShowConfig(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Necesarias */}
              <div className="flex items-start justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-emerald-300">Cookies necesarias</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Esenciales para el funcionamiento del sitio. Incluyen autenticación y seguridad.
                  </p>
                </div>
                <div className="ml-3">
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                    Siempre activas
                  </span>
                </div>
              </div>

              {/* Preferencias */}
              <label className="flex cursor-pointer items-start justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-200">Cookies de preferencias</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Recuerdan tus preferencias como idioma o tema visual.
                  </p>
                </div>
                <div className="ml-3">
                  <input
                    type="checkbox"
                    checked={preferences.preferences}
                    onChange={(e) =>
                      setPreferences({ ...preferences, preferences: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-[#22CC88] focus:ring-0"
                  />
                </div>
              </label>

              {/* Analíticas */}
              <label className="flex cursor-pointer items-start justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-200">Cookies analíticas</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Nos ayudan a entender cómo usas el sitio para mejorarlo (Google Analytics).
                  </p>
                </div>
                <div className="ml-3">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({ ...preferences, analytics: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-[#22CC88] focus:ring-0"
                  />
                </div>
              </label>

              {/* Marketing */}
              <label className="flex cursor-pointer items-start justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-200">Cookies de marketing</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Permiten mostrarte anuncios relevantes y medir campañas publicitarias.
                  </p>
                </div>
                <div className="ml-3">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences({ ...preferences, marketing: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-[#22CC88] focus:ring-0"
                  />
                </div>
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={handleAcceptNecessary}
                className="rounded-full border border-slate-600 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Rechazar opcionales
              </button>
              <button
                onClick={handleSavePreferences}
                className="rounded-full bg-[#22CC88] px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-[#18a96f]"
              >
                Guardar preferencias
              </button>
            </div>

            <p className="mt-3 text-center text-xs text-slate-500">
              <Link href="/legal/cookies" className="hover:underline">
                Ver política de cookies completa
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// Componente para reabrir el banner desde el footer
export function CookieSettingsButton() {
  function handleOpen() {
    // Eliminar el consentimiento para que el banner vuelva a aparecer
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    window.location.reload();
  }

  return (
    <button
      onClick={handleOpen}
      className="text-slate-400 hover:text-slate-200 text-sm"
    >
      Configurar cookies
    </button>
  );
}
