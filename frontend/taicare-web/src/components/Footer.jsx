import React from 'react'
import styled from 'styled-components'

const Bar = styled.footer`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: ${({ theme }) => theme.colors.cardBg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.fg};
  box-shadow: 0 -1px 4px rgba(0,0,0,0.1);
`

export default function Footer() {
  return <Bar>© {new Date().getFullYear()} TAICareApp</Bar>
}
