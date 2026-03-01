# from django.urls import path
# from .views import (LoginView, RefreshView, LogoutView, ForgetPasswordView, VerifyLinkView, ResetPasswordView,
#                     PermissionView, EmployeeView, EmployeeToggleView, RoleView, AccountActivateView)

# urlpatterns = [
#     path('v1/login/', LoginView.as_view()),
#     path('v1/refresh/', RefreshView.as_view()),
#     path('v1/logout/', LogoutView.as_view()),

#     path('v1/forget/password/', ForgetPasswordView.as_view()),
#     path('v1/verify/link/', VerifyLinkView.as_view()),
#     path('v1/reset/password/', ResetPasswordView.as_view()),

#     path('v1/employee/', EmployeeView.as_view()),
#     path('v1/toggle/', EmployeeToggleView.as_view()),

#     path('v1/permission/', PermissionView.as_view()),
#     path('v1/role/', RoleView.as_view()),

#     path('v1/account/activate/', AccountActivateView.as_view()),

# ]


from django.urls import path
from .views import (
    LoginView, RefreshView, LogoutView, ForgetPasswordView, VerifyLinkView,
    ResetPasswordView, VerifyOTPView, PermissionView, EmployeeView,
    EmployeeToggleView, RoleView, AccountActivateView, ChangePasswordView,
    CompanyView,    
)

urlpatterns = [
    # Authentication
    path('v1/login/',            LoginView.as_view(),          name='login'),
    path('v1/refresh/',          RefreshView.as_view(),         name='refresh-token'),
    path('v1/logout/',           LogoutView.as_view(),          name='logout'),

    # Password management
    path('v1/change/password/',  ChangePasswordView.as_view(),  name='change-password'),
    path('v1/forget/password/',  ForgetPasswordView.as_view(),  name='forget-password'),
    path('v1/verify/otp/',       VerifyOTPView.as_view(),       name='verify-otp'),
    path('v1/reset/password/',   ResetPasswordView.as_view(),   name='reset-password'),
    path('v1/verify/link/',      VerifyLinkView.as_view(),      name='verify-link'),

    # Employee management
    path('v1/employee/',         EmployeeView.as_view(),        name='employee'),
    path('v1/toggle/',           EmployeeToggleView.as_view(),  name='employee-toggle'),

    # Role & Permission management
    path('v1/permission/',       PermissionView.as_view(),      name='permission'),
    path('v1/role/',             RoleView.as_view(),            name='role'),

    # Account activation
    path('v1/account/activate/', AccountActivateView.as_view(), name='account-activate'),

    # Company
    path('v1/company/',          CompanyView.as_view(),         name='company'),
]