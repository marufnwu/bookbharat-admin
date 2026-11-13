import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlaskConical, Play, Square, BarChart3 } from 'lucide-react';
import { LoadingSpinner } from '../../components';
import { seoAgentApi } from '../../api/seoAgent';
import { toast } from '../../utils/toast';
import type { GrowthExperiment } from '../../types/seoAgent';

const statusClass: Record<string, string> = {
  draft: 'border-gray-200 bg-gray-50 text-gray-600',
  running: 'border-green-200 bg-green-50 text-green-700',
  paused: 'border-amber-200 bg-amber-50 text-amber-700',
  stopped: 'border-gray-200 bg-white text-gray-600',
};

const verdictClass: Record<string, string> = {
  improved: 'text-green-700',
  neutral: 'text-gray-600',
  worse: 'text-red-700',
  insufficient_data: 'text-amber-700',
};

const Experiments: React.FC = () => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [minimumSample, setMinimumSample] = useState(100);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['growth-experiments'],
    queryFn: seoAgentApi.growthExperiments,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['growth-experiments'] });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      seoAgentApi.createGrowthExperiment({
        name,
        hypothesis,
        minimum_sample: minimumSample,
      }),
    onSuccess: () => {
      toast.success('Experiment created');
      setName('');
      setHypothesis('');
      invalidate();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Could not create experiment'),
  });

  const startMutation = useMutation({
    mutationFn: seoAgentApi.startGrowthExperiment,
    onSuccess: () => {
      toast.success('Experiment started');
      invalidate();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Could not start'),
  });

  const stopMutation = useMutation({
    mutationFn: seoAgentApi.stopGrowthExperiment,
    onSuccess: () => {
      toast.success('Experiment stopped');
      invalidate();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Could not stop'),
  });

  const analyzeMutation = useMutation({
    mutationFn: seoAgentApi.analyzeGrowthExperiment,
    onSuccess: (result: any) => {
      toast.success(`Verdict: ${result.verdict}`);
      invalidate();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Could not analyze'),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        Could not load experiments.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Experiments</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Control-group tests for commercial changes. Verdicts are deterministic, not guarantees.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Create experiment</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-800">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Product page CTA"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-800">Minimum sample</span>
            <input
              type="number"
              min={10}
              value={minimumSample}
              onChange={(event) => setMinimumSample(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="text-sm font-medium text-gray-800">Hypothesis</span>
          <textarea
            value={hypothesis}
            onChange={(event) => setHypothesis(event.target.value)}
            rows={2}
            placeholder="A clearer add-to-cart label increases cart additions."
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => createMutation.mutate()}
          disabled={!name.trim() || !hypothesis.trim() || createMutation.isPending}
          className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Creating…' : 'Create experiment'}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Experiment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Control</th>
                <th className="px-4 py-3 font-medium">Variant</th>
                <th className="px-4 py-3 font-medium">Lift</th>
                <th className="px-4 py-3 font-medium">Verdict</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    No experiments yet.
                  </td>
                </tr>
              )}
              {data.map((experiment: GrowthExperiment) => (
                <tr key={experiment.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{experiment.name}</p>
                    <p className="mt-0.5 max-w-sm text-xs text-gray-500">{experiment.hypothesis}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass[experiment.status]}`}>
                      {experiment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {experiment.control_rate === null ? '—' : `${(experiment.control_rate * 100).toFixed(2)}%`}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {experiment.variant_rate === null ? '—' : `${(experiment.variant_rate * 100).toFixed(2)}%`}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {experiment.lift === null ? '—' : `${(experiment.lift * 100).toFixed(2)}%`}
                  </td>
                  <td className={`px-4 py-3 text-xs font-medium ${experiment.verdict ? verdictClass[experiment.verdict] : 'text-gray-400'}`}>
                    {experiment.verdict || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {experiment.status === 'draft' && (
                        <button
                          type="button"
                          onClick={() => startMutation.mutate(experiment.id)}
                          disabled={startMutation.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          <Play className="h-3.5 w-3.5" />
                          Start
                        </button>
                      )}
                      {experiment.status === 'running' && (
                        <>
                          <button
                            type="button"
                            onClick={() => analyzeMutation.mutate(experiment.id)}
                            disabled={analyzeMutation.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                            Analyze
                          </button>
                          <button
                            type="button"
                            onClick={() => stopMutation.mutate(experiment.id)}
                            disabled={stopMutation.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Square className="h-3.5 w-3.5" />
                            Stop
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Experiments;
