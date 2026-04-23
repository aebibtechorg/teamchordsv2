using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace tcv2.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMusicianProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Bio",
                table: "Profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Instruments",
                table: "Profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MusicalRole",
                table: "Profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredKey",
                table: "Profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Website",
                table: "Profiles",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Bio",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "Instruments",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "MusicalRole",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "PreferredKey",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "Website",
                table: "Profiles");
        }
    }
}
