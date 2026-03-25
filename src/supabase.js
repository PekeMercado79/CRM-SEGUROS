import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Auth ──────────────────────────────────────────────────────
export const authService = {
  async registrar(email, password, nombre) {
      const { data, error } = await supabase.auth.signUp({
            email, password, options: { data: { nombre } }
                })
                    if (error) throw error
                        return data
                          },
                            async login(email, password) {
                                const { data, error } = await supabase.auth.signInWithPassword({ email, password })
                                    if (error) throw error
                                        return data
                                          },
                                            async logout() {
                                                const { error } = await supabase.auth.signOut()
                                                    if (error) throw error
                                                      },
                                                        async getSesion() {
                                                            const { data: { session } } = await supabase.auth.getSession()
                                                                return session
                                                                  },
                                                                    onCambioSesion(callback) {
                                                                        return supabase.auth.onAuthStateChange((_e, session) => callback(session))
                                                                          }
                                                                          }

                                                                          // ── Clientes ──────────────────────────────────────────────────
                                                                          export const clientesService = {
                                                                            async obtenerTodos() {
                                                                                const { data, error } = await supabase
                                                                                      .from('clientes').select('*').order('created_at', { ascending: false })
                                                                                          if (error) throw error
                                                                                              return data
                                                                                                },
                                                                                                  async crear(cliente) {
                                                                                                      const { data: { user } } = await supabase.auth.getUser()
                                                                                                          const { data, error } = await supabase
                                                                                                                .from('clientes').insert({ ...cliente, agente_id: user.id }).select().single()
                                                                                                                    if (error) throw error
                                                                                                                        return data
                                                                                                                          },
                                                                                                                            async actualizar(id, cambios) {
                                                                                                                                const { data, error } = await supabase
                                                                                                                                      .from('clientes').update(cambios).eq('id', id).select().single()
                                                                                                                                          if (error) throw error
                                                                                                                                              return data
                                                                                                                                                },
                                                                                                                                                  async eliminar(id) {
                                                                                                                                                      const { error } = await supabase.from('clientes').delete().eq('id', id)
                                                                                                                                                          if (error) throw error
                                                                                                                                                            }
                                                                                                                                                            }
                                                                                                                                                            
                                                                                                                                                            // ── Polizas ───────────────────────────────────────────────────
                                                                                                                                                            export const polizasService = {
                                                                                                                                                              async obtenerTodas() {
                                                                                                                                                                  const { data, error } = await supabase
                                                                                                                                                                        .from('polizas').select('*, clientes(nombre, apellido)')
                                                                                                                                                                              .order('fecha_vencimiento', { ascending: true })
                                                                                                                                                                                  if (error) throw error
                                                                                                                                                                                      return data
                                                                                                                                                                                        },
                                                                                                                                                                                          async crear(poliza) {
                                                                                                                                                                                              const { data: { user } } = await supabase.auth.getUser()
                                                                                                                                                                                                  const { data, error } = await supabase
                                                                                                                                                                                                        .from('polizas').insert({ ...poliza, agente_id: user.id }).select().single()
                                                                                                                                                                                                            if (error) throw error
                                                                                                                                                                                                                return data
                                                                                                                                                                                                                  },
                                                                                                                                                                                                                    async actualizar(id, cambios) {
                                                                                                                                                                                                                        const { data, error } = await supabase
                                                                                                                                                                                                                              .from('polizas').update(cambios).eq('id', id).select().single()
                                                                                                                                                                                                                                  if (error) throw error
                                                                                                                                                                                                                                      return data
                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                          async proximasAVencer(dias = 30) {
                                                                                                                                                                                                                                              const hoy = new Date().toISOString().split('T')[0]
                                                                                                                                                                                                                                                  const limite = new Date(Date.now() + dias * 86400000).toISOString().split('T')[0]
                                                                                                                                                                                                                                                      const { data, error } = await supabase
                                                                                                                                                                                                                                                            .from('polizas')
                                                                                                                                                                                                                                                                  .select('*, clientes(nombre, apellido, email, telefono)')
                                                                                                                                                                                                                                                                        .gte('fecha_vencimiento', hoy).lte('fecha_vencimiento', limite)
                                                                                                                                                                                                                                                                              .eq('estado', 'activa').order('fecha_vencimiento', { ascending: true })
                                                                                                                                                                                                                                                                                  if (error) throw error
                                                                                                                                                                                                                                                                                      return data
                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                        // ── Comisiones ────────────────────────────────────────────────
                                                                                                                                                                                                                                                                                        export const comisionesService = {
                                                                                                                                                                                                                                                                                          async obtenerTodas() {
                                                                                                                                                                                                                                                                                              const { data, error } = await supabase
                                                                                                                                                                                                                                                                                                    .from('comisiones')
                                                                                                                                                                                                                                                                                                          .select('*, clientes(nombre, apellido), polizas(numero_poliza, aseguradora)')
                                                                                                                                                                                                                                                                                                                .order('fecha', { ascending: false })
                                                                                                                                                                                                                                                                                                                    if (error) throw error
                                                                                                                                                                                                                                                                                                                        return data
                                                                                                                                                                                                                                                                                                                          },
                                                                                                                                                                                                                                                                                                                            async crear(comision) {
                                                                                                                                                                                                                                                                                                                                const { data: { user } } = await supabase.auth.getUser()
                                                                                                                                                                                                                                                                                                                                    const { data, error } = await supabase
                                                                                                                                                                                                                                                                                                                                          .from('comisiones').insert({ ...comision, agente_id: user.id }).select().single()
                                                                                                                                                                                                                                                                                                                                              if (error) throw error
                                                                                                                                                                                                                                                                                                                                                  return data
                                                                                                                                                                                                                                                                                                                                                    },
                                                                                                                                                                                                                                                                                                                                                      async marcarPagada(id) {
                                                                                                                                                                                                                                                                                                                                                          const { data, error } = await supabase
                                                                                                                                                                                                                                                                                                                                                                .from('comisiones').update({ estado: 'pagada' }).eq('id', id).select().single()
                                                                                                                                                                                                                                                                                                                                                                    if (error) throw error
                                                                                                                                                                                                                                                                                                                                                                        return data
                                                                                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                                                                                          }
