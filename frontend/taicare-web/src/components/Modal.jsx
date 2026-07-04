import React from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Dialog = styled.div`
  position: relative; /* needed so Close can position absolutely */
  background: ${({ theme }) => theme.colors.cardBg};
  border-radius: 8px;
  width: 90%;
  max-width: ${({ maxWidth }) => maxWidth || '400px'};
  max-height: 85vh;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Dialog itself is hidden, only body scrolls */
`;

const Close = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.fg};
  font-size: 1.5rem;
  position: absolute;
  top: 1rem;
  right: 1rem;
  cursor: pointer;
  z-index: 1010;
`;

export const ModalHeader = styled.div`
  padding: 2rem 2rem 0.5rem 2rem;
  flex-shrink: 0;
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    color: ${({ theme }) => theme.colors.text};
  }
`;

export const ModalBody = styled.div`
  padding: 0.75rem 2rem;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0; /* CRITICAL: Allows flex item to shrink and scroll */
  
  /* Prevent inner double scrollbars inside automodals */
  .ScrollCard, div[max-height] {
    max-height: none !important;
  }
`;

export const ModalFooter = styled.div`
  padding: 0.5rem 2rem 2rem 2rem;
  background: ${({ theme }) => theme.colors.cardBg};
  flex-shrink: 0;
  z-index: 1005;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  label {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
  }

  input,
  select,
  textarea {
    padding: 0.5rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 4px;
    font-size: 1rem;
    width: 100%;
    background: ${({ theme }) => theme.colors.buttonBg};
    color: ${({ theme }) => theme.colors.text};
  }
`;

// Helper function to recursively flatten React fragments
const flattenChildren = (children) => {
  const arr = React.Children.toArray(children);
  const result = [];
  arr.forEach((child) => {
    if (child && (child.type === React.Fragment || child.type?.toString() === 'Symbol(react.fragment)')) {
      result.push(...flattenChildren(child.props.children));
    } else if (child) {
      result.push(child);
    }
  });
  return result;
};

export default function Modal({ isOpen, onClose, children, maxWidth }) {
  if (!isOpen) return null;

  const childrenArray = flattenChildren(children);

  // If the modal has exactly 1 child (like <Wizard>), it handles its own full-height layout.
  // We render it directly with padding: 0 and overflow: hidden.
  if (childrenArray.length === 1) {
    return (
      <Overlay onClick={onClose}>
        <Dialog onClick={(e) => e.stopPropagation()} maxWidth={maxWidth} style={{ padding: 0 }}>
          <Close onClick={onClose}>&times;</Close>
          {children}
        </Dialog>
      </Overlay>
    );
  }

  // Extract header and footer automatically for flat children list
  let header = null;
  let footer = null;
  const body = [];

  childrenArray.forEach((child, index) => {
    if (index === 0 && child.type && typeof child.type === 'string' && /^h[1-6]$/i.test(child.type)) {
      header = child;
    } else if (index === childrenArray.length - 1) {
      footer = child;
    } else {
      body.push(child);
    }
  });

  // If first child was not a heading, it means we don't have a distinct header element. Put it back to body.
  if (!header) {
    body.unshift(childrenArray[0]);
  }

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()} maxWidth={maxWidth}>
        <Close onClick={onClose}>&times;</Close>
        {header && <ModalHeader>{header}</ModalHeader>}
        <ModalBody>{body}</ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </Dialog>
    </Overlay>
  );
}
