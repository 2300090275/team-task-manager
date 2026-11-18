import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { CheckCircle2, XCircle, Loader2, ExternalLink, Copy, Database, RefreshCw } from 'lucide-react';

const SETUP_SQL = `-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    members UUID[] DEFAULT '{}',
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'review', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date TIMESTAMP WITH TIME ZONE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS (app uses JWT middleware for access control)
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Permissions
GRANT ALL ON projects TO anon, authenticated;
GRANT ALL ON tasks TO anon, authenticated;`;

export default function SetupWizard({ onComplete }) {
  const [checking, setChecking] = useState(true);
  const [tables, setTables] = useState({ users: false, projects: false, tasks: false });
  const [copied, setCopied] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const checkTables = async () => {
    setChecking(true);
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) {
        const data = await res.json();
        const newStatus = {
          users: true,
          projects: data.tables?.projects === 'OK',
          tasks: data.tables?.tasks === 'OK',
        };
        setTables(newStatus);
        if (newStatus.projects && newStatus.tasks) {
          setTimeout(() => onComplete?.(), 1500);
        }
      }
    } catch (e) {
      console.error('Health check failed:', e);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkTables();
    // Poll every 5 seconds
    const interval = setInterval(checkTables, 5000);
    return () => clearInterval(interval);
  }, []);

  const allOK = tables.users && tables.projects && tables.tasks;

  const copySQL = async () => {
    await navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const projectRef = 'rtjiieqkdljlunackbal';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/6 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative"
      >
        <Card className="shadow-2xl shadow-black/5 border-0 ring-1 ring-border/60">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex justify-center mb-4"
            >
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-xl shadow-primary/30">
                <Database className="h-8 w-8 text-white" />
              </div>
            </motion.div>
            <CardTitle className="text-2xl font-bold">Database Setup Required</CardTitle>
            <CardDescription className="text-base mt-2">
              Your Supabase database is missing the <code className="text-xs bg-muted px-1.5 py-0.5 rounded">projects</code> and <code className="text-xs bg-muted px-1.5 py-0.5 rounded">tasks</code> tables. Follow the steps below to set them up.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {/* Status indicators */}
            <div className="flex justify-center gap-6">
              {[
                { name: 'users', ok: tables.users },
                { name: 'projects', ok: tables.projects },
                { name: 'tasks', ok: tables.tasks },
              ].map((t) => (
                <div key={t.name} className="flex items-center gap-2">
                  {checking ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : t.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className={`text-sm font-medium ${t.ok ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {t.name}
                  </span>
                </div>
              ))}
            </div>

            {allOK ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-3"
              >
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <p className="text-lg font-semibold text-emerald-600">All tables are ready!</p>
                <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
              </motion.div>
            ) : (
              <>
                {/* Steps */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="h-6 w-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                    <div>
                      <p className="text-sm font-medium">Open the Supabase SQL Editor</p>
                      <a
                        href={`https://supabase.com/dashboard/project/${projectRef}/sql/new`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-1.5 text-sm text-primary hover:underline font-medium"
                      >
                        Open SQL Editor <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="h-6 w-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Copy this SQL and paste it into the editor</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copySQL}
                        className="mt-2"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Copy SQL to Clipboard
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="h-6 w-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                    <p className="text-sm font-medium">Click the green <strong>"Run"</strong> button in the SQL editor</p>
                  </div>
                </div>

                {/* SQL Preview */}
                <details className="group">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    View SQL preview
                  </summary>
                  <pre className="mt-2 p-3 rounded-lg bg-muted/50 text-xs overflow-auto max-h-48 font-mono leading-relaxed">
                    {SETUP_SQL}
                  </pre>
                </details>

                <div className="flex justify-center pt-2">
                  <Button onClick={checkTables} disabled={checking} variant="outline">
                    {checking ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking…</>
                    ) : (
                      <><RefreshCw className="mr-2 h-4 w-4" /> Check Again</>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  This page auto-checks every 5 seconds. Once the tables are created, you'll be redirected automatically.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
