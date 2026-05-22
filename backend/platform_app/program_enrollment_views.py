from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import ActivityApplicationStatus, ProgramApplication
from .permissions import IsMentee
from .serializers import MenteeEnrolledProgramSerializer


@api_view(["GET"])
@permission_classes([IsMentee])
def my_programs(request):
    """Programs the current mentee has applied to (excluding rejected)."""
    applications = (
        ProgramApplication.objects.filter(mentee=request.user)
        .exclude(status=ActivityApplicationStatus.REJECTED)
        .select_related("program")
        .order_by("-created_at")
    )
    return Response(MenteeEnrolledProgramSerializer(applications, many=True).data)
