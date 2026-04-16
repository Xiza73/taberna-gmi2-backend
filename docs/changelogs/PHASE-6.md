# Phase 6: Uploads (Cloudinary) — Changelog

**Date**: 2026-04-15
**Status**: Completed

## Overview

Infrastructure-only @Global module for image uploads via Cloudinary. Admin-only endpoints for uploading and deleting images used by products and banners.

## Files Created (7)

### Domain Layer (1)
| File | Description |
|------|-------------|
| `src/modules/uploads/domain/interfaces/image-uploader.interface.ts` | `IImageUploader` interface + `IMAGE_UPLOADER` Symbol token. Methods: upload(Buffer, folder), delete(publicId) |

### Infrastructure Layer (1)
| File | Description |
|------|-------------|
| `src/modules/uploads/infrastructure/services/cloudinary-image-uploader.service.ts` | Cloudinary adapter implementing IImageUploader. Configures via CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET. Uses upload_stream for Buffer uploads. Logger for error tracking. |

### Application Layer (3)
| File | Description |
|------|-------------|
| `upload-image-response.dto.ts` | Output DTO: url + publicId |
| `upload-image.use-case.ts` | Validates mime type (jpg/png/webp) and size (5MB max), delegates to IImageUploader |
| `delete-image.use-case.ts` | Delegates publicId deletion to IImageUploader |

### Presentation Layer (1)
| File | Description |
|------|-------------|
| `src/modules/uploads/presentation/admin-uploads.controller.ts` | Admin controller: POST /admin/uploads/image (multipart/form-data via FileInterceptor), DELETE /admin/uploads/image/:publicId |

### Module (1)
| File | Description |
|------|-------------|
| `src/modules/uploads/uploads.module.ts` | @Global module, exports IMAGE_UPLOADER token |

## Files Modified (1)

| File | Change |
|------|--------|
| `src/app.module.ts` | Added UploadsModule import |

## Endpoints

### Admin (2)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/admin/uploads/image` | admin | Upload image (multipart/form-data, ?folder=products\|banners) |
| DELETE | `/admin/uploads/image/:publicId` | admin | Delete image by Cloudinary publicId |

## Validation Results

| Check | Result |
|-------|--------|
| Spec compliance (endpoints, interface, use cases) | ✅ PASS |
| CLAUDE.md conventions | ✅ PASS |
| Architecture (@Global, no ORM entities) | ✅ PASS |
| File validation (mime + size) | ✅ PASS |
| ErrorMessages usage | ✅ PASS |
| Logger in infrastructure | ✅ PASS |
| Cloudinary config via ConfigService | ✅ PASS |
| Module exports IMAGE_UPLOADER | ✅ PASS |
| TypeScript compilation | ✅ PASS |

## Validation Corrections

| Issue | File | Fix |
|-------|------|-----|
| Missing `.service` suffix in filename | `cloudinary-image-uploader.ts` | Renamed to `cloudinary-image-uploader.service.ts` per CLAUDE.md `kebab-case.{type}.ts` convention |

## Design Decisions

| Decision | Reason |
|----------|--------|
| @Global module | IMAGE_UPLOADER token available project-wide without explicit imports |
| No database entities | Pure infrastructure adapter — no persistence needed |
| Validation in use case, not controller | Keeps controller thin; domain exception for invalid format/size |
| Folder via query param (default: 'products') | Flexible folder routing without separate endpoints |
| Cloudinary publicId with slashes | Spec defines `:publicId` param. Callers should URL-encode folder-prefixed IDs (e.g., `products%2Fabc123`) |

## Build Verification

- `npx tsc --noEmit` — passes with zero errors
