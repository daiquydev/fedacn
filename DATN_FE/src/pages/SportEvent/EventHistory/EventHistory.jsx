import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMedal,
  FaTrophy,
  FaSpinner,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTimes,
} from "react-icons/fa";
import { MdHistory, MdErrorOutline } from "react-icons/md";
import moment from "moment";
import toast from "react-hot-toast";
import { getJoinedEvents } from "../../../apis/sportEventApi";

export default function EventHistory() {
  const navigate = useNavigate();

  const [pastEvents, setPastEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await getJoinedEvents({ page: 1, limit: 100 });
        const events = response?.data?.result?.events || response?.data?.result || [];

        // Filter only past/completed events and map to expected format
        const now = new Date();
        const completedEvents = events
          .filter(event => {
            const endDate = new Date(event.end_date || event.endDate || event.date);
            return endDate < now || event.status === 'completed';
          })
          .map(event => ({
            id: event._id || event.id,
            name: event.name || event.title || '',
            date: event.start_date || event.startDate || event.date,
            endDate: event.end_date || event.endDate,
            location: event.location || '',
            category: event.category || event.sport_type || '',
            participants: event.participant_count || event.participants || 0,
            performance: event.user_result?.status || 'Completed',
            ranking: event.user_result?.ranking || null,
            totalParticipants: event.participant_count || event.max_participants || 0,
            achievement: event.user_result?.achievement || 'Participant',
            time: event.user_result?.time || '',
          }));

        setPastEvents(completedEvents);
      } catch (err) {
        console.error(err);
        setError("Không thể tải lịch sử sự kiện.");
        toast.error("Lỗi tải dữ liệu");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPastEvents();
  }, []);

  const handleEventClick = (eventId) => {
    navigate(`/sport-event/${eventId}`);
  };

  // FILTER
  const filteredEvents = useMemo(() => {
    return pastEvents.filter((event) => {
      if (
        filterCategory !== "all" &&
        event.category.toLowerCase() !== filterCategory.toLowerCase()
      ) {
        return false;
      }

      const eventDate = moment(event.date);

      if (filterStartDate && eventDate.isBefore(filterStartDate)) {
        return false;
      }

      if (filterEndDate && eventDate.isAfter(moment(filterEndDate).endOf("day"))) {
        return false;
      }

      return true;
    });
  }, [pastEvents, filterCategory, filterStartDate, filterEndDate]);

  // SORT
  const sortedEvents = useMemo(() => {
    const items = [...filteredEvents];

    items.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "date") {
        aValue = moment(aValue);
        bValue = moment(bValue);
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;

      return 0;
    });

    return items;
  }, [filteredEvents, sortConfig]);

  const categories = useMemo(
    () => ["all", ...new Set(pastEvents.map((e) => e.category))],
    [pastEvents]
  );

  const getMedalIcon = (ranking, total, achievement) => {
    if (achievement === "Winner")
      return <FaTrophy className="text-yellow-500" />;

    if (!ranking || !total) return null;

    const percent = (ranking / total) * 100;

    if (percent <= 10) return <FaMedal className="text-yellow-500" />;
    if (percent <= 25) return <FaMedal className="text-gray-400" />;
    if (percent <= 50) return <FaMedal className="text-orange-600" />;

    return null;
  };

  const requestSort = (key) => {
    let direction = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="ml-1 inline" />;

    if (sortConfig.direction === "asc")
      return <FaSortUp className="ml-1 inline text-red-500" />;

    return <FaSortDown className="ml-1 inline text-red-500" />;
  };

  const resetFilters = () => {
    setFilterCategory("all");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  return (
    <div className="max-w-7xl mx-auto p-8">

      <div className="flex items-center mb-6">
        <MdHistory className="text-green-500 mr-3" size={30} />
        <h1 className="text-3xl font-bold">Lịch sử sự kiện</h1>
      </div>

      {isLoading && (
        <div className="flex items-center">
          <FaSpinner className="animate-spin text-red-500 mr-3" />
          Đang tải...
        </div>
      )}

      {!isLoading && error && (
        <div className="text-red-500 flex items-center">
          <MdErrorOutline className="mr-2" />
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <table className="w-full border mt-6">
          <thead>
            <tr>
              <th onClick={() => requestSort("name")}>
                Tên {getSortIcon("name")}
              </th>
              <th>Thể loại</th>
              <th onClick={() => requestSort("date")}>
                Ngày {getSortIcon("date")}
              </th>
              <th>Địa điểm</th>
              <th>Hạng</th>
              <th>Thành tích</th>
            </tr>
          </thead>

          <tbody>
            {sortedEvents.map((event) => (
              <tr key={event.id} onClick={() => handleEventClick(event.id)}>
                <td>{event.name}</td>
                <td>{event.category}</td>
                <td>{moment(event.date).format("DD/MM/YYYY")}</td>
                <td>{event.location}</td>
                <td>
                  {event.ranking
                    ? `${event.ranking}/${event.totalParticipants}`
                    : "--"}
                </td>
                <td>
                  {getMedalIcon(
                    event.ranking,
                    event.totalParticipants,
                    event.achievement
                  ) || event.achievement}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}