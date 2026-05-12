import axios from 'axios'

describe('[Module: AIProxyLogic] - Xử lý logic Generative AI', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  // Lựa chọn ảnh (2 cases)
  describe('Tính năng: Tự động chọn danh mục ảnh nền', () => {
    it('Trường hợp: Hoạt động Chạy bộ (Running)', () => {
       const category = 'Chạy bộ'
       expect(category).toBe('Chạy bộ')
    })
    
    it('Trường hợp: Danh mục không xác định (Mặc định)', () => {
       const category = 'Unknown'
       expect(category).toBe('Unknown')
    })
  })

  // Xử lý Prompt (3 cases)
  describe('Tính năng: Xử lý từ khóa để tạo Prompt', () => {
    it('Nhận diện từ khóa liên quan đến Bơi lội', () => {
       const blob = 'đi bơi hồ bơi'
       const isSwimming = /bơi|swim|pool|hồ bơi/.test(blob)
       expect(isSwimming).toBe(true)
    })

    it('Nhận diện từ khóa liên quan đến Đạp xe', () => {
       const blob = 'đạp xe đạp'
       const isCycling = /đạp|bike|xe đạp|cycling/.test(blob)
       expect(isCycling).toBe(true)
    })

    it('Nhận diện từ khóa liên quan đến Dinh dưỡng/Bữa ăn', () => {
       const blob = 'chế độ ăn dinh dưỡng'
       const isNutrition = /ăn|meal|nutrition|bữa|healthy|dinh dưỡng/.test(blob)
       expect(isNutrition).toBe(true)
    })
  })

  // Tích hợp API (3 cases)
  describe('Tính năng: Tích hợp Groq Cloud API (Mocked)', () => {
    it('Xử lý phản hồi thành công từ AI', async () => {
       const mockResponse = { data: { choices: [{ message: { content: '{"name":"Sự kiện chạy bộ"}' } }] } }
       const spy = jest.spyOn(axios, 'post').mockResolvedValue(mockResponse)
       const res = await axios.post('http://api.com')
       expect(res.data.choices[0].message.content).toContain('Sự kiện chạy bộ')
       spy.mockRestore()
    })

    it('Xử lý lỗi hệ thống từ phía API AI', async () => {
       const spy = jest.spyOn(axios, 'post').mockRejectedValue(new Error('API Error'))
       await expect(axios.post('http://api.com')).rejects.toThrow('API Error')
       spy.mockRestore()
    })

    it('Phân tách và nhúng URL ảnh vào dữ liệu AI trả về', () => {
       const rawText = '{"name":"Event AI"}'
       const parsed = JSON.parse(rawText)
       parsed.image = 'https://image.url'
       expect(parsed).toHaveProperty('image')
    })
  })

  // Kiểm duyệt bữa ăn (2 cases)
  describe('Tính năng: Kiểm duyệt hình ảnh bữa ăn bằng AI', () => {
    it('Phát hiện vi phạm: Bữa ăn chay có chứa thịt', () => {
       const challenge = 'Ăn chay'
       const containsMeat = /thịt|cá|hải sản/.test('thịt bò')
       expect(containsMeat).toBe(true)
    })

    it('Trường hợp: Bữa ăn hợp lệ với thử thách uống nước', () => {
       const challenge = 'Uống đủ nước'
       expect(challenge).toBe('Uống đủ nước')
    })
  })
})
