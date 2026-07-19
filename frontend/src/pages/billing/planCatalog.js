export const DEFAULT_PLAN_CATALOG = [
  {
    id: 'free',
    slug: 'free',
    name: 'Basic / Free',
    price: 0,
    desc: 'Free forever • up to 200 employees • DB optional',
    features: ['Employee & attendance basics', 'Leave & payroll essentials', 'Optional database setup'],
    highlight: false,
    tag: null,
  },
  {
    id: 'custom',
    slug: 'custom',
    name: 'Custom / Add-on',
    price: null,
    desc: 'Choose add-ons and modules on demand',
    features: ['Optional modules for recruitment', 'Performance & training add-ons', 'Tailored implementation support'],
    highlight: false,
    tag: 'Custom',
  },
  {
    id: 'pro',
    slug: 'pro',
    name: 'Pro',
    price: 349900,
    desc: 'Full access, automation, and support',
    features: ['Unlimited employee access', 'Automation & compliance workflows', 'Priority support and onboarding'],
    highlight: true,
    tag: 'Popular',
  },
];

export function normalizePlanCatalog(raw, fallback = DEFAULT_PLAN_CATALOG) {
  const items = Array.isArray(raw?.plans) ? raw.plans : (Array.isArray(raw) ? raw : []);
  if (!items.length) return [...fallback];

  const normalized = items.map((plan) => {
    const slug = plan.slug || plan.id || 'free';
    const basePrice = typeof plan.base_price_paise === 'number' ? plan.base_price_paise : (plan.price ?? null);
    const id = plan.id || slug;
    const price = basePrice === 0 ? 0 : (basePrice ?? null);

    return {
      id,
      slug,
      name: plan.name || plan.display_name || plan.label || slug,
      desc: plan.tagline || plan.desc || plan.note || 'Flexible subscription options',
      price,
      features: Array.isArray(plan.highlights) && plan.highlights.length
        ? plan.highlights
        : (Array.isArray(plan.features) ? plan.features : []),
      highlight: Boolean(plan.is_popular || plan.highlight),
      tag: plan.badge || (plan.is_popular ? 'Popular' : null),
      base_price_paise: basePrice,
      is_popular: Boolean(plan.is_popular),
      is_active: plan.is_active !== false,
    };
  });

  const bySlug = new Map(normalized.map((plan) => [plan.slug, plan]));
  const fallbackBySlug = new Map(fallback.map((plan) => [plan.slug, plan]));

  return ['free', 'custom', 'pro'].map((slug) => {
    const fromApi = bySlug.get(slug) || bySlug.get(slug.toLowerCase());
    const fallbackPlan = fallbackBySlug.get(slug) || fallbackBySlug.get(slug.toLowerCase());
    if (fromApi) return fromApi;
    return fallbackPlan ? { ...fallbackPlan } : null;
  }).filter(Boolean);
}
