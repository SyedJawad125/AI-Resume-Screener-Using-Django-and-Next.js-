import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()

from apps.users.models import Permission

permissions = [
    # ---------- ROLE ----------
    Permission(name='Show Role',       code_name='show_role',       module_name='Role', module_label='User Management', description='User can see role'),
    Permission(name='Create Role',     code_name='create_role',     module_name='Role', module_label='User Management', description='User can create role'),
    Permission(name='Read Role',       code_name='read_role',       module_name='Role', module_label='User Management', description='User can read role'),
    Permission(name='Update Role',     code_name='update_role',     module_name='Role', module_label='User Management', description='User can update role'),
    Permission(name='Delete Role',     code_name='delete_role',     module_name='Role', module_label='User Management', description='User can delete role'),
    
    # ---------- PERMISSION -----
    Permission(name='Show Permission', code_name='show_permission', module_name='Permission', module_label='User Permission', description='User can see Permission'),
    Permission(name='Create Permission', code_name='create_permission', module_name='Permission', module_label='User Permission', description='User can create Permission'),
    Permission(name='Read Permission', code_name='read_permission', module_name='Permission', module_label='User Permission', description='User can read Permission'),
    Permission(name='Update Permission', code_name='update_permission', module_name='Permission', module_label='User Permission', description='User can update Permission'),
    Permission(name='Delete Permission', code_name='delete_permission', module_name='Permission', module_label='User Permission', description='User can delete Permission'),

    # ---------- USER ----------
    Permission(name='Show User',       code_name='show_user',       module_name='User', module_label='User Management', description='User can see user'),
    Permission(name='Create User',     code_name='create_user',     module_name='User', module_label='User Management', description='User can create user'),
    Permission(name='Read User',       code_name='read_user',       module_name='User', module_label='User Management', description='User can read user'),
    Permission(name='Update User',     code_name='update_user',     module_name='User', module_label='User Management', description='User can update user'),
    Permission(name='Delete User',     code_name='delete_user',     module_name='User', module_label='User Management', description='User can delete user'),
    Permission(name='Deactivate User', code_name='toggle_user',     module_name='User', module_label='User Management', description='User can deactivate user'),

    # ---------- COMPANY ----------
    Permission(name='Create Company', code_name='create_company', module_name='Company', module_label='Company Management', description='User can create Company'),
    Permission(name='Read Company',   code_name='read_company',   module_name='Company', module_label='Company Management', description='User can read Company'),
    Permission(name='Update Company', code_name='update_company', module_name='Company', module_label='Company Management', description='User can update Company'),
    Permission(name='Delete Company', code_name='delete_company', module_name='Company', module_label='Company Management', description='User can delete Company'),

    # ---------- CATEGORY ----------
    Permission(name='Create Category', code_name='create_category', module_name='Category', module_label='Blog Management', description='User can create category'),
    Permission(name='Read Category',   code_name='read_category',   module_name='Category', module_label='Blog Management', description='User can read category'),
    Permission(name='Update Category', code_name='update_category', module_name='Category', module_label='Blog Management', description='User can update category'),
    Permission(name='Delete Category', code_name='delete_category', module_name='Category', module_label='Blog Management', description='User can delete category'),

    # ---------- TAG ----------
    Permission(name='Create Tag',      code_name='create_tag',      module_name='Tag', module_label='Blog Management', description='User can create tag'),
    Permission(name='Read Tag',        code_name='read_tag',        module_name='Tag', module_label='Blog Management', description='User can read tag'),
    Permission(name='Update Tag',      code_name='update_tag',      module_name='Tag', module_label='Blog Management', description='User can update tag'),
    Permission(name='Delete Tag',      code_name='delete_tag',      module_name='Tag', module_label='Blog Management', description='User can delete tag'),

    # ---------- BLOG POST ----------
    Permission(name='Create Blog Post', code_name='create_blog_post', module_name='BlogPost', module_label='Blog Management', description='User can create blog post'),
    Permission(name='Read Blog Post',   code_name='read_blog_post',   module_name='BlogPost', module_label='Blog Management', description='User can read blog post'),
    Permission(name='Update Blog Post', code_name='update_blog_post', module_name='BlogPost', module_label='Blog Management', description='User can update blog post'),
    Permission(name='Delete Blog Post', code_name='delete_blog_post', module_name='BlogPost', module_label='Blog Management', description='User can delete blog post'),

    # ---------- COMMENT ----------
    Permission(name='Create Comment',  code_name='create_comment',  module_name='Comment', module_label='Blog Management', description='User can create comment'),
    Permission(name='Read Comment',    code_name='read_comment',    module_name='Comment', module_label='Blog Management', description='User can read comment'),
    Permission(name='Update Comment',  code_name='update_comment',  module_name='Comment', module_label='Blog Management', description='User can update comment'),
    Permission(name='Delete Comment',  code_name='delete_comment',  module_name='Comment', module_label='Blog Management', description='User can delete comment'),

    # ---------- MEDIA ----------
    Permission(name='Create Media',    code_name='create_media',    module_name='Media', module_label='Media Library', description='User can create media'),
    Permission(name='Read Media',      code_name='read_media',      module_name='Media', module_label='Media Library', description='User can read media'),
    Permission(name='Update Media',    code_name='update_media',    module_name='Media', module_label='Media Library', description='User can update media'),
    Permission(name='Delete Media',    code_name='delete_media',    module_name='Media', module_label='Media Library', description='User can delete media'),

    # ---------- NEWSLETTER ----------
    Permission(name='Create Newsletter', code_name='create_newsletter', module_name='Newsletter', module_label='Campaign Management', description='User can create newsletter'),
    Permission(name='Read Newsletter',   code_name='read_newsletter',   module_name='Newsletter', module_label='Campaign Management', description='User can read newsletter'),
    Permission(name='Update Newsletter', code_name='update_newsletter', module_name='Newsletter', module_label='Campaign Management', description='User can update newsletter'),
    Permission(name='Delete Newsletter', code_name='delete_newsletter', module_name='Newsletter', module_label='Campaign Management', description='User can delete newsletter'),

    # ---------- CAMPAIGN ----------
    Permission(name='Create Campaign', code_name='create_campaign', module_name='Campaign', module_label='Campaign Management', description='User can create campaign'),
    Permission(name='Read Campaign',   code_name='read_campaign',   module_name='Campaign', module_label='Campaign Management', description='User can read campaign'),
    Permission(name='Update Campaign', code_name='update_campaign', module_name='Campaign', module_label='Campaign Management', description='User can update campaign'),
    Permission(name='Delete Campaign', code_name='delete_campaign', module_name='Campaign', module_label='Campaign Management', description='User can delete campaign'),

    # ---------- IMAGE ----------
    Permission(name='Create Image',    code_name='create_image',    module_name='Image', module_label='Image Management', description='User can create Image'),
    Permission(name='Read Image',      code_name='read_image',      module_name='Image', module_label='Image Management', description='User can read Image'),
    Permission(name='Update Image',    code_name='update_image',    module_name='Image', module_label='Image Management', description='User can update Image'),
    Permission(name='Delete Image',    code_name='delete_image',    module_name='Image', module_label='Image Management', description='User can delete Image'),

    # ---------- CATEGORY MANAGEMENT ----------
    Permission(name='Create Category', code_name='create_category', module_name='Category', module_label='Category Management', description='User can create Category'),
    Permission(name='Read Category',   code_name='read_category',   module_name='Category', module_label='Category Management', description='User can read Category'),
    Permission(name='Update Category', code_name='update_category', module_name='Category', module_label='Category Management', description='User can update Category'),
    Permission(name='Delete Category', code_name='delete_category', module_name='Category', module_label='Category Management', description='User can delete Category'),

    # ---------- IMAGE CATEGORY ----------
    Permission(name='Create Image Category', code_name='create_image_category', module_name='Image Category', module_label='Image Category Management', description='User can create Image Category'),
    Permission(name='Read Image Category',   code_name='read_image_category',   module_name='Image Category', module_label='Image Category Management', description='User can read Image Category'),
    Permission(name='Update Image Category', code_name='update_image_category', module_name='Image Category', module_label='Image Category Management', description='User can update Image Category'),
    Permission(name='Delete Image Category', code_name='delete_image_category', module_name='Image Category', module_label='Image Category Management', description='User can delete Image Category'),

    # ---------- JOB ----------
    Permission(name='Create Job',  code_name='create_job',  module_name='Job', module_label='Job Management', description='User can create a job'),
    Permission(name='Read Job',    code_name='read_job',    module_name='Job', module_label='Job Management', description='User can view a job'),
    Permission(name='Update Job',  code_name='update_job',  module_name='Job', module_label='Job Management', description='User can update a job'),
    Permission(name='Delete Job',  code_name='delete_job',  module_name='Job', module_label='Job Management', description='User can delete a job'),
    Permission(name='Show Job',    code_name='show_job',    module_name='Job', module_label='Job Management', description='User can list all jobs'),
    Permission(name='Toggle Job',  code_name='toggle_job',  module_name='Job', module_label='Job Management', description='User can toggle job status'),
    Permission(name='Analyze Job', code_name='analyze_job', module_name='Job', module_label='Job Management', description='User can trigger AI analysis on a job'),
    Permission(name='Stats Job',   code_name='stats_job',   module_name='Job', module_label='Job Management', description='User can view job statistics'),

    # ---------- RESUME ----------
    Permission(name='Show Resume',        code_name='show_resume',        module_name='Resume', module_label='Resume Management', description='User can see the lightweight resume list for tables and dropdowns'),
    Permission(name='Upload Resume',      code_name='upload_resume',      module_name='Resume', module_label='Resume Management', description='User can upload a single resume file'),
    Permission(name='Read Resume',        code_name='read_resume',        module_name='Resume', module_label='Resume Management', description='User can view a resume in full detail'),
    Permission(name='Update Resume',      code_name='update_resume',      module_name='Resume', module_label='Resume Management', description='User can update resume metadata such as name, tags, and notes'),
    Permission(name='Delete Resume',      code_name='delete_resume',      module_name='Resume', module_label='Resume Management', description='User can soft-delete and deactivate a resume'),
    Permission(name='Bulk Upload Resume', code_name='bulk_upload_resume', module_name='Resume', module_label='Resume Management', description='User can bulk upload up to 100 resumes at once and check session status'),
    Permission(name='Retry Parse Resume', code_name='retry_parse_resume', module_name='Resume', module_label='Resume Management', description='User can re-trigger AI parsing for failed resumes'),
    Permission(name='Resume Stats',       code_name='stats_resume',       module_name='Resume', module_label='Resume Management', description='User can view resume statistics for the company'),

    # ---------- SCREENING ----------
    Permission(name='Show Screening',      code_name='show_screening',      module_name='Screening', module_label='Screening Management', description='User can see the paginated list of screening sessions'),
    Permission(name='Create Screening',    code_name='create_screening',    module_name='Screening', module_label='Screening Management', description='User can start a new AI screening session against a job and a set of resumes'),
    Permission(name='Read Screening',      code_name='read_screening',      module_name='Screening', module_label='Screening Management', description='User can view session detail, result list, result detail, and agent execution logs'),
    Permission(name='Delete Screening',    code_name='delete_screening',    module_name='Screening', module_label='Screening Management', description='User can delete a screening session (blocked while processing)'),
    Permission(name='Decide Screening',    code_name='decide_screening',    module_name='Screening', module_label='Screening Management', description='User can submit an HR decision (shortlist / reject / invite) on a candidate result'),
    Permission(name='Compare Candidates',  code_name='compare_screening',   module_name='Screening', module_label='Screening Management', description='User can run a side-by-side comparison of 2 to 5 candidate results'),
    Permission(name='Screening Analytics', code_name='analytics_screening', module_name='Screening', module_label='Screening Management', description='User can view the full screening analytics dashboard for the company'),
    Permission(name='Screening Stats',     code_name='stats_screening',     module_name='Screening', module_label='Screening Management', description='User can view lightweight screening statistics for the company'),
    Permission(name='Show All Screenings', code_name='show_all_screenings', module_name='Screening', module_label='Screening Management', description='User can see screening sessions and results initiated by other users (manager/admin only)'),
]


def add_permission():
    for permission in permissions:
        try:
            Permission.objects.get(code_name=permission.code_name)
        except Permission.DoesNotExist:
            permission.save()


if __name__ == '__main__':
    print("Populating Permissions ...")
    add_permission()