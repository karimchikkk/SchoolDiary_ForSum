using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolDiary.Data;
using SchoolDiary.Models;

namespace SchoolDiary.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SchedulesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SchedulesController(AppDbContext context)
        {
            _context = context;
        }

        // Получить расписание класса
        // Было: [HttpGet("{className}")]
        // Стало:
        [HttpGet("by-class/{classId}")]
        public async Task<IActionResult> GetByClassId(int classId)
        {
            var schedules = await _context.Schedules
                .Where(s => s.ClassId == classId) // Убедись, что в модели Schedule есть поле ClassId
                .OrderBy(s => s.DayOfWeek)
                .ThenBy(s => s.LessonNumber)
                .ToListAsync();

            return Ok(schedules);
        }
        [HttpGet("by-teacher/{teacherName}")]
        public async Task<IActionResult> GetByTeacher(string teacherName)
        {
            var schedules = await _context.Schedules
                .Where(s => s.TeacherName == teacherName)
                .OrderBy(s => s.DayOfWeek)
                .ThenBy(s => s.LessonNumber)
                .ToListAsync();

            return Ok(schedules);
        }
        // Добавить урок
        [HttpPost]
        public async Task<IActionResult> Create(Schedule schedule)
        {
            _context.Schedules.Add(schedule);

            await _context.SaveChangesAsync();

            return Ok(schedule);
        }

        // Удалить
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var schedule = await _context.Schedules.FindAsync(id);

            if (schedule == null)
                return NotFound();

            _context.Schedules.Remove(schedule);

            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}