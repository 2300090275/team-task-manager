import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, FolderKanban, CheckSquare, BarChart3, X, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/team-report', label: 'TeamRepo', icon: BarChart3 },
];

export default function Sidebar({ isOpen, setIsOpen, collapsed, setCollapsed }) {
  const location = useLocation();

  const sidebarContent = (isMobile = false) => (
    <div className="flex h-full flex-col">
      {/* ── Logo Area ── */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/[0.06]">
        <Link to="/" className="flex items-center gap-3 group" onClick={() => isMobile && setIsOpen(false)}>
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 via-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/40 shrink-0">
              <Zap className="h-5 w-5 text-white drop-shadow-sm" />
            </div>
            {/* Animated glow ring */}
            <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
          </div>
          {(!collapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              <span className="text-[15px] font-bold tracking-tight text-white">TaskFlow</span>
              <span className="text-[10px] font-medium text-white/30 -mt-0.5 tracking-wide uppercase">Pro Suite</span>
            </motion.div>
          )}
        </Link>

        {isMobile ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all duration-200"
            onClick={() => setCollapsed?.(!collapsed)}
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </motion.div>
          </Button>
        )}
      </div>

      {/* ── Section Label ── */}
      {(!collapsed || isMobile) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 pt-5 pb-1"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">Navigation</p>
        </motion.div>
      )}

      {/* ── Nav Items ── */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((navItem) => {
          const Icon = navItem.icon;
          const isActive = location.pathname === navItem.path;

          return (
            <Link
              key={navItem.path}
              to={navItem.path}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                collapsed && !isMobile && 'justify-center px-2.5'
              )}
              onClick={() => isMobile && setIsOpen(false)}
              title={collapsed ? navItem.label : undefined}
            >
              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId={isMobile ? 'sidebar-pill-mobile' : 'sidebar-pill'}
                  className="absolute inset-0 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-blue-500/15 to-indigo-500/10 border border-primary/20" />
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-blue-400 to-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                </motion.div>
              )}

              {/* Icon */}
              <div className={cn(
                'relative z-10 flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 shrink-0',
                isActive
                  ? 'bg-primary/15 text-blue-400'
                  : 'text-white/40 group-hover:text-white/80 group-hover:bg-white/[0.06]'
              )}>
                <Icon className="h-[17px] w-[17px]" />
              </div>

              {/* Label */}
              {(!collapsed || isMobile) && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'relative z-10 transition-colors duration-200',
                    isActive ? 'text-white font-semibold' : 'text-white/50 group-hover:text-white/90'
                  )}
                >
                  {navItem.label}
                </motion.span>
              )}

              {/* Hover glow (non-active only) */}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Upgrade / Footer Card ── */}
      <div className="p-3 mt-auto">
        {(!collapsed || isMobile) ? (
          <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4">
            {/* Decorative glow */}
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-primary/15 rounded-full blur-xl" />
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-indigo-500/10 rounded-full blur-lg" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary/30 to-indigo-500/30 flex items-center justify-center">
                  <Zap className="h-3 w-3 text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-white/70">TaskFlow v2.0</span>
              </div>
              <p className="text-[10px] text-white/30 leading-relaxed">
                Team Task Manager
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary/25 to-indigo-500/25 flex items-center justify-center">
              <Zap className="h-3 w-3 text-blue-400/60" />
            </div>
            <p className="text-[9px] text-white/20 font-medium">v2</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — glass effect */}
      <motion.aside
        className="hidden lg:block shrink-0 overflow-hidden border-r border-white/[0.06] bg-white/[0.02] backdrop-blur-xl"
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {sidebarContent(false)}
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-white/[0.06] bg-slate-950/95 backdrop-blur-2xl shadow-2xl shadow-black/50 lg:hidden"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
