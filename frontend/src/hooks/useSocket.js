import { useEffect } from "react";
import useSocketStore from "../store/socketStore";

const useSocket = () => {
  const { socket, connect, disconnect } =
    useSocketStore();

  useEffect(() => {
    connect();

    return () => disconnect();
  }, []);

  return socket;
};

export default useSocket;