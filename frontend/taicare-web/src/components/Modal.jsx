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
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  label {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.fg};
  }

  input,
  select {
    padding: 0.5rem;
    border: 1px solid ${({ theme }) => theme.colors.fg};
    border-radius: 4px;
    font-size: 1rem;
    width: 100%;
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.fg};
  }
`;

export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <Close onClick={onClose}>&times;</Close>
        {children}
      </Dialog>
    </Overlay>
  );
}
