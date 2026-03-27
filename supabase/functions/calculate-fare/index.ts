// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

/**
 * Jong Jaroen - calculate-fare Edge Function
  * Handles Distance Matrix API securely server-side.
   * API Key never exposed to frontend.
    *
     * 3% GP Logic: final_price = base_fare + (distance_km * rate_per_km) * 1.03
      */

      const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY') ?? '';

      // Fare config (baht)
      const BASE_FARE     = 35;   // base fare
      const RATE_PER_KM   = 7;    // per km rate
      const GP_RATE       = 0.03; // 3% platform fee

      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          };

          serve(async (req: Request) => {
            if (req.method === 'OPTIONS') {
                return new Response('ok', { headers: corsHeaders });
                  }

                    try {
                        const { origin_lat, origin_lng, dest_lat, dest_lng } = await req.json();

                            if (!origin_lat || !origin_lng || !dest_lat || !dest_lng) {
                                  return new Response(
                                          JSON.stringify({ error: 'Missing coordinates' }),
                                                  { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                                                        );
                                                            }

                                                                // Call Google Maps Distance Matrix API
                                                                    const url = `https://maps.googleapis.com/maps/api/distancematrix/json` +
                                                                          `?origins=${origin_lat},${origin_lng}` +
                                                                                `&destinations=${dest_lat},${dest_lng}` +
                                                                                      `&mode=driving` +
                                                                                            `&key=${GOOGLE_MAPS_API_KEY}`;

                                                                                                const gmRes  = await fetch(url);
                                                                                                    const gmData = await gmRes.json();
                                                                                                    
                                                                                                        const element = gmData?.rows?.[0]?.elements?.[0];
                                                                                                        
                                                                                                            if (!element || element.status !== 'OK') {
                                                                                                                  return new Response(
                                                                                                                          JSON.stringify({ error: 'Google Maps API error', detail: element?.status }),
                                                                                                                                  { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                                                                                                                                        );
                                                                                                                                            }
                                                                                                                                            
                                                                                                                                                const distance_m  = element.distance.value;  // meters
                                                                                                                                                    const duration_s  = element.duration.value;  // seconds
                                                                                                                                                        const distance_km = parseFloat((distance_m / 1000).toFixed(2));
                                                                                                                                                        
                                                                                                                                                            // Calculate fare
                                                                                                                                                                const raw_fare   = BASE_FARE + (distance_km * RATE_PER_KM);
                                                                                                                                                                    const final_price = parseFloat((raw_fare * (1 + GP_RATE)).toFixed(2));
                                                                                                                                                                        const gp_amount   = parseFloat((raw_fare * GP_RATE).toFixed(2));
                                                                                                                                                                        
                                                                                                                                                                            return new Response(
                                                                                                                                                                                  JSON.stringify({
                                                                                                                                                                                          distance_km,
                                                                                                                                                                                                  duration_min: Math.ceil(duration_s / 60),
                                                                                                                                                                                                          base_fare:    BASE_FARE,
                                                                                                                                                                                                                  raw_fare:     parseFloat(raw_fare.toFixed(2)),
                                                                                                                                                                                                                          gp_amount,
                                                                                                                                                                                                                                  final_price,
                                                                                                                                                                                                                                          distance_text: element.distance.text,
                                                                                                                                                                                                                                                  duration_text: element.duration.text,
                                                                                                                                                                                                                                                        }),
                                                                                                                                                                                                                                                              {
                                                                                                                                                                                                                                                                      status: 200,
                                                                                                                                                                                                                                                                              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                        );
                                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                                          } catch (err) {
                                                                                                                                                                                                                                                                                              return new Response(
                                                                                                                                                                                                                                                                                                    JSON.stringify({ error: 'Internal error', detail: String(err) }),
                                                                                                                                                                                                                                                                                                          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                                                                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                                });
