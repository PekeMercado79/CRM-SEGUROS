import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const ADMIN_EMAIL = 'jgmercadorodriguez@gmail.com'

// ── Estilos inline (sin dependencias extra) ───────────────────
const css = {
  wrap: { minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', padding: '0' },
  nav: { background: '#1e293b', borderBottom: '1px solid #334155', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 },
  navBrand: { fontWeight: 700, fontSize: 18, color: '#60a5fa', letterSpacing: '-0.5px' },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  navEmail: { fontSize: 13, color: '#94a3b8' },
  btnLogout: { background: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  main: { padding: '28px 32px', maxWidth: 1100, margin: '0 auto' },
  pageTitle: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 28 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
  statCard: { background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '18px 20px' },
  statNum: { fontSize: 28, fontWeight: 700, color: '#60a5fa', lineHeight: 1 },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#f1f5f9' },
  btnPrimary: { background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 },
  table: { width: '100%', borderCollapse: 'collapse', background: '#1e293b', borderRadius: 12, overflow: 'hidden', border: '1px solid #334155' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #334155', background: '#162032' },
  td: { padding: '14px 16px', fontSize: 14, color: '#cbd5e1', borderBottom: '1px solid #1e293b' },
  badge: (color) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: color === 'green' ? '#14532d' : color === 'red' ? '#450a0a' : '#1e3a5f', color: color === 'green' ? '#4ade80' : color === 'red' ? '#f87171' : '#60a5fa' }),
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 28, width: '100%', maxWidth: 460 },
  modalTitle: { fontSize: 18, fontWeight: 600, color: '#f1f5f9', marginBottom: 20 },
  label: { display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 14, marginBottom: 16, boxSizing: 'border-box', outline: 'none' },
  select: { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 14, marginBottom: 16, boxSizing: 'border-box' },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 },
  btnCancel: { background: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  btnSave: { background: '#2563eb', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  btnPausa: (activo) => ({ background: 'transparent', border: `1px solid ${activo ? '#ef4444' : '#22c55e'}`, color: activo ? '#ef4444' : '#22c55e', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }),
  btnPago: { background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  alert: (ok) => ({ padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, background: ok ? '#14532d' : '#450a0a', color: ok ? '#4ade80' : '#f87171', border: `1px solid ${ok ? '#16a34a' : '#b91c1c'}` }),
  loginWrap: { minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginBox: { background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 36, width: '100%', maxWidth: 380 },
  loginTitle: { fontSize: 22, fontWeight: 700, color: '#60a5fa', textAlign: 'center', marginBottom: 6 },
  loginSub: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  payHistoryBox: { marginTop: 8, background: '#0f172a', borderRadius: 8, padding: 12, maxHeight: 200, overflowY: 'auto' },
  payRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e293b', fontSize: 13 },
}

// ── LOGIN ADMIN ───────────────────────────────────────────────
function LoginAdmin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (error) throw error
      if (data.user.email !== ADMIN_EMAIL) {
        await supabase.auth.signOut()
        throw new Error('No tienes acceso al panel de administración')
      }
      onLogin(data.user)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={css.loginWrap}>
      <div style={css.loginBox}>
        <div style={css.loginTitle}>SeguCore Admin</div>
        <div style={css.loginSub}>Panel de administración exclusivo</div>
        {error && <div style={css.alert(false)}>{error}</div>}
        <label style={css.label}>Email</label>
        <input style={css.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
        <label style={css.label}>Contraseña</label>
        <input style={css.input} type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" />
        <button style={{ ...css.btnPrimary, width: '100%', justifyContent: 'center', marginTop: 4 }} onClick={handleLogin} disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar al panel'}
        </button>
      </div>
    </div>
  )
}

// ── MODAL CREAR AGENTE ────────────────────────────────────────
function ModalCrearAgente({ onClose, onCreated }) {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', plan: 'basico', notas_admin: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleCrear = async () => {
    if (!form.nombre || !form.email) return setMsg({ ok: false, text: 'Nombre y email son obligatorios' })
    if (!form.password) return setMsg({ ok: false, text: 'La contraseña es obligatoria' })
    setLoading(true)
    setMsg(null)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { nombre: form.nombre } }
      })
      if (error) throw error
      await supabase.from('agentes').update({
        nombre: form.nombre,
        telefono: form.telefono,
        plan: form.plan,
        notas_admin: form.notas_admin,
        activo: true
      }).eq('id', data.user.id)
      // Enviar correo de bienvenida con Resend
await fetch('/api/enviar-correo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: form.email, nombre: form.nombre, password: form.password })
})
setMsg({ ok: true, text: `✓ Agente creado y correo enviado a ${form.email}` })
      setTimeout(() => { onCreated(); onClose() }, 3000)
    } catch (e) {
      setMsg({ ok: false, text: e.message })
    }
    setLoading(false)
  }
return (
    <div style={css.modal}>
      <div style={css.modalBox}>
        <div style={css.modalTitle}>Nuevo agente</div>
        {msg && <div style={css.alert(msg.ok)}>{msg.text}</div>}
        <label style={css.label}>Nombre completo *</label>
        <input style={css.input} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Juan Pérez" />
        <label style={css.label}>Email *</label>
        <input style={css.input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="agente@email.com" />
        <label style={css.label}>Contraseña temporal *</label>
        <input style={css.input} type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Ej. Juan2026!" />
        <label style={css.label}>Teléfono</label>
        <input style={css.input} value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="871 000 0000" />
        <label style={css.label}>Plan</label>
        <select style={css.select} value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}>
          <option value="basico">Básico — $299/mes</option>
          <option value="pro">Pro — $499/mes</option>
          <option value="agencia">Agencia — $799/mes</option>
        </select>
        <label style={css.label}>Notas internas (solo tú las ves)</label>
        <input style={css.input} value={form.notas_admin} onChange={e => setForm({ ...form, notas_admin: e.target.value })} placeholder="Ej. Pagó en efectivo, vence el 25 de abril" />
        <div style={css.btnRow}>
          <button style={css.btnCancel} onClick={onClose}>Cancelar</button>
          <button style={css.btnSave} onClick={handleCrear} disabled={loading}>{loading ? 'Creando...' : 'Crear agente'}</button>
        </div>
      </div>
    </div>
  )
}
// ── MODAL REGISTRAR PAGO ──────────────────────────────────────
function ModalPago({ agente, onClose, onSaved }) {
  const [form, setForm] = useState({ monto: '', metodo_pago: 'transferencia', fecha_pago: new Date().toISOString().split('T')[0], fecha_vencimiento: '', notas: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleGuardar = async () => {
    if (!form.monto || !form.fecha_vencimiento) return setMsg({ ok: false, text: 'Monto y fecha de vencimiento son obligatorios' })
    setLoading(true)
    try {
      await supabase.from('suscripciones').insert({ agente_id: agente.id, plan: agente.plan, monto: parseFloat(form.monto), metodo_pago: form.metodo_pago, fecha_pago: form.fecha_pago, fecha_vencimiento: form.fecha_vencimiento, notas: form.notas })
      setMsg({ ok: true, text: '✓ Pago registrado correctamente' })
      setTimeout(() => { onSaved(); onClose() }, 1500)
    } catch (e) {
      setMsg({ ok: false, text: e.message })
    }
    setLoading(false)
  }

  return (
    <div style={css.modal}>
      <div style={css.modalBox}>
        <div style={css.modalTitle}>Registrar pago — {agente.nombre}</div>
        {msg && <div style={css.alert(msg.ok)}>{msg.text}</div>}
        <label style={css.label}>Monto (MXN) *</label>
        <input style={css.input} type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="299" />
        <label style={css.label}>Método de pago</label>
        <select style={css.select} value={form.metodo_pago} onChange={e => setForm({ ...form, metodo_pago: e.target.value })}>
          <option value="transferencia">Transferencia / SPEI</option>
          <option value="efectivo">Efectivo</option>
          <option value="oxxo">OXXO</option>
          <option value="tarjeta">Tarjeta</option>
        </select>
        <label style={css.label}>Fecha de pago *</label>
        <input style={css.input} type="date" value={form.fecha_pago} onChange={e => setForm({ ...form, fecha_pago: e.target.value })} />
        <label style={css.label}>Vence el *</label>
        <input style={css.input} type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} />
        <label style={css.label}>Notas</label>
        <input style={css.input} value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Ej. Pago mensual abril 2026" />
        <div style={css.btnRow}>
          <button style={css.btnCancel} onClick={onClose}>Cancelar</button>
          <button style={css.btnSave} onClick={handleGuardar} disabled={loading}>{loading ? 'Guardando...' : 'Guardar pago'}</button>
        </div>
      </div>
    </div>
  )
}

// ── PANEL PRINCIPAL ───────────────────────────────────────────
function PanelAdmin({ user, onLogout }) {
  const [agentes, setAgentes] = useState([])
  const [suscripciones, setSuscripciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalCrear, setModalCrear] = useState(false)
  const [modalPago, setModalPago] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const cargarDatos = async () => {
    setLoading(true)
    const { data: ag } = await supabase.from('agentes').select('*').order('created_at', { ascending: false })
    const { data: sus } = await supabase.from('suscripciones').select('*').order('fecha_pago', { ascending: false })
    setAgentes(ag || [])
    setSuscripciones(sus || [])
    setLoading(false)
  }

  useEffect(() => { cargarDatos() }, [])

  const toggleActivo = async (agente) => {
    await supabase.from('agentes').update({ activo: !agente.activo }).eq('id', agente.id)
    cargarDatos()
  }

  const ultimoPago = (agenteId) => suscripciones.filter(s => s.agente_id === agenteId).sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago))[0]

  const estadoPago = (agenteId) => {
    const p = ultimoPago(agenteId)
    if (!p) return { color: 'gray', label: 'Sin registro' }
    const vence = new Date(p.fecha_vencimiento)
    const hoy = new Date()
    const dias = Math.ceil((vence - hoy) / 86400000)
    if (dias < 0) return { color: 'red', label: 'Vencido' }
    if (dias <= 7) return { color: 'amber', label: `Vence en ${dias}d` }
    return { color: 'green', label: `Vigente hasta ${p.fecha_vencimiento}` }
  }

  const agsFiltrados = agentes.filter(a =>
    a.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.email?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const stats = {
    total: agentes.length,
    activos: agentes.filter(a => a.activo).length,
    vencidos: agentes.filter(a => estadoPago(a.id).color === 'red').length,
    ingresos: suscripciones.filter(s => {
      const f = new Date(s.fecha_pago)
      const hoy = new Date()
      return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()
    }).reduce((acc, s) => acc + (s.monto || 0), 0)
  }

  return (
    <div style={css.wrap}>
      {modalCrear && <ModalCrearAgente onClose={() => setModalCrear(false)} onCreated={cargarDatos} />}
      {modalPago && <ModalPago agente={modalPago} onClose={() => setModalPago(null)} onSaved={cargarDatos} />}

      <nav style={css.nav}>
        <div style={css.navBrand}>SeguCore Admin</div>
        <div style={css.navRight}>
          <span style={css.navEmail}>{user.email}</span>
          <button style={css.btnLogout} onClick={onLogout}>Salir</button>
        </div>
      </nav>

      <div style={css.main}>
        <div style={css.pageTitle}>Panel de administración</div>
        <div style={css.pageSubtitle}>Gestiona agentes, pagos y accesos desde aquí</div>

        {/* Stats */}
        <div style={css.statsRow}>
          <div style={css.statCard}>
            <div style={css.statNum}>{stats.total}</div>
            <div style={css.statLabel}>Agentes totales</div>
          </div>
          <div style={css.statCard}>
            <div style={{ ...css.statNum, color: '#4ade80' }}>{stats.activos}</div>
            <div style={css.statLabel}>Activos</div>
          </div>
          <div style={css.statCard}>
            <div style={{ ...css.statNum, color: stats.vencidos > 0 ? '#f87171' : '#4ade80' }}>{stats.vencidos}</div>
            <div style={css.statLabel}>Con pago vencido</div>
          </div>
          <div style={css.statCard}>
            <div style={{ ...css.statNum, color: '#a78bfa' }}>${stats.ingresos.toLocaleString()}</div>
            <div style={css.statLabel}>Ingresos este mes (MXN)</div>
          </div>
        </div>

        {/* Tabla agentes */}
        <div style={css.toolbar}>
          <div style={css.sectionTitle}>Agentes ({agsFiltrados.length})</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              style={{ ...css.input, marginBottom: 0, width: 220, padding: '8px 12px' }}
              placeholder="Buscar agente..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            <button style={css.btnPrimary} onClick={() => setModalCrear(true)}>
              + Nuevo agente
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>Cargando agentes...</div>
        ) : (
          <table style={css.table}>
            <thead>
              <tr>
                <th style={css.th}>Agente</th>
                <th style={css.th}>Plan</th>
                <th style={css.th}>Estado</th>
                <th style={css.th}>Pago</th>
                <th style={css.th}>Notas</th>
                <th style={css.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {agsFiltrados.length === 0 && (
                <tr><td colSpan={6} style={{ ...css.td, textAlign: 'center', color: '#475569', padding: 32 }}>No hay agentes registrados aún</td></tr>
              )}
              {agsFiltrados.map(ag => {
                const pago = estadoPago(ag.id)
                const up = ultimoPago(ag.id)
                return (
                  <tr key={ag.id}>
                    <td style={css.td}>
                      <div style={{ fontWeight: 500, color: '#f1f5f9' }}>{ag.nombre}</div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{ag.email}</div>
                      {ag.telefono && <div style={{ fontSize: 12, color: '#475569' }}>{ag.telefono}</div>}
                    </td>
                    <td style={css.td}>
                      <span style={css.badge('blue')}>{ag.plan || 'básico'}</span>
                    </td>
                    <td style={css.td}>
                      <span style={css.badge(ag.activo ? 'green' : 'red')}>
                        {ag.activo ? 'Activo' : 'Pausado'}
                      </span>
                    </td>
                    <td style={css.td}>
                      <span style={css.badge(pago.color)}>{pago.label}</span>
                      {up && <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>${up.monto} · {up.metodo_pago}</div>}
                    </td>
                    <td style={css.td}>
                      <div style={{ fontSize: 12, color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ag.notas_admin || '—'}
                      </div>
                    </td>
                    <td style={css.td}>
  <div style={{ display: 'flex', gap: 6 }}>
    <button style={css.btnPago} onClick={() => setModalPago(ag)}>+ Pago</button>
    <button style={css.btnPausa(ag.activo)} onClick={() => toggleActivo(ag)}>
      {ag.activo ? 'Pausar' : 'Activar'}
    </button>
    <button style={{ background: 'transparent', border: '1px solid #7f1d1d', color: '#f87171', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }} onClick={() => eliminarAgente(ag)}>
      Eliminar
    </button>
  </div>
</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── EXPORT PRINCIPAL ──────────────────────────────────────────
export default function AdminPanel() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email === ADMIN_EMAIL) setUser(session.user)
      setChecking(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user?.email === ADMIN_EMAIL ? session.user : null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (checking) return <div style={{ ...css.loginWrap, color: '#475569' }}>Verificando acceso...</div>
  if (!user) return <LoginAdmin onLogin={setUser} />
  return <PanelAdmin user={user} onLogout={handleLogout} />
}
