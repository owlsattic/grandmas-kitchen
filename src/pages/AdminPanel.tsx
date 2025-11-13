import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { RecipeCategoryManagement } from '@/components/RecipeCategoryManagement';

interface UserWithRole {
  id: string;
  email: string;
  role: string | null;
  role_id: string | null;
}

interface EmailChangeRequest {
  id: string;
  user_id: string;
  current_email: string;
  new_email: string;
  reason: string | null;
  status: string;
  created_at: string;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'moderator' | 'user'>('user');
  const [loading, setLoading] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'admin' | 'moderator'>('moderator');
  const [changeEmailUserId, setChangeEmailUserId] = useState('');
  const [changeEmailNewEmail, setChangeEmailNewEmail] = useState('');
  const [emailRequests, setEmailRequests] = useState<EmailChangeRequest[]>([]);
  const [testFetchInput, setTestFetchInput] = useState('');
  const [testFetchResult, setTestFetchResult] = useState<any>(null);
  const [testFetchLoading, setTestFetchLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('AdminPanel: Auth state:', { user: user?.id, authLoading, roleLoading, isAdmin, role });
    
    // First check if user is logged in
    if (!authLoading && !user) {
      console.log('AdminPanel: No user, redirecting to auth');
      navigate('/auth');
      return;
    }

    // ONLY redirect to home if we're done loading AND confirmed the user is NOT an admin
    // Wait for role to be fetched (role !== null) before making access decision
    if (!authLoading && !roleLoading && user && role !== null && !isAdmin) {
      console.log('AdminPanel: User is not admin, access denied. Role:', role);
      toast({
        title: 'Access Denied',
        description: `You do not have permission to access this page. Your role: ${role}`,
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [user, isAdmin, role, authLoading, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchEmailChangeRequests();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    
    // Fetch all users with their emails
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('email');

    // Fetch all user roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('id, user_id, role');

    // Combine profiles with their roles
    const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
      const userRole = roles?.find(r => r.user_id === profile.id);
      return {
        id: profile.id,
        email: profile.email || profile.id.substring(0, 8) + '...',
        role: userRole?.role || null,
        role_id: userRole?.id || null,
      };
    });

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const handleAddRole = async () => {
    if (!newUserEmail) {
      toast({
        title: 'Error',
        description: 'Please enter an email address.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    // Find the user by email (exact match or partial match)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .or(`email.ilike.%${newUserEmail}%,full_name.ilike.%${newUserEmail}%`)
      .maybeSingle();

    if (!profile) {
      toast({
        title: 'Error',
        description: `User not found with email or name: "${newUserEmail}". Make sure they have signed up first.`,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Check if user already has this role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.id)
      .eq('role', newUserRole)
      .maybeSingle();

    if (existingRole) {
      toast({
        title: 'Info',
        description: `${profile.email || profile.full_name} already has the ${newUserRole} role.`,
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: profile.id, role: newUserRole });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Role ${newUserRole} assigned to ${profile.email || profile.full_name}`,
      });
      setNewUserEmail('');
      fetchUsers();
    }
    
    setLoading(false);
  };

  const handleRemoveRole = async (roleId: string) => {
    setLoading(true);
    
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('id', roleId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Role removed successfully.',
      });
      fetchUsers();
    }
    
    setLoading(false);
  };

  const handleCreateStaff = async () => {
    if (!staffName || !staffEmail || !staffPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create user with is_staff metadata
      const { data, error } = await supabase.auth.signUp({
        email: staffEmail,
        password: staffPassword,
        options: {
          data: {
            full_name: staffName,
            is_staff: true,
          },
        },
      });

      if (error) {
        // Provide a more helpful error message for duplicate emails
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          throw new Error(`This email is already registered as a customer account. Please use a different email for staff members (e.g., ${staffName.split(' ')[0].toLowerCase()}@grandmasrecipes.com)`);
        }
        throw error;
      }

      if (data.user) {
        // Assign role to staff member
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user.id, role: staffRole });

        if (roleError) throw roleError;

        toast({
          title: 'Success',
          description: `Staff member ${staffName} created as ${staffRole}`,
        });
        
        setStaffName('');
        setStaffEmail('');
        setStaffPassword('');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create staff member',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!changeEmailUserId || !changeEmailNewEmail) {
      toast({
        title: 'Error',
        description: 'Please enter both User ID and new email address.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-change-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: changeEmailUserId,
            newEmail: changeEmailNewEmail,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change email');
      }

      toast({
        title: 'Success',
        description: `Email updated successfully to ${changeEmailNewEmail}`,
      });
      
      setChangeEmailUserId('');
      setChangeEmailNewEmail('');
      fetchUsers();
    } catch (error) {
      console.error('Error changing email:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailChangeRequests = async () => {
    const { data } = await supabase
      .from('email_change_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setEmailRequests(data);
    }
  };

  const handleProcessEmailRequest = async (requestId: string, newStatus: 'approved' | 'rejected', userId: string, newEmail: string) => {
    setLoading(true);

    try {
      // Update the request status
      const { error: updateError } = await supabase
        .from('email_change_requests')
        .update({
          status: newStatus,
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // If approved, actually change the email
      if (newStatus === 'approved') {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No active session');
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-change-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              userId: userId,
              newEmail: newEmail,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to change email');
        }
      }

      toast({
        title: 'Success',
        description: `Request ${newStatus}`,
      });

      fetchEmailChangeRequests();
      fetchUsers();
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testFetchInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an Amazon URL or ASIN',
        variant: 'destructive',
      });
      return;
    }

    setTestFetchLoading(true);
    setTestFetchResult(null);

    try {
      console.log('Testing fetch for:', testFetchInput.trim());
      const { data, error } = await supabase.functions.invoke('fetch-amazon-product', {
        body: { url: testFetchInput.trim() },
      });

      console.log('Fetch response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        setTestFetchResult({ 
          error: `Edge Function Error: ${error.message}`,
          stage: 'edge_function_call'
        });
        toast({
          title: 'Edge Function Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setTestFetchResult(data);
      
      if (data?.error) {
        console.error('Fetch error from Amazon:', data.error);
        toast({
          title: 'Amazon Blocked Request',
          description: data.message || data.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Product details fetched successfully',
        });
      }
    } catch (error) {
      console.error('Error testing fetch:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch product',
        variant: 'destructive',
      });
      setTestFetchResult({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        stage: 'unknown'
      });
    } finally {
      setTestFetchLoading(false);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant="outline"
            onClick={() => navigate('/admin-instructions')}
          >
            📖 Admin Instructions
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/seo-admin')}
            style={{ backgroundColor: '#e6f3ff', borderColor: '#b3d9ff' }}
          >
            🔍 Manage SEO
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/image-management')}
            style={{ backgroundColor: '#ffe6f0', borderColor: '#ffb3d9' }}
          >
            🖼️ Manage Images
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              console.log('Navigating to /recipe-management');
              navigate('/recipe-management');
            }}
            style={{ backgroundColor: '#e6ffe6', borderColor: '#b3ffb3' }}
          >
            Manage Recipes
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/product-management')}
            style={{ backgroundColor: '#fff4e6', borderColor: '#ffd9b3' }}
          >
            Manage Products
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Amazon Product Fetch</CardTitle>
            <CardDescription>Debug tool to test the Amazon product fetch functionality. Uses randomized delays between field scans to help avoid bot detection.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTestFetch} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Amazon.com/.co.uk URL, amzn.to link, or raw ASIN (e.g. B07XYZ1234)"
                  value={testFetchInput}
                  onChange={(e) => setTestFetchInput(e.target.value)}
                  className="flex-1"
                  disabled={testFetchLoading}
                />
                <Button type="submit" disabled={testFetchLoading}>
                  {testFetchLoading ? 'Fetching...' : 'Run Test'}
                </Button>
              </div>
            </form>

            <div className="mt-4 p-4 bg-muted rounded-md min-h-[120px]">
              {!testFetchResult ? (
                <p className="text-sm text-muted-foreground">
                  Try a full amazon.co.uk URL, an amzn.to short link, or a raw ASIN to see what data can be extracted.
                </p>
              ) : testFetchResult.error ? (
                <div className="text-sm space-y-3">
                  <div className="border-l-4 border-destructive pl-3">
                    <p className="text-destructive font-semibold mb-1">❌ Request Failed</p>
                    <p className="text-muted-foreground text-xs mb-2">
                      {testFetchResult.stage === 'edge_function_call' 
                        ? 'Failed at: Edge Function Call' 
                        : 'Failed at: Amazon Request'}
                    </p>
                    <p className="text-foreground">{testFetchResult.error}</p>
                  </div>
                  
                  {testFetchResult.message && (
                    <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded">
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                        💡 Recommendation:
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {testFetchResult.message}
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold mb-2">Why this happens:</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Amazon actively blocks automated scraping to prevent bots</li>
                      <li>They return 503/500 errors when they detect automated requests</li>
                      <li>This affects all automated tools, not just this one</li>
                    </ul>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold mb-2">Workaround:</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Copy the product image URL from Amazon directly</li>
                      <li>Manually enter title, description, and price</li>
                      <li>The ASIN will be extracted from the affiliate link automatically</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 ${testFetchResult.title ? 'text-green-600' : 'text-destructive'}`}>
                      {testFetchResult.title ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <span className="font-semibold">Title:</span>{' '}
                      <span className={testFetchResult.title ? 'text-foreground' : 'text-destructive'}>
                        {testFetchResult.title || 'FAILED - Not found'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 ${testFetchResult.price ? 'text-green-600' : 'text-destructive'}`}>
                      {testFetchResult.price ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <span className="font-semibold">Price:</span>{' '}
                      <span className={testFetchResult.price ? 'text-foreground' : 'text-destructive'}>
                        {testFetchResult.price ? `£${testFetchResult.price}` : 'FAILED - Not found'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 ${testFetchResult.asin ? 'text-green-600' : 'text-destructive'}`}>
                      {testFetchResult.asin ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <span className="font-semibold">ASIN:</span>{' '}
                      <span className={testFetchResult.asin ? 'text-foreground' : 'text-destructive'}>
                        {testFetchResult.asin || 'FAILED - Not found'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 ${testFetchResult.imageUrl ? 'text-green-600' : 'text-destructive'}`}>
                      {testFetchResult.imageUrl ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <span className="font-semibold">Image URL:</span>{' '}
                      <span className={`break-all ${testFetchResult.imageUrl ? 'text-foreground' : 'text-destructive'}`}>
                        {testFetchResult.imageUrl ? (
                          <a href={testFetchResult.imageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {testFetchResult.imageUrl.substring(0, 80)}...
                          </a>
                        ) : 'FAILED - Not found'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 ${testFetchResult.description ? 'text-green-600' : 'text-destructive'}`}>
                      {testFetchResult.description ? '✓' : '✗'}
                    </span>
                    <div className="flex-1">
                      <span className="font-semibold">Description:</span>{' '}
                      <span className={testFetchResult.description ? 'text-foreground' : 'text-destructive'}>
                        {testFetchResult.description ? `${testFetchResult.description.substring(0, 150)}...` : 'FAILED - Not found'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 ${testFetchResult.category ? 'text-green-600' : 'text-amber-600'}`}>
                      {testFetchResult.category ? '✓' : '⚠'}
                    </span>
                    <div className="flex-1">
                      <span className="font-semibold">Category:</span>{' '}
                      <span className={testFetchResult.category ? 'text-foreground' : 'text-muted-foreground'}>
                        {testFetchResult.category || 'Optional - Not found'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">Success rate:</span>{' '}
                      {Math.round(([testFetchResult.title, testFetchResult.price, testFetchResult.asin, testFetchResult.imageUrl, testFetchResult.description].filter(Boolean).length / 5) * 100)}% 
                      ({[testFetchResult.title, testFetchResult.price, testFetchResult.asin, testFetchResult.imageUrl, testFetchResult.description].filter(Boolean).length}/5 fields extracted)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Staff Account</CardTitle>
            <CardDescription>Create a staff account separate from customer accounts (no subscription needed)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Michael Pickett"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="michael@grandmasrecipes.com"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="Secure password"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={staffRole} onValueChange={(value: any) => setStaffRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreateStaff} disabled={loading} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Staff Account
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Staff accounts are separate from customer accounts and won't appear in customer mailshots or subscription lists.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Assign Role to Existing User</CardTitle>
            <CardDescription>Grant permissions to users who already have a customer account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter email or name (e.g., michael@email.com or Michael Pickett)"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="flex-1"
              />
              <Select value={newUserRole} onValueChange={(value: any) => setNewUserRole(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddRole} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Assign Role
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Note: The user must have signed up for an account first before you can assign them a role.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Change User Email</CardTitle>
            <CardDescription>Update email address for any user (staff or customer)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>User ID</Label>
                <Input
                  placeholder="Enter user UUID from table below"
                  value={changeEmailUserId}
                  onChange={(e) => setChangeEmailUserId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>New Email Address</Label>
                <Input
                  type="email"
                  placeholder="new.email@example.com"
                  value={changeEmailNewEmail}
                  onChange={(e) => setChangeEmailNewEmail(e.target.value)}
                />
              </div>
              <Button onClick={handleChangeEmail} disabled={loading} className="w-full">
                Change Email
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Note: Only admins can change email addresses. The user will need to use the new email for login.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Email Change Requests</CardTitle>
            <CardDescription>Review and process customer email change requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Current Email</TableHead>
                  <TableHead>New Email</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No email change requests
                    </TableCell>
                  </TableRow>
                ) : (
                  emailRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {request.user_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="font-medium">{request.current_email}</TableCell>
                      <TableCell className="text-primary">{request.new_email}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {request.reason || 'N/A'}
                      </TableCell>
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
                      <TableCell className="text-right">
                        {request.status === 'pending' && (
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleProcessEmailRequest(request.id, 'approved', request.user_id, request.new_email)}
                              disabled={loading}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleProcessEmailRequest(request.id, 'rejected', request.user_id, request.new_email)}
                              disabled={loading}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Members & Roles</CardTitle>
            <CardDescription>All registered users and their role assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{user.id.substring(0, 8)}...</TableCell>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {users.find(u => u.id === user.id)?.email ? 
                          users.find(u => u.id === user.id)?.email?.split('@')[0] : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {user.role ? (
                          <Badge variant={user.role === 'admin' ? 'default' : user.role === 'moderator' ? 'secondary' : 'outline'}>
                            {user.role}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Regular user</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.role_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRole(user.role_id!)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="mt-8">
          <RecipeCategoryManagement />
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>What each role can do</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge className="mb-2">Admin</Badge>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Assign and remove roles for any user</li>
                <li>Add, edit, and delete any recipe</li>
                <li>Access admin panel</li>
              </ul>
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">Moderator</Badge>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Review and approve user-submitted recipes</li>
                <li>Add new recipes to the platform</li>
                <li>Edit and delete their own recipes</li>
              </ul>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">User</Badge>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>View recipes based on subscription tier</li>
                <li>Premium users can add their own recipes</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
