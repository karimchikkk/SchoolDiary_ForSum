namespace SchoolDiary.DTOs
{
    public class StudentBoardDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; }

        public List<GradeDto> Grades { get; set; }
    }
}