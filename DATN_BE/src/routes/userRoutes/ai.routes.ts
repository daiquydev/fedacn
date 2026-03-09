import { Router, Request, Response } from 'express'
import AIUsageLogModel from '~/models/schemas/aiUsageLog.schema'

const aiRouter = Router()

// ==================== CURATED SPORT IMAGES ====================
// Verified working direct image URLs (Google/sport stock photos)
const SPORT_IMAGES: Record<string, string[]> = {
    'Chạy bộ': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/2014_Womens_Mini_Marathon.jpg/1280px-2014_Womens_Mini_Marathon.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/2015_Delhi_Half_Marathon.jpg/1280px-2015_Delhi_Half_Marathon.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/NYC_Marathon_2013.jpg/1280px-NYC_Marathon_2013.jpg'
    ],
    'Đạp xe': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Cycling_on_road.jpg/1280px-Cycling_on_road.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Tour_de_pologne_2009.jpg/1280px-Tour_de_pologne_2009.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Cycling_race.jpg/800px-Cycling_race.jpg'
    ],
    'Bơi lội': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Michael_Phelps_Rio_Olympics_2016.jpg/1280px-Michael_Phelps_Rio_Olympics_2016.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/2008_Olympic_Group_Athletics.jpg/1280px-2008_Olympic_Group_Athletics.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Swimming_at_the_2012_Summer_Olympics.jpg/1280px-Swimming_at_the_2012_Summer_Olympics.jpg'
    ],
    'Bóng đá': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/2010_FIFA_World_Cup_final%2C_July_11%2C_2010.jpg/1280px-2010_FIFA_World_Cup_final%2C_July_11%2C_2010.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Soccer_ball.jpg/800px-Soccer_ball.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Football_iu_1996.jpg/1280px-Football_iu_1996.jpg'
    ],
    'Bóng rổ': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Euroleague_basketball_match.jpg/1280px-Euroleague_basketball_match.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Basketball_through_hoop.jpg/800px-Basketball_through_hoop.jpg'
    ],
    'Cầu lông': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Badminton_at_the_2012_Summer_Olympics_45.jpg/1280px-Badminton_at_the_2012_Summer_Olympics_45.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Badminton_match.jpg/1280px-Badminton_match.jpg'
    ],
    'Yoga': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_scene_at_the_2017_International_Yoga_Day_celebration_in_Bengaluru.jpg/1280px-A_scene_at_the_2017_International_Yoga_Day_celebration_in_Bengaluru.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Yoga_girl.jpg/800px-Yoga_girl.jpg'
    ],
    'Gym / Fitness': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Gym_in_2014.jpg/1280px-Gym_in_2014.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/CrossFit_dumbbell.jpg/800px-CrossFit_dumbbell.jpg'
    ],
    'Pilates': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Pilates_is_cool.jpg/800px-Pilates_is_cool.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Pilates_reformer_exercise.jpg/1280px-Pilates_reformer_exercise.jpg'
    ],
    'Leo núi': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg/1280px-Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Hiking_Trail.jpg/1280px-Hiking_Trail.jpg'
    ],
    'Đánh tennis': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/2014_US_Open_(tennis)_-_Tournament_(15052490631).jpg/1280px-2014_US_Open_(tennis)_-_Tournament_(15052490631).jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Tennis_Racket_and_Balls.jpg/1280px-Tennis_Racket_and_Balls.jpg'
    ],
    'Zumba': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Zumba_class_in_Melbourne.jpg/1280px-Zumba_class_in_Melbourne.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Zumba_dance_class.jpg/800px-Zumba_dance_class.jpg'
    ],
    'default': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/2012_Olympic_Games_5000m_final.jpg/1280px-2012_Olympic_Games_5000m_final.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Trampoline_at_2012_Summer_Olympics.jpg/1280px-Trampoline_at_2012_Summer_Olympics.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/GoldenGateBridge-001.jpg/1280px-GoldenGateBridge-001.jpg'
    ]
}

function pickImage(category: string): string {
    const pool = SPORT_IMAGES[category] || SPORT_IMAGES['default']
    return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * POST /api/ai/generate
 * Proxy to Groq (free) to avoid browser CORS. Injects verified image URL.
 * Body: { prompt: string }
 */
aiRouter.post('/generate', async (req: Request, res: Response) => {
    const { prompt } = req.body
    if (!prompt) {
        res.status(400).json({ message: 'prompt is required' })
        return
    }

    const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim()
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_key_here') {
        res.status(500).json({ message: 'GROQ_API_KEY not configured — get a free key at https://console.groq.com' })
        return
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'Bạn là chuyên gia tạo nội dung form sự kiện thể thao. Chỉ trả về JSON object thuần túy, không có markdown hay giải thích.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 2048
            })
        })

        if (!response.ok) {
            const errData = await response.json()
            console.error('[AI Proxy] Groq error:', JSON.stringify(errData))
            res.status(response.status).json({ message: errData?.error?.message || 'Groq API error' })
            return
        }

        const data = await response.json()
        let text = data?.choices?.[0]?.message?.content || ''

        // ---- Inject a verified working image URL ----
        try {
            const cleaned = text.replace(/```(?:json)?\n?/gi, '').replace(/```/g, '').trim()
            const parsed = JSON.parse(cleaned)
            parsed.image = pickImage(parsed.category || '')
            text = JSON.stringify(parsed)
        } catch {
            // If parsing fails, still return the raw text and let FE handle it
        }

        // Log AI usage (fire-and-forget)
        AIUsageLogModel.create({ feature: 'create_post' }).catch(() => { })

        res.json({ text })
    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Internal server error' })
    }
})


// ==================== FITNESS ANALYSIS ====================

/**
 * POST /api/ai/analyze-fitness
 * Analyze fitness calculator results and suggest exercises from DB.
 * Body: { calculationType, inputData, calculatedResult, availableExercises }
 */
aiRouter.post('/analyze-fitness', async (req: Request, res: Response) => {
    const { calculationType, inputData, calculatedResult, availableExercises } = req.body

    if (!calculationType || !calculatedResult) {
        res.status(400).json({ message: 'calculationType and calculatedResult are required' })
        return
    }

    const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim()
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_key_here') {
        res.status(500).json({ message: 'GROQ_API_KEY not configured' })
        return
    }

    // Build a user-friendly description of the calculator type
    const calcTypeLabels: Record<string, string> = {
        BMI: 'Chỉ số BMI (Body Mass Index)',
        TDEE: 'Chỉ số TDEE (Tổng năng lượng tiêu thụ hàng ngày)',
        'Body Fat': 'Tỷ lệ mỡ cơ thể (Body Fat %)',
        BMR: 'Chỉ số BMR (Trao đổi chất cơ bản)',
        IBW: 'Cân nặng lý tưởng (Ideal Body Weight)',
        LBM: 'Khối lượng cơ nạc (Lean Body Mass)',
        'Calo Burned': 'Lượng calo đốt cháy trong hoạt động'
    }
    const calcLabel = calcTypeLabels[calculationType] || calculationType

    // Truncate exercises list to avoid token overflow (max 30 exercises)
    const exerciseList = (availableExercises || []).slice(0, 30).map((ex: any) => ({
        _id: ex._id,
        name: ex.name,
        name_vi: ex.name_vi,
        category: ex.category,
        difficulty: ex.difficulty,
        calories_per_min: ex.calories_per_min,
        estimated_kcal: ex.estimated_kcal
    }))

    const prompt = `Bạn là bác sĩ thể thao và chuyên gia sức khỏe. Người dùng vừa sử dụng công cụ tính toán ${calcLabel}.

Kết quả tính toán: ${JSON.stringify(calculatedResult)}
Thông tin đầu vào của người dùng: ${JSON.stringify(inputData)}

Nhiệm vụ của bạn:
1. Phân tích ngắn gọn tình trạng sức khỏe của người dùng dựa trên chỉ số trên (2-3 câu, thân thiện, chuyên nghiệp)
2. Từ danh sách bài tập bên dưới, chọn 4 bài tập PHÙ HỢP NHẤT với tình trạng sức khỏe của người dùng. Chỉ được chọn bài tập có trong danh sách (dùng đúng _id).
3. Với mỗi bài tập được chọn, viết 1 câu lý do ngắn gọn tại sao bài đó phù hợp.

Danh sách bài tập có sẵn trong hệ thống:
${JSON.stringify(exerciseList)}

Trả về JSON theo đúng định dạng sau (không có markdown, không có giải thích thêm):
{"health_analysis":"...","suggested_exercises":[{"_id":"...","name":"...","name_vi":"...","reason":"..."}]}`

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'Bạn là bác sĩ thể thao chuyên nghiệp. Chỉ trả về JSON object thuần túy, không có markdown hay giải thích ngoài JSON.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 1024
            })
        })

        if (!response.ok) {
            const errData = await response.json()
            console.error('[AI Analyze Fitness] Groq error:', JSON.stringify(errData))
            res.status(response.status).json({ message: errData?.error?.message || 'Groq API error' })
            return
        }

        const data = await response.json()
        const text = data?.choices?.[0]?.message?.content || ''

        // Parse JSON from AI response
        try {
            const cleaned = text.replace(/```(?:json)?\n?/gi, '').replace(/```/g, '').trim()
            const parsed = JSON.parse(cleaned)
            // Enrich suggested exercises with full data from availableExercises
            if (parsed.suggested_exercises && availableExercises) {
                parsed.suggested_exercises = parsed.suggested_exercises.map((suggested: any) => {
                    const fullEx = availableExercises.find((ex: any) => ex._id === suggested._id)
                    return fullEx ? { ...fullEx, reason: suggested.reason } : suggested
                })
            }
            // Log AI usage (fire-and-forget)
            AIUsageLogModel.create({ feature: 'analyze_fitness' }).catch(() => { })

            res.json(parsed)
        } catch {
            // If JSON parse fails, return raw text for debugging
            res.json({ health_analysis: text, suggested_exercises: [] })
        }
    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Internal server error' })
    }
})

/**
 * POST /api/ai/analyze-workout-description
 * Analyze a user's free-text health description and suggest exercises from DB.
 * Body: { description, availableExercises }
 */
aiRouter.post('/analyze-workout-description', async (req: Request, res: Response) => {
    const { description, availableExercises } = req.body

    if (!description || description.trim().length < 5) {
        res.status(400).json({ message: 'description is required (min 5 chars)' })
        return
    }

    const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim()
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_key_here') {
        res.status(500).json({ message: 'GROQ_API_KEY not configured' })
        return
    }

    const exerciseList = (availableExercises || []).slice(0, 30).map((ex: any) => ({
        _id: ex._id,
        name: ex.name,
        name_vi: ex.name_vi,
        category: ex.category,
        difficulty: ex.difficulty,
        calories_per_min: ex.calories_per_min,
        estimated_kcal: ex.estimated_kcal
    }))

    const prompt = `Bạn là bác sĩ thể thao và chuyên gia sức khỏe có nhiều năm kinh nghiệm. Người dùng đã mô tả tình trạng sức khỏe và mục tiêu tập luyện của họ như sau:

"${description.trim()}"

Nhiệm vụ của bạn:
1. Phân tích tình trạng sức khỏe của người dùng dựa trên mô tả trên (2-4 câu, thân thiện, chuyên nghiệp, như một bác sĩ đang tư vấn trực tiếp). Đưa ra nhận xét về tình trạng hiện tại và những điều cần lưu ý khi tập luyện.
2. Từ danh sách bài tập bên dưới, chọn 4-6 bài tập PHÙ HỢP NHẤT với tình trạng và mục tiêu của người dùng. Chỉ được chọn bài tập có trong danh sách (dùng đúng _id). Ưu tiên các bài tập an toàn và phù hợp với thể trạng được mô tả.
3. Với mỗi bài tập được chọn, viết 1 câu lý do ngắn gọn tại sao bài đó phù hợp với người dùng này cụ thể.

Danh sách bài tập có sẵn trong hệ thống:
${JSON.stringify(exerciseList)}

Trả về JSON theo đúng định dạng sau (không có markdown, không có giải thích thêm):
{"health_analysis":"...","suggested_exercises":[{"_id":"...","name":"...","name_vi":"...","reason":"..."}]}`

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'Bạn là bác sĩ thể thao chuyên nghiệp. Chỉ trả về JSON object thuần túy, không có markdown hay giải thích ngoài JSON.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 1200
            })
        })

        if (!response.ok) {
            const errData = await response.json()
            console.error('[AI Workout Description] Groq error:', JSON.stringify(errData))
            res.status(response.status).json({ message: errData?.error?.message || 'Groq API error' })
            return
        }

        const data = await response.json()
        const text = data?.choices?.[0]?.message?.content || ''

        try {
            const cleaned = text.replace(/```(?:json)?\n?/gi, '').replace(/```/g, '').trim()
            const parsed = JSON.parse(cleaned)
            // Enrich suggested exercises with full data from availableExercises
            if (parsed.suggested_exercises && availableExercises) {
                parsed.suggested_exercises = parsed.suggested_exercises.map((suggested: any) => {
                    const fullEx = availableExercises.find((ex: any) => ex._id === suggested._id)
                    return fullEx ? { ...fullEx, reason: suggested.reason } : suggested
                })
            }
            // Log AI usage (fire-and-forget)
            AIUsageLogModel.create({ feature: 'analyze_workout' }).catch(() => { })

            res.json(parsed)
        } catch {
            res.json({ health_analysis: text, suggested_exercises: [] })
        }
    } catch (err: any) {
        res.status(500).json({ message: err.message || 'Internal server error' })
    }
})

export default aiRouter
