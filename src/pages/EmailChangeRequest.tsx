import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';

const emailChangeSchema = z.object({
  newEmail: z.string().trim().email({ message: 'Please enter a valid email address' }),
  reason: z.string().trim().max(500, { message: 'Reason must be less than 500 characters' }).optional(),
});

interface EmailChangeRequest {
  id: string;
  current_email: string;
  new_email: string;
  reason: string | null;
  status: string;
  created_at: string;
}

const EmailChangeRequest = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<EmailChangeRequest[]>([]);
  const { toast } = useToast();

  useState(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  });

  useState(() => {
    if (user) {
      fetchRequests();
    }
  });

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('email_change_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setRequests(data);
    }
  };

  const handleSubmit = async () => {
    // Validate input
    const validation = emailChangeSchema.safeParse({ newEmail, reason });
    
    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'Could not retrieve your current email.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Check for existing pending requests
      const { data: existingRequests } = await supabase
        .from('email_change_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequests) {
        toast({
          title: 'Request Already Exists',
          description: 'You already have a pending email change request. Please wait for it to be processed.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('email_change_requests')
        .insert({
          user_id: user.id,
          current_email: user.email,
          new_email: validation.data.newEmail,
          reason: validation.data.reason || null,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your email change request has been submitted. An admin will review it shortly.',
      });

      setNewEmail('');
      setReason('');
      fetchRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Email Change Request</h1>
          <p className="text-muted-foreground">Request to update your account email address</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Submit Email Change Request</CardTitle>
            <CardDescription>Current email: {user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>New Email Address</Label>
                <Input
                  type="email"
                  placeholder="your.new@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Reason (Optional)</Label>
                <Textarea
                  placeholder="Why do you need to change your email?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">{reason.length}/500 characters</p>
              </div>
              <Button onClick={handleSubmit} disabled={loading} className="w-full">
                Submit Request
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Requests</CardTitle>
            <CardDescription>View the status of your email change requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>New Email</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No requests yet
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.new_email}</TableCell>
                      <TableCell className="text-muted-foreground">{request.reason || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.status === 'approved'
                              ? 'default'
                              : request.status === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailChangeRequest;
