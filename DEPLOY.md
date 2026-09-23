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

El proyecto usa por defecto `https://zeloura-api.onrender.com/api`, que corresponde al servicio definido en `render.yaml`. Si Render asigna otro nombre, crea `mobile/.env` con la URL que muestre Render:

```env
EXPO_PUBLIC_API_URL=https://TU-SERVICIO.onrender.com/api
```

Comprueba primero que `https://TU-SERVICIO.onrender.com/` responda `API del Restaurante funcionando correctamente`. Para probar el backend local desde Expo Go, usa en `mobile/.env` la IP LAN del computador, por ejemplo `http://192.168.1.8:3000/api`.

Después genera una nueva APK:

```powershell
cd mobile
npx eas build --platform android --profile production
```

La APK anterior conserva la IP local y no puede cambiar su URL después de compilarse.

## Funcionamiento sin internet

Con el backend público disponible, el login, la carta, la disponibilidad y la sincronización funcionan desde cualquier red. Sin internet, usa `Continuar sin conexión`: permite crear reservas locales, pero no puede publicarlas en el servidor hasta que vuelvas a iniciar sesión con una cuenta real online.