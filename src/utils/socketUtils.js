import { io } from 'socket.io-client';

// Constants for socket event names
export const SOCKET_EVENTS = {
  INVENTORY_UPDATE: 'inventory_update',
  PURCHASE_BILL_CREATED: 'purchase_bill_created',
  SELL_BILL_CREATED: 'sell_bill_created',
  RETURN_BILL_CREATED: 'return_bill_created'
};

let socket = null;

/**
 * Initialize socket connection with user data
 * @param {Object} userData - The user data containing email
 */
export const initializeSocket = (userData) => {
  if (socket) {
    console.log('Socket already initialized');
    return;
  }

  socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5001', {
    withCredentials: true
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    if (userData && userData.email) {
      socket.emit('join', userData);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Subscribe to a socket event
 * @param {string} event - The event name
 * @param {Function} callback - The callback function
 */
export const subscribeToEvent = (event, callback) => {
  if (!socket) {
    console.warn('Socket not initialized');
    return;
  }
  socket.on(event, callback);
};

/**
 * Unsubscribe from a socket event
 * @param {string} event - The event name
 * @param {Function} callback - The callback function
 */
export const unsubscribeFromEvent = (event, callback) => {
  if (!socket) {
    console.warn('Socket not initialized');
    return;
  }
  socket.off(event, callback);
};

export default socket; 