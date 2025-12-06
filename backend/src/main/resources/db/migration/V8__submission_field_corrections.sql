-- Create table for storing field-level corrections made in PM tool
-- Original submission data stays in mobile app DB, corrections are stored here
CREATE TABLE submission_field_correction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference to submission in mobile app (not a FK, just reference)
    submission_id UUID NOT NULL,
    
    -- Field that was corrected
    field_id VARCHAR(255) NOT NULL,
    
    -- The corrected value
    corrected_value TEXT,
    
    -- The original value (for audit trail)
    original_value TEXT,
    
    -- Who made the correction
    corrected_by UUID NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only one correction per submission-field combination
    CONSTRAINT uq_submission_field UNIQUE (submission_id, field_id)
);

-- Index for fast lookup by submission
CREATE INDEX idx_correction_submission_id ON submission_field_correction(submission_id);

-- Index for unique constraint
CREATE INDEX idx_correction_submission_field ON submission_field_correction(submission_id, field_id);

-- Comment
COMMENT ON TABLE submission_field_correction IS 'Stores field-level corrections made in PM tool. Original data stays in mobile app.';
COMMENT ON COLUMN submission_field_correction.submission_id IS 'Reference to submission in mobile app (not a FK)';
COMMENT ON COLUMN submission_field_correction.field_id IS 'The field ID that was corrected';
COMMENT ON COLUMN submission_field_correction.corrected_value IS 'The corrected value (stored as JSON text)';
COMMENT ON COLUMN submission_field_correction.original_value IS 'The original value from mobile app (for audit trail)';
COMMENT ON COLUMN submission_field_correction.corrected_by IS 'User who made the correction';

