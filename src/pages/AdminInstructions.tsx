import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Users, Eye, ShoppingBag, UserPlus, Mail } from 'lucide-react';

const AdminInstructions = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Panel
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">Admin Instructions</h1>
          <p className="text-muted-foreground">Complete guide to managing Grandma's Kitchen</p>
        </div>

        <div className="space-y-6">
          {/* Recipe Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle>Managing Recipes</CardTitle>
              </div>
              <CardDescription>How to add, edit, and organize recipes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">How to Add a New Recipe:</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                  <li>Go to <Link 
                    to="/recipe-management" 
                    className="text-primary hover:underline"
                    onClick={() => console.log('📍 AdminInstructions: Clicking text link to /recipe-management')}
                  >Manage Recipes</Link> from the Admin Panel</li>
                  <li>Click the <strong>"Create New Recipe"</strong> button (top right)</li>
                  <li>Fill in the recipe details:
                    <ul className="list-disc list-inside ml-6 mt-1">
                      <li><strong>Basic Info:</strong> Title, description, category, country</li>
                      <li><strong>Details:</strong> Servings, cooking time</li>
                      <li><strong>Ingredients:</strong> Add each ingredient with amount and name</li>
                      <li><strong>Instructions:</strong> Add step-by-step cooking instructions</li>
                      <li><strong>Nutrition:</strong> Optional nutritional information</li>
                      <li><strong>Images:</strong> Upload up to 12 recipe photos</li>
                      <li><strong>Visibility:</strong> Choose public, private, or pending review</li>
                    </ul>
                  </li>
                  <li>Click <strong>"Create Recipe"</strong> to save</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How to Edit or Delete a Recipe:</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>In Recipe Management, click the <strong>pencil icon</strong> to edit</li>
                  <li>Click the <strong>trash icon</strong> to delete (requires confirmation)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Recipe Moderation:</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Go to <Link to="/moderation" className="text-primary hover:underline">Recipe Moderation</Link> to review pending recipes</li>
                  <li>Approve or reject user-submitted recipes</li>
                  <li>Edit recipes before approving if needed</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle>User & Role Management</CardTitle>
              </div>
              <CardDescription>Managing staff accounts and user permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">How to Create a Staff Account:</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                  <li>Go to the <Link to="/admin" className="text-primary hover:underline">Admin Panel</Link></li>
                  <li>Find the <strong>"Create New Staff Account"</strong> section</li>
                  <li>Enter staff member details:
                    <ul className="list-disc list-inside ml-6 mt-1">
                      <li><strong>Full Name:</strong> e.g., "Michael Pickett"</li>
                      <li><strong>Email:</strong> Use a dedicated staff email (e.g., michael@grandmasrecipes.com)</li>
                      <li><strong>Password:</strong> Create a secure password</li>
                      <li><strong>Role:</strong> Choose Moderator or Admin</li>
                    </ul>
                  </li>
                  <li>Click <strong>"Create Staff Account"</strong></li>
                </ol>
                <p className="text-sm text-muted-foreground mt-2 italic">
                  Note: Staff accounts are separate from customer accounts and don't require subscriptions
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How to Assign Roles to Existing Users:</h3>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                  <li>In the <strong>"Assign Role to Existing User"</strong> section</li>
                  <li>Enter the user's email or name</li>
                  <li>Select the role (Admin, Moderator, or User)</li>
                  <li>Click <strong>"Assign Role"</strong></li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Role Permissions:</h3>
                <div className="space-y-2 text-muted-foreground">
                  <div>
                    <strong className="text-foreground">Admin:</strong>
                    <ul className="list-disc list-inside ml-6">
                      <li>Full access to all features</li>
                      <li>Create/edit/delete recipes</li>
                      <li>Manage users and roles</li>
                      <li>Process email change requests</li>
                      <li>Moderate recipes</li>
                      <li>Manage products</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-foreground">Moderator:</strong>
                    <ul className="list-disc list-inside ml-6">
                      <li>Create/edit/delete recipes</li>
                      <li>Moderate user recipes</li>
                      <li>Manage products</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-foreground">User:</strong>
                    <ul className="list-disc list-inside ml-6">
                      <li>View recipes (based on subscription tier)</li>
                      <li>Create personal recipes (premium users only)</li>
                      <li>Manage own account</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <CardTitle>Email Change Management</CardTitle>
              </div>
              <CardDescription>Processing user email change requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">How to Process Email Change Requests:</h3>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                  <li>View pending requests in the <strong>"Email Change Requests"</strong> section</li>
                  <li>Review the user's reason for the change</li>
                  <li>Click <strong>"Approve"</strong> to accept or <strong>"Reject"</strong> to deny</li>
                  <li>The user will be notified of the decision</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">How to Manually Change a User's Email:</h3>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Find the <strong>"Change User Email"</strong> section</li>
                  <li>Enter the user's ID and new email address</li>
                  <li>Click <strong>"Change Email"</strong></li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Product Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <CardTitle>Product Management</CardTitle>
              </div>
              <CardDescription>Managing shop products</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">How to Add Products:</h3>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Go to <Link to="/product-management" className="text-primary hover:underline">Product Management</Link></li>
                  <li>Click <strong>"Add Product"</strong></li>
                  <li>Fill in product details (title, description, price, category)</li>
                  <li>Add Amazon URL or product images</li>
                  <li>Click <strong>"Save Product"</strong></li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Quick Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Reference Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/admin">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => {
                    console.log('📍 Navigating to /recipe-management');
                    navigate('/recipe-management');
                  }}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Manage Recipes
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/moderation">
                    <Eye className="w-4 h-4 mr-2" />
                    Recipe Moderation
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link to="/product-management">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Product Management
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminInstructions;
