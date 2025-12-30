# Redirección de Autenticación
- El parámetro `redirectTo` en Supabase Auth debe ser exactamente `${window.location.origin}/auth/callback`.
- Esto evita el error 400 de Google OAuth por desajuste de URI.