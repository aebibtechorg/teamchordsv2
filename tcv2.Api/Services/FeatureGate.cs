using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using tcv2.Api.Data.Entities;

namespace tcv2.Api.Services
{
    public static class FeatureGate
    {
        public static IResult? CheckLiveSync(Organization org)
        {
            if (!PlanService.CanUseLiveSync(org))
            {
                return Results.Json(new { upgrade = true, message = "Live sync requires a paid plan." }, statusCode: StatusCodes.Status403Forbidden);
            }
            return null;
        }

        public static IResult? CheckBluetoothPedal(Organization org)
        {
            if (!PlanService.CanUseBluetoothPedal(org))
            {
                return Results.Json(new { upgrade = true, message = "Bluetooth foot-pedal requires a paid plan." }, statusCode: StatusCodes.Status403Forbidden);
            }
            return null;
        }

        public static IResult? CheckBulkUpload(Organization org)
        {
            if (!PlanService.CanUseBulkUpload(org))
            {
                return Results.Json(new { upgrade = true, message = "Bulk upload requires a paid plan." }, statusCode: StatusCodes.Status403Forbidden);
            }
            return null;
        }

        public static IResult? CheckBackupExport(Organization org)
        {
            if (!PlanService.CanUseBackupExport(org))
            {
                return Results.Json(new { upgrade = true, message = "Backup and export requires a paid plan." }, statusCode: StatusCodes.Status403Forbidden);
            }
            return null;
        }

        public static IResult? CheckCrossTeamLibrary(Organization org)
        {
            if (!PlanService.CanUseCrossTeamLibrary(org))
            {
                return Results.Json(new { upgrade = true, message = "Cross-team library sharing requires the Organization plan." }, statusCode: StatusCodes.Status403Forbidden);
            }
            return null;
        }

        public static IResult? CheckAdminControls(Organization org)
        {
            if (!PlanService.CanUseAdminControls(org))
            {
                return Results.Json(new { upgrade = true, message = "Admin controls require the Organization plan." }, statusCode: StatusCodes.Status403Forbidden);
            }
            return null;
        }

        public static IResult? CheckLimits(Organization org, int currentSongs, int currentSetLists, int currentMembers, int currentTeams)
        {
            if (currentSongs >= PlanService.GetSongLimit(org))
            {
                return Results.Json(new { upgrade = true, message = $"Song limit reached ({PlanService.GetSongLimit(org)}). Upgrade to add more." }, statusCode: StatusCodes.Status403Forbidden);
            }
            if (currentSetLists >= PlanService.GetSetListLimit(org))
            {
                return Results.Json(new { upgrade = true, message = $"Set list limit reached ({PlanService.GetSetListLimit(org)}). Upgrade to add more." }, statusCode: StatusCodes.Status403Forbidden);
            }
            if (currentMembers >= PlanService.GetMemberLimit(org))
            {
                return Results.Json(new { upgrade = true, message = $"Member limit reached ({PlanService.GetMemberLimit(org)}). Upgrade to add more." }, statusCode: StatusCodes.Status403Forbidden);
            }
            if (currentTeams >= PlanService.GetTeamLimit(org))
            {
                return Results.Json(new { upgrade = true, message = $"Team limit reached ({PlanService.GetTeamLimit(org)}). Upgrade to add more." }, statusCode: StatusCodes.Status403Forbidden);
            }
            return null;
        }
    }
}
