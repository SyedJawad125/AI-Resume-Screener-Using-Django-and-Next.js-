
SHOW_ROLE = 'show_role'
CREATE_ROLE = 'create_role'
READ_ROLE = 'read_role'
UPDATE_ROLE = 'update_role'
DELETE_ROLE = 'delete_role'

SHOW_USER = 'show_user'
CREATE_USER = 'create_user'
READ_USER = 'read_user'
UPDATE_USER = 'update_user'
DELETE_USER = 'delete_user'
TOGGLE_USER = 'toggle_user'


CREATE_AUCTION = 'create_auction'
READ_AUCTION = 'read_auction'
UPDATE_AUCTION = 'update_auction'
DELETE_AUCTION = 'delete_auction'

CREATE_TAG = 'create_tag'
READ_TAG = 'read_tag'
UPDATE_TAG = 'update_tag'
DELETE_TAG = 'delete_tag'

CREATE_LOT = 'create_lot'
READ_LOT = 'read_lot'
UPDATE_LOT = 'update_lot'
DELETE_LOT = 'delete_lot'

CREATE_FAQ = 'create_faq'
READ_FAQ = 'read_faq'
UPDATE_FAQ = 'update_faq'
DELETE_FAQ = 'delete_faq'

CREATE_NEWS_CATEGORY =  'create_news_category'
READ_NEWS_CATEGORY =  'read_news_category'
UPDATE_NEWS_CATEGORY = 'update_news_category'
DELETE_NEWS_CATEGORY = 'delete_news_category'

CREATE_NEWS_UPDATE =  'create_news_update'
READ_NEWS_UPDATE =  'read_news_update'
UPDATE_NEWS_UPDATE = 'update_news_update'
DELETE_NEWS_UPDATE = 'delete_news_update'

UPDATE_PROFILE = 'update_profile'
GET_PROFILE = 'get_profile'

CREATE_BUSINESS =  'create_business'
READ_BUSINESS =  'read_business'
UPDATE_BUSINESS = 'update_business'
DELETE_BUSINESS = 'delete_business'

CREATE_CATEGORY = 'create_category'
READ_CATEGORY = 'read_category'
UPDATE_CATEGORY = 'update_category'
DELETE_CATEGORY = 'delete_category'

CREATE_TAG = 'create_tag'
READ_TAG = 'read_tag'
UPDATE_TAG = 'update_tag'
DELETE_TAG = 'delete_tag'

CREATE_BLOG_POST = 'create_blog_post'
READ_BLOG_POST = 'read_blog_post'
UPDATE_BLOG_POST = 'update_blog_post'
DELETE_BLOG_POST = 'delete_blog_post'

CREATE_COMMENT = 'create_comment'
READ_COMMENT = 'read_comment'
UPDATE_COMMENT = 'update_comment'
DELETE_COMMENT = 'delete_comment'

CREATE_MEDIA = 'create_media'
READ_MEDIA = 'read_media'
UPDATE_MEDIA = 'update_media'
DELETE_MEDIA = 'delete_media'

CREATE_NEWSLETTER = 'create_newsletter'
READ_NEWSLETTER = 'read_newsletter'
UPDATE_NEWSLETTER = 'update_newsletter'
DELETE_NEWSLETTER = 'delete_newsletter'

CREATE_CAMPAIGN = 'create_campaign'
READ_CAMPAIGN = 'read_campaign'
UPDATE_CAMPAIGN = 'update_campaign'
DELETE_CAMPAIGN = 'delete_campaign'

CREATE_IMAGE = 'create_image'
READ_IMAGE = 'read_image'
UPDATE_IMAGE = 'update_image'
DELETE_IMAGE = 'delete_image'

CREATE_IMAGE_CATEGORY = 'create_image_category'
READ_IMAGE_CATEGORY = 'read_image_category'
UPDATE_IMAGE_CATEGORY = 'update_image_category'
DELETE_IMAGE_CATEGORY = 'delete_image_category'

# ─── JOB ─────────────────────────────────────
SHOW_JOB    = "show_job"
CREATE_JOB  = "create_job"
READ_JOB    = "read_job"
UPDATE_JOB  = "update_job"
DELETE_JOB  = "delete_job"
ANALYZE_JOB = "analyze_job"
STATS_JOB   = "stats_job"
TOGGLE_JOB  = "toggle_job"   # ← was missing
# ─── RESUMES ─────────────────────────────────────
SHOW_RESUME         = 'show_resume'          # lightweight list — tables / dropdowns
UPLOAD_RESUME       = 'upload_resume'        # POST  /resume/          (single upload)
READ_RESUME         = 'read_resume'          # GET   /resume/?id=  or list
UPDATE_RESUME       = 'update_resume'        # PATCH /resume/?id=      (metadata only)
DELETE_RESUME       = 'delete_resume'        # DELETE /resume/?id=     (soft-delete)
BULK_UPLOAD_RESUME  = 'bulk_upload_resume'   # POST  /resume/bulk-upload/  + status GET
RETRY_PARSE_RESUME  = 'retry_parse_resume'   # POST  /resume/retry-parse/
STATS_RESUME        = 'stats_resume'         # GET   /resume/stats/

# ── Screening ─────────────────────────────────────────────
SHOW_SCREENING      = 'show_screening'      # GET  /screening/v1/session/  (list)
CREATE_SCREENING    = 'create_screening'    # POST /screening/v1/session/start/
READ_SCREENING      = 'read_screening'      # GET  /screening/v1/session/?id=
                                            # GET  /screening/v1/result/  or ?id=
                                            # GET  /screening/v1/result/agent-logs/
DELETE_SCREENING    = 'delete_screening'    # DELETE /screening/v1/session/?id=
DECIDE_SCREENING    = 'decide_screening'    # PATCH /screening/v1/result/decision/
COMPARE_SCREENING   = 'compare_screening'   # POST /screening/v1/compare/
ANALYTICS_SCREENING = 'analytics_screening' # GET  /screening/v1/analytics/
STATS_SCREENING     = 'stats_screening'     # GET  /screening/v1/stats/
SHOW_ALL_SCREENINGS = 'show_all_screenings' # bypass initiated_by scope filter (manager/admin role)




# Company
CREATE_COMPANY = 'create_company'
READ_COMPANY   = 'read_company'
UPDATE_COMPANY = 'update_company'
DELETE_COMPANY = 'delete_company'