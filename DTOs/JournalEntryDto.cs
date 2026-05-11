namespace SchoolDiary.DTOs
{
    public class JournalEntryDto
    {
        public int StudentId { get; set; }
        public string StudentName { get; set; }
        public List<GradeDto> Grades { get; set; }
    }
}