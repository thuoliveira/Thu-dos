import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Busca tarefas do dia
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('archived', false)
      .or(`due_date.eq.${today},status.eq.doing`)
      .order('priority', { ascending: false });

    const taskList = tasks?.length > 0 
      ? tasks.map(t => `• ${t.title} ${t.due_date === today ? '📅' : '🔄'}`).join('<br>')
      : 'Nenhuma tarefa para hoje! 🎉';

    const { data, error } = await resend.emails.send({
      from: 'THU-DOs <onboarding@resend.dev>',
      to: ['thudeoliveira@gmail.com'],
      subject: `📋 THU-DOs - ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}`,
      html: `
        <div style="font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #0d9488; font-size: 24px; margin-bottom: 20px;">☀️ Bom dia, Thu!</h1>
          
          <div style="background: #f0fdfa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #115e59; font-size: 16px; margin: 0 0 12px 0;">Suas tarefas de hoje:</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0;">${taskList}</p>
          </div>
          
          <a href="${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://thu-dos.vercel.app'}" 
             style="display: inline-block; background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Abrir THU-DOs →
          </a>
          
          <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">
            Enviado às 7h • Horário de Brasília
          </p>
        </div>
      `,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, tasks: tasks?.length || 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
