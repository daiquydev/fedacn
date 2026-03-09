import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserFriends, FaChevronDown, FaChevronUp, FaCheck } from 'react-icons/fa';
import useravatar from '../assets/images/useravatar.jpg';

/**
 * Participant avatar list with expandable functionality + social ring indicators
 *
 * @param {Object} props
 * @param {Array}  props.participants   - List of participants: { id, name, avatar, isFollowed }
 * @param {Number} props.initialLimit    - How many avatars to show initially (default: 3)
 * @param {String} props.title           - Optional title (pass null/false to hide)
 * @param {String} props.size            - sm | md | lg
 * @param {Boolean}props.showCount       - Show total count label
 * @param {Set}    props.friendIds       - Set of user IDs that are mutual friends
 * @param {Set}    props.connectedIds    - Set of user IDs that follow/are followed by me
 */
const ParticipantsList = ({
  participants = [],
  initialLimit = 3,
  title = 'Người tham gia',
  size = 'md',
  showCount = true,
  friendIds = new Set(),
  connectedIds = new Set(),
}) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  if (!participants.length) return null;

  // Sort followed/friends to front
  const sorted = [...participants].sort((a, b) => {
    const aConn = connectedIds.has(String(a.id)) || a.isFollowed;
    const bConn = connectedIds.has(String(b.id)) || b.isFollowed;
    if (aConn && !bConn) return -1;
    if (!aConn && bConn) return 1;
    return 0;
  });

  const visible = expanded ? sorted : sorted.slice(0, initialLimit);
  const remaining = sorted.length - visible.length;

  const sizes = {
    sm: { img: 'w-7 h-7', overlap: '-ml-2', badge: 'w-2 h-2 -right-0.5 -top-0.5', badgeCheck: 5 },
    md: { img: 'w-9 h-9', overlap: '-ml-2.5', badge: 'w-3 h-3 -right-0.5 -top-0.5', badgeCheck: 6 },
    lg: { img: 'w-11 h-11', overlap: '-ml-3', badge: 'w-3.5 h-3.5 right-0 top-0', badgeCheck: 7 },
  }[size] ?? sizes?.md;

  const s = sizes;

  return (
    <div className="inline-flex flex-col">
      {title && (
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1.5">
          <FaUserFriends className="mr-1.5" />
          <span>{title}</span>
          {showCount && <span className="ml-1">({participants.length})</span>}
        </div>
      )}

      <div className="flex items-center">
        <div className="flex">
          {visible.map((p, idx) => {
            const uid = String(p.id || '');
            const isFriend = friendIds.has(uid);
            const isConnected = connectedIds.has(uid) || p.isFollowed;

            // Ring style - always visible, not on hover
            let ringStyle = {};
            if (isFriend) {
              ringStyle = { boxShadow: '0 0 0 2.5px #22c55e, 0 0 0 4px rgba(34,197,94,0.2)' };
            } else if (isConnected) {
              ringStyle = { boxShadow: '0 0 0 2px #60a5fa, 0 0 0 3.5px rgba(96,165,250,0.2)' };
            } else {
              ringStyle = { border: '2px solid #e5e7eb' };
            }

            return (
              <div
                key={p.id || idx}
                className={`relative flex-shrink-0 ${idx > 0 ? s.overlap : ''}`}
                style={{ zIndex: visible.length - idx }}
              >
                {/* Tooltip */}
                <div className="group relative cursor-pointer" onClick={() => p.id && navigate(`/user/${p.id}`)}>
                  <img
                    src={p.avatar || useravatar}
                    alt={p.name}
                    className={`${s.img} rounded-full object-cover`}
                    style={ringStyle}
                    onError={(e) => { e.target.onerror = null; e.target.src = useravatar; }}
                  />

                  {/* Friend check badge */}
                  {isFriend && (
                    <span className={`absolute ${s.badge} bg-green-500 border border-white dark:border-gray-800 rounded-full flex items-center justify-center`}>
                      <FaCheck className="text-white" style={{ fontSize: s.badgeCheck }} />
                    </span>
                  )}

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 -translate-y-1 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                    {p.name}
                    {isFriend && <span className="ml-1 text-green-300">• Bạn bè</span>}
                    {!isFriend && isConnected && <span className="ml-1 text-blue-300">• Theo dõi</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* +N remaining */}
          {!expanded && remaining > 0 && (
            <div
              className={`${s.img} ${s.overlap} rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer text-gray-600 dark:text-gray-300 text-xs font-bold flex-shrink-0`}
              onClick={() => setExpanded(true)}
            >
              +{remaining}
            </div>
          )}
        </div>

        {participants.length > initialLimit && (
          <button
            className="ml-2 text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <><FaChevronUp className="text-[10px]" /> Thu gọn</>
            ) : (
              <><FaChevronDown className="text-[10px]" /> Xem thêm</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ParticipantsList;