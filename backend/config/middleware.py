from django.http import HttpResponseForbidden

from accounts.models import User


class AdminPanelRoleMiddleware:
    """
    Django admin (/admin/) is only for users with role=admin.
    Unauthenticated users may access /admin/login/.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        if not path.startswith("/admin"):
            return self.get_response(request)

        if path.startswith("/admin/login"):
            return self.get_response(request)

        if request.user.is_authenticated:
            if getattr(request.user, "role", None) != User.Role.ADMIN:
                return HttpResponseForbidden("Only users with the Admin role may access this panel.")

        return self.get_response(request)
