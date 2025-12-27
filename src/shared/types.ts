import z from "zod";

// Esquemas de validación
export const TeacherSchema = z.object({
  id: z.number(),
  name: z.string(),
  user_id: z.string(),
  email: z.string().email(),
  tutor_course_id: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CourseSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const StudentSchema = z.object({
  id: z.number(),
  name: z.string(),
  course_id: z.number(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  guardian_name: z.string().nullable(),
  guardian_phone: z.string().nullable(),
  address: z.string().nullable(),
  has_student_insurance: z.boolean().nullable(),
  blood_type: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SubjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  teacher_id: z.number(),
  course_id: z.number(),
  hours_per_week: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ScheduleSchema = z.object({
  id: z.number(),
  subject_id: z.number(),
  day_of_week: z.number(),
  start_time: z.string(),
  end_time: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const AttendanceRecordSchema = z.object({
  id: z.number(),
  subject_id: z.number(),
  schedule_id: z.number(),
  attendance_date: z.string(),
  teacher_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SubmitAttendanceSchema = z.object({
  subject_id: z.number(),
  schedule_id: z.number(),
  attendance_date: z.string(),
  absent_student_ids: z.array(z.number()),
});

// Tipos derivados
export type Teacher = z.infer<typeof TeacherSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type Student = z.infer<typeof StudentSchema>;
export type Subject = z.infer<typeof SubjectSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>;
export type SubmitAttendance = z.infer<typeof SubmitAttendanceSchema>;
export type ManualAttendanceEntry = z.infer<typeof ManualAttendanceEntrySchema>;
export type ManualAttendance = z.infer<typeof ManualAttendanceSchema>;

// Tipos extendidos para la interfaz
export interface TodayClass {
  schedule_id: number;
  subject_id: number;
  subject_name: string;
  course_id: number;
  course_name: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  hours_per_week: number;
}

export interface DailyAbsence {
  student_id: number;
  student_name: string;
  course_id: number;
  course_name: string;
  absence_count: number;
}

export const ManualAttendanceEntrySchema = z.object({
  student_name: z.string(),
  subject_id: z.number(),
  attendance_date: z.string(),
  hours_count: z.number(),
});

export const ManualAttendanceSchema = z.object({
  entries: z.array(ManualAttendanceEntrySchema),
});

export interface StudentWithAttendance extends Student {
  is_absent?: boolean;
}

export interface AbsenceEntry {
  id: string;
  student_name: string;
  subject_id: number;
  subject_name: string;
  hours_count: number;
}

export interface AttendanceReport {
  date: string;
  course_name: string;
  subject_name: string;
  total_students: number;
  present_count: number;
  absent_count: number;
  attendance_percentage: number;
  absent_students: Student[];
  present_students: Student[];
}

export const StudentCSVSchema = z.object({
  nombre: z.string(),
  curso: z.string(),
  telefono: z.string().optional(),
  correo: z.string().email().optional(),
  nombre_acudiente: z.string().optional(),
  telefono_acudiente: z.string().optional(),
  direccion: z.string().optional(),
  seguro_estudiantil: z.string().optional(),
  tipo_sangre: z.string().optional(),
});

export type StudentCSV = z.infer<typeof StudentCSVSchema>;
