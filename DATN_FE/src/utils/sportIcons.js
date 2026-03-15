/**
 * Bộ icon thể thao dùng chung cho cả Admin và User frontend.
 * Key là giá trị lưu trong DB (field `icon` của SportCategory).
 */
import {
    FaRunning, FaBiking, FaSwimmer, FaDumbbell, FaBasketballBall,
    FaVolleyballBall, FaTableTennis, FaMountain, FaSkating, FaWalking,
    FaHorse, FaFistRaised, FaBowlingBall, FaFootballBall, FaGolfBall,
    FaSkiing, FaSnowboarding, FaWater, FaBaseballBall
} from 'react-icons/fa'
import {
    MdSportsSoccer, MdSportsTennis, MdGolfCourse, MdSportsScore,
    MdSportsHandball, MdSportsGymnastics, MdSportsBaseball, MdSportsVolleyball,
    MdSportsHockey, MdSportsRugby, MdSportsCricket, MdSportsEsports,
    MdSurfing, MdKayaking, MdSkateboarding, MdDownhillSkiing,
    MdPool, MdFitnessCenter, MdDirectionsRun, MdDirectionsBike,
    MdDirectionsWalk, MdSelfImprovement, MdSailing, MdScubaDiving
} from 'react-icons/md'
import {
    GiMeditation, GiShuttlecock, GiHighKick, GiBoxingGlove,
    GiArcheryTarget, GiFencer, GiJumpingRope, GiWeightLiftingUp
} from 'react-icons/gi'

export const SPORT_ICONS = {
    // ── Chạy / Đi bộ ──
    running:        { icon: FaRunning },
    walking:        { icon: FaWalking },
    directions_run: { icon: MdDirectionsRun },

    // ── Xe đạp ──
    cycling:        { icon: FaBiking },
    directions_bike:{ icon: MdDirectionsBike },

    // ── Bơi / Nước ──
    swimming:       { icon: FaSwimmer },
    surfing:        { icon: MdSurfing },
    kayaking:       { icon: MdKayaking },
    sailing:        { icon: MdSailing },
    scuba_diving:   { icon: MdScubaDiving },
    pool:           { icon: MdPool },
    water:          { icon: FaWater },

    // ── Gym / Fitness ──
    fitness:        { icon: FaDumbbell },
    fitness_center: { icon: MdFitnessCenter },
    weight_lifting: { icon: GiWeightLiftingUp },
    jump_rope:      { icon: GiJumpingRope },

    // ── Yoga / Thiền ──
    yoga:           { icon: GiMeditation },
    self_improve:   { icon: MdSelfImprovement },
    pilates:        { icon: MdDirectionsWalk },

    // ── Bóng ──
    soccer:         { icon: MdSportsSoccer },
    basketball:     { icon: FaBasketballBall },
    volleyball:     { icon: FaVolleyballBall },
    football:       { icon: FaFootballBall },
    baseball:       { icon: FaBaseballBall },
    rugby:          { icon: MdSportsRugby },
    cricket:        { icon: MdSportsCricket },
    handball:       { icon: MdSportsHandball },
    bowling:        { icon: FaBowlingBall },

    // ── Vợt ──
    tennis:         { icon: MdSportsTennis },
    tabletennis:    { icon: FaTableTennis },
    badminton:      { icon: GiShuttlecock },

    // ── Võ thuật / Chiến đấu ──
    martial_arts:   { icon: GiHighKick },
    boxing:         { icon: GiBoxingGlove },
    fencing:        { icon: GiFencer },
    fist:           { icon: FaFistRaised },

    // ── Ngoài trời / Mạo hiểm ──
    hiking:         { icon: FaMountain },
    archery:        { icon: GiArcheryTarget },
    horse:          { icon: FaHorse },
    golf:           { icon: MdGolfCourse },

    // ── Trượt / Băng / Tuyết ──
    skating:        { icon: FaSkating },
    skateboarding:  { icon: MdSkateboarding },
    skiing:         { icon: FaSkiing },
    downhill_ski:   { icon: MdDownhillSkiing },
    snowboarding:   { icon: FaSnowboarding },

    // ── Khác ──
    gymnastics:     { icon: MdSportsGymnastics },
    hockey:         { icon: MdSportsHockey },
    esports:        { icon: MdSportsEsports },
    sport:          { icon: MdSportsScore },
}

/** Lấy React component icon từ key (field `icon` trong DB). Fallback → MdSportsScore */
export function getSportIcon(key) {
    return SPORT_ICONS[key]?.icon || MdSportsScore
}
