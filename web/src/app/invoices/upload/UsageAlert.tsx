import Link from "next/link";

interface Props {
  plan: string;
  used: number;
  limit: number;
  remaining: number;
  canSendToGestoria: boolean;
}

export default function UsageAlert({ plan, used, limit, remaining, canSendToGestoria }: Props) {
  const percentUsed = Math.round((used / limit) * 100);
  const isNearLimit = percentUsed >= 80;
  const isAtLimit = remaining === 0;
  const isFree = plan === "free";

  if (!isNearLimit && !isFree) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      {/* Alerta de límite */}
      {isAtLimit && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">🚫</span>
            <div className="flex-1">
              <p className="font-medium text-red-300">Has alcanzado el límite de facturas</p>
              <p className="mt-1 text-sm text-red-300/80">
                Tu plan {plan === "free" ? "gratuito" : plan} permite {limit} facturas por ciclo y ya has
                subido {used}. No podrás subir más facturas hasta que se reinicie tu ciclo (por ejemplo, en la
                próxima renovación) a menos que actualices el plan.
              </p>
              <Link
                href="/pricing"
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-red-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-600"
              >
                Mejorar plan ahora
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Aviso de cerca del límite */}
      {!isAtLimit && isNearLimit && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="font-medium text-amber-300">Te quedan pocas facturas</p>
              <p className="mt-1 text-sm text-amber-300/80">
                Has usado {used} de {limit} facturas en tu ciclo actual. Te quedan {remaining} antes de que
                bloqueemos nuevas subidas.
              </p>
              <Link
                href="/pricing"
                className="mt-2 text-xs text-amber-400 hover:underline"
              >
                Ver planes →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Aviso de funciones limitadas en plan gratuito */}
      {isFree && !canSendToGestoria && !isAtLimit && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div className="flex-1">
              <p className="font-medium text-slate-200">Plan gratuito</p>
              <p className="mt-1 text-sm text-slate-400">
                En el plan gratuito no puedes enviar facturas a tu gestoría directamente desde FaktuGo.
                Actualiza a Básico o Pro para habilitar el correo automático.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
