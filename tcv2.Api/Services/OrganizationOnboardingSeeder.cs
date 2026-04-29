using Microsoft.EntityFrameworkCore;
using tcv2.Api.Data;
using tcv2.Api.Data.Entities;

namespace tcv2.Api.Services;

internal static class OrganizationOnboardingSeeder
{
    private const string SampleTitle = "Welcome to Team Chords";
    private const string SampleArtist = "Team Chords";
    private const string SampleKey = "G";
    private const string SampleSetListName = "Starter Set List";
    private const string SampleTargetKey = "G";
    private const short SampleCapo = 0;
    private const short SampleOrder = 1;

    private const string SampleContent = """
{title: Welcome to Team Chords}
{artist: Team Chords}

[G]Welcome to [D]your new [Em]library
[C]Use the tour to [G]get started
[D]Build your set lists and [G]share songs
""";

    public static async Task SeedAsync(AppDbContext db, Organization organization, DateTime createdAt)
    {
        var hasTrackedOnboardingContent = db.ChangeTracker.Entries<SetList>()
            .Any(e => e.Entity.OrgId == organization.Id && e.State != EntityState.Deleted)
            || db.ChangeTracker.Entries<ChordSheet>()
                .Any(e => e.Entity.OrgId == organization.Id && e.State != EntityState.Deleted);

        var hasOnboardingContent = hasTrackedOnboardingContent
            || await db.SetLists.AnyAsync(x => x.OrgId == organization.Id)
            || await db.ChordSheets.AnyAsync(x => x.OrgId == organization.Id);

        if (hasOnboardingContent)
        {
            return;
        }

        var chordSheet = new ChordSheet
        {
            Id = Guid.NewGuid(),
            OrgId = organization.Id,
            Title = SampleTitle,
            Artist = SampleArtist,
            Content = SampleContent,
            Key = SampleKey,
            CreatedAt = createdAt
        };

        var setList = new SetList
        {
            Id = Guid.NewGuid(),
            OrgId = organization.Id,
            Name = SampleSetListName,
            CreatedAt = createdAt
        };

        var output = new Output
        {
            Id = Guid.NewGuid(),
            SetListId = setList.Id,
            ChordSheetId = chordSheet.Id,
            TargetKey = SampleTargetKey,
            Capo = SampleCapo,
            Order = SampleOrder,
            CreatedAt = createdAt
        };

        db.ChordSheets.Add(chordSheet);
        db.SetLists.Add(setList);
        db.Outputs.Add(output);

        await Task.CompletedTask;
    }
}


