import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { taskAPI, projectAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  CheckCircle2, Clock, AlertCircle, ListTodo, TrendingUp,
  Loader2, ArrowRight, FolderKanban, BarChart3, Sparkles, Zap, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, overdue: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, projectsRes] = await Promise.all([
        taskAPI.getDashboardStats(),
        projectAPI.getAll(),
      ]);
      setStats(statsRes.data.stats);
      setRecentTasks(statsRes.data.recentTasks || []);
      setProjects(projectsRes.data.projects || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      const msg = err.response?.data?.message || err.message;
      if (msg?.includes('schema cache') || msg?.includes('table')) {
        setError('Database tables are not set up yet. Please run the SQL from supabase_schema.sql in your Supabase SQL Editor, then refresh.');
      } else if (!err.response) {
        setError('Cannot connect to the backend server. Make sure the backend is running on port 5000.');
      } else {
        setError(msg || 'Failed to load dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const map = {
      'todo': { cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30', label: 'To Do', dot: 'bg-slate-400' },
      'in-progress': { cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30', label: 'In Progress', dot: 'bg-blue-500' },
      'review': { cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30', label: 'Review', dot: 'bg-amber-500' },
      'done': { cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', label: 'Done', dot: 'bg-emerald-500' },
    };
    return map[status] || map['todo'];
  };

  const statCards = [
    { title: 'Total Tasks', value: stats.total, icon: ListTodo, color: '#3B82F6', gradient: 'from-blue-500 to-blue-600' },
    { title: 'Completed', value: stats.completed, icon: CheckCircle2, color: '#10B981', gradient: 'from-emerald-500 to-emerald-600' },
    { title: 'In Progress', value: stats.pending, icon: Clock, color: '#F59E0B', gradient: 'from-amber-500 to-amber-600' },
    { title: 'Overdue', value: stats.overdue, icon: AlertCircle, color: '#EF4444', gradient: 'from-rose-500 to-rose-600' },
  ];

  const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading dashboard…</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full text-center space-y-5"
        >
          <div className="relative inline-flex">
            <div className="h-20 w-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertCircle className="h-9 w-9 text-red-400" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-red-500/10 blur-xl -z-10" />
          </div>
          <h3 className="text-xl font-bold text-white">Something went wrong</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">{error}</p>
          <Button onClick={() => { setLoading(true); setError(null); fetchDashboardData(); }} className="mt-2">
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-7 pb-8">
      {/* ══════════ Hero Welcome Card ══════════ */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl p-[1px]">
        {/* Outer gradient border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/40 via-primary/20 to-indigo-500/40" />
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800/90 backdrop-blur-sm overflow-hidden">
          {/* Content */}
          <div className="relative z-10 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 mb-2"
                >
                  <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary/30 to-blue-600/30 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <span className="text-xs font-semibold text-blue-400/80 uppercase tracking-wider">Dashboard Overview</span>
                </motion.div>
                <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
                  Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
                </h2>
                <p className="text-white/40 text-sm mt-2 max-w-lg leading-relaxed">
                  Here's an overview of your team's progress. {stats.total > 0
                    ? `You've completed ${pct}% of your tasks.`
                    : 'Create your first project and start tracking tasks.'}
                </p>
              </div>

              {/* Quick stat pill */}
              {stats.total > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] px-5 py-3 backdrop-blur-sm"
                >
                  <div className="relative">
                    <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/[0.06]" />
                      <motion.circle
                        cx="18" cy="18" r="15" fill="none" stroke="url(#progress-grad)" strokeWidth="3"
                        strokeLinecap="round" strokeDasharray={`${pct * 0.942} 100`}
                        initial={{ strokeDasharray: '0 100' }}
                        animate={{ strokeDasharray: `${pct * 0.942} 100` }}
                        transition={{ duration: 1.5, delay: 0.6, ease: 'easeOut' }}
                      />
                      <defs>
                        <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{pct}%</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{stats.completed}/{stats.total}</p>
                    <p className="text-[11px] text-white/30">Completed</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/[0.07] rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-indigo-500/[0.05] rounded-full translate-y-1/2 blur-2xl" />
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-blue-400/30 rounded-full" />
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-300/20 rounded-full" />
        </div>
      </motion.div>

      {/* ══════════ Stat Cards — Glass Morphism ══════════ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.title} variants={item}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group cursor-default"
              >
                <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md p-5 transition-all duration-300 hover:border-white/[0.1] hover:shadow-xl hover:shadow-black/20">
                  {/* Glow on hover */}
                  <div
                    className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ backgroundColor: `${card.color}15` }}
                  />

                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{card.title}</span>
                      <div
                        className={`h-10 w-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}
                        style={{ boxShadow: `0 4px 14px ${card.color}30` }}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                    </div>

                    <motion.p
                      className="text-3xl font-bold tracking-tight text-white"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 200 }}
                    >
                      {card.value}
                    </motion.p>

                    {/* Subtle bottom accent bar */}
                    <div className="absolute -bottom-5 left-0 right-0 h-[2px] rounded-full opacity-50"
                      style={{ background: `linear-gradient(90deg, ${card.color}60, transparent)` }}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* ══════════ Progress + Projects Row ══════════ */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Progress card */}
        {stats.total > 0 && (
          <motion.div variants={item} className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-400" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-white">Overall Progress</CardTitle>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-blue-400 bg-blue-500/10 rounded-lg px-3 py-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {pct}%
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Progress bar */}
                <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-primary to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
                    style={{ boxShadow: '0 0 12px rgba(59,130,246,0.4)' }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">{stats.completed} of {stats.total} tasks completed</span>
                  <span className="text-white/40">{stats.total - stats.completed} remaining</span>
                </div>

                {/* Status breakdown mini-cards */}
                <div className="grid grid-cols-4 gap-2.5 pt-1">
                  {[
                    { label: 'To Do', count: stats.total - stats.completed - stats.overdue, color: '#94A3B8', border: 'border-slate-500/20' },
                    { label: 'Active', count: stats.pending, color: '#3B82F6', border: 'border-blue-500/20' },
                    { label: 'Done', count: stats.completed, color: '#10B981', border: 'border-emerald-500/20' },
                    { label: 'Overdue', count: stats.overdue, color: '#EF4444', border: 'border-rose-500/20' },
                  ].map((s) => (
                    <div key={s.label} className={`text-center p-3 rounded-xl bg-white/[0.02] border ${s.border} transition-colors hover:bg-white/[0.04]`}>
                      <div className="h-1 w-6 rounded-full mx-auto mb-2" style={{ backgroundColor: s.color }} />
                      <p className="text-lg font-bold text-white">{s.count}</p>
                      <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>
          </motion.div>
        )}

        {/* Projects quick view */}
        <motion.div variants={item} className={stats.total === 0 ? 'lg:col-span-3' : ''}>
          <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                    <FolderKanban className="h-4 w-4 text-indigo-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-white">Projects</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="text-xs text-white/40 hover:text-white">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-10">
                  <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                    <FolderKanban className="h-7 w-7 text-white/15" />
                  </div>
                  <p className="text-white/40 text-sm font-medium">No projects yet</p>
                  <p className="text-white/20 text-xs mt-1">Get started by creating your first project</p>
                  <Button size="sm" className="mt-4" onClick={() => navigate('/projects')}>
                    Create Project
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {projects.slice(0, 5).map((project, i) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.06 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group"
                      onClick={() => navigate('/projects')}
                    >
                      <div
                        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200 border border-white/[0.06]"
                        style={{ backgroundColor: `${project.color}15` }}
                      >
                        <FolderKanban className="h-4 w-4" style={{ color: project.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate text-white/80 group-hover:text-white transition-colors">{project.name}</p>
                        <p className="text-[11px] text-white/25">
                          {(project.members?.length || 0) + 1} member{(project.members?.length || 0) + 1 !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant="outline" className={
                        project.status === 'active' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                        project.status === 'completed' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' :
                        'bg-slate-500/15 text-slate-300 border-slate-500/30'
                      }>
                        {project.status === 'active' ? 'Active' : project.status === 'completed' ? 'Done' : 'Archived'}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>
        </motion.div>
      </div>

      {/* ══════════ Recent Tasks ══════════ */}
      <motion.div variants={item}>
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <CardTitle className="text-sm font-semibold text-white">Recent Tasks</CardTitle>
              </div>
              {recentTasks.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')} className="text-xs text-white/40 hover:text-white">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <div className="text-center py-14">
                <div className="h-16 w-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                  <ListTodo className="h-8 w-8 text-white/10" />
                </div>
                <p className="text-white/40 text-sm font-medium">No tasks yet</p>
                <p className="text-white/20 text-xs mt-1">Create a project first, then add tasks</p>
                <Button size="sm" className="mt-5" onClick={() => navigate('/tasks')}>
                  Go to Tasks
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {recentTasks.map((task, i) => {
                  const statusCfg = getStatusConfig(task.status);
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.07 }}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-all duration-200 group cursor-pointer"
                      onClick={() => navigate('/tasks')}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-transparent ${statusCfg.dot}`}
                          style={{ boxShadow: `0 0 6px ${statusCfg.dot.includes('emerald') ? '#10B98140' : statusCfg.dot.includes('blue') ? '#3B82F640' : statusCfg.dot.includes('amber') ? '#F59E0B40' : '#94A3B840'}` }}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate text-white/70 group-hover:text-white transition-colors">{task.title}</p>
                          <div className="flex items-center gap-2 text-[11px] text-white/25 mt-0.5">
                            {task.project && (
                              <>
                                <span className="flex items-center gap-1">
                                  <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: task.project.color || '#3B82F6' }} />
                                  {task.project.name}
                                </span>
                                <span className="text-white/10">•</span>
                              </>
                            )}
                            <span>{task.assignee ? task.assignee.name : 'Unassigned'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <Badge variant="outline" className={statusCfg.cls}>{statusCfg.label}</Badge>
                        {task.due_date && (
                          <span className="text-[11px] text-white/20 hidden sm:inline">
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </div>
      </motion.div>
    </motion.div>
  );
}
