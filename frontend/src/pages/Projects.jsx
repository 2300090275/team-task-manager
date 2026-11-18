import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { projectAPI, authAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/useToast';
import {
  Plus, FolderKanban, MoreHorizontal, Trash2, Edit,
  Users, Loader2, UserPlus, X, Search, CheckCircle2
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const { isAdmin, user } = useAuth();
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3B82F6' });

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data.projects || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      const msg = err.response?.data?.message || err.message;
      if (msg?.includes('schema cache') || msg?.includes('table')) {
        setError('Database tables are not set up. Please run supabase_schema.sql in your Supabase SQL Editor, then refresh.');
      } else if (!err.response) {
        setError('Cannot connect to backend. Make sure the server is running on port 5000.');
      } else {
        setError(msg || 'Failed to load projects.');
      }
    } finally {
      setLoading(false);
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
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      if (editingProject) {
        await projectAPI.update(editingProject.id, formData);
        toast({ title: 'Project updated', description: `"${formData.name}" has been updated.`, variant: 'success' });
      } else {
        await projectAPI.create(formData);
        toast({ title: 'Project created', description: `"${formData.name}" has been created.`, variant: 'success' });
      }
      setDialogOpen(false);
      setEditingProject(null);
      setFormData({ name: '', description: '', color: '#3B82F6' });
      fetchProjects();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to save project', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      color: project.color || '#3B82F6',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (projectId) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await projectAPI.delete(projectId);
      toast({ title: 'Project deleted', variant: 'success' });
      fetchProjects();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete project', variant: 'destructive' });
    }
  };

  const openMembersDialog = (project) => {
    setSelectedProject(project);
    setMemberSearch('');
    setMembersDialogOpen(true);
  };

  const addMember = async (userId) => {
    if (!selectedProject) return;
    const currentMembers = selectedProject.members || [];
    if (currentMembers.includes(userId)) {
      toast({ title: 'Already a member', variant: 'default' });
      return;
    }
    try {
      const updatedMembers = [...currentMembers, userId];
      await projectAPI.update(selectedProject.id, { members: updatedMembers });
      toast({ title: 'Member added', variant: 'success' });
      setSelectedProject({ ...selectedProject, members: updatedMembers });
      fetchProjects();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add member', variant: 'destructive' });
    }
  };

  const removeMember = async (userId) => {
    if (!selectedProject) return;
    try {
      const updatedMembers = (selectedProject.members || []).filter((m) => m !== userId);
      await projectAPI.update(selectedProject.id, { members: updatedMembers });
      toast({ title: 'Member removed', variant: 'success' });
      setSelectedProject({ ...selectedProject, members: updatedMembers });
      fetchProjects();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove member', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (project, newStatus) => {
    try {
      await projectAPI.update(project.id, { status: newStatus });
      toast({ title: 'Status updated', variant: 'success' });
      fetchProjects();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      active: { cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', label: 'Active' },
      completed: { cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30', label: 'Completed' },
      archived: { cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30', label: 'Archived' },
    };
    const c = map[status] || map['active'];
    return <Badge variant="outline" className={c.cls}>{c.label}</Badge>;
  };

  const filteredUsers = allUsers.filter((u) => {
    if (!selectedProject) return false;
    if (u.id === selectedProject.user_id) return false; // owner always there
    const isAlreadyMember = (selectedProject.members || []).includes(u.id);
    if (isAlreadyMember) return false;
    if (memberSearch) {
      return u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
             u.email.toLowerCase().includes(memberSearch.toLowerCase());
    }
    return true;
  });

  const projectMembers = allUsers.filter((u) => {
    if (!selectedProject) return false;
    return (selectedProject.members || []).includes(u.id);
  });

  const projectOwner = allUsers.find((u) => u.id === selectedProject?.user_id);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          </div>
          <p className="text-sm text-white/40 font-medium">Loading projects…</p>
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
              <FolderKanban className="h-9 w-9 text-red-400" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-red-500/10 blur-xl -z-10" />
          </div>
          <h3 className="text-xl font-bold text-white">Cannot load projects</h3>
          <p className="text-sm text-white/40 leading-relaxed">{error}</p>
          <Button onClick={() => { setLoading(true); setError(null); fetchProjects(); }}>
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
            <div className="h-7 w-7 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-white/[0.06]">
              <FolderKanban className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <span className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.15em]">Projects</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Projects</h2>
          <p className="text-white/30 text-sm mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''} • Manage your projects and teams
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingProject(null); setFormData({ name: '', description: '', color: '#3B82F6' }); } }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingProject(null); setFormData({ name: '', description: '', color: '#3B82F6' }); }}>
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Edit Project' : 'Create Project'}</DialogTitle>
              <DialogDescription>{editingProject ? 'Update your project details.' : 'Create a new project to organize your tasks.'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter project name"
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
                    placeholder="What is this project about?"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`h-8 w-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                          formData.color === color ? 'border-foreground scale-110 shadow-md' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingProject ? 'Updating…' : 'Creating…'}
                    </>
                  ) : editingProject ? 'Update Project' : 'Create Project'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {projects.length === 0 ? (
            <motion.div variants={item} className="col-span-full">
              <div className="rounded-xl border-2 border-dashed border-white/[0.08] bg-white/[0.01]">
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="h-18 w-18 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
                    <FolderKanban className="h-9 w-9 text-white/15" />
                  </div>
                  <p className="text-white/50 font-semibold">No projects yet</p>
                  <p className="text-white/25 text-sm mt-1">Create your first project to get started</p>
                  <Button className="mt-5" onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create Project
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            projects.map((project) => (
              <motion.div key={project.id} variants={item} layout>
                <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }} className="group h-full">
                  <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md h-full flex flex-col transition-all duration-300 hover:border-white/[0.1] hover:shadow-xl hover:shadow-black/20">
                    {/* Color accent bar */}
                    <div className="h-1 rounded-t-xl" style={{ background: `linear-gradient(90deg, ${project.color || '#3B82F6'}, ${project.color || '#3B82F6'}60)` }} />
                    {/* Hover glow */}
                    <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundColor: `${project.color || '#3B82F6'}10` }} />

                    <div className="p-5 pb-3 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 border border-white/[0.06]"
                            style={{ backgroundColor: `${project.color}15` }}
                          >
                            <FolderKanban className="h-5 w-5" style={{ color: project.color }} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate">{project.name}</h3>
                            <p className="text-[11px] text-white/25 mt-0.5">
                              Created {new Date(project.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {(isAdmin || project.user_id === user?.id || project.owner?.id === user?.id) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white hover:bg-white/10"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(project)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openMembersDialog(project)}>
                                <UserPlus className="mr-2 h-4 w-4" /> Manage Members
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(project.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-0">
                      <p className="text-sm text-white/30 line-clamp-2 mb-4 min-h-[2.5rem]">
                        {project.description || 'No description'}
                      </p>
                      <div className="flex items-center justify-between">
                        <Select
                          value={project.status}
                          onValueChange={(val) => handleStatusChange(project, val)}
                        >
                          <SelectTrigger className="h-7 w-auto border-0 bg-transparent p-0 gap-1 shadow-none focus:ring-0">
                            {getStatusBadge(project.status)}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>

                        <button
                          onClick={() => openMembersDialog(project)}
                          className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white transition-colors"
                        >
                          <Users className="h-4 w-4" />
                          <span>{(project.members?.length || 0) + 1}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Manage Members
            </DialogTitle>
            <DialogDescription>
              Add or remove team members for "{selectedProject?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Owner */}
            {projectOwner && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/70 to-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {projectOwner.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{projectOwner.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{projectOwner.email}</p>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Owner</Badge>
              </div>
            )}

            {/* Current members */}
            {projectMembers.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Members</p>
                {projectMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    {(isAdmin || selectedProject?.user_id === user?.id) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => removeMember(member.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add members */}
            {(isAdmin || selectedProject?.user_id === user?.id) && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Add Members</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email…"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredUsers.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      {memberSearch ? 'No users found' : 'All users are already members'}
                    </p>
                  ) : (
                    filteredUsers.slice(0, 10).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => addMember(u.id)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
                      >
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                        <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMembersDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
