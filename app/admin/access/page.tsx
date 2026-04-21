'use client'

import { useEffect, useMemo, useState } from 'react'

type ActivityLog = {
  id: number
  entity_type: 'dealer' | 'district_manager' | 'bpo'
  entity_id: string
  entity_unique_id: string | null
  entity_name: string
  portal: 'dealer' | 'district' | 'bpo'
  event_type: 'login' | 'logout'
  occurred_at: string
}

const ENTITY_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Dealer', value: 'dealer' },
  { label: 'District Manager', value: 'district_manager' },
  { label: 'BPO', value: 'bpo' },
] as const

const EVENT_FILTERS = [
  { label: 'Login', value: 'login' },
  { label: 'Logout', value: 'logout' },
] as const

export default function AccessManagementPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [liveConnected, setLiveConnected] = useState(false)
  const [entityFilter, setEntityFilter] = useState<(typeof ENTITY_FILTERS)[number]['value']>('all')
  const [showLogin, setShowLogin] = useState(true)
  const [showLogout, setShowLogout] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchLogs = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)

    try {
      const params = new URLSearchParams()
      params.set('limit', '300')
      if (entityFilter !== 'all') params.set('entityType', entityFilter)

      const response = await fetch(`/api/login-activity?${params.toString()}`, { cache: 'no-store' })
      const data = await response.json()

      if (data.success) {
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch login activity logs:', error)
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  useEffect(() => {
    let source: EventSource | null = null

    const params = new URLSearchParams()
    params.set('limit', '300')
    if (entityFilter !== 'all') params.set('entityType', entityFilter)

    const connect = () => {
      source = new EventSource(`/api/login-activity/stream?${params.toString()}`)

      source.addEventListener('ready', () => {
        setLiveConnected(true)
      })

      source.addEventListener('logs', (event) => {
        try {
          const parsed = JSON.parse((event as MessageEvent).data || '[]')
          setLogs(parsed)
          setLoading(false)
          setLiveConnected(true)
        } catch (error) {
          console.error('Failed to parse live logs:', error)
        }
      })

      source.addEventListener('error', () => {
        setLiveConnected(false)
      })

      source.onerror = () => {
        setLiveConnected(false)
        source?.close()
      }
    }

    fetchLogs()
    connect()

    return () => {
      source?.close()
      setLiveConnected(false)
    }
  }, [entityFilter])

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return logs

    return logs.filter((row) => {
      if (row.event_type === 'login' && !showLogin) return false
      if (row.event_type === 'logout' && !showLogout) return false

      const bag = [
        row.entity_type,
        row.entity_unique_id || '',
        row.entity_name,
        row.portal,
        row.event_type,
      ]
        .join(' ')
        .toLowerCase()

      return bag.includes(q)
    })
  }, [logs, searchQuery, showLogin, showLogout])

  const labelForEntity = (type: ActivityLog['entity_type']) => {
    if (type === 'district_manager') return 'District Manager'
    if (type === 'bpo') return 'BPO'
    return 'Dealer'
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Login Activity Monitor</h1>
          <p className="mt-2 text-muted-foreground dark:text-slate-400">
            Track dealer, district manager, and BPO login/logout activity from all portals.
          </p>
          <p className={`mt-1 text-xs font-semibold ${liveConnected ? 'text-green-600' : 'text-amber-600'}`}>
            {liveConnected ? 'Live: connected' : 'Live: reconnecting'}
          </p>
        </div>

        <button
          onClick={() => fetchLogs(true)}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 w-full sm:w-auto"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {ENTITY_FILTERS.map((item) => (
          <button
            key={item.value}
            onClick={() => setEntityFilter(item.value)}
            className={`rounded-full border px-3 py-1 text-xs font-bold ${
              entityFilter === item.value
                ? 'border-indigo-300 bg-indigo-100 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by name, unique ID, portal"
          className="w-full sm:w-80 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <button
          onClick={() => setSearchQuery(searchInput.trim())}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 w-full sm:w-auto"
        >
          Search
        </button>
        <button
          onClick={() => {
            setSearchInput('')
            setSearchQuery('')
          }}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 w-full sm:w-auto"
        >
          Clear
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Time</p>
        {EVENT_FILTERS.map((item) => {
          const active = item.value === 'login' ? showLogin : showLogout
          return (
            <button
              key={item.value}
              onClick={() => {
                if (item.value === 'login') {
                  setShowLogin((prev) => !prev)
                  return
                }
                setShowLogout((prev) => !prev)
              }}
              className={`rounded-full border px-3 py-1 text-xs font-bold ${
                active
                  ? 'border-amber-300 bg-amber-100 text-amber-700'
                  : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="overflow-hidden rounded-lg border bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="space-y-2 p-3 md:hidden">
          {loading ? (
            <div className="rounded-lg border border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
              Loading login activity...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="rounded-lg border border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
              {logs.length === 0
                ? 'No activity logs found yet. New entries will appear when dealer/district/BPO users login or click Logout from portal menus.'
                : 'No records match your search/filter.'}
            </div>
          ) : (
            filteredLogs.map((row) => (
              <div key={row.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{labelForEntity(row.entity_type)}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${row.event_type === 'login' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {row.event_type}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{row.entity_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">ID: {row.entity_unique_id || 'N/A'}</p>
                <p className="mt-1 text-xs uppercase text-slate-600 dark:text-slate-400">{row.portal}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{new Date(row.occurred_at).toLocaleString('en-IN')}</p>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-240">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">User Type</th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Unique ID</th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Portal</th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={5}>Loading login activity...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={5}>
                    {logs.length === 0
                      ? 'No activity logs found yet. New entries will appear when dealer/district/BPO users login or click Logout from portal menus.'
                      : 'No records match your search/filter.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{labelForEntity(row.entity_type)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{row.entity_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{row.entity_unique_id || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm uppercase text-slate-600 dark:text-slate-400">{row.portal}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {new Date(row.occurred_at).toLocaleString('en-IN')}
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${row.event_type === 'login' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {row.event_type}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
