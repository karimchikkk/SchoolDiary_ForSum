namespace SchoolDiary.Models
{
    public class Schedule
    {
        public int Id { get; set; }

        public string ClassName { get; set; } = string.Empty;
        public int ClassId { get; set; }

        public int DayOfWeek { get; set; }

        public int LessonNumber { get; set; }

        public string SubjectName { get; set; } = string.Empty;

        public string? TeacherName { get; set; }

        public string? StartTime { get; set; }

        public string? EndTime { get; set; }
    }
}