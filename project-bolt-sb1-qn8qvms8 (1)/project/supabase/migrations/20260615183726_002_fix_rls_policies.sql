-- Drop all broken policies
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;

DROP POLICY IF EXISTS "select_customers" ON customers;
DROP POLICY IF EXISTS "insert_customers" ON customers;
DROP POLICY IF EXISTS "update_customers" ON customers;
DROP POLICY IF EXISTS "delete_customers" ON customers;

DROP POLICY IF EXISTS "select_devices" ON devices;
DROP POLICY IF EXISTS "insert_devices" ON devices;
DROP POLICY IF EXISTS "update_devices" ON devices;
DROP POLICY IF EXISTS "delete_devices" ON devices;

DROP POLICY IF EXISTS "select_emi_schedules" ON emi_schedules;
DROP POLICY IF EXISTS "insert_emi_schedules" ON emi_schedules;
DROP POLICY IF EXISTS "update_emi_schedules" ON emi_schedules;
DROP POLICY IF EXISTS "delete_emi_schedules" ON emi_schedules;

DROP POLICY IF EXISTS "select_payments" ON payments;
DROP POLICY IF EXISTS "insert_payments" ON payments;
DROP POLICY IF EXISTS "update_payments" ON payments;
DROP POLICY IF EXISTS "delete_payments" ON payments;

DROP POLICY IF EXISTS "select_device_locks" ON device_locks;
DROP POLICY IF EXISTS "insert_device_locks" ON device_locks;
DROP POLICY IF EXISTS "update_device_locks" ON device_locks;
DROP POLICY IF EXISTS "delete_device_locks" ON device_locks;

DROP POLICY IF EXISTS "select_activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "insert_activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "update_activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "delete_activity_logs" ON activity_logs;

-- Create a SECURITY DEFINER function that bypasses RLS to check admin role
-- This prevents infinite recursion when policies check the profiles table
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_dealer()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'dealer')
  );
$$;

-- =====================
-- PROFILES policies
-- Simple: each user sees only their own profile (no cross-profile reads needed)
-- =====================
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_profile" ON profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =====================
-- CUSTOMERS policies
-- =====================
CREATE POLICY "select_customers" ON customers
  FOR SELECT TO authenticated
  USING (dealer_id = auth.uid() OR user_id = auth.uid() OR is_admin());

CREATE POLICY "insert_customers" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (dealer_id = auth.uid() OR is_admin());

CREATE POLICY "update_customers" ON customers
  FOR UPDATE TO authenticated
  USING (dealer_id = auth.uid() OR is_admin())
  WITH CHECK (dealer_id = auth.uid() OR is_admin());

CREATE POLICY "delete_customers" ON customers
  FOR DELETE TO authenticated
  USING (dealer_id = auth.uid() OR is_admin());

-- =====================
-- DEVICES policies
-- =====================
CREATE POLICY "select_devices" ON devices
  FOR SELECT TO authenticated
  USING (
    dealer_id = auth.uid()
    OR customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "insert_devices" ON devices
  FOR INSERT TO authenticated
  WITH CHECK (dealer_id = auth.uid() OR is_admin());

CREATE POLICY "update_devices" ON devices
  FOR UPDATE TO authenticated
  USING (dealer_id = auth.uid() OR is_admin())
  WITH CHECK (dealer_id = auth.uid() OR is_admin());

CREATE POLICY "delete_devices" ON devices
  FOR DELETE TO authenticated
  USING (dealer_id = auth.uid() OR is_admin());

-- =====================
-- EMI SCHEDULES policies
-- =====================
CREATE POLICY "select_emi_schedules" ON emi_schedules
  FOR SELECT TO authenticated
  USING (
    dealer_id = auth.uid()
    OR customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "insert_emi_schedules" ON emi_schedules
  FOR INSERT TO authenticated
  WITH CHECK (dealer_id = auth.uid() OR is_admin());

CREATE POLICY "update_emi_schedules" ON emi_schedules
  FOR UPDATE TO authenticated
  USING (dealer_id = auth.uid() OR is_admin())
  WITH CHECK (dealer_id = auth.uid() OR is_admin());

CREATE POLICY "delete_emi_schedules" ON emi_schedules
  FOR DELETE TO authenticated
  USING (dealer_id = auth.uid() OR is_admin());

-- =====================
-- PAYMENTS policies
-- =====================
CREATE POLICY "select_payments" ON payments
  FOR SELECT TO authenticated
  USING (
    emi_schedule_id IN (SELECT id FROM emi_schedules WHERE dealer_id = auth.uid())
    OR emi_schedule_id IN (
        SELECT id FROM emi_schedules
        WHERE customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    )
    OR is_admin()
  );

CREATE POLICY "insert_payments" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (
    emi_schedule_id IN (SELECT id FROM emi_schedules WHERE dealer_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "update_payments" ON payments
  FOR UPDATE TO authenticated
  USING (
    emi_schedule_id IN (SELECT id FROM emi_schedules WHERE dealer_id = auth.uid())
    OR is_admin()
  )
  WITH CHECK (
    emi_schedule_id IN (SELECT id FROM emi_schedules WHERE dealer_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "delete_payments" ON payments
  FOR DELETE TO authenticated
  USING (
    emi_schedule_id IN (SELECT id FROM emi_schedules WHERE dealer_id = auth.uid())
    OR is_admin()
  );

-- =====================
-- DEVICE LOCKS policies
-- =====================
CREATE POLICY "select_device_locks" ON device_locks
  FOR SELECT TO authenticated
  USING (
    device_id IN (SELECT id FROM devices WHERE dealer_id = auth.uid())
    OR device_id IN (
        SELECT id FROM devices
        WHERE customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    )
    OR is_admin()
  );

CREATE POLICY "insert_device_locks" ON device_locks
  FOR INSERT TO authenticated
  WITH CHECK (
    device_id IN (SELECT id FROM devices WHERE dealer_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "update_device_locks" ON device_locks
  FOR UPDATE TO authenticated
  USING (device_id IN (SELECT id FROM devices WHERE dealer_id = auth.uid()) OR is_admin())
  WITH CHECK (device_id IN (SELECT id FROM devices WHERE dealer_id = auth.uid()) OR is_admin());

CREATE POLICY "delete_device_locks" ON device_locks
  FOR DELETE TO authenticated
  USING (device_id IN (SELECT id FROM devices WHERE dealer_id = auth.uid()) OR is_admin());

-- =====================
-- ACTIVITY LOGS policies
-- =====================
CREATE POLICY "select_activity_logs" ON activity_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_dealer());

CREATE POLICY "insert_activity_logs" ON activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_activity_logs" ON activity_logs
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_activity_logs" ON activity_logs
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_admin());
