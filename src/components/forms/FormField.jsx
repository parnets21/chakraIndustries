import React from 'react';

const inputStyle = {
  width: '100%',
  padding: '9px 13px',
  border: '1.5px solid #e2e8f0',
  borderRadius: 9,
  fontSize: 13,
  fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
  color: '#1c2833',
  background: '#fff',
  outline: 'none',
  transition: 'border-color 0.18s, box-shadow 0.18s',
  boxSizing: 'border-box',
};

const focusStyle = {
  borderColor: '#c0392b',
  boxShadow: '0 0 0 3px rgba(192,57,43,0.1)',
};

export function FormField({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', letterSpacing: '0.2px' }}>
          {label}{required && <span style={{ color: '#e74c3c', marginLeft: 2 }}>*</span>}
        </label>
      )}
      {children}
    </div>
  );
}

export function Input({ label, required, ...props }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <FormField label={label} required={required}>
      <input
        {...props}
        style={{ ...inputStyle, ...(focused ? focusStyle : {}), ...props.style }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </FormField>
  );
}

export function Select({ label, required, children, ...props }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <FormField label={label} required={required}>
      <select
        {...props}
        style={{ ...inputStyle, ...(focused ? focusStyle : {}), ...props.style }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {children}
      </select>
    </FormField>
  );
}

export function Textarea({ label, required, ...props }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <FormField label={label} required={required}>
      <textarea
        {...props}
        style={{ ...inputStyle, ...(focused ? focusStyle : {}), minHeight: 80, resize: 'vertical', ...props.style }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </FormField>
  );
}

export function Grid2({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
      {children}
    </div>
  );
}

export function ModalBtn({ variant = 'primary', onClick, children, type = 'button' }) {
  const [hovered, setHovered] = React.useState(false);
  const styles = {
    primary: {
      base: { background: 'linear-gradient(135deg,#e74c3c,#c0392b)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(192,57,43,0.3)' },
      hover: { boxShadow: '0 4px 14px rgba(192,57,43,0.4)', transform: 'translateY(-1px)' },
    },
    outline: {
      base: { background: 'transparent', color: '#c0392b', border: '1.5px solid #c0392b' },
      hover: { background: '#c0392b', color: '#fff' },
    },
    success: {
      base: { background: 'linear-gradient(135deg,#2ecc71,#27ae60)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(39,174,96,0.25)' },
      hover: { boxShadow: '0 4px 14px rgba(39,174,96,0.35)', transform: 'translateY(-1px)' },
    },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '9px 20px',
        borderRadius: 9,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
        transition: 'all 0.18s ease',
        ...s.base,
        ...(hovered ? s.hover : {}),
      }}
    >
      {children}
    </button>
  );
}
