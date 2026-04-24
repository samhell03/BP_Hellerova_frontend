import { useEffect, useMemo, useRef, useState } from "react";
import { FiBell } from "react-icons/fi";
import { getAllNotifications, markNotificationAsRead } from "../../api/packages";
import "../../styles/notifications.css";

function NotificationsBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await getAllNotifications();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Chyba při načítání notifikací:", err);
        setNotifications([]);
      }
    };

    loadNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const hasUnread = useMemo(
    () => notifications.some((item) => !item.isRead),
    [notifications]
  );

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const handleMarkAsRead = async (item) => {
    if (item.isRead) {
      return;
    }

    try {
      await markNotificationAsRead(item.packageId, item._id);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === item._id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      console.error("Chyba při označení notifikace:", err);
    }
  };

  return (
    <div className="notifications-bell" ref={wrapperRef}>
      <button
        type="button"
        className="notifications-bell-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Otevřít notifikace"
      >
        <FiBell className="notifications-bell-icon" />

        {hasUnread && (
          <span className="notifications-bell-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-bell-panel">
          <div className="notifications-bell-header">
            <strong>Notifikace</strong>
          </div>

          <div className="notifications-bell-body">
            {notifications.length === 0 ? (
              <p className="notifications-bell-empty">Žádné notifikace</p>
            ) : (
              notifications.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => handleMarkAsRead(item)}
                  className={`notifications-bell-item ${
                    item.isRead ? "is-read" : ""
                  }`}
                >
                  <strong className="notifications-bell-item-title">
                    {item.title}
                  </strong>
                  <div className="notifications-bell-item-message">
                    {item.message}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsBell;