import { supabase } from './supabase';

/* Fire-and-forget. An audit write must never block or fail a user action. */
export async function logAction(
  action: 'created' | 'updated' | 'deleted' | 'restored',
  entity: string,
  entityId: string | null,
  summary: string
) {
  try {
    const { data } = await supabase.auth.getUser();
    await supabase.from('audit_log').insert({
      actor: data.user?.id ?? null,
      action, entity, entity_id: entityId, summary
    });
  } catch (e) {
    console.warn('audit write failed', e);
  }
}
