-- Function to safely increment points
CREATE OR REPLACE FUNCTION increment_points(user_id UUID, points_to_add INT)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET total_points = total_points + points_to_add,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
