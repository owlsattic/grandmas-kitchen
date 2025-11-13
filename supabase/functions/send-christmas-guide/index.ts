import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SubscribeRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SubscribeRequest = await req.json();

    // Validate email
    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid email address" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if email already exists
    const { data: existingSubscriber, error: checkError } = await supabase
      .from("christmas_subscribers")
      .select("email, unsubscribed")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing subscriber:", checkError);
      throw checkError;
    }

    if (existingSubscriber) {
      if (existingSubscriber.unsubscribed) {
        return new Response(
          JSON.stringify({ 
            error: "This email has unsubscribed from our list. Please contact us if you'd like to resubscribe." 
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      return new Response(
        JSON.stringify({ 
          error: "You're already subscribed! Check your inbox for the Christmas guide." 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Insert new subscriber
    const { error: insertError } = await supabase
      .from("christmas_subscribers")
      .insert({
        email: email.toLowerCase(),
        guide_sent: true,
      });

    if (insertError) {
      console.error("Error inserting subscriber:", insertError);
      throw insertError;
    }

    // Send email via Brevo
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY not configured");
    }

    const emailContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Christmas Dinner Guide</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #fffaf3;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #fffdf9; border: 1px solid #e9ddcc; border-radius: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 2px solid #e9ddcc;">
              <h1 style="margin: 0; font-size: 32px; color: #4b6043; font-weight: bold;">🎄 Grandma's Kitchen</h1>
              <p style="margin: 10px 0 0; font-size: 18px; color: #c97a40; font-family: 'Brush Script MT', cursive;">Your Christmas Dinner Guide Has Arrived!</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3a3124;">
                Dear Friend,
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3a3124;">
                Thank you for subscribing to Grandma's Kitchen! Your complete Christmas dinner recipe collection is ready.
              </p>
              
              <div style="background-color: #fffefb; border: 1px solid #e9ddcc; border-radius: 8px; padding: 30px; margin: 30px 0;">
                <h2 style="margin: 0 0 20px; font-size: 24px; color: #4b6043; text-align: center;">What's Inside Your Guide:</h2>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #3a3124; font-size: 16px; line-height: 1.8;">
                  <li>Complete Christmas dinner menu with precise timings</li>
                  <li>Traditional roast turkey & beef recipes with step-by-step instructions</li>
                  <li>Classic sides: perfect roast potatoes, stuffing & rich gravy</li>
                  <li>Festive desserts that will wow your guests</li>
                  <li>Creative leftover transformation recipes</li>
                  <li>Complete shopping list & make-ahead tips</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${supabaseUrl.replace('supabase.co', 'lovable.app')}/recipes?category=Christmas" 
                   style="display: inline-block; background-color: #c97a40; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  View Christmas Recipes →
                </a>
              </div>
              
              <div style="background-color: #fff8ed; border-left: 4px solid #c97a40; padding: 20px; margin: 30px 0;">
                <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #3a3124; font-style: italic;">
                  "Christmas dinner is about gathering together, not stressing in the kitchen. With good planning and simple traditions, every meal becomes a memory."
                </p>
                <p style="margin: 10px 0 0; font-size: 14px; color: #c97a40; text-align: right;">— Grandma</p>
              </div>
              
              <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #3a3124;">
                Happy cooking, and Merry Christmas! 🎅
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #fffdf9; border-top: 1px solid #e9ddcc; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #856a4a;">
                © 2025 Grandma's Kitchen — All Rights Reserved
              </p>
              <p style="margin: 0; font-size: 12px; color: #856a4a;">
                You're receiving this because you signed up for our Christmas Dinner Guide.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Grandma's Kitchen",
          email: "garypickett@outlook.com",
        },
        to: [{ email: email }],
        subject: "🎄 Your Free Christmas Dinner Guide is Here!",
        htmlContent: emailContent,
      }),
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text();
      console.error("Brevo API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    console.log("Email sent successfully to:", email);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Check your inbox! Your Christmas guide is on its way 🎄" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-christmas-guide function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
