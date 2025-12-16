import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext.jsx'
import Header from '../components/Header.jsx'
import Sidebar from '../components/Sidebar.jsx'
import Footer from '../components/Footer.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const AppContainer = styled.div`
  display: flex; flex-direction: column; height: 100vh; width: 100vw;
`
const Body = styled.div`
  flex: 1; display: flex; overflow: hidden;
`
const Main = styled.main`
  flex: 1; background: ${({ theme }) => theme.colors.bg}; padding: 1.5rem; overflow-y: auto;
`

/* ---------- Layout del dashboard ---------- */
const Shell = styled.div`
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 14px;
  padding: 1rem;
`
const TopGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`
const Card = styled.section`
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  padding: 1rem;
  min-height: 160px;
  display: flex; flex-direction: column;
`
const CardHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: .5rem;
  h3 { margin: 0; font-size: 1.05rem; color: ${({ theme }) => theme.colors.text}; }
`
const AddBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.cardBg};
  color: ${({ theme }) => theme.colors.text};
  width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 6px; cursor: pointer; transition: background .15s ease;
  &:hover { background: ${({ theme }) => theme.colors.hoverBg}; }
`
const CardBody = styled.div`
  flex: 1; display: grid; place-items: center;
  color: ${({ theme }) => theme.colors.textSecondary || theme.colors.text}; opacity: .85; text-align: center;
`
const ChartsBand = styled.section`
  margin-bottom: 1rem;
  background: ${({ theme }) => theme.colors.cardBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px; padding: 1rem; min-height: 240px;
`
const ChartsHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: .5rem;
  h3 { margin: 0; font-size: 1.05rem; }
`
/* Charts grid + frames */
const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  @media (max-width: 1100px) { grid-template-columns: 1fr; }
`
const ChartFrame = styled.div`
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.cardBg };
  iframe { width: 100%; height: 100%; border: 0; }
`

/* ---------- Listas (rutinas/alertas) ---------- */
const List = styled.ul`
  list-style: none; margin: 0; padding: 0;
`
const Item = styled.li`
  display: grid; grid-template-columns: 1fr auto; gap: .5rem; align-items: center;
  padding: .5rem .25rem; border-bottom: 1px dashed ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: 0; }
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.hoverBg}; border-radius: 6px; }
`
const Title = styled.div`
  display: flex; flex-direction: column;
  strong { color: ${({ theme }) => theme.colors.text}; }
  small { opacity: .8; }
`
const Badge = styled.span`
  font-size: .75rem; padding: .15rem .5rem; border-radius: 999px; border: 1px solid transparent;
  ${({ variant }) => variant === 'running'
    ? 'background: rgba(34,197,94,.12); color:#16a34a; border-color: rgba(34,197,94,.25);'
    : 'background: rgba(59,130,246,.12); color:#2563eb; border-color: rgba(59,130,246,.25);'}
`
const Meta = styled.div`
  font-size: .85rem; opacity: .9;
`
const More = styled.button`
  margin-top: .5rem; width: 100%; padding: .5rem .75rem;
  border-radius: 8px; border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.cardBg}; cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.hoverBg}; }
`
const ListScroll = styled.div`
  max-height: 320px; overflow: auto; padding-right: .25rem;
`

export default function Home() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(window.innerWidth >= 768)

  /* datos para rutinas */
  const [routines, setRoutines] = useState([])
  const [households, setHouseholds] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(5) // ver más rutinas -> +5
  const listRef = useRef(null);

  /* datos para alertas */
  const [alerts, setAlerts] = useState([])
  const [loadingAlerts, setLoadingAlerts] = useState(true)
  const [limitAlerts, setLimitAlerts] = useState(5)
  const alertListRef = useRef(null)

  useEffect(() => {
    const onResize = () => setMenuOpen(window.innerWidth >= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const [rR, hR, uR] = await Promise.all([
          fetch(`${API}/routines`, { credentials: 'include' }),
          fetch(`${API}/households`, { credentials: 'include' }),
          fetch(`${API}/users?role=paciente`, { credentials: 'include' })
        ])
        const [r, h, u] = await Promise.all([rR.json(), hR.json(), uR.json()])
        setRoutines(Array.isArray(r) ? r : [])
        setHouseholds(Array.isArray(h) ? h : [])
        setPatients(Array.isArray(u) ? u : [])
      } catch {
        setRoutines([]); setHouseholds([]); setPatients([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Cargar TODAS las alertas y filtrar no resueltas, orden ascendente (más antiguas primero)
  useEffect(() => {
    (async () => {
      try {
        setLoadingAlerts(true)
        const res = await fetch(`${API}/alerts`, { credentials: 'include' })
        const data = res.ok ? await res.json() : []
        setAlerts(Array.isArray(data) ? data : [])
      } catch {
        setAlerts([])
      } finally {
        setLoadingAlerts(false)
      }
    })()
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  // utilidades de tiempo
  const dayName = (d) => ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d]
  const parseHM = (hm) => {
    const [H,M] = String(hm||'0:0').split(':').map(n=>parseInt(n,10)||0)
    return { H, M }
  }
  const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate()+n); return d }

  // calcular próxima/actual ocurrencia por rutina en las próximas 48h
  const horizonHours = 48

  const enriched = useMemo(() => {
    if (!routines.length) return []

    const usersById = Object.fromEntries(patients.map(u => [String(u._id), u]))
    const hhById = Object.fromEntries(households.map(h => [String(h._id), h]))

    const now = new Date()
    const items = []

    for (const r of routines) {
      const hh = hhById[String(r.household_id)]
      const ownerId = hh?.owner ? String(hh.owner) : null
      const patientName = ownerId && usersById[ownerId]?.name ? usersById[ownerId].name : '(Paciente)'

      let best = null
      for (let offset=0; offset<=2; offset++) {
        const date = addDays(now, offset)
        const wname = dayName(date.getDay())
        if (!Array.isArray(r.days) || !r.days.includes(wname)) continue

        const { H: sH, M: sM } = parseHM(r.expected_start)
        const { H: eH, M: eM } = parseHM(r.expected_end)
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), sH, sM, 0, 0)
        let end   = new Date(date.getFullYear(), date.getMonth(), date.getDate(), eH, eM, 0, 0)
        if (end <= start) end = addDays(end, 1)

        const startsInMs   = start - now
        const endsInMs     = end - now
        const inProgress   = now >= start && now < end
        const withinHorizon= (startsInMs <= horizonHours*3600*1000) || inProgress
        if (!withinHorizon) continue

        const record = {
          _id: r._id,
          routineName: r.name || '(Rutina)',
          patientName,
          start, end, inProgress,
          sortKey: inProgress ? endsInMs : startsInMs,
          rangeLabel: `${String(sH).padStart(2,'0')}:${String(sM).padStart(2,'0')}–${String(eH).padStart(2,'0')}:${String(eM).padStart(2,'0')}`,
        }

        if (!best) best = record
        else {
          if (best.inProgress && record.inProgress) {
            if (record.sortKey < best.sortKey) best = record
          } else if (best.inProgress !== record.inProgress) {
            if (record.inProgress) best = record
            else if (!best.inProgress && record.sortKey < best.sortKey) best = record
          } else if (record.sortKey < best.sortKey) {
            best = record
          }
        }
      }
      if (best) items.push(best)
    }

    items.sort((a,b) => {
      if (a.inProgress !== b.inProgress) return a.inProgress ? -1 : 1
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey
      return String(a._id).localeCompare(String(b._id))
    })

    return items
  }, [routines, households, patients])

  // Alertas no resueltas ordenadas por fecha ascendente
  const unresolvedSorted = useMemo(() => {
    const usersById = Object.fromEntries(patients.map(u => [String(u._id), u]))
    const hhById = Object.fromEntries(households.map(h => [String(h._id), h]))

    return (alerts || [])
      .filter(a => a && (a.resolved === false))
      .map(a => {
        const t = a.timestamp ? new Date(a.timestamp) : (a.createdAt ? new Date(a.createdAt) : null)
        const hhId = a.device_id?.household_id
        const ownerId = hhId && hhById[String(hhId)]?.owner ? String(hhById[String(hhId)].owner) : null
        const patientName = ownerId && usersById[ownerId]?.name ? usersById[ownerId].name : '(Paciente)'
        return {
          ...a,
          _when: t ? t.getTime() : 0,
          _patientName: patientName
        }
      })
      .sort((x,y) => x._when - y._when)
  }, [alerts, households, patients])

  const visible = enriched.slice(0, limit)
  const visibleAlerts = unresolvedSorted.slice(0, limitAlerts)

  const formatRel = (ms) => {
    const s = Math.max(0, Math.round(ms/1000))
    const h = Math.floor(s/3600)
    const m = Math.floor((s%3600)/60)
    if (h>0 && m>0) return `${h}h ${m}m`
    if (h>0) return `${h}h`
    return `${m}m`
  }
  const fmtDateTime = (d) => {
    if (!d) return ''
    const dd = new Date(d)
    if (isNaN(+dd)) return ''
    return dd.toLocaleString()
  }

  return (
    <AppContainer>
      <Header onToggleMenu={() => setMenuOpen(o => !o)} onLogout={() => { logout(); navigate('/login') }} />
      <Body>
        <Sidebar open={menuOpen} />
        <Main>
          <Shell>

            {/* Charts arriba */}
            <ChartsBand>
              <ChartsHeader>
                <h3>Charts</h3>
                <AddBtn title="Añadir chart">＋</AddBtn>
              </ChartsHeader>

              <ChartGrid>
                <ChartFrame>
                  <iframe
                    title="Alertas por household"
                    src="https://charts.mongodb.com/charts-project-0-mrlcghx/embed/charts?id=5586cb32-40f5-43c6-aa69-2fc92f368003&maxDataAge=14400&theme=light&autoRefresh=true"
                  />
                </ChartFrame>

                <ChartFrame>
                  <iframe
                    title="Resueltas vs No resueltas"
                    src="https://charts.mongodb.com/charts-project-0-mrlcghx/embed/charts?id=4632ee43-0a08-4ed4-8a32-0fc3fd6d6b3a&maxDataAge=14400&theme=light&autoRefresh=true"
                  />
                </ChartFrame>
              </ChartGrid>
            </ChartsBand>

            {/* Rutinas y Alertas debajo */}
            <TopGrid>
              {/* Próximas rutinas */}
              <Card>
                <CardHeader>
                  <h3>Próximas rutinas</h3>
                  <AddBtn title="Añadir rutina" onClick={()=>navigate('/routines')}>＋</AddBtn>
                </CardHeader>

                {loading ? (
                  <CardBody> Cargando… </CardBody>
                ) : !visible.length ? (
                  <CardBody>No hay rutinas relevantes en las próximas 48h.</CardBody>
                ) : (
                  <>
                    <ListScroll ref={listRef}>
                      <List>
                        {visible.map(r => (
                          <Item key={r._id} onClick={()=>navigate('/routines')}>
                            <Title>
                              <strong>{r.routineName} — {r.patientName}</strong>
                              <Meta>{r.rangeLabel}</Meta>
                            </Title>
                            <div>
                              {r.inProgress ? (
                                <Badge variant="running">En curso · termina en {formatRel(r.end - new Date())}</Badge>
                              ) : (
                                <Badge variant="upcoming">Empieza en {formatRel(r.start - new Date())}</Badge>
                              )}
                            </div>
                          </Item>
                        ))}
                      </List>
                    </ListScroll>

                    {enriched.length > visible.length && (
                      <More
                        onClick={() => {
                          setLimit(l => l + 5);
                          setTimeout(() => {
                            if (listRef.current) {
                              listRef.current.scrollTo({
                                top: listRef.current.scrollHeight,
                                behavior: 'smooth'
                              });
                            }
                          }, 0);
                        }}
                      >
                        Ver más
                      </More>
                    )}
                  </>
                )}
              </Card>

              {/* Alertas (NO resueltas, más antiguas primero) */}
              <Card>
                <CardHeader>
                  <h3>Alertas</h3>
                  <AddBtn title="Crear alerta manual">＋</AddBtn>
                </CardHeader>

                {loadingAlerts ? (
                  <CardBody>Cargando…</CardBody>
                ) : !visibleAlerts.length ? (
                  <CardBody>Sin alertas pendientes.</CardBody>
                ) : (
                  <>
                    <ListScroll ref={alertListRef}>
                      <List>
                        {visibleAlerts.map(a => (
                          <Item key={a._id} onClick={()=>navigate('/alerts')}>
                            <Title>
                              <strong>{a.type || 'Alerta'} — {a._patientName}</strong>
                              <Meta>{fmtDateTime(a.timestamp || a.createdAt)}</Meta>
                            </Title>
                            <div>
                              <Badge variant="upcoming">Pendiente</Badge>
                            </div>
                          </Item>
                        ))}
                      </List>
                    </ListScroll>

                    {unresolvedSorted.length > visibleAlerts.length && (
                      <More
                        onClick={() => {
                          setLimitAlerts(n => n + 5)
                          setTimeout(() => {
                            if (alertListRef.current) {
                              alertListRef.current.scrollTo({
                                top: alertListRef.current.scrollHeight,
                                behavior: 'smooth'
                              })
                            }
                          }, 0)
                        }}
                      >
                        Ver más
                      </More>
                    )}
                  </>
                )}
              </Card>
            </TopGrid>

          </Shell>
        </Main>
      </Body>
      <Footer />
    </AppContainer>
  )
}