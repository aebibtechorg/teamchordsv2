using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace tcv2.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationToInvite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OrganizationId",
                table: "Invites",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invites_OrganizationId",
                table: "Invites",
                column: "OrganizationId");

            migrationBuilder.AddForeignKey(
                name: "FK_Invites_Organizations_OrganizationId",
                table: "Invites",
                column: "OrganizationId",
                principalTable: "Organizations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invites_Organizations_OrganizationId",
                table: "Invites");

            migrationBuilder.DropIndex(
                name: "IX_Invites_OrganizationId",
                table: "Invites");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "Invites");
        }
    }
}
