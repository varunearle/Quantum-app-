-- Create portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assets table
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  expected_return DECIMAL(10, 6) NOT NULL,
  volatility DECIMAL(10, 6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create optimization_results table
CREATE TABLE IF NOT EXISTS public.optimization_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  weights JSONB NOT NULL,
  expected_return DECIMAL(10, 6) NOT NULL,
  volatility DECIMAL(10, 6) NOT NULL,
  sharpe_ratio DECIMAL(10, 6) NOT NULL,
  convergence_data JSONB,
  parameters JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for portfolios
CREATE POLICY "portfolios_select_own" ON public.portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "portfolios_insert_own" ON public.portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "portfolios_update_own" ON public.portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "portfolios_delete_own" ON public.portfolios FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for assets
CREATE POLICY "assets_select_own" ON public.assets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE portfolios.id = assets.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "assets_insert_own" ON public.assets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.portfolios WHERE portfolios.id = assets.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "assets_update_own" ON public.assets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE portfolios.id = assets.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "assets_delete_own" ON public.assets FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE portfolios.id = assets.portfolio_id AND portfolios.user_id = auth.uid())
);

-- Create RLS policies for optimization_results
CREATE POLICY "optimization_results_select_own" ON public.optimization_results FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE portfolios.id = optimization_results.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "optimization_results_insert_own" ON public.optimization_results FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.portfolios WHERE portfolios.id = optimization_results.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "optimization_results_update_own" ON public.optimization_results FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE portfolios.id = optimization_results.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "optimization_results_delete_own" ON public.optimization_results FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE portfolios.id = optimization_results.portfolio_id AND portfolios.user_id = auth.uid())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_portfolio_id ON public.assets(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_optimization_results_portfolio_id ON public.optimization_results(portfolio_id);
