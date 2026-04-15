# 16. Uploads

Subida de imagenes via Cloudinary. Usado por admin para productos y banners.

**Endpoints:**
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/admin/uploads/image` | admin | Subir imagen (multipart/form-data) |
| DELETE | `/admin/uploads/image/:publicId` | admin | Eliminar imagen por publicId |

**Interface**: `IImageUploader` + `IMAGE_UPLOADER` token
- `upload(file: Buffer, folder: string): Promise<{ url: string, publicId: string }>`
- `delete(publicId: string): Promise<void>`

**Implementacion**: `CloudinaryImageUploader` service

**Configuracion**:
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Carpetas: `products/`, `banners/`
- Formatos: jpg, png, webp. Max 5MB.

**Use Cases**: `UploadImageUseCase`, `DeleteImageUseCase`

**Nota**: Al eliminar (soft-delete) un producto o banner, las imagenes en Cloudinary quedan como referencia en el snapshot de ordenes. No se eliminan automaticamente. Cleanup manual via admin si se necesita.
