import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { taskAPI, projectAPI, authAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/useToast';
import {
  Plus, CheckSquare, MoreHorizontal, Trash2, Edit,
  Calendar, Flag, Loader2, Search, X, Filter, User
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '../components/ui/dropdown-menu';

const statusOptions = [
  { value: 'todo', label: 'To Do', dot: 'bg-slate-400', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  { value: 'in-progress', label: 'In Progress', dot: 'bg-blue-500', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { value: 'review', label: 'Review', dot: 'bg-amber-500', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { value: 'done', label: 'Done', dot: 'bg-emerald-500', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  { value: 'medium', label: 'Medium', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { value: 'high', label: 'High', cls: 'bg-red-500/15 text-red-300 border-red-500/30' },
];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({ status: '', project: '', priority: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const { isAdmin, user } = useAuth();
  const [formData, setFormData] = useState({
    title: '', description: '', project: '', status: 'todo',
    priority: 'medium', dueDate: '', assignee: ''
  });

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const params = {};
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.project && filters.project !== 'all') params.project = filters.project;
      if (filters.priority && filters.priority !== 'all') params.priority = filters.priority;
      const response = await taskAPI.getAll(params);
      setTasks(response.data.tasks || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      const msg = err.response?.data?.message || err.message;
      if (msg?.includes('schema cache') || msg?.includes('table')) {
        setError('Database tables are not set up. Please run supabase_schema.sql in your Supabase SQL Editor, then refresh.');
      } else if (!err.response) {
        setError('Cannot connect to backend. Make sure the server is running on port 5000.');
      } else {
        setError(msg || 'Failed to load tasks.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authAPI.getUsers();
      setAllUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.project) {
      toast({ title: 'Validation', description: 'Title and Project are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        project: formData.project,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
        assignee: formData.assignee || undefined,
      };
      if (editingTask) {
        const res = await taskAPI.update(editingTask.id, taskData);
        setTasks(prev => prev.map(t => t.id === editingTask.id ? res.data.task : t));
        toast({ title: 'Task updated', variant: 'success' });
      } else {
        await taskAPI.create(taskData);
        toast({ title: 'Task created', description: `"${formData.title}" has been created.`, variant: 'success' });
        fetchTasks(); // refresh to get full task with joins
      }
      setDialogOpen(false);
      setEditingTask(null);
      resetForm();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to save task', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => setFormData({
    title: '', description: '', project: '', status: 'todo',
    priority: 'medium', dueDate: '', assignee: ''
  });

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      project: task.project?.id || task.project_id || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      assignee: task.assignee?.id || task.assignee_id || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskAPI.delete(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast({ title: 'Task deleted', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskAPI.update(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      toast({ title: 'Status updated', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status) => {
    const cfg = statusOptions.find(s => s.value === status) || statusOptions[0];
    return (
      <Badge variant="outline" className={`${cfg.cls} gap-1.5`}>
        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const cfg = priorityOptions.find(p => p.value === priority) || priorityOptions[1];
    return (
      <Badge variant="outline" className={cfg.cls}>
        <Flag className="mr-1 h-3 w-3" />
        {cfg.label}
      </Badge>
    );
  };

  const hasActiveFilters = filters.status || filters.project || filters.priority;

  // Client-side search
  const filteredTasks = searchQuery
    ? tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : tasks;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          </div>
          <p className="text-sm text-white/40 font-medium">Loading tasks…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full text-center space-y-5">
          <div className="relative inline-flex">
            <div className="h-20 w-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <CheckSquare className="h-9 w-9 text-red-400" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-red-500/10 blur-xl -z-10" />
          </div>
          <h3 className="text-xl font-bold text-white">Cannot load tasks</h3>
          <p className="text-sm text-white/40 leading-relaxed">{error}</p>
          <Button onClick={() => { setLoading(true); setError(null); fetchTasks(); }}>
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-white/[0.06]">
              <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <span className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.15em]">Tasks</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Tasks</h2>
          <p className="text-white/30 text-sm mt-1">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} • Manage and track your work
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingTask(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTask(null); resetForm(); }}>
              <Plus className="mr-2 h-4 w-4" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
              <DialogDescription>{editingTask ? 'Update task details.' : 'Create a new task for your project.'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter task title"
                    required
                    className="h-11"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the task…"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project <span className="text-destructive">*</span></label>
                    <Select value={formData.project} onValueChange={(value) => setFormData({ ...formData, project: value })}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                              {p.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assignee</label>
                    <Select value={formData.assignee} onValueChange={(value) => setFormData({ ...formData, assignee: value === '_none' ? '' : value })}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Unassigned</SelectItem>
                        {allUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingTask ? 'Updating…' : 'Creating…'}
                    </>
                  ) : editingTask ? 'Update Task' : 'Create Task'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & Search */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              <Input
                placeholder="Search tasks…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-white/30"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-white/25 shrink-0" />
              <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.priority || 'all'} onValueChange={(value) => setFilters({ ...filters, priority: value === 'all' ? '' : value })}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.project || 'all'} onValueChange={(value) => setFilters({ ...filters, project: value === 'all' ? '' : value })}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ status: '', project: '', priority: '' })}
                  className="h-9 text-xs text-white/30 hover:text-white"
                >
                  <X className="mr-1 h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks list */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md overflow-hidden">
        <div className="p-0">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-20">
              <div className="h-18 w-18 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
                <CheckSquare className="h-9 w-9 text-white/15" />
              </div>
              <p className="text-white/50 font-semibold">
                {searchQuery || hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
              </p>
              <p className="text-white/25 text-sm mt-1">
                {searchQuery || hasActiveFilters ? 'Try adjusting your search or filters' : 'Create a project first, then add tasks'}
              </p>
              {!searchQuery && !hasActiveFilters && (
                <Button className="mt-5" onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Task
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left py-3 px-4 font-semibold text-[10px] text-white/25 uppercase tracking-[0.12em]">Task</th>
                    <th className="text-left py-3 px-4 font-semibold text-[10px] text-white/25 uppercase tracking-[0.12em] hidden md:table-cell">Project</th>
                    <th className="text-left py-3 px-4 font-semibold text-[10px] text-white/25 uppercase tracking-[0.12em] hidden lg:table-cell">Assignee</th>
                    <th className="text-left py-3 px-4 font-semibold text-[10px] text-white/25 uppercase tracking-[0.12em]">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-[10px] text-white/25 uppercase tracking-[0.12em] hidden sm:table-cell">Priority</th>
                    <th className="text-left py-3 px-4 font-semibold text-[10px] text-white/25 uppercase tracking-[0.12em] hidden lg:table-cell">Due Date</th>
                    <th className="text-right py-3 px-4 font-semibold text-[10px] text-white/25 uppercase tracking-[0.12em] w-12">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredTasks.map((task, i) => (
                      <motion.tr
                        key={task.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.03] transition-colors group"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-sm text-white/70 group-hover:text-white transition-colors">{task.title}</p>
                            {task.description && (
                              <p className="text-[11px] text-white/25 line-clamp-1 mt-0.5">{task.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          {task.project ? (
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: task.project.color || '#3B82F6' }} />
                              <span className="text-sm text-white/50 truncate max-w-[120px]">{task.project.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-white/20">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                {task.assignee.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm text-white/50 truncate max-w-[100px]">{task.assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-white/20">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Select value={task.status} onValueChange={(value) => handleStatusChange(task.id, value)}>
                            <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 shadow-none focus:ring-0 gap-0">
                              {getStatusBadge(task.status)}
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <span className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                                    {opt.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">{getPriorityBadge(task.priority)}</td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-white/30">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white hover:bg-white/10">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(task)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              {(isAdmin || task.created_by === user?.id || task.creator?.id === user?.id) && (
                                <DropdownMenuItem
                                  onClick={() => handleDelete(task.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
