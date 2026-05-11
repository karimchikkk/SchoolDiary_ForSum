namespace SchoolDiary.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public int? ClassId { get; set; } // Чтобы знать, чей это ученик
        public int Role { get; set; }     // Чтобы подтвердить, что это именно ученик (0)
    }
}
