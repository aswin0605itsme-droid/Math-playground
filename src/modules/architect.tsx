import React from 'react';
import { createRoot } from 'react-dom/client';
import { ArchitectConsole } from './ArchitectConsole';

export async function initArchitect(container: HTMLElement) {
  const root = createRoot(container);
  root.render(React.createElement(ArchitectConsole));
  
  return {
    unmount: () => {
      root.unmount();
    }
  };
}
