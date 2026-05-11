namespace SchoolDiary.DTOs
{
    public class GradeDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int SubjectId { get; set; }
        public int Value { get; set; }
        public string? Comment { get; set; }
        public bool IsAbsent { get; set; }
        public string Date { get; set; }
    }
}