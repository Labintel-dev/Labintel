import React from 'react';
import { createPortal } from 'react-dom';

/**
 * PrintPortal Component
 * Renders its children into the #print-root element for clean printing.
 */
const PrintPortal = ({ children }) => {
  const mountPoint = document.getElementById('print-root');
  if (!mountPoint) return null;
  return createPortal(children, mountPoint);
};

export default PrintPortal;
