import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { taskAPI, projectAPI, authAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  CheckCircle2, Clock, AlertCircle, ListTodo, Loader2,
  BarChart3, PieChartIcon, Users, TrendingUp, Filter, X, Zap, Activity, Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const PIE_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444'];
const STATUS_CONFIG = {
  'todo':        { label: 'To Do',       color: '#3B82F6', icon: ListTodo },
  'pending':     { label: 'Pending',     color: '#3B82F6', icon: ListTodo },
  'in-progress': { label: 'In Progress', color: '#F59E0B', icon: Clock },
  'review':      { label: 'Review',      color: '#8B5CF6', icon: AlertCircle },
  'done':        { label: 'Completed',   color: '#10B981', icon: CheckCircle2 },
};

/* ═══════════ Stat Card — Glass ═══════════ */
function StatCard({ title, value, icon: Icon, color, subtitle, delay = 0 }) {
  return (
    <motion.div variants={item}>
      <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }} className="group cursor-default h-full">
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md p-5 transition-all duration-300 hover:border-white/[0.1] hover:shadow-xl hover:shadow-black/20 h-full">
          {/* Corner glow */}
          <div
            className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ backgroundColor: `${color}12` }}
          />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.12em]">{title}</p>
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${color}30, ${color}15)`, border: `1px solid ${color}25`, boxShadow: `0 4px 12px ${color}20` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
            </div>
            <motion.p
              className="text-3xl font-bold tracking-tight text-white"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + delay * 0.1, type: 'spring', stiffness: 200 }}
            >
              {value}
            </motion.p>
            {subtitle && <p className="text-[11px] text-white/25 mt-1.5 font-medium">{subtitle}</p>}
          </div>
          {/* Bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${color}50, transparent 80%)` }} />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════ Chart Card — Glass ═══════════ */
function ChartCard({ title, description, icon: Icon, iconColor = 'text-blue-400', bgColor = 'bg-blue-500/15', children }) {
  return (
    <motion.div variants={item}>
      <motion.div whileHover={{ y: -3, transition: { duration: 0.25 } }} className="h-full">
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md h-full transition-all duration-300 hover:border-white/[0.1] hover:shadow-xl hover:shadow-black/20">
          {/* Subtle top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          <div className="p-5 pb-2">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl ${bgColor} flex items-center justify-center border border-white/[0.06]`}>
                <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                {description && <p className="text-[11px] text-white/30 mt-0.5">{description}</p>}
              </div>
            </div>
          </div>
          <div className="px-5 pb-5 pt-1">{children}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════ Custom Tooltip — Glass ═══════════ */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/[0.1] rounded-xl px-4 py-3 shadow-2xl shadow-black/40">
      <p className="font-semibold text-white text-xs mb-1.5">{label || payload[0]?.name}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs py-0.5">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
          <span className="text-white/40">{p.name}:</span>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════ Custom Pie Label ═══════════ */
function renderPieLabel({ name, percent }) {
  if (percent < 0.05) return null;
  return `${name} ${(percent * 100).toFixed(0)}%`;
}

/* ═══════════ Custom Legend ═══════════ */
function GlassLegend({ payload }) {
  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      {payload?.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[11px] text-white/35 font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function TeamReport() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterProject, setFilterProject] = useState('all');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        taskAPI.getAll(),
        projectAPI.getAll(),
        authAPI.getUsers().catch(() => ({ data: { users: [] } })),
      ]);
      setTasks(tasksRes.data.tasks || []);
      setProjects(projectsRes.data.projects || []);
      setUsers(usersRes.data.users || []);
      setError(null);
    } catch (err) {
      console.error('TeamReport fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  // ——— Derived data (UNCHANGED) ———
  const filtered = useMemo(() => {
    if (filterProject === 'all') return tasks;
    return tasks.filter(t => t.project_id === filterProject);
  }, [tasks, filterProject]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const completed = filtered.filter(t => t.status === 'done').length;
    const inProgress = filtered.filter(t => t.status === 'in-progress').length;
    const pending = filtered.filter(t => ['todo', 'pending'].includes(t.status)).length;
    const review = filtered.filter(t => t.status === 'review').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, pending, review, completionRate };
  }, [filtered]);

  const pieData = useMemo(() => {
    const counts = {};
    filtered.forEach(t => {
      const cfg = STATUS_CONFIG[t.status] || { label: t.status };
      counts[cfg.label] = (counts[cfg.label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const barData = useMemo(() => {
    const userMap = {};
    filtered.forEach(t => {
      if (!t.assignee_id && !t.assignee) return;
      const uid = t.assignee_id || t.assignee?.id;
      const uname = t.assignee?.name || users.find(u => u.id === uid)?.name || 'Unknown';
      if (!userMap[uid]) userMap[uid] = { name: uname, completed: 0, inProgress: 0, todo: 0 };
      if (t.status === 'done') userMap[uid].completed++;
      else if (t.status === 'in-progress') userMap[uid].inProgress++;
      else userMap[uid].todo++;
    });
    return Object.values(userMap).sort((a, b) => b.completed - a.completed);
  }, [filtered, users]);

  const projectBarData = useMemo(() => {
    const pMap = {};
    filtered.forEach(t => {
      const pid = t.project_id;
      const pname = t.project?.name || projects.find(p => p.id === pid)?.name || 'Unassigned';
      if (!pMap[pid]) pMap[pid] = { name: pname.length > 15 ? pname.substring(0, 15) + '…' : pname, tasks: 0, completed: 0 };
      pMap[pid].tasks++;
      if (t.status === 'done') pMap[pid].completed++;
    });
    return Object.values(pMap).sort((a, b) => b.tasks - a.tasks);
  }, [filtered, projects]);

  // ——— Loading ———
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          </div>
          <p className="text-sm text-white/40 font-medium">Loading analytics…</p>
        </motion.div>
      </div>
    );
  }

  // ——— Error ———
  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full text-center space-y-5">
          <div className="relative inline-flex">
            <div className="h-20 w-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <BarChart3 className="h-9 w-9 text-red-400" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-red-500/10 blur-xl -z-10" />
          </div>
          <h3 className="text-xl font-bold text-white">Cannot load analytics</h3>
          <p className="text-sm text-white/40">{error}</p>
          <Button onClick={() => { setLoading(true); setError(null); fetchData(); }}>Try Again</Button>
        </motion.div>
      </div>
    );
  }

  // ——— Empty state ———
  if (tasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full text-center space-y-5">
          <div className="relative inline-flex">
            <div className="h-24 w-24 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
              <BarChart3 className="h-11 w-11 text-white/15" />
            </div>
            <div className="absolute inset-0 rounded-3xl bg-primary/5 blur-2xl -z-10" />
          </div>
          <h3 className="text-xl font-bold text-white">No data yet</h3>
          <p className="text-sm text-white/35 leading-relaxed max-w-sm mx-auto">
            Create some tasks first and they'll appear in your team analytics dashboard.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-7 pb-8">

      {/* ══════════ Header + Filter ══════════ */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/25 to-indigo-500/25 flex items-center justify-center border border-white/[0.06]">
              <Activity className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <span className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.15em]">Analytics</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Team Analytics</h2>
          <p className="text-white/30 text-sm mt-1">
            Performance insights across {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] pl-3 pr-1 py-1 backdrop-blur-sm">
            <Filter className="h-3.5 w-3.5 text-white/25" />
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="h-7 bg-transparent text-sm text-white/70 focus:outline-none appearance-none pr-6 cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center' }}
            >
              <option value="all" className="bg-slate-900 text-white">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>
              ))}
            </select>
          </div>
          {filterProject !== 'all' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/10 rounded-lg" onClick={() => setFilterProject('all')}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* ══════════ Stat Cards ══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tasks" value={stats.total} icon={ListTodo} color="#3B82F6" subtitle={`across ${projects.length} projects`} delay={0} />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle2} color="#10B981" subtitle={`${stats.completionRate}% completion rate`} delay={1} />
        <StatCard title="In Progress" value={stats.inProgress} icon={Clock} color="#F59E0B" subtitle={stats.review > 0 ? `+${stats.review} in review` : undefined} delay={2} />
        <StatCard title="Pending" value={stats.pending} icon={AlertCircle} color="#EF4444" subtitle={stats.pending > 0 ? 'Awaiting start' : 'All caught up!'} delay={3} />
      </div>

      {/* ══════════ Charts Row ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <ChartCard title="Task Distribution" description="Status breakdown" icon={PieChartIcon} iconColor="text-violet-400" bgColor="bg-violet-500/15">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  label={renderPieLabel}
                  animationBegin={100}
                  animationDuration={800}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth={2}
                >
                  {pieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<GlassLegend />} verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Bar Chart — Team Performance */}
        <ChartCard
          title="Team Performance"
          description={barData.length > 0 ? 'Tasks per team member' : 'No assigned tasks yet'}
          icon={Users}
          iconColor="text-emerald-400"
          bgColor="bg-emerald-500/15"
        >
          <div className="h-72">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend content={<GlassLegend />} verticalAlign="top" />
                  <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="inProgress" fill="#F59E0B" name="In Progress" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="todo" fill="#3B82F6" name="To Do" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="h-14 w-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <Users className="h-6 w-6 text-white/10" />
                </div>
                <p className="text-sm text-white/30">Assign tasks to see performance data</p>
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* ══════════ Project Breakdown ══════════ */}
      {projectBarData.length > 0 && (
        <ChartCard title="Project Breakdown" description="Tasks and completion by project" icon={TrendingUp} iconColor="text-amber-400" bgColor="bg-amber-500/15">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectBarData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend content={<GlassLegend />} verticalAlign="top" />
                <Bar dataKey="tasks" fill="#3B82F6" name="Total Tasks" radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* ══════════ Completion Rate — Glass ══════════ */}
      <motion.div variants={item}>
        <motion.div whileHover={{ y: -2, transition: { duration: 0.25 } }}>
          <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md transition-all duration-300 hover:border-white/[0.1] hover:shadow-xl hover:shadow-black/20">
            {/* Decorative glow */}
            <div className="absolute -top-10 right-1/4 w-40 h-20 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 left-1/4 w-40 h-20 bg-emerald-500/5 rounded-full blur-3xl" />

            <div className="relative p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center border border-white/[0.06]">
                    <Target className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Overall Completion</h3>
                    <p className="text-[11px] text-white/25 mt-0.5">{stats.completed} of {stats.total} tasks completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.span
                    className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                  >
                    {stats.completionRate}%
                  </motion.span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-primary to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.completionRate}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  style={{ boxShadow: '0 0 16px rgba(59,130,246,0.35), 0 0 32px rgba(16,185,129,0.15)' }}
                />
              </div>
              <div className="flex justify-between mt-2.5 text-[11px] text-white/20 font-medium">
                <span>0%</span>
                <div className="flex items-center gap-4">
                  {[25, 50, 75].map(n => (
                    <span key={n} className={stats.completionRate >= n ? 'text-white/35' : ''}>{n}%</span>
                  ))}
                </div>
                <span className="text-emerald-400/50">100%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
