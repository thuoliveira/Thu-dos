'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const PRIORITIES = {
  alta: { dot: 'bg-rose-400', label: 'Alta' },
  media: { dot: 'bg-amber-400', label: 'Média' },
  baixa: { dot: 'bg-emerald-400', label: 'Baixa' }
}

const KANBAN_COLUMNS = [
  { id: 'todo', label: 'A fazer', color: 'border-slate-300' },
  { id: 'doing', label: 'Fazendo', color: 'border-teal-400' },
  { id: 'done', label: 'Concluído', color: 'border-emerald-400' }
]

const DEFAULT_CATEGORIES = ['Geral', 'Trabalho', 'Pessoal', 'Estudos']
const DEFAULT_TOPICS = ['Aurora', 'CS', 'OKRs', 'SaaS', 'Marketplace', 'Español']

const TOPIC_COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-emerald-100 text-emerald-700',
  'bg-cyan-100 text-cyan-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-fuchsia-100 text-fuchsia-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
]

export default function TaskManager() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [topics, setTopics] = useState(DEFAULT_TOPICS)
  const [view, setView] = useState('kanban')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filter, setFilter] = useState('all')
  const [topicFilter, setTopicFilter] = useState('all')
  const [draggedTask, setDraggedTask] = useState(null)
  const fileInputRef = useRef(null)
  const [importText, setImportText] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newTopic, setNewTopic] = useState('')
  const [syncing, setSyncing] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    category: 'Geral',
    topics: [],
    priority: 'media',
    dueDate: '',
    status: 'todo'
  })

  // Load from Supabase
  useEffect(() => {
    fetchTasks()
    const savedCats = localStorage.getItem('thu-dos-categories')
    const savedTopics = localStorage.getItem('thu-dos-topics')
    const savedView = localStorage.getItem('thu-dos-view')
    if (savedCats) setCategories(JSON.parse(savedCats))
    if (savedTopics) setTopics(JSON.parse(savedTopics))
    if (savedView) setView(savedView)
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setTasks(data.map(t => ({
        ...t,
        dueDate: t.due_date,
        createdAt: t.created_at
      })))
    }
    setLoading(false)
  }

  // Save settings to localStorage
  useEffect(() => { localStorage.setItem('thu-dos-categories', JSON.stringify(categories)) }, [categories])
  useEffect(() => { localStorage.setItem('thu-dos-topics', JSON.stringify(topics)) }, [topics])
  useEffect(() => { localStorage.setItem('thu-dos-view', view) }, [view])

  const getTopicColor = (topic) => {
    const index = topics.indexOf(topic) % TOPIC_COLORS.length
    return TOPIC_COLORS[index >= 0 ? index : 0]
  }

  const resetForm = () => {
    setFormData({ title: '', category: 'Geral', topics: [], priority: 'media', dueDate: '', status: 'todo' })
    setEditingTask(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    setSyncing(true)

    if (editingTask) {
      await supabase
        .from('tasks')
        .update({
          title: formData.title,
          category: formData.category,
          topics: formData.topics,
          priority: formData.priority,
          due_date: formData.dueDate || null,
          status: formData.status
        })
        .eq('id', editingTask.id)
    } else {
      await supabase
        .from('tasks')
        .insert({
          id: Date.now().toString(),
          title: formData.title,
          category: formData.category,
          topics: formData.topics,
          priority: formData.priority,
          due_date: formData.dueDate || null,
          status: formData.status,
          archived: false
        })
    }
    
    await fetchTasks()
    setSyncing(false)
    resetForm()
  }

  const deleteTask = async (id) => {
    setSyncing(true)
    await supabase.from('tasks').delete().eq('id', id)
    await fetchTasks()
    setSyncing(false)
  }

  const archiveTask = async (id) => {
    setSyncing(true)
    await supabase.from('tasks').update({ archived: true }).eq('id', id)
    await fetchTasks()
    setSyncing(false)
  }

  const unarchiveTask = async (id) => {
    setSyncing(true)
    await supabase.from('tasks').update({ archived: false }).eq('id', id)
    await fetchTasks()
    setSyncing(false)
  }

  const archiveAllCompleted = async () => {
    setSyncing(true)
    await supabase.from('tasks').update({ archived: true }).eq('status', 'done').eq('archived', false)
    await fetchTasks()
    setSyncing(false)
  }

  const startEdit = (task) => {
    setFormData({
      title: task.title,
      category: task.category,
      topics: task.topics || [],
      priority: task.priority,
      dueDate: task.dueDate || task.due_date || '',
      status: task.status
    })
    setEditingTask(task)
    setShowForm(true)
  }

  const toggleStatus = async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    
    const statusOrder = ['todo', 'doing', 'done']
    const nextStatus = statusOrder[(statusOrder.indexOf(task.status) + 1) % 3]
    
    setSyncing(true)
    await supabase.from('tasks').update({ status: nextStatus }).eq('id', id)
    await fetchTasks()
    setSyncing(false)
  }

  const moveToStatus = async (taskId, newStatus) => {
    setSyncing(true)
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    await fetchTasks()
    setSyncing(false)
  }

  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => e.preventDefault()

  const handleDrop = (e, status) => {
    e.preventDefault()
    if (draggedTask) {
      moveToStatus(draggedTask.id, status)
      setDraggedTask(null)
    }
  }

  const handleFileImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => setImportText(event.target.result)
    reader.readAsText(file)
  }

  const processImport = async () => {
    if (!importText.trim()) return
    setSyncing(true)
    
    const lines = importText.split('\n').filter(line => line.trim())
    const newTasks = lines.map(line => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: line.trim().replace(/^[-•*]\s*/, ''),
      category: 'Geral',
      topics: [],
      priority: 'media',
      due_date: null,
      status: 'todo',
      archived: false
    }))

    await supabase.from('tasks').insert(newTasks)
    await fetchTasks()
    
    setSyncing(false)
    setImportText('')
    setShowImport(false)
  }

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()])
      setNewCategory('')
    }
  }

  const removeCategory = (cat) => {
    if (categories.length > 1) setCategories(categories.filter(c => c !== cat))
  }

  const addTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()])
      setNewTopic('')
    }
  }

  const removeTopic = (topic) => setTopics(topics.filter(t => t !== topic))

  const toggleFormTopic = (topic) => {
    if (formData.topics.includes(topic)) {
      setFormData({ ...formData, topics: formData.topics.filter(t => t !== topic) })
    } else {
      setFormData({ ...formData, topics: [...formData.topics, topic] })
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const isOverdue = (task) => {
    const dueDate = task.dueDate || task.due_date
    if (!dueDate || task.status === 'done') return false
    return new Date(dueDate) < new Date(new Date().setHours(0,0,0,0))
  }

  const activeTasks = tasks.filter(t => !t.archived)
  const archivedTasks = tasks.filter(t => t.archived)
  
  const filteredTasks = activeTasks.filter(t => {
    if (filter !== 'all' && t.category !== filter) return false
    if (topicFilter !== 'all' && !t.topics?.includes(topicFilter)) return false
    return true
  })

  const completedCount = activeTasks.filter(t => t.status === 'done').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-teal-600 flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Carregando...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sync indicator */}
      {syncing && (
        <div className="fixed top-4 right-4 bg-teal-500 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-2 z-50 shadow-lg">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Sincronizando...
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-teal-600 tracking-tight">THU-DOs</h1>
              <span className="text-xs text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">☁️ sync</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button onClick={() => setView('list')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'list' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}>
                  Lista
                </button>
                <button onClick={() => setView('kanban')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'kanban' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}>
                  Kanban
                </button>
              </div>

              <button onClick={() => setShowArchive(true)} className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors relative" title="Arquivadas">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                {archivedTasks.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {archivedTasks.length}
                  </span>
                )}
              </button>

              <button onClick={() => setShowSettings(true)} className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors" title="Configurações">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              <button onClick={() => setShowImport(true)} className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors" title="Importar">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>

              <button onClick={() => { resetForm(); setShowForm(true) }} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                + Nova
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-teal-100 text-teal-700' : 'text-slate-500 hover:bg-slate-100'}`}>
              Todas
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${filter === cat ? 'bg-teal-100 text-teal-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                {cat}
              </button>
            ))}
          </div>

          {topics.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              <span className="text-xs text-slate-400 py-1">Tópicos:</span>
              <button onClick={() => setTopicFilter('all')} className={`px-2 py-0.5 text-xs rounded-full transition-colors ${topicFilter === 'all' ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:bg-slate-100'}`}>
                Todos
              </button>
              {topics.map(topic => (
                <button key={topic} onClick={() => setTopicFilter(topic)} className={`px-2 py-0.5 text-xs rounded-full transition-colors ${topicFilter === topic ? getTopicColor(topic) : 'text-slate-400 hover:bg-slate-100'}`}>
                  {topic}
                </button>
              ))}
            </div>
          )}

          {completedCount > 0 && (
            <button onClick={archiveAllCompleted} className="mt-3 text-xs text-slate-400 hover:text-teal-600 transition-colors">
              Arquivar {completedCount} concluída{completedCount > 1 ? 's' : ''} →
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* LIST VIEW */}
        {view === 'list' && (
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <EmptyState onAdd={() => setShowForm(true)} />
            ) : (
              filteredTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  topics={topics}
                  getTopicColor={getTopicColor}
                  onToggle={() => toggleStatus(task.id)}
                  onEdit={() => startEdit(task)}
                  onDelete={() => deleteTask(task.id)}
                  onArchive={() => archiveTask(task.id)}
                  formatDate={formatDate}
                  isOverdue={isOverdue(task)}
                />
              ))
            )}
          </div>
        )}

        {/* KANBAN VIEW */}
        {view === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {KANBAN_COLUMNS.map(column => (
              <div
                key={column.id}
                className={`bg-white/50 rounded-xl p-4 border-t-2 ${column.color} min-h-[300px]`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center justify-between">
                  {column.label}
                  <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {filteredTasks.filter(t => t.status === column.id).length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {filteredTasks.filter(t => t.status === column.id).map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-2">
                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITIES[task.priority].dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 font-medium">{task.title}</p>
                          
                          {task.topics?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {task.topics.map(topic => (
                                <span key={topic} className={`text-xs px-1.5 py-0.5 rounded ${getTopicColor(topic)}`}>
                                  {topic}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-slate-400">{task.category}</span>
                            {(task.dueDate || task.due_date) && (
                              <span className={`text-xs ${isOverdue(task) ? 'text-rose-500' : 'text-slate-400'}`}>
                                {formatDate(task.dueDate || task.due_date)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button onClick={() => startEdit(task)} className="text-slate-300 hover:text-teal-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          {task.status === 'done' && (
                            <button onClick={() => archiveTask(task.id)} className="text-slate-300 hover:text-teal-500 transition-colors" title="Arquivar">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                            </button>
                          )}
                          <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-rose-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Task Form Modal */}
      {showForm && (
        <Modal onClose={resetForm}>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            {editingTask ? 'Editar tarefa' : 'Nova tarefa'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="O que precisa fazer?"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
              autoFocus
              required
            />

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Tópicos</label>
              <div className="flex flex-wrap gap-1.5">
                {topics.map(topic => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleFormTopic(topic)}
                    className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                      formData.topics?.includes(topic) ? getTopicColor(topic) : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-teal-400">
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-teal-400">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-teal-400" />
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-teal-400">
                <option value="todo">A fazer</option>
                <option value="doing">Fazendo</option>
                <option value="done">Concluído</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={resetForm} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg font-medium transition-colors">Cancelar</button>
              <button type="submit" className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2.5 rounded-lg font-medium transition-colors">{editingTask ? 'Salvar' : 'Criar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Import Modal */}
      {showImport && (
        <Modal onClose={() => { setShowImport(false); setImportText('') }}>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Importar tarefas</h2>
          <p className="text-sm text-slate-500 mb-4">Cole o texto do Plaud Note ou importe um arquivo</p>
          <div className="space-y-4">
            <input ref={fileInputRef} type="file" accept=".txt,.md" onChange={handleFileImport} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-600 hover:file:bg-teal-100" />
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Cole aqui o conteúdo..." rows={6} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => { setShowImport(false); setImportText('') }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg font-medium transition-colors">Cancelar</button>
              <button onClick={processImport} disabled={!importText.trim()} className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white py-2.5 rounded-lg font-medium transition-colors">Importar</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Archive Modal */}
      {showArchive && (
        <Modal onClose={() => setShowArchive(false)}>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Arquivadas ({archivedTasks.length})</h2>
          {archivedTasks.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Nenhuma tarefa arquivada</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {archivedTasks.map(task => (
                <div key={task.id} className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">{task.title}</p>
                    <p className="text-xs text-slate-400">{task.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => unarchiveTask(task.id)} className="p-1.5 text-slate-400 hover:text-teal-500 rounded" title="Restaurar">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                    <button onClick={() => deleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-rose-500 rounded" title="Deletar">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setShowArchive(false)} className="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg font-medium transition-colors">Fechar</button>
        </Modal>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Modal onClose={() => setShowSettings(false)}>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Configurações</h2>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Categorias</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {categories.map(cat => (
                <span key={cat} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {cat}
                  {categories.length > 1 && <button onClick={() => removeCategory(cat)} className="text-slate-400 hover:text-rose-500">×</button>}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())} placeholder="Nova categoria..." className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-teal-400" />
              <button onClick={addCategory} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors">+</button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Tópicos</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {topics.map(topic => (
                <span key={topic} className={`${getTopicColor(topic)} px-3 py-1 rounded-full text-sm flex items-center gap-2`}>
                  {topic}
                  <button onClick={() => removeTopic(topic)} className="opacity-60 hover:opacity-100">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())} placeholder="Novo tópico..." className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-teal-400" />
              <button onClick={addTopic} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-1.5 rounded-lg text-sm transition-colors">+</button>
            </div>
          </div>

          <button onClick={() => setShowSettings(false)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg font-medium transition-colors">Fechar</button>
        </Modal>
      )}
    </div>
  )
}

function TaskCard({ task, topics, getTopicColor, onToggle, onEdit, onDelete, onArchive, formatDate, isOverdue }) {
  const statusStyles = { todo: 'border-slate-200', doing: 'border-teal-300 bg-teal-50/30', done: 'border-emerald-300 bg-emerald-50/30' }
  const dueDate = task.dueDate || task.due_date

  return (
    <div className={`bg-white rounded-xl p-4 border ${statusStyles[task.status]} transition-all hover:shadow-sm`}>
      <div className="flex items-start gap-3">
        <button onClick={onToggle} className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${task.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : task.status === 'doing' ? 'border-teal-400 bg-teal-100' : 'border-slate-300 hover:border-teal-400'}`}>
          {task.status === 'done' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          {task.status === 'doing' && <span className="w-2 h-2 bg-teal-500 rounded-full" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</p>
          {task.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {task.topics.map(topic => <span key={topic} className={`text-xs px-2 py-0.5 rounded-full ${getTopicColor(topic)}`}>{topic}</span>)}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITIES[task.priority].dot}`} />
            <span className="text-xs text-slate-400">{task.category}</span>
            {dueDate && <span className={`text-xs ${isOverdue ? 'text-rose-500 font-medium' : 'text-slate-400'}`}>{formatDate(dueDate)}</span>}
          </div>
        </div>
        <div className="flex gap-1">
          {task.status === 'done' && (
            <button onClick={onArchive} className="p-1.5 text-slate-400 hover:text-teal-500 rounded-lg hover:bg-slate-50 transition-colors" title="Arquivar">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            </button>
          )}
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-teal-500 rounded-lg hover:bg-slate-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
      </div>
      <p className="text-slate-500 mb-4">Nenhuma tarefa ainda</p>
      <button onClick={onAdd} className="text-teal-600 hover:text-teal-700 font-medium">Criar primeira tarefa →</button>
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}
