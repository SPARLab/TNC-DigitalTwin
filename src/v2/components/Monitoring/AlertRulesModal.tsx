// ============================================================================
// AlertRulesModal — explains what sensor thresholds open each live alert.
// ============================================================================

import { useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import {
  alertRulesConfig,
  formatRuleTrigger,
  groupAlertRulesByCategory,
  interpolateRuleMessage,
  type AlertRule,
} from '../../alerts/alertRules';
import {
  formatSeverityLabel,
  severityMarkerColor,
} from './internal/alertMarkerLayer';

interface AlertRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function severityCssColor(severity: string): string {
  const [r, g, b] = severityMarkerColor(severity);
  return `rgb(${r}, ${g}, ${b})`;
}

function RuleCard({ rule }: { rule: AlertRule }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h4 className="text-[12px] font-semibold text-gray-900">{rule.alert_type}</h4>
        <span
          className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white"
          style={{ backgroundColor: severityCssColor(rule.severity) }}
        >
          {formatSeverityLabel(rule.severity)}
        </span>
      </div>
      <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-gray-800">
        {formatRuleTrigger(rule)}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
        {interpolateRuleMessage(rule.message, rule)}
      </p>
    </article>
  );
}

export function AlertRulesModal({ isOpen, onClose }: AlertRulesModalProps) {
  const categories = useMemo(
    () =>
      groupAlertRulesByCategory(alertRulesConfig.rules, {
        includeTest: false,
      }),
    [],
  );

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-rules-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div className="min-w-0">
            <h2
              id="alert-rules-modal-title"
              className="text-sm font-semibold text-gray-900"
            >
              Alert trigger rules
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
              Thresholds that open live alerts. Readings older than{' '}
              {alertRulesConfig.max_observation_age_minutes} minutes are ignored;
              alerts expire after about {alertRulesConfig.default_ttl_minutes}{' '}
              minutes without a fresh match.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close alert rules"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="flex flex-col gap-4">
            {categories.map((group) => (
              <section key={group.category}>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {group.category}
                </h3>
                <div className="flex flex-col gap-2">
                  {group.rules.map((rule) => (
                    <RuleCard key={rule.id} rule={rule} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
