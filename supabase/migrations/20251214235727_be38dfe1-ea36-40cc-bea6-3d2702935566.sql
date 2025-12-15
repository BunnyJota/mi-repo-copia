-- Allow authenticated users to create barbershops (for registration flow)
CREATE POLICY "Authenticated users can create barbershops"
ON public.barbershops
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow owners to insert user_roles for themselves
CREATE POLICY "Owners can insert own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to insert subscriptions for barbershops they are creating
CREATE POLICY "Authenticated can insert subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to insert availability rules for barbershops they are creating
CREATE POLICY "Authenticated can insert availability rules"
ON public.availability_rules
FOR INSERT
TO authenticated
WITH CHECK (true);