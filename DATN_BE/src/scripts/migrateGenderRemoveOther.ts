import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import { UserRoles } from '../constants/enums'
import UserModel from '../models/schemas/user.schema'

/**
 * 1) Chuẩn hóa: `other`, null, rỗng, giá trị không thuộc male|female|unknown → `unknown`
 * 2) User thường còn `unknown`: đoán **male / female** từ tên (heuristic tiếng Việt); không chắc → giữ `unknown`.
 *
 * Chạy: npm run migrate:gender-remove-other
 * Chỉ xem thống kê, không ghi DB: MIGRATE_GENDER_DRY_RUN=1 npm run migrate:gender-remove-other
 */

function stripTones(s: string): string {
  return s
    .trim()
    .replace(/đ/gi, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function tokensFromName(name: string): string[] {
  if (!name || typeof name !== 'string') return []
  return stripTones(name)
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean)
}

const FEMALE_MIDDLE = new Set(['thi'])
const MALE_MIDDLE = new Set(['van', 'duc', 'dinh', 'huu', 'cang', 'the', 'sy', 'su'])

const FEMALE_GIVEN = new Set([
  'mai',
  'hoa',
  'hong',
  'nga',
  'hang',
  'huong',
  'huyen',
  'vy',
  'nhi',
  'ngan',
  'my',
  'thuy',
  'trang',
  'yen',
  'lien',
  'dao',
  'uyen',
  'quynh',
  'diem',
  'nhung',
  'thao',
  'xuan',
  'hue',
  'duyen',
  'phuong',
  'tram',
  'bich',
  'tuyen',
  'lan',
  'ngoc',
  'chi',
  'thu'
])

const MALE_GIVEN = new Set([
  'huy',
  'khoa',
  'tuan',
  'bao',
  'cuong',
  'phuc',
  'tin',
  'tien',
  'son',
  'long',
  'quan',
  'vu',
  'dat',
  'hieu',
  'thang',
  'trung',
  'duy',
  'khoi',
  'phong',
  'thien',
  'loi',
  'nam',
  'hung',
  'hoang',
  'hai',
  'chien',
  'cong',
  'binh',
  'phu',
  'vinh',
  'tai',
  'luan',
  'tam',
  'kien',
  'tinh',
  'sang',
  'vuong',
  'truong',
  'minh',
  'khanh',
  'tung',
  'duc',
  'giap',
  'hau',
  'loc',
  'phap',
  'thuan',
  'tri'
])

function normalizeStoredGender(g: unknown): 'male' | 'female' | 'unknown' {
  if (g === 'male' || g === 'female') return g
  return 'unknown'
}

/** Heuristic — có thể sai với tên đặc biệt / nước ngoài; cần chỉnh tay sau nếu cần */
export function inferGenderFromName(rawName: string): 'male' | 'female' | 'unknown' {
  const tokens = tokensFromName(rawName)
  if (tokens.length === 0) return 'unknown'

  for (let i = 0; i < tokens.length; i++) {
    if (FEMALE_MIDDLE.has(tokens[i]) && i > 0 && i < tokens.length - 1) {
      return 'female'
    }
  }

  let fc = 0
  let mc = 0
  for (const t of tokens) {
    if (FEMALE_GIVEN.has(t)) fc++
    if (MALE_GIVEN.has(t)) mc++
  }
  if (fc > 0 && mc === 0) return 'female'
  if (mc > 0 && fc === 0) return 'male'

  let hasMaleMiddle = false
  for (let i = 0; i < tokens.length; i++) {
    if (MALE_MIDDLE.has(tokens[i]) && i > 0 && i < tokens.length - 1) {
      hasMaleMiddle = true
      break
    }
  }
  if (hasMaleMiddle) return 'male'

  return 'unknown'
}

async function migrate() {
  const dryRun =
    process.env.MIGRATE_GENDER_DRY_RUN === '1' ||
    process.env.MIGRATE_GENDER_DRY_RUN === 'true' ||
    process.env.MIGRATE_GENDER_DRY_RUN === 'yes'

  await mongoose.connect(envConfig.mongoURL)
  console.log('Connected to MongoDB', dryRun ? '(DRY RUN — không ghi database)' : '')

  const countOther = await UserModel.countDocuments({ gender: 'other' })
  const countInvalid = await UserModel.countDocuments({
    gender: { $exists: true, $nin: ['male', 'female', 'unknown'] }
  })
  const countNullEmpty = await UserModel.countDocuments({ $or: [{ gender: null }, { gender: '' }] })

  if (!dryRun) {
    const r1 = await UserModel.updateMany({ gender: 'other' }, { $set: { gender: 'unknown' } })
    console.log(`[1] gender "other" → "unknown": matched ${r1.matchedCount}, modified ${r1.modifiedCount}`)

    const r2 = await UserModel.updateMany(
      { gender: { $exists: true, $nin: ['male', 'female', 'unknown'] } },
      { $set: { gender: 'unknown' } }
    )
    console.log(`[2] invalid gender → "unknown": matched ${r2.matchedCount}, modified ${r2.modifiedCount}`)

    const r3 = await UserModel.updateMany({ $or: [{ gender: null }, { gender: '' }] }, { $set: { gender: 'unknown' } })
    console.log(`[3] null/empty gender → "unknown": matched ${r3.matchedCount}, modified ${r3.modifiedCount}`)
  } else {
    console.log(
      `[1–3] DRY RUN — sẽ chuẩn hóa khi chạy thật: other=${countOther}, invalid=${countInvalid}, null/rỗng=${countNullEmpty}`
    )
  }

  /** User cần suy luận: sau chuẩn hóa không còn male/female rõ ràng */
  const inferSourceFilter = {
    role: UserRoles.user,
    isDeleted: { $ne: true },
    $or: [
      { gender: 'unknown' },
      { gender: 'other' },
      { gender: null },
      { gender: '' },
      { gender: { $exists: true, $nin: ['male', 'female', 'unknown'] } }
    ]
  }

  const baseFilter = dryRun
    ? inferSourceFilter
    : {
        role: UserRoles.user,
        isDeleted: { $ne: true },
        gender: 'unknown' as const
      }

  const cursor = UserModel.find(baseFilter).select({ name: 1, gender: 1 }).lean().cursor()
  let examined = 0
  let toFemale = 0
  let toMale = 0
  let stayUnknown = 0
  const bulk: Parameters<typeof UserModel.bulkWrite>[0] = []

  for await (const doc of cursor) {
    const g = (doc as { gender?: unknown }).gender
    if (dryRun && normalizeStoredGender(g) !== 'unknown') {
      continue
    }

    examined++
    const inferred = inferGenderFromName(String((doc as { name?: string }).name || ''))
    if (inferred === 'unknown') {
      stayUnknown++
      continue
    }
    if (inferred === 'female') toFemale++
    else toMale++

    if (!dryRun) {
      bulk.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { gender: inferred } }
        }
      })
      if (bulk.length >= 200) {
        await UserModel.bulkWrite(bulk, { ordered: false })
        bulk.length = 0
      }
    }
  }

  if (!dryRun && bulk.length > 0) {
    await UserModel.bulkWrite(bulk, { ordered: false })
  }

  console.log(
    `[4] Đã xét ${examined} user (role=user, ${dryRun ? 'chuẩn hóa giới tính → unknown rồi suy luận' : 'gender=unknown sau bước 1–3'})`
  )
  console.log(`    → suy ra female: ${toFemale}, male: ${toMale}, giữ unknown: ${stayUnknown}`)
  if (dryRun) {
    console.log('    (DRY RUN: không cập nhật DB — bỏ biến môi trường để ghi thật)')
  }

  await mongoose.disconnect()
  console.log('Done.')
  process.exit(0)
}

migrate().catch((e) => {
  console.error(e)
  process.exit(1)
})
