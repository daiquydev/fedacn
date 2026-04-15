import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserFriends, FaChevronDown, FaChevronUp, FaCheck, FaCrown } from 'react-icons/fa';
import useravatar from '../assets/images/useravatar.jpg';

/**
 * Participant avatar list with social ring indicators + optional expand
 *
 * @param {Object}  props
 * @param {Array}   props.participants   - List of participants: { id, name, avatar, isFollowed }
 * @param {Number}  props.initialLimit   - How many avatars to show initially (default: 3)
 * @param {String}  props.title          - Optional title (pass null/false to hide)
 * @param {String}  props.size           - sm | md | lg
 * @param {Boolean} props.showCount      - Show total count label
 * @param {Set}     props.friendIds      - Set of user IDs that are mutual friends
 * @param {Set}     props.connectedIds   - Set of user IDs that follow/are followed by me
 * @param {String}  props.creatorId      - User ID of the event organizer/creator
 * @param {Boolean} props.showExpand     - Show "Xem thêm / Thu gọn" button (default: true)
 */
const ParticipantsList = ({
  participants = [],
  initialLimit = 3,
  title = 'Người tham gia',
  size = 'md',
  showCount = true,
  friendIds = new Set(),
  connectedIds = new Set(),
  creatorId = '',
  showExpand = true,
  totalCount,
}) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  if (!participants.length) return null;

  const sizes = {
    sm: { img: 'w-7 h-7', overlap: '-ml-2', badge: 'w-2.5 h-2.5 -right-0.5 -top-0.5', badgeFontSize: 5 },
    md: { img: 'w-9 h-9', overlap: '-ml-2.5', badge: 'w-3 h-3 -right-0.5 -top-0.5', badgeFontSize: 6 },
    lg: { img: 'w-11 h-11', overlap: '-ml-3', badge: 'w-3.5 h-3.5 right-0 top-0', badgeFontSize: 7 },
  }[size] || { img: 'w-9 h-9', overlap: '-ml-2.5', badge: 'w-3 h-3 -right-0.5 -top-0.5', badgeFontSize: 6 };

  // Enrich each participant with role flags
  const withRoles = participants.map(p => {
    const uid = String(p.id || '');
    const isOrganizer = !!(uid && uid === String(creatorId));
    const isFriend = friendIds.has(uid);
    const isConnected = connectedIds.has(uid) || !!p.isFollowed;
    return { ...p, isOrganizer, isFriend, isConnected };
  });

  // Sort: organizer → friends → followers/following → others
  const sorted = [...withRoles].sort((a, b) => {
    if (a.isOrganizer !== b.isOrganizer) return a.isOrganizer ? -1 : 1;
    if (a.isFriend !== b.isFriend) return a.isFriend ? -1 : 1;
    if (a.isConnected !== b.isConnected) return a.isConnected ? -1 : 1;
    return 0;
  });

  const visible = expanded ? sorted : sorted.slice(0, initialLimit);
  const remaining = totalCount !== undefined ? Math.max(0, totalCount - visible.length) : (sorted.length - visible.length);

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
            let ringStyle = {};
            let badgeBg = '';
            let roleLabel = '';
            let roleLabelColor = '';

            if (p.isOrganizer) {
              ringStyle = { boxShadow: '0 0 0 2.5px #f59e0b, 0 0 0 4px rgba(245,158,11,0.25)' };
              badgeBg = 'bg-amber-500';
              roleLabel = 'Người tổ chức';
              roleLabelColor = 'text-amber-300';
            } else if (p.isFriend) {
              ringStyle = { boxShadow: '0 0 0 2.5px #22c55e, 0 0 0 4px rgba(34,197,94,0.2)' };
              badgeBg = 'bg-green-500';
              roleLabel = 'Bạn bè';
              roleLabelColor = 'text-green-300';
            } else if (p.isConnected) {
              ringStyle = { boxShadow: '0 0 0 2px #60a5fa, 0 0 0 3.5px rgba(96,165,250,0.2)' };
              roleLabel = 'Theo dõi';
              roleLabelColor = 'text-blue-300';
            } else {
              ringStyle = { border: '2px solid #e5e7eb' };
            }

            // Tooltip horizontal alignment: first items align left, last items align right to avoid overflow
            const tooltipAlign = idx === 0
              ? 'left-0 -translate-x-0'
              : idx >= visible.length - 1
                ? 'right-0 translate-x-0'
                : 'left-1/2 -translate-x-1/2';

            return (
              <div
                key={p.id || idx}
                className={`relative flex-shrink-0 ${idx > 0 ? sizes.overlap : ''}`}
                style={{ zIndex: visible.length - idx + 1 }}
              >
                <div
                  className="group relative cursor-pointer"
                  onClick={() => p.id && navigate(`/user/${p.id}`)}
                >
                  <img
                    src={p.avatar || useravatar}
                    alt={p.name}
                    className={`${sizes.img} rounded-full object-cover`}
                    style={ringStyle}
                    onError={(e) => { e.target.onerror = null; e.target.src = useravatar; }}
                  />

                  {/* Badge icon */}
                  {(p.isOrganizer || p.isFriend) && (
                    <span className={`absolute ${sizes.badge} ${badgeBg} border border-white dark:border-gray-800 rounded-full flex items-center justify-center`}>
                      {p.isOrganizer
                        ? <FaCrown style={{ fontSize: sizes.badgeFontSize, color: 'white' }} />
                        : <FaCheck style={{ fontSize: sizes.badgeFontSize, color: 'white' }} />
                      }
                    </span>
                  )}

                  {/* Tooltip */}
                  <div
                    className={`absolute bottom-full ${tooltipAlign} mb-2 px-2.5 py-1.5 bg-gray-900/95 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[9999] pointer-events-none shadow-xl`}
                  >
                    <div className="font-semibold leading-tight">{p.name || 'Người dùng'}</div>
                    {roleLabel && (
                      <div className={`text-[10px] mt-0.5 ${roleLabelColor}`}>{roleLabel}</div>
                    )}
                    <div className={`absolute top-full ${idx === 0 ? 'left-3' : idx >= visible.length - 1 ? 'right-3' : 'left-1/2 -translate-x-1/2'} border-4 border-transparent border-t-gray-900/95`} />
                  </div>
                </div>
              </div>
            );
          })}

          {/* +N remaining */}
          {!expanded && remaining > 0 && (
            <div
              className={`${sizes.img} ${sizes.overlap} flex-shrink-0 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-300 shadow-sm ${showExpand ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors' : ''}`}
              style={{ zIndex: 1 }}
              onClick={showExpand ? () => setExpanded(true) : undefined}
            >
              +{remaining}
            </div>
          )}
        </div>

        {/* Expand / Collapse button */}
        {showExpand && participants.length > initialLimit && (
          <button
            className="ml-2 text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5 shrink-0"
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