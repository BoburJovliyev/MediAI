-- Allow admins to view all scan_analyses
CREATE POLICY "Admins can view all scans"
ON public.scan_analyses
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all diagnoses
CREATE POLICY "Admins can view all diagnoses"
ON public.diagnoses
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all rehab_sessions
CREATE POLICY "Admins can view all rehab sessions"
ON public.rehab_sessions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all patients
CREATE POLICY "Admins can view all patients"
ON public.patients
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));