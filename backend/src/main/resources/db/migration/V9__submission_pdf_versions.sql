-- Create table for tracking PDF versions when submissions are corrected
-- Original PDF (v1) stays in mobile app, corrected versions (v2, v3, ...) are tracked here
CREATE TABLE submission_pdf_version (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference to submission in mobile app (not a FK, just reference)
    submission_id UUID NOT NULL,
    
    -- Version number (2, 3, 4, ... since v1 is the original)
    version INTEGER NOT NULL,
    
    -- S3 object key for the corrected PDF (e.g., "path/file_v2.pdf")
    pdf_object_key VARCHAR(512) NOT NULL,
    
    -- Who triggered the PDF regeneration
    created_by UUID NOT NULL,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only one record per version per submission
    CONSTRAINT uq_submission_version UNIQUE (submission_id, version)
);

-- Index for fast lookup by submission (to find latest version)
CREATE INDEX idx_pdf_submission_id ON submission_pdf_version(submission_id);

-- Index for finding latest version
CREATE INDEX idx_pdf_submission_version ON submission_pdf_version(submission_id, version DESC);

-- Comments
COMMENT ON TABLE submission_pdf_version IS 'Tracks PDF versions for corrected submissions. Original (v1) in mobile app, corrected versions tracked here.';
COMMENT ON COLUMN submission_pdf_version.submission_id IS 'Reference to submission in mobile app';
COMMENT ON COLUMN submission_pdf_version.version IS 'Version number (2, 3, 4, ... since v1 is original)';
COMMENT ON COLUMN submission_pdf_version.pdf_object_key IS 'S3 object key for corrected PDF (e.g., path/file_v2.pdf)';
COMMENT ON COLUMN submission_pdf_version.created_by IS 'User who saved corrections and triggered PDF regeneration';

