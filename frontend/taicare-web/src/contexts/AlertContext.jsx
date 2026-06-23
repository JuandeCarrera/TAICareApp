import React, { createContext, useState, useContext } from 'react';
import Modal from '../components/Modal.jsx';
import styled from 'styled-components';
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

const AlertContext = createContext();

const DialogContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding-top: 1rem;
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  
  ${({ $type }) =>
    $type === 'confirm'
      ? `
          background: rgba(14, 165, 233, 0.15);
          color: #0ea5e9;
        `
      : $type === 'success'
      ? `
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        `
      : `
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        `}
`;

const MessageText = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  line-height: 1.5;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  width: 100%;
  margin-top: 0.5rem;
`;

const Btn = styled.button`
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  
  ${({ $variant, theme }) =>
    $variant === 'danger'
      ? `
          background: #ef4444;
          color: #fff;
          border: 1px solid #ef4444;
        `
      : $variant === 'primary'
      ? `
          background: ${theme.colors.primary};
          color: #fff;
          border: 1px solid ${theme.colors.primary};
        `
      : `
          background: transparent;
          color: ${theme.colors.text};
          border: 1px solid ${theme.colors.border};
        `}
        
  &:hover {
    opacity: 0.85;
  }
`;

export function AlertProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    type: 'alert', // 'alert' | 'confirm' | 'success'
    message: '',
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = (message, type = 'alert') => {
    return new Promise((resolve) => {
      setConfig({
        type,
        message,
        onConfirm: () => {
          setIsOpen(false);
          resolve(true);
        },
        onCancel: null,
      });
      setIsOpen(true);
    });
  };

  const showConfirm = (message) => {
    return new Promise((resolve) => {
      setConfig({
        type: 'confirm',
        message,
        onConfirm: () => {
          setIsOpen(false);
          resolve(true);
        },
        onCancel: () => {
          setIsOpen(false);
          resolve(false);
        },
      });
      setIsOpen(true);
    });
  };

  const handleClose = () => {
    if (config.onCancel) {
      config.onCancel();
    } else if (config.onConfirm) {
      config.onConfirm();
    }
    setIsOpen(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <Modal isOpen={isOpen} onClose={handleClose} maxWidth="360px">
        <DialogContent>
          <IconContainer $type={config.type}>
            {config.type === 'confirm' ? (
              <HelpCircle size={28} />
            ) : config.type === 'success' ? (
              <CheckCircle2 size={28} />
            ) : (
              <AlertCircle size={28} />
            )}
          </IconContainer>
          <MessageText>{config.message}</MessageText>
          <ButtonRow>
            {config.type === 'confirm' ? (
              <>
                <Btn onClick={() => { config.onCancel?.(); }}>Cancelar</Btn>
                <Btn $variant="primary" onClick={() => { config.onConfirm?.(); }}>Confirmar</Btn>
              </>
            ) : (
              <Btn $variant={config.type === 'success' ? 'primary' : 'danger'} onClick={() => { config.onConfirm?.(); }}>
                Aceptar
              </Btn>
            )}
          </ButtonRow>
        </DialogContent>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
