import uuid
from django.db import models
from utils.reusable_classes import TimeStamps, TimeUserStamps
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from utils.validators import val_name, val_mobile, val_code_name
from utils.enums import *


# ─────────────────────────────────────────────────────────────────
#  COMPANY  (new — required by jobs / resumes / screening apps)
# ─────────────────────────────────────────────────────────────────

class SubscriptionPlan(models.TextChoices):
    FREE         = 'free',         'Free'
    STARTER      = 'starter',      'Starter'
    PROFESSIONAL = 'professional', 'Professional'
    ENTERPRISE   = 'enterprise',   'Enterprise'


class Company(TimeStamps):
    """
    Multi-tenant company. Every user belongs to one company.
    All jobs, resumes, and screening sessions are scoped to a company.
    """
    name              = models.CharField(max_length=255, db_index=True)
    slug              = models.SlugField(max_length=255, blank=True)
    email             = models.EmailField(blank=True)
    phone             = models.CharField(max_length=30, blank=True)
    address           = models.CharField(max_length=500, blank=True)
    website           = models.URLField(blank=True)
    logo              = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    description       = models.TextField(blank=True)
    subscription_plan = models.CharField(
        max_length=20,
        choices=SubscriptionPlan.choices,
        default=SubscriptionPlan.FREE,
    )
    monthly_screening_limit = models.PositiveIntegerField(default=50)  # 0 = unlimited
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(self.name)
            slug, counter = base_slug, 1
            while Company.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    class Meta:
        verbose_name_plural = 'Companies'
        db_table = 'companies'


# ─────────────────────────────────────────────────────────────────
#  USER MANAGER  (unchanged)
# ─────────────────────────────────────────────────────────────────

class UserManager(BaseUserManager):
    def create_user(self, username, password=None):
        if not username:
            raise ValueError('User must have a username.')
        user = self.model(username=username)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password):
        user = self.create_user(username=username, password=password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


def get_profile_image_path(self, filename):
    return f'profile_images/{self.pk}/{str(uuid.uuid4())}.png'


# ─────────────────────────────────────────────────────────────────
#  USER  (2 new fields + 1 new method added)
# ─────────────────────────────────────────────────────────────────

class User(AbstractBaseUser, TimeStamps):
    type_choices = (
        (CUSTOMER, CUSTOMER),
        (EMPLOYEE, EMPLOYEE),
    )
    username       = models.CharField(max_length=100, unique=True)
    first_name     = models.CharField(max_length=100, validators=[val_name])
    last_name      = models.CharField(max_length=100, validators=[val_name])
    full_name      = models.CharField(max_length=200, validators=[val_name], null=True, blank=True)
    email          = models.EmailField(max_length=100, null=True, blank=True)
    mobile         = models.CharField(max_length=35, validators=[val_mobile], null=True, blank=True)
    profile_image  = models.ImageField(max_length=255, upload_to=get_profile_image_path, null=True, blank=True)
    login_attempts = models.IntegerField(default=0)
    is_blocked     = models.BooleanField(default=False)
    is_staff       = models.BooleanField(default=False)
    is_superuser   = models.BooleanField(default=False)
    is_active      = models.BooleanField(default=False)
    is_verified    = models.BooleanField(default=False)

    # Legacy token-based fields
    password_link_token            = models.CharField(max_length=255, null=True, blank=True)
    password_link_token_created_at = models.DateTimeField(null=True, blank=True)

    # OTP fields
    password_reset_code            = models.CharField(max_length=6, null=True, blank=True)
    password_reset_code_created_at = models.DateTimeField(null=True, blank=True)
    password_reset_verified        = models.BooleanField(default=False)

    address              = models.CharField(max_length=255, null=True, blank=True)
    last_password_changed = models.DateTimeField(null=True, blank=True)
    role         = models.ForeignKey('Role', related_name='role_users', blank=True, null=True, on_delete=models.CASCADE)
    type         = models.CharField(max_length=10, choices=type_choices, default=CUSTOMER)
    activation_link_token            = models.CharField(max_length=255, null=True, blank=True)
    activation_link_token_created_at = models.DateTimeField(null=True, blank=True)
    deactivated  = models.BooleanField(default=False)
    password     = models.CharField(max_length=128, null=True, blank=True)

    # ── NEW: company FK ───────────────────────────────────────────
    company = models.ForeignKey(
        'Company',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='company_users',
    )

    objects        = UserManager()
    USERNAME_FIELD = 'username'

    def save(self, *args, **kwargs):
        self.email      = self.username
        self.first_name = self.first_name.title()
        self.last_name  = self.last_name.title()
        self.full_name  = f'{self.first_name} {self.last_name}'
        return super().save(*args, **kwargs)

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser

    def get_full_name(self):
        return self.full_name or f"{self.first_name} {self.last_name}"

    def get_short_name(self):
        return self.first_name

    # ── NEW: permission helper used by jobs/resumes/screening views ──
    def has_perm_for(self, permission_code: str) -> bool:
        """
        Check if this user's role has a permission with the given code_name.
        Used by jobs / resumes / screening views.
        Example: request.user.has_perm_for('can_upload_resumes')
        """
        if self.is_superuser:
            return True
        if not self.role:
            return False
        return self.role.permissions.filter(code_name=permission_code).exists()


# ─────────────────────────────────────────────────────────────────
#  ROLE  (unchanged)
# ─────────────────────────────────────────────────────────────────

class Role(TimeUserStamps):
    name        = models.CharField(max_length=100, validators=[val_name])
    code_name   = models.CharField(max_length=50, unique=True, validators=[val_code_name])
    permissions = models.ManyToManyField('Permission', related_name='+')
    description = models.CharField(max_length=250)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.name = self.name.title()
        return super().save(*args, **kwargs)


# ─────────────────────────────────────────────────────────────────
#  PERMISSION  (unchanged)
# ─────────────────────────────────────────────────────────────────

class Permission(models.Model):
    name         = models.CharField(max_length=100, validators=[val_name])
    code_name    = models.CharField(max_length=100, unique=True, validators=[val_code_name])
    module_name  = models.CharField(max_length=100)
    module_label = models.CharField(max_length=100, null=True, blank=True)
    description  = models.CharField(max_length=200)

    def __str__(self):
        return self.name


# ─────────────────────────────────────────────────────────────────
#  USER TOKEN  (unchanged)
# ─────────────────────────────────────────────────────────────────

class UserToken(TimeStamps):
    user         = models.ForeignKey('User', on_delete=models.PROTECT, related_name="user_token")
    device_token = models.TextField(max_length=512, null=True, blank=True)


# ─────────────────────────────────────────────────────────────────
#  EMPLOYEE  (unchanged)
# ─────────────────────────────────────────────────────────────────

class Employee(TimeUserStamps):
    status_choices = (
        (INVITED,      INVITED),
        (ACTIVE,       ACTIVE),
        (DEACTIVATED,  DEACTIVATED),
    )
    user   = models.OneToOneField('User', on_delete=models.SET_NULL, related_name="user_employee", null=True, blank=True)
    status = models.CharField(max_length=20, choices=status_choices, default=INVITED)