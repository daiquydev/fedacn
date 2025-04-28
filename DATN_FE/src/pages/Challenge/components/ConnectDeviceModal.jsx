import React, { useState } from 'react';
import { BsSmartwatch, BsApple, BsFillCheckCircleFill } from 'react-icons/bs';
import { FaAndroid, FaBluetoothB, FaBluetooth, FaWifi, FaCheck, FaSync } from 'react-icons/fa';
import { BiLinkAlt } from 'react-icons/bi';

const ConnectDeviceModal = ({ isOpen, onClose, onConnect, challengeType }) => {
  const [step, setStep] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [foundDevices, setFoundDevices] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Mock danh sách thiết bị
  const devices = [
    { id: 1, name: 'Mi Band 7', type: 'fitness', brand: 'Xiaomi', icon: <FaAndroid className="text-green-500" /> },
    { id: 2, name: 'Apple Watch Series 7', type: 'smartwatch', brand: 'Apple', icon: <BsApple className="text-gray-800" /> },
    { id: 3, name: 'Garmin Forerunner 255', type: 'sport', brand: 'Garmin', icon: <FaAndroid className="text-green-500" /> },
    { id: 4, name: 'Samsung Galaxy Watch 5', type: 'smartwatch', brand: 'Samsung', icon: <FaAndroid className="text-green-500" /> },
    { id: 5, name: 'Fitbit Versa 4', type: 'fitness', brand: 'Fitbit', icon: <FaAndroid className="text-green-500" /> }
  ];
  
  if (!isOpen) return null;
  
  const handleScan = () => {
    setIsScanning(true);
    
    // Giả lập tìm thiết bị
    setTimeout(() => {
      setFoundDevices(devices);
      setIsScanning(false);
    }, 2000);
  };
  
  const handleSelectDevice = (device) => {
    setSelectedDevice(device);
    setStep(2);
  };
  
  const handleConnect = () => {
    setIsConnecting(true);
    
    // Giả lập kết nối thiết bị
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setStep(3);
    }, 3000);
  };
  
  const handleFinish = () => {
    onConnect(selectedDevice);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
              <BsSmartwatch className="mr-2 text-blue-500" />
              Kết nối thiết bị đeo thông minh
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        </div>
        
        {/* Body */}
        <div className="p-4">
          {/* Steps indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                2
              </div>
              <div className={`w-16 h-1 ${step >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                3
              </div>
            </div>
          </div>
          
          {/* Step 1: Select device */}
          {step === 1 && (
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-4">Chọn thiết bị để theo dõi thử thách</h4>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Thiết bị của bạn sẽ tự động theo dõi và cập nhật tiến độ thử thách.
                </p>
                
                {isScanning ? (
                  <div className="text-center py-8">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
                    <p>Đang dò tìm thiết bị...</p>
                  </div>
                ) : (
                  <div>
                    {foundDevices.length > 0 ? (
                      <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                        {foundDevices.map(device => (
                          <div 
                            key={device.id}
                            onClick={() => handleSelectDevice(device)}
                            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <div className="flex items-center">
                              {device.icon}
                              <div className="ml-3">
                                <p className="font-medium text-gray-800 dark:text-white">{device.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{device.brand}</p>
                              </div>
                            </div>
                            <span className="text-blue-500">Chọn</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="mb-4">Chưa tìm thấy thiết bị nào.</p>
                        <button
                          onClick={handleScan}
                          className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition mx-auto"
                        >
                          <FaBluetooth className="mr-2" /> Dò tìm thiết bị
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 2: Connect device */}
          {step === 2 && (
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-4">Kết nối với {selectedDevice?.name}</h4>
              
              <div className="mb-6 text-center">
                <div className="inline-block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
                  <BsSmartwatch className="text-4xl text-blue-500" />
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Hãy đảm bảo thiết bị của bạn đã bật Bluetooth và trong phạm vi kết nối.
                </p>
                
                <div className="flex justify-center space-x-6 mb-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full mb-2">
                      <FaBluetoothB className="text-blue-600 dark:text-blue-400 text-xl" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Bluetooth</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full mb-2">
                      <FaWifi className="text-blue-600 dark:text-blue-400 text-xl" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Wi-Fi</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full mb-2">
                      <BiLinkAlt className="text-blue-600 dark:text-blue-400 text-xl" />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Đồng bộ</span>
                  </div>
                </div>
                
                {isConnecting ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-ping relative inline-flex h-16 w-16 rounded-full bg-blue-400 opacity-75 mb-3"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Đang kết nối...</p>
                  </div>
                ) : (
                  <button
                    onClick={handleConnect}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                  >
                    Kết nối ngay
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Step 3: Success and permissions */}
          {step === 3 && (
            <div className="text-center">
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <BsFillCheckCircleFill className="text-green-500 text-3xl" />
                </div>
                <h4 className="text-lg font-medium text-gray-800 dark:text-white">Kết nối thành công!</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Thiết bị {selectedDevice?.name} đã được kết nối và sẽ tự động theo dõi thử thách của bạn.
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                <h5 className="font-medium text-gray-800 dark:text-white mb-2">Dữ liệu sẽ được thu thập:</h5>
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-center">
                    <FaCheck className="text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">Số bước chân và quãng đường di chuyển</span>
                  </li>
                  <li className="flex items-center">
                    <FaCheck className="text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">Nhịp tim và calories tiêu thụ</span>
                  </li>
                  <li className="flex items-center">
                    <FaCheck className="text-green-500 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">Thời gian và cường độ hoạt động thể chất</span>
                  </li>
                </ul>
              </div>
              
              <button
                onClick={handleFinish}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
              >
                Hoàn tất
              </button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          Bạn có thể chỉnh sửa thiết bị kết nối trong phần Cài đặt sau.
        </div>
      </div>
    </div>
  );
};

export default ConnectDeviceModal; 