using tcv2.Api.Data.Entities;

namespace tcv2.Api.Services
{
    public static class PlanService
    {
        public static bool CanUseLiveSync(Organization org)
        {
            return org.Plan >= Plan.GiggingBand;
        }

        public static bool CanUseBluetoothPedal(Organization org)
        {
            return org.Plan >= Plan.GiggingBand;
        }

        public static bool CanUseBulkUpload(Organization org)
        {
            return org.Plan >= Plan.GiggingBand;
        }

        public static bool CanUseBackupExport(Organization org)
        {
            return org.Plan >= Plan.GiggingBand;
        }

        public static bool CanUseCrossTeamLibrary(Organization org)
        {
            return org.Plan >= Plan.Organization;
        }

        public static bool CanUseAdminControls(Organization org)
        {
            return org.Plan >= Plan.Organization;
        }

        public static int GetSongLimit(Organization org)
        {
            return org.Plan switch
            {
                Plan.Free => 50,
                Plan.GiggingBand => int.MaxValue,
                Plan.Organization => int.MaxValue,
                _ => 50
            };
        }

        public static int GetSetListLimit(Organization org)
        {
            return org.Plan switch
            {
                Plan.Free => 3,
                Plan.GiggingBand => int.MaxValue,
                Plan.Organization => int.MaxValue,
                _ => 3
            };
        }

        public static int GetMemberLimit(Organization org)
        {
            return org.Plan switch
            {
                Plan.Free => 3,
                Plan.GiggingBand => int.MaxValue,
                Plan.Organization => int.MaxValue,
                _ => 3
            };
        }

        public static int GetTeamLimit(Organization org)
        {
            return org.Plan switch
            {
                Plan.Free => 1,
                Plan.GiggingBand => 1,
                Plan.Organization => 5,
                _ => 1
            };
        }

        public static bool IsSubscriptionActive(Organization org)
        {
            return org.SubscriptionStatus == SubscriptionStatus.Active ||
                   (org.SubscriptionStatus == SubscriptionStatus.None && org.Plan == Plan.Free);
        }
    }
}
