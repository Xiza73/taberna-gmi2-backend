import { SetMetadata } from '@nestjs/common';

import { type SubjectType } from '../../domain/enums/subject-type.enum.js';

export const SUBJECT_TYPE_KEY = 'subjectType';
export const RequireSubjectType = (...types: SubjectType[]) =>
  SetMetadata(SUBJECT_TYPE_KEY, types);
