/**
 * Helper function to trigger calendar sync for a user
 * Can be called from anywhere in the app when tasks change
 */

export async function triggerCalendarSync(userId: string): Promise<void> {
  try {
    // Call the sync endpoint in the background
    // Use fetch with no-cors to avoid blocking the UI
    fetch('/api/integrations/google-calendar/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(err => {
      // Silently fail - sync will happen via cron if this fails
      console.log('Background calendar sync triggered (errors ignored)')
    })
  } catch (error) {
    // Silently ignore errors - cron job will catch it later
    console.log('Calendar sync trigger failed (will retry via cron)')
  }
}
