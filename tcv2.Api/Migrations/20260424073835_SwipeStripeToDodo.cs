using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace tcv2.Api.Migrations
{
    /// <inheritdoc />
    public partial class SwipeStripeToDodo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "StripeSubscriptionId",
                table: "Organizations",
                newName: "DodoSubscriptionId");

            migrationBuilder.RenameColumn(
                name: "StripeCustomerId",
                table: "Organizations",
                newName: "DodoCustomerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DodoSubscriptionId",
                table: "Organizations",
                newName: "StripeSubscriptionId");

            migrationBuilder.RenameColumn(
                name: "DodoCustomerId",
                table: "Organizations",
                newName: "StripeCustomerId");
        }
    }
}
