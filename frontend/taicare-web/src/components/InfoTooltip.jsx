import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes, css } from 'styled-components';
import { HelpCircle } from 'lucide-react';

const fadeInBottom = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, 4px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
`;

const fadeInTop = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, -96%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
  }
`;

const TooltipContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.35rem;
  vertical-align: middle;
`;

const TooltipTrigger = styled.button`
  background: none;
  border: none;
  padding: 2px;
  color: ${({ theme }) => theme.colors.textSecondary || theme.colors.text};
  opacity: 0.5;
  cursor: help;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.15s ease;

  &:hover {
    opacity: 1;
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.hoverBg || 'rgba(0, 0, 0, 0.05)'};
    transform: scale(1.08);
  }
  
  &:focus {
    outline: none;
  }
`;

const TooltipBoxPortal = styled.div`
  position: absolute;
  z-index: 99999;
  width: 220px;
  padding: 0.6rem 0.8rem;
  background: ${({ theme }) => theme.isDark ? '#1e293b' : '#ffffff'};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  font-size: 0.78rem;
  font-weight: 400;
  line-height: 1.4;
  text-align: left;
  white-space: normal;
  pointer-events: none;
  
  ${({ $placement }) =>
    $placement === 'top'
      ? css`
          transform: translate(-50%, -100%);
          animation: ${fadeInTop} 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        `
      : css`
          transform: translate(-50%, 0);
          animation: ${fadeInBottom} 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        `}
`;

const TooltipArrowPortal = styled.div`
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
  left: 50%;
  transform: translateX(-50%);

  ${({ $placement, theme }) =>
    $placement === 'top'
      ? css`
          top: 100%;
          border-width: 5px 5px 0 5px;
          border-color: ${theme.colors.border} transparent transparent transparent;
          
          &::after {
            content: '';
            position: absolute;
            top: -6px;
            left: -5px;
            border-width: 5px 5px 0 5px;
            border-color: ${theme.isDark ? '#1e293b' : '#ffffff'} transparent transparent transparent;
          }
        `
      : css`
          bottom: 100%;
          border-width: 0 5px 5px 5px;
          border-color: transparent transparent ${theme.colors.border} transparent;
          
          &::after {
            content: '';
            position: absolute;
            top: 1px;
            left: -5px;
            border-width: 0 5px 5px 5px;
            border-color: transparent transparent ${theme.isDark ? '#1e293b' : '#ffffff'} transparent;
          }
        `}
`;

export default function InfoTooltip({ text, size = 14 }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState('bottom');
  const triggerRef = useRef(null);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      const estimatedHeight = 140;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Choose top placement if not enough space below, and there is more space above
      const newPlacement = (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) ? 'top' : 'bottom';
      setPlacement(newPlacement);

      setCoords({
        top: newPlacement === 'top'
          ? rect.top + window.scrollY - 8
          : rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
  };

  useEffect(() => {
    if (visible) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [visible]);

  return (
    <TooltipContainer>
      <TooltipTrigger
        ref={triggerRef}
        type="button"
        aria-label="Información"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        <HelpCircle size={size} />
      </TooltipTrigger>
      {visible &&
        createPortal(
          <TooltipBoxPortal $placement={placement} style={{ top: coords.top, left: coords.left }}>
            {text}
            <TooltipArrowPortal $placement={placement} />
          </TooltipBoxPortal>,
          document.body
        )}
    </TooltipContainer>
  );
}
