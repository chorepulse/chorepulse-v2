-- MINIMAL TEST - Create just the rewards table to isolate the issue

-- Clean up
DROP TABLE IF EXISTS test_rewards CASCADE;

-- Test 1: Create without CHECK constraint
CREATE TABLE test_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active'
);

-- Insert a test row
INSERT INTO test_rewards (name, status) VALUES ('Test Reward', 'active');

-- Verify it worked
SELECT * FROM test_rewards;

-- Clean up the test
DROP TABLE test_rewards;

-- Test 2: Create WITH CHECK constraint
CREATE TABLE test_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'))
);

-- Insert a test row
INSERT INTO test_rewards (name, status) VALUES ('Test Reward 2', 'active');

-- Verify it worked
SELECT * FROM test_rewards;

-- Final cleanup
DROP TABLE test_rewards;
