'use client';

import React, { useState } from 'react';
import { Button, Card } from '@nexus/ui';
import { NexusAIEngine } from '@nexus/ai-engine';
import { NexusAnalytics } from '@nexus/analytics';
import { appConfig } from '../app.config';

const aiEngine = new NexusAIEngine(appConfig.ai);
const analytics = new NexusAnalytics(appConfig.id);

export default function HomePage() {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleTestAI = async () => {
    setLoading(true);
    analytics.track({ eventName: 'test_ai_clicked' });

    try {
      const res = await aiEngine.generate({
        prompt: 'Hola desde la arquitectura NEXUS CORE Micro-Frontend',
      });
      setResponse(res.text);
    } catch (err) {
      setResponse('Error al conectar con la IA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <Card className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          🚀 {appConfig.name}
        </h1>
        <p className="text-slate-400">
          Micro-frontend conectado activamente al ecosistema <strong className="text-indigo-400">NEXUS CORE</strong>.
        </p>
        <div className="pt-2">
          <Button onClick={handleTestAI} isLoading={loading}>
            Probar Motor IA Agnóstico
          </Button>
        </div>
      </Card>

      {response && (
        <Card className="border-indigo-500/30">
          <h2 className="text-sm font-semibold text-slate-400 mb-2">Respuesta del Engine:</h2>
          <p className="text-slate-200 font-mono text-sm bg-slate-900 p-4 rounded-xl border border-slate-800">
            {response}
          </p>
        </Card>
      )}
    </main>
  );
}