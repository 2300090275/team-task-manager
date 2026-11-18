const supabase = require('../config/supabase');
const { validationResult } = require('express-validator');

// Helper: enrich tasks with related data (project, assignee, creator)
async function enrichTasks(tasks) {
  if (!tasks || tasks.length === 0) return [];

  // Collect unique IDs
  const projectIds = [...new Set(tasks.map(t => t.project_id).filter(Boolean))];
  const userIds = [...new Set([
    ...tasks.map(t => t.assignee_id).filter(Boolean),
    ...tasks.map(t => t.created_by).filter(Boolean),
  ])];

  // Batch fetch projects
  let projectMap = {};
  if (projectIds.length > 0) {
    const { data: projects } = await supabase.from('projects').select('id, name, color, user_id, members').in('id', projectIds);
    (projects || []).forEach(p => { projectMap[p.id] = p; });
  }

  // Batch fetch users
  let userMap = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase.from('users').select('id, name, email').in('id', userIds);
    (users || []).forEach(u => { userMap[u.id] = u; });
  }

  return tasks.map(t => ({
    ...t,
    project: projectMap[t.project_id] || null,
    assignee: userMap[t.assignee_id] || null,
    creator: userMap[t.created_by] || null,
  }));
}

// Helper: enrich a single task
async function enrichTask(task) {
  const result = await enrichTasks([task]);
  return result[0];
}

exports.createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { title, description, status, priority, dueDate, project, assignee, tags } = req.body;

    // Check if project exists
    const { data: projectExists, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project)
      .single();

    if (projectError || !projectExists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = projectExists.user_id === req.user.id;
    const isMember = projectExists.members && projectExists.members.includes(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isMember && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to create tasks in this project' });
    }

    const taskData = {
      title,
      project_id: project,
      status: status || 'todo',
    };

    // Only include columns that might exist
    if (description !== undefined) taskData.description = description;
    if (priority) taskData.priority = priority;
    if (dueDate) taskData.due_date = dueDate;
    if (assignee) taskData.assignee_id = assignee;
    if (tags) taskData.tags = tags;
    taskData.created_by = req.user.id;

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) {
      console.error('Create task error:', error);
      return res.status(500).json({ message: 'Error creating task', error: error.message });
    }

    const enriched = await enrichTask(task);
    res.status(201).json({ message: 'Task created successfully', task: enriched });
  } catch (error) {
    console.error('Create task exception:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    // Get user's project IDs for non-admin
    let projectIds = [];
    if (req.user.role !== 'admin') {
      const { data: userProjects } = await supabase
        .from('projects')
        .select('id')
        .or(`user_id.eq.${req.user.id},members.cs.{${req.user.id}}`);
      
      projectIds = userProjects ? userProjects.map(p => p.id) : [];
    }

    let query = supabase.from('tasks').select('*');

    // Filter by user's projects for non-admin
    if (req.user.role !== 'admin') {
      if (projectIds.length === 0) {
        return res.json({ tasks: [] });
      }
      query = query.in('project_id', projectIds);
    }

    // Apply optional filters
    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.project) query = query.eq('project_id', req.query.project);
    if (req.query.assignee) query = query.eq('assignee_id', req.query.assignee);
    if (req.query.priority) query = query.eq('priority', req.query.priority);

    const { data: tasks, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch tasks error:', error);
      if (error.message?.includes('column') || error.message?.includes('schema cache')) {
        return res.json({ tasks: [], warning: 'Schema mismatch — run fix_schema.sql in Supabase SQL Editor' });
      }
      return res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }

    const enriched = await enrichTasks(tasks || []);
    res.json({ tasks: enriched });
  } catch (error) {
    console.error('Fetch tasks exception:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check authorization via project
    if (task.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('user_id, members')
        .eq('id', task.project_id)
        .single();

      if (project) {
        const isOwner = project.user_id === req.user.id;
        const isMember = project.members && project.members.includes(req.user.id);
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isMember && !isAdmin) {
          return res.status(403).json({ message: 'Not authorized to view this task' });
        }
      }
    }

    const enriched = await enrichTask(task);
    res.json({ task: enriched });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check authorization via project
    if (task.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('user_id, members')
        .eq('id', task.project_id)
        .single();

      if (project) {
        const isOwner = project.user_id === req.user.id;
        const isMember = project.members && project.members.includes(req.user.id);
        const isAdmin = req.user.role === 'admin';
        const isAssignee = task.assignee_id === req.user.id;

        if (!isOwner && !isMember && !isAdmin && !isAssignee) {
          return res.status(403).json({ message: 'Not authorized to update this task' });
        }
      }
    }

    const { title, description, status, priority, dueDate, assignee, tags } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (dueDate) updateData.due_date = dueDate;
    if (assignee !== undefined) updateData.assignee_id = assignee;
    if (tags) updateData.tags = tags;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Update task error:', error);
      return res.status(500).json({ message: 'Error updating task', error: error.message });
    }

    const enriched = await enrichTask(updatedTask);
    res.json({ message: 'Task updated successfully', task: enriched });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check authorization
    if (task.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', task.project_id)
        .single();

      if (project) {
        const isOwner = project.user_id === req.user.id;
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) {
          return res.status(403).json({ message: 'Not authorized to delete this task' });
        }
      }
    }

    const { error } = await supabase.from('tasks').delete().eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ message: 'Error deleting task', error: error.message });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    // Get user's project IDs
    let projectIds = [];
    if (req.user.role !== 'admin') {
      const { data: userProjects } = await supabase
        .from('projects')
        .select('id')
        .or(`user_id.eq.${req.user.id},members.cs.{${req.user.id}}`);
      
      projectIds = userProjects ? userProjects.map(p => p.id) : [];
    }

    // Get task counts
    let countQuery = supabase.from('tasks').select('*', { count: 'exact' });
    let completedQuery = supabase.from('tasks').select('*', { count: 'exact' }).eq('status', 'done');
    let pendingQuery = supabase.from('tasks').select('*', { count: 'exact' }).in('status', ['todo', 'in-progress', 'review', 'pending']);

    if (req.user.role !== 'admin') {
      if (projectIds.length === 0) {
        return res.json({ stats: { total: 0, completed: 0, pending: 0, overdue: 0 }, recentTasks: [] });
      }
      countQuery = countQuery.in('project_id', projectIds);
      completedQuery = completedQuery.in('project_id', projectIds);
      pendingQuery = pendingQuery.in('project_id', projectIds);
    }

    const { count: totalTasks } = await countQuery;
    const { count: completedTasks } = await completedQuery;
    const { count: pendingTasks } = await pendingQuery;

    // Get recent tasks (simple select, no joins)
    let recentQuery = supabase.from('tasks').select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (req.user.role !== 'admin' && projectIds.length > 0) {
      recentQuery = recentQuery.in('project_id', projectIds);
    }

    const { data: recentTasks } = await recentQuery;
    const enrichedRecent = await enrichTasks(recentTasks || []);

    res.json({
      stats: {
        total: totalTasks || 0,
        completed: completedTasks || 0,
        pending: pendingTasks || 0,
        overdue: 0
      },
      recentTasks: enrichedRecent
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
