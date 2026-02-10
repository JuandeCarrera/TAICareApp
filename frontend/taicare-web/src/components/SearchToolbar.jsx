// src/components/SearchToolbar.jsx
import React, { useMemo } from 'react';
import styled, { useTheme } from 'styled-components';

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;

  > * {
    flex: 1 1 260px;
    min-width: 220px;
  }
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text};

  span {
    opacity: 0.9;
  }
`;

const baseInput = `
  width: 100%;
  height: 38px;
  padding: 0 .75rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  outline: none;
  transition: border-color .15s ease, background .15s ease, color .15s ease;

  &::placeholder { color: var(--hint); }
  &:focus { border-color: var(--primary); }
`;

const TextInput = styled.input`
  ${baseInput}
`;

const Select = styled.select`
  ${baseInput}
  padding-right: 2rem;
  appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, var(--text) 50%),
    linear-gradient(135deg, var(--text) 50%, transparent 50%);
  background-position:
    calc(100% - 16px) calc(50% - 3px),
    calc(100% - 11px) calc(50% - 3px);
  background-size:
    6px 6px,
    6px 6px;
  background-repeat: no-repeat;
`;

// Forzamos colores del menú de opciones (Chromium/Firefox lo respetan)
const Option = styled.option`
  background: var(--bg);
  color: var(--text);
`;

const DateInput = styled.input.attrs({ type: 'date' })`
  ${baseInput}
  &::-webkit-calendar-picker-indicator {
    filter: invert(var(--invert));
  }
`;

const SwitchWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 38px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  padding: 0 0.75rem;
  border-radius: 8px;
  input {
    accent-color: var(--primary);
  }
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  border-radius: 8px;
  min-height: 38px;

  button {
    border: 1px solid var(--border);
    background: ${({ theme }) => theme.colors.cardBg};
    color: var(--text);
    border-radius: 999px;
    padding: 0.15rem 0.5rem;
    cursor: pointer;
  }
`;

const ClearBtn = styled.button`
  flex: 0 0 auto;
  margin-left: auto; /* anclado a la derecha de la última fila */
  height: 38px;
  padding: 0 0.9rem;
  border-radius: 8px;
  border: 1px solid var(--primary);
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  cursor: pointer;
  transition: opacity 0.15s ease;
  &:hover {
    opacity: 0.9;
  }
`;

const SortWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export default function SearchToolbar({
  query,
  onQueryChange,
  placeholder = 'Buscar por texto (título, mensaje, tipo, habitación)',
  filters = [],
  values = {},
  onValuesChange = () => {},
  sortOptions = [],
  sort,
  onSortChange = () => {},
  onClear = () => {},
}) {
  const theme = useTheme();

  // Variables CSS derivadas del tema (claro/oscuro)
  const cssVars = useMemo(
    () => ({
      '--bg': theme.isDark
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(15, 23, 42, 0.06)',
      '--text': theme.colors.text,
      '--border': theme.colors.border,
      '--hint': theme.colors.textSecondary || 'rgba(255,255,255,.6)',
      '--primary': theme.colors.primary,
      '--invert': theme.isDark ? 1 : 0,
    }),
    [theme]
  );

  return (
    <Bar style={cssVars}>
      {/* búsqueda libre */}
      <Field>
        <span> </span>
        <TextInput
          value={query}
          placeholder={placeholder}
          onChange={(e) => onQueryChange(e.target.value)}
          style={cssVars}
        />
      </Field>

      {/* filtros */}
      {filters.map((f) => {
        if (f.type === 'select') {
          return (
            <Field key={f.key}>
              <span>{f.label}</span>
              <Select
                value={values[f.key] ?? ''}
                onChange={(e) =>
                  onValuesChange({ ...values, [f.key]: e.target.value })
                }
                style={cssVars}
              >
                {(f.options || []).map((opt) => (
                  <Option
                    key={String(opt.value)}
                    value={opt.value}
                    style={cssVars}
                  >
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Field>
          );
        }

        if (f.type === 'daterange') {
          return (
            <Field key={f.key}>
              <span>Fecha</span>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <DateInput
                  value={values[f.fromKey] || ''}
                  onChange={(e) =>
                    onValuesChange({ ...values, [f.fromKey]: e.target.value })
                  }
                  style={cssVars}
                  placeholder="Desde"
                />
                <DateInput
                  value={values[f.toKey] || ''}
                  onChange={(e) =>
                    onValuesChange({ ...values, [f.toKey]: e.target.value })
                  }
                  style={cssVars}
                  placeholder="Hasta"
                />
              </div>
            </Field>
          );
        }

        if (f.type === 'switch') {
          return (
            <Field key={f.key}>
              <span>{f.label}</span>
              <SwitchWrap style={cssVars}>
                <input
                  type="checkbox"
                  checked={!!values[f.key]}
                  onChange={(e) =>
                    onValuesChange({ ...values, [f.key]: e.target.checked })
                  }
                />
                <span>{values[f.key] ? 'Sí' : 'No'}</span>
              </SwitchWrap>
            </Field>
          );
        }

        if (f.type === 'taglist') {
          const selected = new Set(values[f.key] || []);
          const toggle = (v) => {
            const next = new Set(selected);
            if (next.has(v)) next.delete(v);
            else next.add(v);
            onValuesChange({ ...values, [f.key]: Array.from(next) });
          };
          return (
            <Field key={f.key}>
              <span>{f.label}</span>
              <TagList style={cssVars}>
                {(f.options || []).map((opt) => {
                  const active = selected.has(opt.value);
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => toggle(opt.value)}
                      style={{
                        background: active ? 'rgba(59,130,246,.12)' : undefined,
                        borderColor: active
                          ? 'rgba(59,130,246,.35)'
                          : undefined,
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </TagList>
            </Field>
          );
        }

        return null;
      })}

      {/* orden */}
      {sortOptions.length > 0 && (
        <SortWrap style={{ flex: '1 1 220px', minWidth: 220 }}>
          <span>Orden</span>
          <Select
            value={sort || ''}
            onChange={(e) => onSortChange(e.target.value)}
            style={cssVars}
          >
            {sortOptions.map((o) => (
              <Option key={o.value} value={o.value} style={cssVars}>
                {o.label}
              </Option>
            ))}
          </Select>
        </SortWrap>
      )}

      {/* limpiar */}
      <ClearBtn onClick={onClear}>Limpiar</ClearBtn>
    </Bar>
  );
}
