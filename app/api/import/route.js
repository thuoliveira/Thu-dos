import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function POST(request) {
  try {
    const { tasks } = await request.json();
    
    const formattedTasks = tasks.map(t => ({
      id: t.id,
      title: t.title,
      category: t.category || 'Geral',
      topics: t.topics || [],
      priority: t.priority || 'media',
      due_date: t.dueDate || null,
      status: t.status || 'todo',
      archived: false,
      created_at: t.createdAt || new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('tasks')
      .upsert(formattedTasks, { onConflict: 'id' });

    if (error) throw error;

    return Response.json({ success: true, imported: formattedTasks.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
