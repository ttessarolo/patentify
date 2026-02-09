import { createFileRoute } from '@tanstack/react-router';
import { verifyWebhook } from '@clerk/tanstack-react-start/webhooks';
import { sql } from '~/lib/db';
import type { WebhookEvent } from '@clerk/tanstack-react-start/webhooks';

/**
 * Webhook endpoint for Clerk user events.
 * Syncs user data to public.utente table.
 *
 * Events handled:
 * - user.created: INSERT into utente
 * - user.updated: UPDATE utente
 * - user.deleted: DELETE from utente (CASCADE removes user_domanda_attempt, quiz)
 */
export const Route = createFileRoute('/api/webhooks/clerk')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }): Promise<Response> => {
    try {
      const evt = await verifyWebhook(request) as WebhookEvent;
      const eventType = evt.type;

      if (eventType === 'user.created') {
        const { id, first_name, last_name, username, email_addresses, image_url, created_at, updated_at } = evt.data;

        // Build name from first_name + last_name, fallback to username
        const name = [first_name, last_name].filter(Boolean).join(' ').trim() || username || 'Unknown';

        // Get primary email or first verified email
        const primaryEmail = email_addresses?.find(e => e.id === (evt.data as { primary_email_address_id?: string }).primary_email_address_id);
        const email = primaryEmail?.email_address || email_addresses?.[0]?.email_address || '';
        const emailVerified = primaryEmail?.verification?.status === 'verified' || false;

        // Convert Clerk timestamps (ms) to ISO strings
        const createdAtTs = new Date(created_at).toISOString();
        const updatedAtTs = new Date(updated_at).toISOString();

        await sql`
          INSERT INTO public.utente (id, name, username, email, email_verified, image_url, created_at, updated_at)
          VALUES (${id}, ${name}, ${username || null}, ${email}, ${emailVerified}, ${image_url || null}, ${createdAtTs}, ${updatedAtTs})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            username = EXCLUDED.username,
            email = EXCLUDED.email,
            email_verified = EXCLUDED.email_verified,
            image_url = EXCLUDED.image_url,
            updated_at = EXCLUDED.updated_at
        `;

        console.log(`[Clerk Webhook] user.created: ${id}`);
        return new Response('User created', { status: 200 });
      }

      if (eventType === 'user.updated') {
        const { id, first_name, last_name, username, email_addresses, image_url, updated_at } = evt.data;

        const name = [first_name, last_name].filter(Boolean).join(' ').trim() || username || 'Unknown';
        const primaryEmail = email_addresses?.find(e => e.id === (evt.data as { primary_email_address_id?: string }).primary_email_address_id);
        const email = primaryEmail?.email_address || email_addresses?.[0]?.email_address || '';
        const emailVerified = primaryEmail?.verification?.status === 'verified' || false;
        const updatedAtTs = new Date(updated_at).toISOString();

        await sql`
          UPDATE public.utente
          SET name = ${name}, username = ${username || null}, email = ${email}, email_verified = ${emailVerified}, image_url = ${image_url || null}, updated_at = ${updatedAtTs}
          WHERE id = ${id}
        `;

        console.log(`[Clerk Webhook] user.updated: ${id}`);
        return new Response('User updated', { status: 200 });
      }

      if (eventType === 'user.deleted') {
        const { id } = evt.data;

        if (id) {
          await sql`DELETE FROM public.utente WHERE id = ${id}`;
          console.log(`[Clerk Webhook] user.deleted: ${id}`);
        }

        return new Response('User deleted', { status: 200 });
      }

      // Unhandled event type
      console.log(`[Clerk Webhook] Unhandled event type: ${eventType}`);
      return new Response('Webhook received', { status: 200 });
    } catch (err) {
      console.error('[Clerk Webhook] Error:', err);
      return new Response('Error verifying webhook', { status: 400 });
    }
      },
    },
  },
});
