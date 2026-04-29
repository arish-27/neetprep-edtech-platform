import enum


class UserRole(str, enum.Enum):
  student = "student"
  teacher = "teacher"
  admin = "admin"


class Subject(str, enum.Enum):
  physics = "Physics"
  chemistry = "Chemistry"
  biology = "Biology"


class UploadFileType(str, enum.Enum):
  pdf = "pdf"
  video = "video"

