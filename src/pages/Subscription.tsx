import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const COUNTRIES = ['UK', 'USA', 'Italy', 'France', 'Spain', 'Mexico', 'Japan', 'India', 'Thailand', 'Greece'];

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '£0',
    description: 'Get started with basic access',
    features: [
      'View 10 example recipes',
      'Basic recipe information',
      'Search and filter'
    ]
  },
  {
    id: 'country',
    name: 'Country Access',
    price: '£10',
    description: 'Explore recipes from one country',
    features: [
      'All recipes from one country',
      'Full recipe details',
      'Nutritional information',
      'Printable recipe cards'
    ]
  },
  {
    id: 'all',
    name: 'All Recipes',
    price: '£15',
    description: 'Access the complete collection',
    features: [
      'All recipes from all countries',
      'Full recipe details',
      'Nutritional information',
      'Printable recipe cards',
      'Priority support'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '£20',
    description: 'Full access plus contribution',
    features: [
      'Everything in All Recipes',
      'Add your own recipes',
      'Edit your recipes',
      'Share with the community',
      'Premium support'
    ]
  }
];

const Subscription = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUserId(session.user.id);
        checkExistingSubscription(session.user.id);
      }
    });
  }, [navigate]);

  const checkExistingSubscription = async (uid: string) => {
    const { data } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', uid)
      .single();
    
    if (data && data.tier !== 'free') {
      navigate('/');
    }
  };

  const handleSelectPlan = async () => {
    if (!selectedTier || !userId) return;
    
    if (selectedTier === 'country' && !selectedCountry) {
      toast({
        title: "Country required",
        description: "Please select a country for this plan",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Update subscription tier
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({ 
          tier: selectedTier,
          status: selectedTier === 'free' ? 'inactive' : 'active'
        })
        .eq('user_id', userId);

      if (subError) throw subError;

      // Update country if needed
      if (selectedTier === 'country' && selectedCountry) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ selected_country: selectedCountry })
          .eq('id', userId);

        if (profileError) throw profileError;
      }

      toast({
        title: "Plan selected!",
        description: `You now have ${TIERS.find(t => t.id === selectedTier)?.name} access`
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 py-12">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground">
            Select the perfect plan for your culinary journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {TIERS.map((tier) => (
            <Card 
              key={tier.id}
              className={`cursor-pointer transition-all ${
                selectedTier === tier.id 
                  ? 'border-primary shadow-lg' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedTier(tier.id)}
            >
              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="text-3xl font-bold text-primary mt-4">
                  {tier.price}
                  {tier.id !== 'free' && <span className="text-sm font-normal text-muted-foreground">/year</span>}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedTier === 'country' && (
          <Card className="max-w-md mx-auto mb-8">
            <CardHeader>
              <CardTitle>Select Your Country</CardTitle>
              <CardDescription>Choose which country's recipes you'd like to access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button 
            size="lg"
            onClick={handleSelectPlan}
            disabled={!selectedTier || loading}
          >
            {loading ? 'Processing...' : 'Continue with Selected Plan'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
