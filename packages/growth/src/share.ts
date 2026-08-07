export interface SharePayload {
  title: string;
  text: string;
  url: string;
}

export async function shareGameResult(payload: SharePayload): Promise<{ success: boolean; method: 'native' | 'clipboard' | 'failed' }> {
  if (typeof window !== 'undefined' && navigator.share) {
    try {
      await navigator.share(payload);
      return { success: true, method: 'native' };
    } catch (err) {
      // Ignorar si el usuario canceló el diálogo modal
      if ((err as Error).name === 'AbortError') {
        return { success: false, method: 'native' };
      }
    }
  }

  // Fallback a Portapapeles
  if (typeof window !== 'undefined' && navigator.clipboard) {
    try {
      const copyText = `${payload.title}\n${payload.text}\n${payload.url}`;
      await navigator.clipboard.writeText(copyText);
      return { success: true, method: 'clipboard' };
    } catch {
      return { success: false, method: 'failed' };
    }
  }

  return { success: false, method: 'failed' };
}