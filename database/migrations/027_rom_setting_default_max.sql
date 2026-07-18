-- Normalize legacy ROM default from "full" to "최대"

UPDATE machine_settings
SET rom_setting = '최대'
WHERE rom_setting = 'full';

UPDATE recommendations
SET rom_setting = '최대'
WHERE rom_setting = 'full';

UPDATE machines
SET rom_type = '최대'
WHERE rom_type = 'full';

UPDATE user_machine_preferences
SET custom_settings = jsonb_set(custom_settings, '{romSetting}', '"최대"', false)
WHERE custom_settings->>'romSetting' = 'full';
