# Publicar Z'eloura

## Backend en Render

1. Crea una cuenta en Render y conecta este repositorio de Git.
2. Elige **Blueprint** y selecciona `render.yaml`.
3. Cuando Render solicite variables, define:
   - `ADMIN_EMAIL`: correo del administrador.
   - `ADMIN_PASSWORD`: una contraseña segura.
4. Espera a que el servicio termine y prueba:

   `https://TU-SERVICIO.onrender.com/`

   Debe responder `API del Restaurante funcionando correctamente`.

El servicio usa un disco persistente en `/var/data`, por lo que SQLite conserva usuarios, menú y reservas después de reinicios.

## APK conectada al backend público

En `mobile/.env` configura la URL real:

```env
EXPO_PUBLIC_API_URL=https://TU-SERVICIO.onrender.com/api
```

Después genera una nueva APK:

```powershell
cd mobile
npx eas build --platform android --profile production
```

La APK anterior conserva la IP local y no puede cambiar su URL después de compilarse.

## Funcionamiento sin internet

Después del primer inicio de sesión con internet, la app conserva la sesión y permite crear o cancelar reservas sin conexión. Las reservas pendientes se sincronizan automáticamente cuando vuelve internet. El primer login y la administración requieren conexión al backend público.