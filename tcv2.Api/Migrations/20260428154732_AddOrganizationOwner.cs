using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace tcv2.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationOwner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OwnerUserId",
                table: "Organizations",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_OwnerUserId",
                table: "Organizations",
                column: "OwnerUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Organizations_Users_OwnerUserId",
                table: "Organizations",
                column: "OwnerUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Organizations_Users_OwnerUserId",
                table: "Organizations");

            migrationBuilder.DropIndex(
                name: "IX_Organizations_OwnerUserId",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "OwnerUserId",
                table: "Organizations");
        }
    }
}
