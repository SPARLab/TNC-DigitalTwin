// ============================================================================
// Live-alert rule catalog — declarative thresholds shown in the Alerts panel
// “what triggers this?” modal. Kept in sync with the publishing rules JSON.
// ============================================================================

import rawRules from './alertRules.json';

export type AlertRuleOp = '>' | '>=' | '<' | '<=' | '==' | '!=';

export interface AlertRuleCondition {
  stream: string;
  field: string;
  op: AlertRuleOp;
  threshold: number;
  unit: string;
}

export interface AlertRule {
  id: string;
  category: string;
  alert_type: string;
  severity: string;
  kind: 'single' | 'multi';
  test?: boolean;
  stream?: string;
  field?: string;
  op?: AlertRuleOp;
  threshold?: number;
  unit?: string;
  message: string;
  all_of?: AlertRuleCondition[];
}

export interface AlertRulesConfig {
  default_ttl_minutes: number;
  max_observation_age_minutes: number;
  rules: AlertRule[];
}

const config = rawRules as AlertRulesConfig;

export const alertRulesConfig: AlertRulesConfig = {
  default_ttl_minutes: config.default_ttl_minutes,
  max_observation_age_minutes: config.max_observation_age_minutes,
  rules: config.rules,
};

const FIELD_LABELS: Record<string, string> = {
  wind_speed_avg: 'Wind speed (avg)',
  relative_humidity_avg: 'Relative humidity (avg)',
  air_temp_avg: 'Air temperature (avg)',
};

const CATEGORY_ORDER = [
  'Wind',
  'Humidity',
  'Air Temperature',
  'Fire Weather',
  'Test',
];

export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field.replace(/_/g, ' ');
}

export function formatUnit(unit: string): string {
  if (unit === 'degC') return '°C';
  return unit;
}

export function interpolateRuleMessage(message: string, rule: AlertRule): string {
  const threshold = rule.threshold;
  const unit = rule.unit ? formatUnit(rule.unit) : '';
  return message
    .replaceAll('{threshold}', threshold === undefined ? '' : String(threshold))
    .replaceAll('{unit}', unit);
}

export function formatCondition(condition: AlertRuleCondition): string {
  return `${fieldLabel(condition.field)} ${condition.op} ${condition.threshold}${
    condition.unit === '%' ? '' : ' '
  }${formatUnit(condition.unit)}`;
}

/** Human-readable trigger line for a rule (single threshold or AND of conditions). */
export function formatRuleTrigger(rule: AlertRule): string {
  if (rule.kind === 'multi' && rule.all_of?.length) {
    return rule.all_of.map(formatCondition).join(' AND ');
  }

  if (
    rule.field !== undefined &&
    rule.op !== undefined &&
    rule.threshold !== undefined &&
    rule.unit !== undefined
  ) {
    return formatCondition({
      stream: rule.stream ?? '',
      field: rule.field,
      op: rule.op,
      threshold: rule.threshold,
      unit: rule.unit,
    });
  }

  return 'See description';
}

export interface AlertRuleCategoryGroup {
  category: string;
  rules: AlertRule[];
}

export function groupAlertRulesByCategory(
  rules: AlertRule[],
  { includeTest = true }: { includeTest?: boolean } = {},
): AlertRuleCategoryGroup[] {
  const filtered = includeTest ? rules : rules.filter((rule) => !rule.test);
  const groups = new Map<string, AlertRule[]>();

  for (const rule of filtered) {
    const category = rule.category.trim() || 'Uncategorized';
    const existing = groups.get(category);
    if (existing) {
      existing.push(rule);
      continue;
    }
    groups.set(category, [rule]);
  }

  return [...groups.entries()]
    .map(([category, rows]) => ({ category, rules: rows }))
    .sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.category);
      const bi = CATEGORY_ORDER.indexOf(b.category);
      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      }
      return a.category.localeCompare(b.category);
    });
}
