import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, AlertCircle, Loader2, ChevronDown, Download } from 'lucide-react';
import { toast } from 'sonner';

type TaskStatus = 'pending' | 'running' | 'complete' | 'error';

interface SEOTask {
  id: number;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: TaskStatus;
  results?: string[];
  summary?: string;
  actionLabel?: string;
  onInstall?: () => Promise<void>;
}

interface SEOTaskCardProps {
  task: SEOTask;
  onRunTask: (taskId: number) => Promise<void>;
  borderColor: string;
}

export const SEOTaskCard = ({ task, onRunTask, borderColor }: SEOTaskCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const handleInstall = async () => {
    if (!task.onInstall) return;
    
    setIsInstalling(true);
    try {
      await task.onInstall();
      toast.success(`${task.title} optimizations re-applied successfully!`);
    } catch (error) {
      toast.error(`Failed to apply ${task.title} optimizations`);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Card className={`${borderColor}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <CardDescription>{task.description}</CardDescription>
          </div>
          {getStatusIcon(task.status)}
        </div>
      </CardHeader>
      <CardContent>
        {task.status === 'complete' && task.results && (
          <div className="mb-4 p-3 bg-muted rounded text-sm space-y-1">
            {task.results.map((result, idx) => (
              <div key={idx} className="font-mono">{result}</div>
            ))}
          </div>
        )}

        {task.summary && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="mb-4">
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              View Implementation Details
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 p-4 bg-accent/50 rounded-lg text-sm">
              <p className="mb-3">{task.summary}</p>
              {task.onInstall && (
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  {isInstalling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      {task.actionLabel || 'Re-apply Optimization'}
                    </>
                  )}
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        <Button
          onClick={() => onRunTask(task.id)}
          disabled={task.status === 'running'}
          className="w-full"
          variant={task.priority === 'high' ? 'default' : task.priority === 'medium' ? 'secondary' : 'outline'}
        >
          {task.status === 'running' ? 'Analysing...' : 
           task.status === 'complete' ? 'Re-run Check' : 'Run Check'}
        </Button>
      </CardContent>
    </Card>
  );
};
