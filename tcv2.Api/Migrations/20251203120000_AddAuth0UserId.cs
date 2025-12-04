using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace tcv2.Api.Migrations
{
    public partial class AddAuth0UserId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Auth0UserId",
                table: "Users",
                type: "text",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Auth0UserId",
                table: "Users");
        }
    }
}
