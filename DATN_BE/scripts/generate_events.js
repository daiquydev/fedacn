const fs = require('fs'); 
const path = require('path'); 
const categories = [ 
    { name: 'Chạy bộ', type: 'Ngoài trời' }, 
    { name: 'Đạp xe', type: 'Ngoài trời' }, 
    { name: 'Đi bộ', type: 'Ngoài trời' }, 
    { name: 'Đi bộ đường dài', type: 'Ngoài trời' }, 
    { name: 'Chạy địa hình', type: 'Ngoài trời' }, 
    { name: 'Trượt patin', type: 'Ngoài trời' }, 
    { name: 'Chạy bộ đường dài', type: 'Ngoài trời' }, 
    { name: 'Bơi lội', type: 'Ngoài trời' },
    { name: 'Yoga', type: 'Trong nhà' }, 
    { name: 'Thể hình / Gym', type: 'Trong nhà' }, 
    { name: 'Pilates', type: 'Trong nhà' }, 
    { name: 'Zumba', type: 'Trong nhà' }, 
    { name: 'HIIT (Cường độ cao)', type: 'Trong nhà' }, 
    { name: 'Kickboxing', type: 'Trong nhà' }, 
    { name: 'Thể dục nhịp điệu', type: 'Trong nhà' }, 
    { name: 'Giãn cơ', type: 'Trong nhà' }, 
    { name: 'Thiền', type: 'Trong nhà' }, 
    { name: 'Bài tập tim mạch (Cardio)', type: 'Trong nhà' }, 
    { name: 'Thể dục tay không', type: 'Trong nhà' } 
]; 
const creators = ['user1@gmail.com', 'quy.tranquil@gmail.com', 'phamquocdung04@gmail.com']; 
function randomDate(start, end) { 
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())); 
} 
const events = []; 
const startCreationPeriod = new Date('2026-03-15T00:00:00Z'); 
const images = { 
    'Chạy bộ': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&h=400', 
    'Đạp xe': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=400', 
    'Đi bộ': 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=500&h=400', 
    'Đi bộ đường dài': 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=500&h=400', 
    'Chạy địa hình': 'https://images.unsplash.com/photo-1505305976870-c0be1cd39939?w=500&h=400', 
    'Trượt patin': 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=500&h=400', 
    'Chạy bộ đường dài': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=400', 
    'Yoga': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&h=400', 
    'Thể hình / Gym': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=400', 
    'Pilates': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=500&h=400', 
    'Zumba': 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=500&h=400', 
    'HIIT (Cường độ cao)': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&h=400', 
    'Kickboxing': 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=500&h=400', 
    'Thể dục nhịp điệu': 'https://images.unsplash.com/photo-1535525153412-5a42439a610f?w=500&h=400', 
    'Giãn cơ': 'https://images.unsplash.com/photo-1552286450-394cb5c59f03?w=500&h=400', 
    'Thiền': 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=500&h=400', 
    'Bơi lội': 'https://images.unsplash.com/photo-1576610616656-f087ee265718?w=500&h=400', 
    'Bài tập tim mạch (Cardio)': 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=500&h=400', 
    'Thể dục tay không': 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=500&h=400' 
}; 
const locations = ['Công viên Thống Nhất, Hà Nội', 'Hồ Tây, Hà Nội', 'Khu đô thị Sala, TP.HCM', 'Công viên Gia Định, TP.HCM', 'Phố đi bộ Nguyễn Huệ, TP.HCM', 'Hồ Gươm, Hà Nội', 'Khu du lịch sinh thái']; 
categories.forEach(cat => { 
    for (let i = 0; i < 3; i++) { 
        let status = ''; 
        if (i === 0) status = 'ended'; 
        else if (i === 1) status = 'ongoing'; 
        else status = 'upcoming'; 
        let startDate, endDate; 
        if (status === 'ended') { 
            startDate = randomDate(new Date('2026-04-01T00:00:00Z'), new Date('2026-04-20T00:00:00Z')); 
            endDate = randomDate(new Date(startDate.getTime() + 86400000), new Date('2026-04-28T00:00:00Z')); 
        } else if (status === 'ongoing') { 
            startDate = randomDate(new Date('2026-04-15T00:00:00Z'), new Date('2026-04-29T00:00:00Z')); 
            endDate = randomDate(new Date('2026-05-01T00:00:00Z'), new Date('2026-05-30T00:00:00Z')); 
        } else { 
            startDate = randomDate(new Date('2026-05-05T00:00:00Z'), new Date('2026-06-15T00:00:00Z')); 
            endDate = randomDate(new Date(startDate.getTime() + 86400000), new Date('2026-06-30T00:00:00Z')); 
        } 
        const createdAt = randomDate(startCreationPeriod, startDate); 
        let name = ''; 
        let description = ''; 
        let location = ''; 
        if (cat.type === 'Ngoài trời') { 
            name = `Sự kiện ${cat.name} ${status === 'ended' ? 'kết thúc' : status === 'ongoing' ? 'sôi động' : 'mùa hè'}`; 
            description = `Cùng tham gia ${cat.name} để rèn luyện sức khỏe ngoài trời, hít thở không khí trong lành.`; 
            location = locations[Math.floor(Math.random() * locations.length)]; 
        } else { 
            name = `Thử thách ${cat.name} ${status === 'ended' ? 'thành công' : status === 'ongoing' ? 'mỗi ngày' : 'bứt phá'}`; 
            description = `Tập luyện ${cat.name} với không gian thoải mái, rèn luyện toàn diện cơ thể và tinh thần.`; 
            location = 'Online'; 
        } 
        events.push({ 
            name, 
            description, 
            category: cat.name, 
            startDate: startDate.toISOString(), 
            endDate: endDate.toISOString(), 
            createdAt: createdAt.toISOString(), 
            location, 
            maxParticipants: Math.floor(Math.random() * 500) + 50, 
            image: images[cat.name], 
            eventType: cat.type, 
            creatorEmail: creators[Math.floor(Math.random() * creators.length)], 
            participants: 0, 
            participants_ids: [] 
        }); 
    } 
}); 
fs.writeFileSync(path.join(__dirname, '../data/sport-events.seed.json'), JSON.stringify(events, null, 2)); 
console.log('Generated sport events');
