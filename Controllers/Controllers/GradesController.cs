using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SchoolDiary.Data;
using SchoolDiary.DTOs;

namespace SchoolDiary.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Теперь ВСЕ методы требуют авторизацию
    public class GradesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GradesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("add")]
        public IActionResult Add([FromBody] AddGradeDto dto)
        {
            var grade = new Grade
            {
                UserId = dto.UserId,
                SubjectId = dto.SubjectId,
                Value = dto.Value,
                IsAbsent = dto.IsAbsent,
                Date = dto.Date // Используем дату с фронтенда
            };
            _context.Grades.Add(grade);
            _context.SaveChanges();
            return Ok(grade);
        }

        [HttpDelete("/api/Grades/{id}")]
        public IActionResult Delete(int id)
        {
            var grade = _context.Grades.Find(id);
            if (grade == null) return NotFound();

            _context.Grades.Remove(grade);
            _context.SaveChanges();
            return Ok();
        }

        // ДОБАВЬ ЭТОТ МЕТОД, чтобы работал update из api.ts
        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] AddGradeDto dto)
        {
            var grade = _context.Grades.Find(id);
            if (grade == null) return NotFound();

            grade.Value = dto.Value;
            grade.IsAbsent = dto.IsAbsent;
            // grade.Date = DateTime.Parse(dto.Date); // по желанию

            _context.SaveChanges();
            return Ok(grade);
        }

        [HttpGet("user/{userId}")]
        public IActionResult GetUserGrades(int userId)
        {
            var grades = _context.Grades
                .Where(g => g.UserId == userId)
                .Select(g => new {
                    g.Id,
                    g.Value,
                    g.Date,
                    g.IsAbsent,
                    subjectName = _context.Subjects
                        .Where(s => s.Id == g.SubjectId)
                        .Select(s => s.Name)
                        .FirstOrDefault()
                }).ToList();
            return Ok(grades);
        }
    }
}