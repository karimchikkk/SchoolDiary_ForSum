namespace SchoolDiary.DTOs
{
    public class AddGradeDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int SubjectId { get; set; }
        public bool IsAbsent { get; set; }
        public DateTime Date { get; set; }

        public int Value { get; set; }
    }
}