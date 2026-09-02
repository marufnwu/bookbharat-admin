import { useQuery, useQueryClient } from '@tanstack/react-query';
import { affiliatesApi } from '@/api/affiliates';
import { Card, CardContent, Button, Badge } from '@/components';
import { toast } from '@/utils/toast';
import { useState } from 'react';

export default function ScheduledJobs() {
  const queryClient = useQueryClient();
  const [triggering, setTriggering] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['job-runs'],
    queryFn: () => affiliatesApi.listJobRuns(),
  });

  const jobs = data?.jobs ?? [];

  async function handleTrigger(command: string) {
    setTriggering(command);
    try {
      const result = await affiliatesApi.triggerJob(command);
      toast.success(`Command executed in ${result?.duration_ms ?? '?'}ms`);
      queryClient.invalidateQueries({ queryKey: ['job-runs'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to trigger command');
    } finally {
      setTriggering(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Scheduled Jobs</h1>
        <p className="mt-1 text-sm text-gray-600">Monitor and manually trigger affiliate cron jobs</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job: any) => (
            <Card key={job.command}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 font-mono">{job.command}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">Last run: </span>
                        <span className="text-gray-900">{job.last_run_at ? new Date(job.last_run_at).toLocaleString('en-IN') : 'Never'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status: </span>
                        <Badge variant={job.last_status === 'success' ? 'success' : job.last_status === 'failure' ? 'error' : 'default'} size="sm">
                          {job.last_status}
                        </Badge>
                      </div>
                      {job.last_count > 0 && (
                        <div>
                          <span className="text-gray-500">Processed: </span>
                          <span className="font-medium text-gray-900">{job.last_count}</span>
                        </div>
                      )}
                      {job.last_duration_ms && (
                        <div>
                          <span className="text-gray-500">Duration: </span>
                          <span className="text-gray-900">{(job.last_duration_ms / 1000).toFixed(1)}s</span>
                        </div>
                      )}
                    </div>
                    {job.last_error && (
                      <p className="text-sm text-error-600 mt-2">{job.last_error}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTrigger(job.command)}
                    loading={triggering === job.command}
                    disabled={triggering !== null}
                  >
                    Run Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
