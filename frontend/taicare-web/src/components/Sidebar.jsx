import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

const Nav = styled.nav`
  width: ${({ open }) => open ? '240px' : '0'};
  transition: width 0.2s ease;
  background: ${({ theme }) => theme.colors.buttonBg};
  overflow: hidden;
`

const Inner = styled.div`
  width: 240px;
  padding: 2rem 1rem;
  display: ${({ open }) => open ? 'block' : 'none'};
`

const Title = styled.h3`
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.fg};
`

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`

const Item = styled.li`
  margin: 0.5rem 0;
`

const MenuLink = styled(Link)`
  color: ${({ theme }) => theme.colors.fg};
  text-decoration: none;
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`

export default function Sidebar({ open }) {
  return (
    <Nav open={open}>
      <Inner open={open}>
        <Title>Menú</Title>
        <List>
          <Item><MenuLink to="/">Home</MenuLink></Item>
          <Item><MenuLink to="/pacientes">Pacientes</MenuLink></Item>
          <Item><MenuLink to="/devices">Dispositivos</MenuLink></Item>
          <Item><MenuLink to="/routines">Rutinas</MenuLink></Item>
          <Item><MenuLink to="/data">Datos</MenuLink></Item>
          <Item><MenuLink to="/alerts">Alertas</MenuLink></Item>
          <Item><MenuLink to="/households">Hogares</MenuLink></Item>
          <Item><MenuLink to="/configuration">Configuración</MenuLink></Item>
        </List>
      </Inner>
    </Nav>
  )
}
