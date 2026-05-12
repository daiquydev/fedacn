import calculatorServices from '../calculator.services'
import { UserGender } from '~/constants/enums'

describe('[Module: FitnessUtilities] - Công cụ tính toán sức khỏe', () => {
  // Tính toán BMI (8 cases)
  describe('Tính năng: Tính chỉ số BMI (calculateBMIService)', () => {
    it('Trường hợp: Người có cân nặng bình thường', () => {
      const result = calculatorServices.calculateBMIService({ weight: 70, height: 1.75 })
      expect(result).toBeCloseTo(22.9, 1)
    })
    it('Trường hợp: Người có chiều cao khác nhau', () => {
      const result = calculatorServices.calculateBMIService({ weight: 60, height: 1.65 })
      expect(result).toBeCloseTo(22.0, 1)
    })
    it('Trường hợp: Người có cân nặng lớn (Béo phì)', () => {
      const result = calculatorServices.calculateBMIService({ weight: 100, height: 1.80 })
      expect(result).toBeCloseTo(30.9, 1)
    })
    it('Trường hợp biên: Chiều cao bằng 0 (Kết quả vô hạn)', () => {
      const result = calculatorServices.calculateBMIService({ weight: 70, height: 0 })
      expect(result).toBe(Infinity)
    })
    it('Trường hợp biên: Cân nặng bằng 0', () => {
      const result = calculatorServices.calculateBMIService({ weight: 0, height: 1.75 })
      expect(result).toBe(0)
    })
    it('Trường hợp biên: Người cực cao (2.5m)', () => {
      const result = calculatorServices.calculateBMIService({ weight: 70, height: 2.5 })
      expect(result).toBeCloseTo(11.2, 1)
    })
    it('Trường hợp biên: Người cực thấp (0.5m)', () => {
      const result = calculatorServices.calculateBMIService({ weight: 70, height: 0.5 })
      expect(result).toBe(280)
    })
    it('Kiểm tra kiểu dữ liệu trả về (Number)', () => {
      const result = calculatorServices.calculateBMIService({ weight: 70, height: 1.75 })
      expect(typeof result).toBe('number')
    })
  })

  // Tính toán BMR (8 cases)
  describe('Tính năng: Tính tỷ lệ trao đổi chất cơ bản (BMR)', () => {
    it('Trường hợp: Nam giới', () => {
      const result = calculatorServices.calculateBMRService({ weight: 70, height: 175, age: 25, gender: UserGender.male })
      expect(result).toBeCloseTo(1675.1, 1)
    })
    it('Trường hợp: Nữ giới', () => {
      const result = calculatorServices.calculateBMRService({ weight: 60, height: 165, age: 25, gender: UserGender.female })
      expect(result).toBeCloseTo(1346.7, 1)
    })
    it('Lỗi: Giới tính không hợp lệ', () => {
      const result = calculatorServices.calculateBMRService({ weight: 70, height: 175, age: 25, gender: 'other' as any })
      expect(result).toBeUndefined()
    })
    it('Trường hợp: Trẻ em (5 tuổi)', () => {
       const result = calculatorServices.calculateBMRService({ weight: 20, height: 110, age: 5, gender: UserGender.male })
       expect(result).toBeGreaterThan(0)
    })
    it('Trường hợp: Người cao tuổi (90 tuổi)', () => {
       const result = calculatorServices.calculateBMRService({ weight: 60, height: 160, age: 90, gender: UserGender.female })
       expect(result).toBeDefined()
    })
    it('Kiểm tra logic: BMR tăng khi cân nặng tăng', () => {
       const bmr1 = calculatorServices.calculateBMRService({ weight: 70, height: 175, age: 25, gender: UserGender.male })
       const bmr2 = calculatorServices.calculateBMRService({ weight: 80, height: 175, age: 25, gender: UserGender.male })
       expect(bmr2!).toBeGreaterThan(bmr1!)
    })
    it('Kiểm tra logic: BMR giảm khi tuổi tăng', () => {
       const bmr1 = calculatorServices.calculateBMRService({ weight: 70, height: 175, age: 25, gender: UserGender.male })
       const bmr2 = calculatorServices.calculateBMRService({ weight: 70, height: 175, age: 35, gender: UserGender.male })
       expect(bmr2!).toBeLessThan(bmr1!)
    })
    it('Kiểm tra định dạng kết quả (Làm tròn 1 chữ số)', () => {
       const result = calculatorServices.calculateBMRService({ weight: 70.5, height: 175.2, age: 25, gender: UserGender.male })
       expect(result!.toString()).toMatch(/\.\d$/)
    })
  })

  // Tính toán TDEE (6 cases)
  describe('Tính năng: Tổng tiêu hao năng lượng hàng ngày (TDEE)', () => {
    it('Mức độ: Ít vận động (Sedentary)', () => {
      const res = calculatorServices.calculateTDEEService({ weight: 70, height: 175, age: 25, gender: UserGender.male, activity: 1.2 })
      expect(res).toBeCloseTo(2010.1, 1)
    })
    it('Mức độ: Vận động nhẹ (Lightly Active)', () => {
      const res = calculatorServices.calculateTDEEService({ weight: 70, height: 175, age: 25, gender: UserGender.male, activity: 1.375 })
      expect(res).toBeCloseTo(2303.3, 1)
    })
    it('Mức độ: Vận động vừa (Moderately Active)', () => {
      const res = calculatorServices.calculateTDEEService({ weight: 70, height: 175, age: 25, gender: UserGender.male, activity: 1.55 })
      expect(res).toBeCloseTo(2596.4, 1)
    })
    it('Mức độ: Vận động cực nhiều (Extra Active)', () => {
      const res = calculatorServices.calculateTDEEService({ weight: 70, height: 175, age: 25, gender: UserGender.male, activity: 1.9 })
      expect(res).toBeCloseTo(3182.7, 1)
    })
    it('Lỗi: Thiếu thông số BMR', () => {
       const res = calculatorServices.calculateTDEEService({ weight: 70, height: 175, age: 25, gender: 'unknown' as any, activity: 1.2 })
       expect(res).toBe(0)
    })
    it('Trường hợp: Chỉ số vận động bằng 0', () => {
       const res = calculatorServices.calculateTDEEService({ weight: 70, height: 175, age: 25, gender: UserGender.male, activity: 0 })
       expect(res).toBe(0)
    })
  })

  // Các chỉ số nhân trắc học khác (10 cases)
  describe('Tính năng: Các chỉ số nhân trắc học (IBW, LBM, Body Fat)', () => {
    it('Cân nặng lý tưởng (IBW) - Nam giới', () => {
      const result = calculatorServices.calculateIBWService({ height: 175, gender: UserGender.male })
      expect(result).toBeCloseTo(70.5, 1)
    })
    it('Cân nặng lý tưởng (IBW) - Nữ giới', () => {
      const result = calculatorServices.calculateIBWService({ height: 165, gender: UserGender.female })
      expect(result).toBeCloseTo(56.9, 1)
    })
    it('Khối lượng nạc (LBM) - Nam giới', () => {
      const result = calculatorServices.calculateLBMService({ weight: 70, height: 175, gender: UserGender.male })
      expect(result).toBeCloseTo(52.8, 1)
    })
    it('Khối lượng nạc (LBM) - Nữ giới', () => {
      const result = calculatorServices.calculateLBMService({ weight: 60, height: 165, gender: UserGender.female })
      expect(result).toBeCloseTo(43.4, 1)
    })
    it('Tỷ lệ mỡ (Body Fat) - Nam giới', () => {
      const result = calculatorServices.calculateBodyFatService({ height: 175, neck: 38, waist: 88, hip: 95, gender: UserGender.male })
      expect(result).toBeDefined()
    })
    it('Lỗi: Tỷ lệ mỡ với giới tính không hợp lệ', () => {
       const result = calculatorServices.calculateBodyFatService({ height: 175, neck: 38, waist: 88, hip: 95, gender: 'none' as any })
       expect(result).toBeUndefined()
    })
    it('Lỗi: Cân nặng lý tưởng với giới tính không hợp lệ', () => {
       const result = calculatorServices.calculateIBWService({ height: 175, gender: 'none' as any })
       expect(result).toBeUndefined()
    })
    it('Lỗi: Khối lượng nạc với giới tính không hợp lệ', () => {
       const result = calculatorServices.calculateLBMService({ weight: 70, height: 175, gender: 'none' as any })
       expect(result).toBeUndefined()
    })
    it('Trường hợp: Chiều cao thấp cho IBW', () => {
       const result = calculatorServices.calculateIBWService({ height: 100, gender: UserGender.male })
       expect(result).toBeDefined()
    })
    it('Trường hợp: Cân nặng nhỏ cho LBM', () => {
       const result = calculatorServices.calculateLBMService({ weight: 5, height: 50, gender: UserGender.male })
       expect(result).toBeDefined()
    })
  })

  // Thói quen sinh hoạt (6 cases)
  describe('Tính năng: Lượng nước và Calo tiêu thụ', () => {
    it('Lượng nước cần thiết hàng ngày', () => {
      expect(calculatorServices.calculateWaterIntakeService({ weight: 70, time: 30 })).toBeCloseTo(2.5, 1)
    })
    it('Lượng nước tăng thêm khi tập luyện', () => {
      expect(calculatorServices.calculateWaterIntakeService({ weight: 70, time: 60 })).toBeCloseTo(2.8, 1)
    })
    it('Trường hợp: Cân nặng bằng 0', () => {
       expect(calculatorServices.calculateWaterIntakeService({ weight: 0, time: 30 })).toBeCloseTo(0.4, 1)
    })
    it('Calo tiêu thụ dựa trên chỉ số MET', () => {
      expect(calculatorServices.calculateCalorieBurnedService({ weight: 70, time: 30, met: 8 })).toBeCloseTo(294, 1)
    })
    it('Trường hợp: Thời gian tập luyện bằng 0', () => {
      expect(calculatorServices.calculateCalorieBurnedService({ weight: 70, time: 0, met: 8 })).toBe(0)
    })
    it('Trường hợp: Chỉ số MET cao (Vận động mạnh)', () => {
       expect(calculatorServices.calculateCalorieBurnedService({ weight: 70, time: 30, met: 15 })).toBeCloseTo(551.3, 1)
    })
  })
})
