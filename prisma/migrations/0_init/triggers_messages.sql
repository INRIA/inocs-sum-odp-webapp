DELIMITER $$

CREATE TRIGGER messages_before_insert
BEFORE INSERT ON messages
FOR EACH ROW
BEGIN
  -- Set from_email from users table
  IF NEW.from_user_id IS NOT NULL THEN
    SET NEW.from_email = (SELECT email FROM users WHERE id = NEW.from_user_id);
  END IF;
  
  -- Set to_email from users table if to_user_id is provided
  IF NEW.to_user_id IS NOT NULL THEN
    SET NEW.to_email = (SELECT email FROM users WHERE id = NEW.to_user_id);
  END IF;
END$$

CREATE TRIGGER messages_before_update
BEFORE UPDATE ON messages
FOR EACH ROW
BEGIN
  IF NEW.from_user_id IS NOT NULL THEN
    SET NEW.from_email = (SELECT email FROM users WHERE id = NEW.from_user_id);
  END IF;
  
  IF NEW.to_user_id IS NOT NULL THEN
    SET NEW.to_email = (SELECT email FROM users WHERE id = NEW.to_user_id);
  END IF;
END$$

DELIMITER ;