import React from 'react';

export default function Stepper({ steps, current }) {
  return (
    <div className="stepper">
      {steps.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : '';
        return (
          <div key={i} className={`step ${state}`}>
            <div className="step-circle">
              {i < current ? <CheckIcon /> : i + 1}
            </div>
            <div className="step-label">{step}</div>
          </div>
        );
      })}
    </div>
  );
}

function CheckIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
