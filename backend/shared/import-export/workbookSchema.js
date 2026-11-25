'use strict';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IMPORT_MODES = Object.freeze(['create-only', 'update-only', 'upsert']);

function isBlank(value) {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

function validateField(value, rule) {
  if (isBlank(value)) return rule.required ? 'Required value is missing' : null;
  // Excel formula cells are never accepted as authoritative import values.
  if (value && typeof value === 'object') return 'Formula or non-primitive cell values are not accepted';
  const v = typeof value === 'string' ? value.trim() : value;
  if (rule.type === 'string' && typeof v !== 'string') return 'Must be text';
  if (rule.type === 'email' && (typeof v !== 'string' || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v))) return 'Invalid email address';
  if (rule.type === 'uuid' && (typeof v !== 'string' || !UUID_RE.test(v))) return 'Must be a valid record UUID';
  if (rule.type === 'date' && !(v instanceof Date) && (typeof v !== 'string' || Number.isNaN(Date.parse(v)))) return 'Must be a valid date';
  if (rule.type === 'boolean' && typeof v !== 'boolean' && !['true', 'false', '1', '0', 'yes', 'no'].includes(String(v).toLowerCase())) return 'Must be true or false';
  if (rule.type === 'integer' && (!Number.isInteger(Number(v)))) return 'Must be a whole number';
  if (rule.type === 'number' && !Number.isFinite(Number(v))) return 'Must be a number';
  if (rule.enum && !rule.enum.includes(String(v))) return `Must be one of: ${rule.enum.join(', ')}`;
  if (rule.maxLength && String(v).length > rule.maxLength) return `Must be at most ${rule.maxLength} characters`;
  if (rule.min !== undefined && Number(v) < rule.min) return `Must be at least ${rule.min}`;
  if (rule.max !== undefined && Number(v) > rule.max) return `Must be at most ${rule.max}`;
  return null;
}

function validateWorkbookData(schema, sheets, options = {}) {
  const errors = [];
  const mode = options.mode || 'create-only';
  if (!IMPORT_MODES.includes(mode)) {
    return { valid: false, errors: [{ sheet: 'Instructions', row: 0, field: 'mode', message: 'Unsupported import mode' }] };
  }

  const knownSheets = new Set(schema.sheets.map((sheet) => sheet.name));
  for (const name of Object.keys(sheets || {})) {
    if (!knownSheets.has(name)) errors.push({ sheet: name, row: 0, field: '', message: 'Unknown worksheet' });
  }

  const normalized = {};
  for (const definition of schema.sheets) {
    const rows = Array.isArray(sheets?.[definition.name]) ? sheets[definition.name] : [];
    normalized[definition.name] = rows;
    const seenKeys = new Set();
    rows.forEach((row, index) => {
      const rowNumber = index + 2;
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        errors.push({ sheet: definition.name, row: rowNumber, field: '', message: 'Row must contain named columns' });
        return;
      }
      for (const [field, rule] of Object.entries(definition.fields)) {
        const message = validateField(row[field], rule);
        if (message) errors.push({ sheet: definition.name, row: rowNumber, field, message });
      }
      const key = row[definition.key];
      if (!isBlank(key)) {
        const normalizedKey = String(key).trim().toLowerCase();
        if (seenKeys.has(normalizedKey)) errors.push({ sheet: definition.name, row: rowNumber, field: definition.key, message: 'Duplicate key in worksheet' });
        seenKeys.add(normalizedKey);
      }
    });
  }

  const parentDefinition = schema.sheets.find((sheet) => sheet.name === 'Employees');
  const parentRows = normalized[parentDefinition?.name] || [];
  const parentKeys = new Set(parentRows.map((row) => String(row?.[parentDefinition.key] || '').trim().toLowerCase()).filter(Boolean));

  for (const definition of schema.sheets.filter((sheet) => sheet.parent)) {
    const seenRecordIds = new Set();
    (normalized[definition.name] || []).forEach((row, index) => {
      const employeeCode = String(row?.[definition.parent.field] || '').trim().toLowerCase();
      const rowNumber = index + 2;
      if (!parentKeys.has(employeeCode)) {
        errors.push({ sheet: definition.name, row: rowNumber, field: definition.parent.field, message: 'Employee Code does not match a row in the Employees worksheet' });
      }
      const recordId = row?.recordId;
      if (!isBlank(recordId)) {
        const id = String(recordId).toLowerCase();
        if (seenRecordIds.has(id)) errors.push({ sheet: definition.name, row: rowNumber, field: 'recordId', message: 'Duplicate record ID in worksheet' });
        seenRecordIds.add(id);
      }
    });
  }

  return { valid: errors.length === 0, errors, rowCount: Object.values(normalized).reduce((sum, rows) => sum + rows.length, 0) };
}

module.exports = { IMPORT_MODES, validateWorkbookData };
