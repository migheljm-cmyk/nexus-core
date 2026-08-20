import { serve } from 'inngest/next';
import { inngest } from '../../../lib/inngest/client';
import { processOsintInvestigation } from '../../../lib/inngest/functions/osintWorker';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processOsintInvestigation,
  ],
});