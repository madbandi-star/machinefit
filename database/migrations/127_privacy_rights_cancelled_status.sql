-- Allow users to cancel privacy rights requests (correction / deletion / processing_stop).

ALTER TABLE privacy_rights_requests
  DROP CONSTRAINT IF EXISTS privacy_rights_requests_status_chk;

ALTER TABLE privacy_rights_requests
  ADD CONSTRAINT privacy_rights_requests_status_chk CHECK (
    status IN ('received', 'reviewing', 'completed', 'rejected', 'cancelled')
  );

COMMENT ON COLUMN privacy_rights_requests.status IS
  'received|reviewing|completed|rejected|cancelled (user-cancelled pending or undone processing_stop)';
