import { useState } from 'react';
import { useProfileStore } from '../store/useProfileStore';
import { apiFetch } from '../utils/api';

const BluetoothPedal = ({ setListId, onAdvance, onRetreat }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState(null);
  const { profile } = useProfileStore();

  const connect = async () => {
    try {
      // Check plan
      const activeOrg = profile?.organizations?.find(o => o.id === profile.orgId);
      if (!activeOrg || activeOrg.plan === 'Free') {
        alert('Bluetooth foot-pedal requires a paid plan.');
        return;
      }

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true, // For demo, accept all; in real app, filter by service UUID
        optionalServices: ['battery_service'], // Example service
      });

      setDevice(device);
      setIsConnected(true);

      device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setDevice(null);
      });

      // In real implementation, listen for characteristics and map to advance/retreat
      // For demo, simulate button presses
      console.log('Connected to foot-pedal');

    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      alert('Failed to connect to foot-pedal');
    }
  };

  const disconnect = () => {
    if (device && device.gatt.connected) {
      device.gatt.disconnect();
    }
    setIsConnected(false);
    setDevice(null);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2">Bluetooth Foot-Pedal</h3>
      {!isConnected ? (
        <button
          onClick={connect}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Connect Foot-Pedal
        </button>
      ) : (
        <div>
          <p className="text-green-600">Connected</p>
          <button
            onClick={disconnect}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default BluetoothPedal;
