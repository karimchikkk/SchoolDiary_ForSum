using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolDiary.Migrations
{
    /// <inheritdoc />
    public partial class AddIsAbsentToGrades : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAbsent",
                table: "Grades",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAbsent",
                table: "Grades");
        }
    }
}
