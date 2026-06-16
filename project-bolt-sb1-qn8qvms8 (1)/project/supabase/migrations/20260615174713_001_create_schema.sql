-- Profiles table
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  company_name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'dealer', 'customer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dealer_id UUID REFERENCES auth.users(id) NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  pincode TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_customers" ON customers FOR SELECT TO authenticated USING (dealer_id = auth.uid() OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "insert_customers" ON customers FOR INSERT TO authenticated WITH CHECK (dealer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "update_customers" ON customers FOR UPDATE TO authenticated USING (dealer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')) WITH CHECK (dealer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "delete_customers" ON customers FOR DELETE TO authenticated USING (dealer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Devices table
CREATE TABLE devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID REFERENCES auth.users(id) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  imei TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  device_model TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked', 'stolen', 'lost')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_devices" ON devices FOR SELECT TO authenticated USING (dealer_id = auth.uid() OR customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "insert_devices" ON devices FOR INSERT TO authenticated WITH CHECK (dealer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "update_devices" ON devices FOR UPDATE TO authenticated USING (dealer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')) WITH CHECK (dealer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "delete_devices" ON devices FOR DELETE TO authenticated USING (dealer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- EMI schedules table
CREATE TABLE emi_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id UUID REFERENCES auth.users(id) NOT NULL,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  device_id UUID REFERENCES devices(id) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  duration_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE emi_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_emi_schedules" ON emi_schedules FOR SELECT TO authenticated USING (dealer_id = auth.uid() OR customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "insert_emi_schedules" ON emi_schedules FOR INSERT TO authenticated WITH CHECK (dealer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "update_emi_schedules" ON emi_schedules FOR UPDATE TO authenticated USING (dealer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')) WITH CHECK (dealer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "delete_emi_schedules" ON emi_schedules FOR DELETE TO authenticated USING (dealer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Payments table
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  emi_schedule_id UUID REFERENCES emi_schedules(id) ON DELETE CASCADE NOT NULL,
  month_number INTEGER NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  payment_method TEXT CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Cheque', 'CreditCard')),
  reference_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_payments" ON payments FOR SELECT TO authenticated USING (emi_schedule_id IN (SELECT id FROM emi_schedules WHERE dealer_id = auth.uid()) OR emi_schedule_id IN (SELECT id FROM emi_schedules WHERE customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "insert_payments" ON payments FOR INSERT TO authenticated WITH CHECK (emi_schedule_id IN (SELECT id FROM emi_schedules WHERE dealer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "update_payments" ON payments FOR UPDATE TO authenticated USING (emi_schedule_id IN (SELECT id FROM emi_schedules WHERE dealer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')) WITH CHECK (emi_schedule_id IN (SELECT id FROM emi_schedules WHERE dealer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "delete_payments" ON payments FOR DELETE TO authenticated USING (emi_schedule_id IN (SELECT id FROM emi_schedules WHERE dealer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Device locks table
CREATE TABLE device_locks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES devices(id) NOT NULL,
  lock_status TEXT NOT NULL DEFAULT 'unlocked' CHECK (lock_status IN ('locked', 'unlocked')),
  reason TEXT,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE device_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_device_locks" ON device_locks FOR SELECT TO authenticated USING (device_id IN (SELECT id FROM devices WHERE dealer_id = auth.uid()) OR device_id IN (SELECT id FROM devices WHERE customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "insert_device_locks" ON device_locks FOR INSERT TO authenticated WITH CHECK (device_id IN (SELECT id FROM devices WHERE dealer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "update_device_locks" ON device_locks FOR UPDATE TO authenticated USING (device_id IN (SELECT id FROM devices WHERE dealer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')) WITH CHECK (device_id IN (SELECT id FROM devices WHERE dealer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "delete_device_locks" ON device_locks FOR DELETE TO authenticated USING (device_id IN (SELECT id FROM devices WHERE dealer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Activity logs table
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_activity_logs" ON activity_logs FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'dealer')));
CREATE POLICY "insert_activity_logs" ON activity_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_activity_logs" ON activity_logs FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete_activity_logs" ON activity_logs FOR DELETE TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
