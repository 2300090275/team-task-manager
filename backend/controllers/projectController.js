const supabase = require('../config/supabase');
const { validationResult } = require('express-validator');

// Helper: fetch owner details for a project
async function attachOwner(project) {
  if (!project || !project.user_id) return project;
  const { data: owner } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', project.user_id)
    .single();
  return { ...project, owner: owner || null };
}

// Helper: fetch owners for multiple projects
async function attachOwners(projects) {
  if (!projects || projects.length === 0) return [];
  const ownerIds = [...new Set(projects.map(p => p.user_id).filter(Boolean))];
  if (ownerIds.length === 0) return projects;
  
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email')
    .in('id', ownerIds);
  
  const userMap = {};
  (users || []).forEach(u => { userMap[u.id] = u; });
  
  return projects.map(p => ({
    ...p,
    owner: userMap[p.user_id] || null
  }));
}

exports.createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, description, members, color } = req.body;

    const projectData = { name };

    // Only add columns that exist in the table
    if (description !== undefined) projectData.description = description;
    if (members) projectData.members = members;
    if (color) projectData.color = color;
    projectData.user_id = req.user.id;
    projectData.status = 'active';

    const { data: project, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) {
      console.error('Create project error:', error);
      return res.status(500).json({ message: 'Error creating project', error: error.message });
    }

    const enriched = await attachOwner(project);

    res.status(201).json({
      message: 'Project created successfully',
      project: enriched
    });
  } catch (error) {
    console.error('Create project exception:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    let query = supabase.from('projects').select('*');

    // If user_id column exists, filter for non-admins
    if (req.user.role !== 'admin') {
      query = query.or(`user_id.eq.${req.user.id},members.cs.{${req.user.id}}`);
    }

    const { data: projects, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch projects error:', error);
      // If the error is about missing columns, return empty with a warning
      if (error.message?.includes('column') || error.message?.includes('schema cache')) {
        return res.json({ projects: [], warning: 'Schema mismatch — run fix_schema.sql in Supabase SQL Editor' });
      }
      return res.status(500).json({ message: 'Error fetching projects', error: error.message });
    }

    const enriched = await attachOwners(projects || []);
    res.json({ projects: enriched });
  } catch (error) {
    console.error('Fetch projects exception:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = project.user_id === req.user.id;
    const isMember = project.members && project.members.includes(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isMember && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    const enriched = await attachOwner(project);
    res.json({ project: enriched });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existingProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = existingProject.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const { name, description, status, members, color } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (members) updateData.members = members;
    if (color) updateData.color = color;
    updateData.updated_at = new Date().toISOString();

    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Update project error:', error);
      return res.status(500).json({ message: 'Error updating project', error: error.message });
    }

    const enriched = await attachOwner(project);
    res.json({
      message: 'Project updated successfully',
      project: enriched
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = project.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    // Delete associated tasks first
    await supabase.from('tasks').delete().eq('project_id', req.params.id);

    // Delete project
    const { error } = await supabase.from('projects').delete().eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ message: 'Error deleting project', error: error.message });
    }

    res.json({ message: 'Project and associated tasks deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
