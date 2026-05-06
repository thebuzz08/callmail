import 'server-only'

import Stripe from 'stripe'

// Use empty string fallback so the module loads at build time even if the env var is missing.
// Actual Stripe API calls will fail at request time with a clear error if the key is missing.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')
