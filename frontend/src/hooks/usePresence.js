import { useEffect, useState } from "react";

const usePresence = (socket, boardId) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("join-board", boardId);

    socket.on("presence-update", (data) => {
      setUsers(data.users);
    });

    return () => {
      socket.off("presence-update");
    };
  }, [socket, boardId]);

  return users;
};

export default usePresence;