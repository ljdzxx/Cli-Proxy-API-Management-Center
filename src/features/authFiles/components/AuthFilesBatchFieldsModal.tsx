import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import type { AuthFileFieldsPatch } from '@/services/api';
import { parsePriorityValue } from '@/features/authFiles/constants';
import styles from '@/pages/AuthFilesPage.module.scss';

type AuthFileHeaders = Record<string, string>;
type HeadersErrorKey =
  | 'auth_files.headers_invalid_json'
  | 'auth_files.headers_invalid_object'
  | 'auth_files.headers_invalid_value';

export type AuthFilesBatchFieldsModalProps = {
  open: boolean;
  selectedCount: number;
  disableControls: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (fields: AuthFileFieldsPatch) => void | Promise<void>;
};

const isRecordObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const parseHeadersText = (
  text: string
): { value: AuthFileHeaders | null; errorKey: HeadersErrorKey | null } => {
  const trimmed = text.trim();
  if (!trimmed) {
    return { value: null, errorKey: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { value: null, errorKey: 'auth_files.headers_invalid_json' };
  }

  if (!isRecordObject(parsed)) {
    return { value: null, errorKey: 'auth_files.headers_invalid_object' };
  }
  if (!Object.values(parsed).every((item) => typeof item === 'string')) {
    return { value: null, errorKey: 'auth_files.headers_invalid_value' };
  }

  return { value: parsed as AuthFileHeaders, errorKey: null };
};

const parseExcludedModelsText = (text: string): string[] => {
  const seen = new Set<string>();
  const models: string[] = [];
  text.split(/[,\n\r]+/).forEach((item) => {
    const model = item.trim().toLowerCase();
    if (!model || seen.has(model)) return;
    seen.add(model);
    models.push(model);
  });
  return models.sort((a, b) => a.localeCompare(b));
};

export function AuthFilesBatchFieldsModal(props: AuthFilesBatchFieldsModalProps) {
  const { t } = useTranslation();
  const { open, selectedCount, disableControls, saving, onClose, onSave } = props;
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [proxyUrl, setProxyUrl] = useState('');
  const [priorityEnabled, setPriorityEnabled] = useState(false);
  const [priority, setPriority] = useState('');
  const [headersEnabled, setHeadersEnabled] = useState(false);
  const [headersText, setHeadersText] = useState('');
  const [excludedModelsEnabled, setExcludedModelsEnabled] = useState(false);
  const [excludedModelsText, setExcludedModelsText] = useState('');
  const [rateLimitEnabled, setRateLimitEnabled] = useState(false);
  const [rateLimitMaxRequests, setRateLimitMaxRequests] = useState('');
  const [rateLimitWindowSeconds, setRateLimitWindowSeconds] = useState('');

  const headersParseResult = useMemo(() => parseHeadersText(headersText), [headersText]);
  const headersError = headersEnabled
    ? headersParseResult.errorKey
      ? t(headersParseResult.errorKey)
      : null
    : null;
  const priorityTrimmed = priority.trim();
  const parsedPriority = priorityEnabled ? parsePriorityValue(priorityTrimmed) : undefined;
  const priorityError =
    priorityEnabled && priorityTrimmed && parsedPriority === undefined
      ? t('auth_files.batch_fields_priority_invalid')
      : null;
  const rateLimitMaxTrimmed = rateLimitMaxRequests.trim();
  const rateLimitWindowTrimmed = rateLimitWindowSeconds.trim();
  const parsedRateLimitMax = rateLimitMaxTrimmed ? Number(rateLimitMaxTrimmed) : 0;
  const parsedRateLimitWindow = rateLimitWindowTrimmed ? Number(rateLimitWindowTrimmed) : 0;
  const rateLimitError =
    rateLimitEnabled &&
    ((rateLimitMaxTrimmed && (!Number.isInteger(parsedRateLimitMax) || parsedRateLimitMax < 0)) ||
      (rateLimitWindowTrimmed &&
        (!Number.isInteger(parsedRateLimitWindow) || parsedRateLimitWindow < 0)))
      ? t('auth_files.batch_fields_rate_limit_invalid')
      : null;

  const patch = useMemo<AuthFileFieldsPatch>(() => {
    const next: AuthFileFieldsPatch = {};
    if (proxyEnabled) {
      next.proxy_url = proxyUrl.trim();
    }
    if (priorityEnabled) {
      next.priority = priorityTrimmed ? (parsedPriority ?? 0) : 0;
    }
    if (headersEnabled && headersParseResult.value) {
      next.headers = headersParseResult.value;
    }
    if (excludedModelsEnabled) {
      next.excluded_models = parseExcludedModelsText(excludedModelsText);
    }
    if (rateLimitEnabled) {
      next.rate_limit_max_requests = parsedRateLimitMax;
      next.rate_limit_window_seconds = parsedRateLimitWindow;
    }
    return next;
  }, [
    headersEnabled,
    headersParseResult.value,
    excludedModelsEnabled,
    excludedModelsText,
    parsedPriority,
    parsedRateLimitMax,
    parsedRateLimitWindow,
    priorityEnabled,
    priorityTrimmed,
    rateLimitEnabled,
    proxyEnabled,
    proxyUrl,
  ]);

  const dirty = Object.keys(patch).length > 0;
  const blocked = Boolean(priorityError || headersError || rateLimitError);

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeDisabled={saving}
      width={620}
      title={t('auth_files.batch_fields_title')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => void onSave(patch)}
            loading={saving}
            disabled={disableControls || saving || selectedCount === 0 || !dirty || blocked}
          >
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className={styles.prefixProxyEditor}>
        <div className={styles.batchFieldsHint}>
          {t('auth_files.batch_fields_desc', { count: selectedCount })}
        </div>

        <div className={styles.batchFieldsRow}>
          <ToggleSwitch
            checked={proxyEnabled}
            onChange={setProxyEnabled}
            disabled={saving}
            ariaLabel={t('auth_files.batch_fields_apply_proxy')}
            label={t('auth_files.batch_fields_apply_proxy')}
          />
          <Input
            label={t('auth_files.proxy_url_label')}
            value={proxyUrl}
            placeholder={t('auth_files.proxy_url_placeholder')}
            disabled={!proxyEnabled || disableControls || saving}
            onChange={(e) => setProxyUrl(e.target.value)}
          />
          <div className="hint">{t('auth_files.batch_fields_proxy_hint')}</div>
        </div>

        <div className={styles.batchFieldsRow}>
          <ToggleSwitch
            checked={priorityEnabled}
            onChange={setPriorityEnabled}
            disabled={saving}
            ariaLabel={t('auth_files.batch_fields_apply_priority')}
            label={t('auth_files.batch_fields_apply_priority')}
          />
          <Input
            label={t('auth_files.priority_label')}
            value={priority}
            placeholder={t('auth_files.priority_placeholder')}
            hint={t('auth_files.batch_fields_priority_hint')}
            disabled={!priorityEnabled || disableControls || saving}
            onChange={(e) => setPriority(e.target.value)}
          />
          {priorityError && <div className="error-box">{priorityError}</div>}
        </div>

        <div className={styles.batchFieldsRow}>
          <ToggleSwitch
            checked={headersEnabled}
            onChange={setHeadersEnabled}
            disabled={saving}
            ariaLabel={t('auth_files.batch_fields_apply_headers')}
            label={t('auth_files.batch_fields_apply_headers')}
          />
          <div className="form-group">
            <label>{t('auth_files.headers_label')}</label>
            <textarea
              className={`input ${headersError ? styles.prefixProxyTextareaInvalid : ''}`}
              value={headersText}
              placeholder={t('auth_files.headers_placeholder')}
              rows={5}
              aria-invalid={Boolean(headersError)}
              disabled={!headersEnabled || disableControls || saving}
              onChange={(e) => setHeadersText(e.target.value)}
            />
            {headersError && <div className="error-box">{headersError}</div>}
            <div className="hint">{t('auth_files.batch_fields_headers_hint')}</div>
          </div>
        </div>

        <div className={styles.batchFieldsRow}>
          <ToggleSwitch
            checked={excludedModelsEnabled}
            onChange={setExcludedModelsEnabled}
            disabled={saving}
            ariaLabel={t('auth_files.batch_fields_apply_excluded_models')}
            label={t('auth_files.batch_fields_apply_excluded_models')}
          />
          <div className="form-group">
            <label>{t('auth_files.excluded_models_label')}</label>
            <textarea
              className="input"
              value={excludedModelsText}
              placeholder={t('auth_files.excluded_models_placeholder')}
              rows={5}
              disabled={!excludedModelsEnabled || disableControls || saving}
              onChange={(e) => setExcludedModelsText(e.target.value)}
            />
            <div className="hint">{t('auth_files.batch_fields_excluded_models_hint')}</div>
          </div>
        </div>

        <div className={styles.batchFieldsRow}>
          <ToggleSwitch
            checked={rateLimitEnabled}
            onChange={setRateLimitEnabled}
            disabled={saving}
            ariaLabel={t('auth_files.batch_fields_apply_rate_limit')}
            label={t('auth_files.batch_fields_apply_rate_limit')}
          />
          <div className={styles.batchFieldsInline}>
            <Input
              label={t('auth_files.rate_limit_max_requests_label')}
              value={rateLimitMaxRequests}
              placeholder={t('auth_files.rate_limit_max_requests_placeholder')}
              disabled={!rateLimitEnabled || disableControls || saving}
              onChange={(e) => setRateLimitMaxRequests(e.target.value)}
            />
            <Input
              label={t('auth_files.rate_limit_window_seconds_label')}
              value={rateLimitWindowSeconds}
              placeholder={t('auth_files.rate_limit_window_seconds_placeholder')}
              disabled={!rateLimitEnabled || disableControls || saving}
              onChange={(e) => setRateLimitWindowSeconds(e.target.value)}
            />
          </div>
          {rateLimitError && <div className="error-box">{rateLimitError}</div>}
          <div className="hint">{t('auth_files.batch_fields_rate_limit_hint')}</div>
        </div>
      </div>
    </Modal>
  );
}
